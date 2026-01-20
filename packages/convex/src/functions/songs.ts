import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';

// ============================================================================
// SONG QUERIES
// ============================================================================

export const list = query({
  args: {
    organizationId: v.id('organizations'),
    language: v.optional(v.union(v.literal('en'), v.literal('ja'), v.literal('es'))),
  },
  handler: async (ctx, args) => {
    if (args.language) {
      return await ctx.db
        .query('songs')
        .withIndex('by_org_language', (q) =>
          q.eq('organizationId', args.organizationId).eq('language', args.language!)
        )
        .collect();
    }
    return await ctx.db
      .query('songs')
      .withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id('songs') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const search = query({
  args: {
    organizationId: v.id('organizations'),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('songs')
      .withSearchIndex('search_title', (q) =>
        q.search('title', args.query).eq('organizationId', args.organizationId)
      )
      .take(20);
  },
});

// ============================================================================
// SONG MUTATIONS
// ============================================================================

export const create = mutation({
  args: {
    organizationId: v.id('organizations'),
    title: v.string(),
    author: v.optional(v.string()),
    copyright: v.optional(v.string()),
    ccliNumber: v.optional(v.string()),
    language: v.union(v.literal('en'), v.literal('ja'), v.literal('es')),
    verses: v.array(v.object({
      id: v.string(),
      label: v.string(),
      text: v.string(),
      order: v.number(),
    })),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert('songs', {
      ...args,
      tags: args.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('songs'),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    copyright: v.optional(v.string()),
    ccliNumber: v.optional(v.string()),
    verses: v.optional(v.array(v.object({
      id: v.string(),
      label: v.string(),
      text: v.string(),
      order: v.number(),
    }))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id('songs') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const addVerse = mutation({
  args: {
    songId: v.id('songs'),
    label: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const song = await ctx.db.get(args.songId);
    if (!song) throw new Error('Song not found');

    const newVerse = {
      id: crypto.randomUUID(),
      label: args.label,
      text: args.text,
      order: song.verses.length,
    };

    await ctx.db.patch(args.songId, {
      verses: [...song.verses, newVerse],
      updatedAt: Date.now(),
    });

    return newVerse.id;
  },
});

export const updateVerse = mutation({
  args: {
    songId: v.id('songs'),
    verseId: v.string(),
    label: v.optional(v.string()),
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const song = await ctx.db.get(args.songId);
    if (!song) throw new Error('Song not found');

    const updatedVerses = song.verses.map((v) =>
      v.id === args.verseId
        ? { ...v, ...(args.label && { label: args.label }), ...(args.text && { text: args.text }) }
        : v
    );

    await ctx.db.patch(args.songId, {
      verses: updatedVerses,
      updatedAt: Date.now(),
    });
  },
});

export const removeVerse = mutation({
  args: {
    songId: v.id('songs'),
    verseId: v.string(),
  },
  handler: async (ctx, args) => {
    const song = await ctx.db.get(args.songId);
    if (!song) throw new Error('Song not found');

    const updatedVerses = song.verses
      .filter((v) => v.id !== args.verseId)
      .map((v, i) => ({ ...v, order: i }));

    await ctx.db.patch(args.songId, {
      verses: updatedVerses,
      updatedAt: Date.now(),
    });
  },
});

export const reorderVerses = mutation({
  args: {
    songId: v.id('songs'),
    verseOrder: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const song = await ctx.db.get(args.songId);
    if (!song) throw new Error('Song not found');

    const verseMap = new Map(song.verses.map((v) => [v.id, v]));
    const reorderedVerses = args.verseOrder
      .map((id, i) => {
        const verse = verseMap.get(id);
        return verse ? { ...verse, order: i } : null;
      })
      .filter(Boolean) as typeof song.verses;

    await ctx.db.patch(args.songId, {
      verses: reorderedVerses,
      updatedAt: Date.now(),
    });
  },
});
