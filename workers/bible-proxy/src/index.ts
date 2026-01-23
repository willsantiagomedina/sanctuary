/**
 * Sanctuary Bible API Proxy Worker
 * 
 * Handles:
 * - Rate limiting by IP
 * - Response caching via KV
 * - Proxying to external Bible APIs
 * - CORS headers for the web app
 */

import {
  BibleReferenceSchema,
  BibleSearchParamsSchema,
  BibleSearchResponseSchema,
  BibleVerseResponseSchema,
  BibleVersionsResponseSchema,
  type BibleReference,
} from './domain';

interface Env {
  BIBLE_CACHE: KVNamespace;
  BIBLE_API_KEY: string;
  ENVIRONMENT: string;
  CACHE_TTL: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace('/bible', '');

    try {
      // Rate limiting
      const rateLimitResult = await checkRateLimit(request, env);
      if (!rateLimitResult.allowed) {
        return jsonResponse(
          { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
          429,
          { 'Retry-After': String(rateLimitResult.retryAfter) }
        );
      }

      // Route handling
      if (path.startsWith('/versions')) {
        return await handleVersions(env);
      }

      if (path.startsWith('/search')) {
        const parsed = parseSearchParams(url);
        if (!parsed) {
          return jsonResponse({ error: 'Missing search query' }, 400);
        }
        return await handleSearch(parsed.query, parsed.version, env, ctx);
      }

      // Parse verse reference: /john/3/16 or /john/3/16-18
      const refMatch = path.match(/^\/(\w+)\/(\d+)(?:\/(\d+)(?:-(\d+))?)?$/);
      if (refMatch) {
        const parsedRef = BibleReferenceSchema.safeParse({
          book: refMatch[1],
          chapter: parseInt(refMatch[2]),
          verseStart: refMatch[3] ? parseInt(refMatch[3]) : undefined,
          verseEnd: refMatch[4] ? parseInt(refMatch[4]) : undefined,
          version: url.searchParams.get('version') || 'kjv',
        });
        if (!parsedRef.success) {
          return jsonResponse({ error: 'Invalid endpoint' }, 404);
        }
        return await handleVerseReference(parsedRef.data, env, ctx);
      }

      return jsonResponse({ error: 'Invalid endpoint' }, 404);
    } catch (error) {
      console.error('Bible API error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  },
};

async function checkRateLimit(request: Request, env: Env): Promise<{ allowed: boolean; retryAfter?: number }> {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `ratelimit:${ip}`;
  const limit = parseInt(env.RATE_LIMIT_REQUESTS);
  const window = parseInt(env.RATE_LIMIT_WINDOW);

  const current = await env.BIBLE_CACHE.get(key);
  const count = current ? parseInt(current) : 0;

  if (count >= limit) {
    return { allowed: false, retryAfter: window };
  }

  await env.BIBLE_CACHE.put(key, String(count + 1), { expirationTtl: window });
  return { allowed: true };
}

function parseSearchParams(url: URL): { query: string; version: string } | null {
  const parsed = BibleSearchParamsSchema.safeParse({
    query: url.searchParams.get('q'),
    version: url.searchParams.get('version'),
  });

  if (!parsed.success) {
    return null;
  }

  return {
    query: parsed.data.query,
    version: parsed.data.version ?? 'kjv',
  };
}

async function handleVersions(env: Env): Promise<Response> {
  // Return supported Bible versions
  const versions = [
    { code: 'kjv', name: 'King James Version', language: 'en' },
    { code: 'web', name: 'World English Bible', language: 'en' },
    { code: 'asv', name: 'American Standard Version', language: 'en' },
  ];

  const payload = BibleVersionsResponseSchema.parse({ versions });
  return jsonResponse(payload, 200);
}

async function handleSearch(query: string, version: string, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cacheKey = `search:${version}:${query.toLowerCase()}`;
  
  // Check cache
  const cached = await env.BIBLE_CACHE.get(cacheKey);
  if (cached) {
    return jsonResponse(JSON.parse(cached), 200, { 'X-Cache': 'HIT' });
  }

  // For now, return a placeholder - integrate with actual Bible API
  const payload = BibleSearchResponseSchema.parse({
    query,
    version,
    results: [],
    message: 'Search functionality requires Bible API integration',
  });

  // Cache the result
  ctx.waitUntil(
    env.BIBLE_CACHE.put(cacheKey, JSON.stringify(payload), {
      expirationTtl: parseInt(env.CACHE_TTL),
    })
  );

  return jsonResponse(payload, 200, { 'X-Cache': 'MISS' });
}

async function handleVerseReference(ref: BibleReference, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cacheKey = `verse:${ref.version}:${ref.book}:${ref.chapter}:${ref.verseStart || 'all'}:${ref.verseEnd || ''}`;

  // Check cache
  const cached = await env.BIBLE_CACHE.get(cacheKey);
  if (cached) {
    return jsonResponse(JSON.parse(cached), 200, { 'X-Cache': 'HIT' });
  }

  // Placeholder response - integrate with actual Bible API or Convex
  const payload = BibleVerseResponseSchema.parse({
    reference: ref,
    text: `[Bible text for ${ref.book} ${ref.chapter}${ref.verseStart ? `:${ref.verseStart}` : ''}${ref.verseEnd ? `-${ref.verseEnd}` : ''}]`,
    message: 'Full Bible data is stored in Convex. Use this endpoint for quick lookups.',
  });

  // Cache the result
  ctx.waitUntil(
    env.BIBLE_CACHE.put(cacheKey, JSON.stringify(payload), {
      expirationTtl: parseInt(env.CACHE_TTL),
    })
  );

  return jsonResponse(payload, 200, { 'X-Cache': 'MISS' });
}

function jsonResponse(data: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}
