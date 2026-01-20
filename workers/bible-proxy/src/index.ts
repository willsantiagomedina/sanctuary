/**
 * Sanctuary Bible API Proxy Worker
 * 
 * Handles:
 * - Rate limiting by IP
 * - Response caching via KV
 * - Proxying to external Bible APIs
 * - CORS headers for the web app
 */

interface Env {
  BIBLE_CACHE: KVNamespace;
  BIBLE_API_KEY: string;
  ENVIRONMENT: string;
  CACHE_TTL: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
}

interface BibleReference {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  version?: string;
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
        const query = url.searchParams.get('q');
        const version = url.searchParams.get('version') || 'kjv';
        if (!query) {
          return jsonResponse({ error: 'Missing search query' }, 400);
        }
        return await handleSearch(query, version, env, ctx);
      }

      // Parse verse reference: /john/3/16 or /john/3/16-18
      const refMatch = path.match(/^\/(\w+)\/(\d+)(?:\/(\d+)(?:-(\d+))?)?$/);
      if (refMatch) {
        const ref: BibleReference = {
          book: refMatch[1],
          chapter: parseInt(refMatch[2]),
          verseStart: refMatch[3] ? parseInt(refMatch[3]) : undefined,
          verseEnd: refMatch[4] ? parseInt(refMatch[4]) : undefined,
          version: url.searchParams.get('version') || 'kjv',
        };
        return await handleVerseReference(ref, env, ctx);
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

async function handleVersions(env: Env): Promise<Response> {
  // Return supported Bible versions
  const versions = [
    { code: 'kjv', name: 'King James Version', language: 'en' },
    { code: 'web', name: 'World English Bible', language: 'en' },
    { code: 'asv', name: 'American Standard Version', language: 'en' },
  ];

  return jsonResponse({ versions }, 200);
}

async function handleSearch(query: string, version: string, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cacheKey = `search:${version}:${query.toLowerCase()}`;
  
  // Check cache
  const cached = await env.BIBLE_CACHE.get(cacheKey);
  if (cached) {
    return jsonResponse(JSON.parse(cached), 200, { 'X-Cache': 'HIT' });
  }

  // For now, return a placeholder - integrate with actual Bible API
  const results = {
    query,
    version,
    results: [],
    message: 'Search functionality requires Bible API integration',
  };

  // Cache the result
  ctx.waitUntil(
    env.BIBLE_CACHE.put(cacheKey, JSON.stringify(results), {
      expirationTtl: parseInt(env.CACHE_TTL),
    })
  );

  return jsonResponse(results, 200, { 'X-Cache': 'MISS' });
}

async function handleVerseReference(ref: BibleReference, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cacheKey = `verse:${ref.version}:${ref.book}:${ref.chapter}:${ref.verseStart || 'all'}:${ref.verseEnd || ''}`;

  // Check cache
  const cached = await env.BIBLE_CACHE.get(cacheKey);
  if (cached) {
    return jsonResponse(JSON.parse(cached), 200, { 'X-Cache': 'HIT' });
  }

  // Placeholder response - integrate with actual Bible API or Convex
  const result = {
    reference: ref,
    text: `[Bible text for ${ref.book} ${ref.chapter}${ref.verseStart ? `:${ref.verseStart}` : ''}${ref.verseEnd ? `-${ref.verseEnd}` : ''}]`,
    message: 'Full Bible data is stored in Convex. Use this endpoint for quick lookups.',
  };

  // Cache the result
  ctx.waitUntil(
    env.BIBLE_CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: parseInt(env.CACHE_TTL),
    })
  );

  return jsonResponse(result, 200, { 'X-Cache': 'MISS' });
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
