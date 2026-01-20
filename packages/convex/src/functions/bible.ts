import { v } from 'convex/values';
import { mutation, query, action } from '../_generated/server';

// ============================================================================
// BIBLE QUERIES
// ============================================================================

export const listTranslations = query({
  args: {
    language: v.optional(v.union(v.literal('en'), v.literal('ja'), v.literal('es'))),
  },
  handler: async (ctx, args) => {
    if (args.language) {
      return await ctx.db
        .query('bibleTranslations')
        .withIndex('by_language', (q) => q.eq('language', args.language!))
        .collect();
    }
    return await ctx.db.query('bibleTranslations').collect();
  },
});

export const getTranslation = query({
  args: { translationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('bibleTranslations')
      .withIndex('by_translation_id', (q) => q.eq('translationId', args.translationId))
      .first();
  },
});

export const listBooks = query({
  args: { translationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('bibleBooks')
      .withIndex('by_translation', (q) => q.eq('translationId', args.translationId))
      .collect();
  },
});

export const getVerses = query({
  args: {
    translationId: v.string(),
    bookAbbrev: v.string(),
    chapter: v.number(),
    verseStart: v.optional(v.number()),
    verseEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allVerses = await ctx.db
      .query('bibleVerses')
      .withIndex('by_chapter', (q) =>
        q
          .eq('translationId', args.translationId)
          .eq('bookAbbrev', args.bookAbbrev)
          .eq('chapter', args.chapter)
      )
      .collect();

    if (args.verseStart !== undefined) {
      return allVerses.filter((v) => {
        const end = args.verseEnd ?? args.verseStart!;
        return v.verse >= args.verseStart! && v.verse <= end;
      });
    }

    return allVerses;
  },
});

export const getVerse = query({
  args: {
    translationId: v.string(),
    bookAbbrev: v.string(),
    chapter: v.number(),
    verse: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('bibleVerses')
      .withIndex('by_reference', (q) =>
        q
          .eq('translationId', args.translationId)
          .eq('bookAbbrev', args.bookAbbrev)
          .eq('chapter', args.chapter)
          .eq('verse', args.verse)
      )
      .first();
  },
});

export const searchVerses = query({
  args: {
    translationId: v.string(),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('bibleVerses')
      .withSearchIndex('search_text', (q) =>
        q.search('text', args.query).eq('translationId', args.translationId)
      )
      .take(50);
  },
});

// ============================================================================
// BIBLE MUTATIONS
// ============================================================================

export const seedTranslation = mutation({
  args: {
    translationId: v.string(),
    name: v.string(),
    abbreviation: v.string(),
    language: v.union(v.literal('en'), v.literal('ja'), v.literal('es')),
    copyright: v.string(),
    bookCount: v.number(),
    verseCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if translation already exists
    const existing = await ctx.db
      .query('bibleTranslations')
      .withIndex('by_translation_id', (q) => q.eq('translationId', args.translationId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert('bibleTranslations', {
      ...args,
      isComplete: false,
      lastSynced: Date.now(),
    });
  },
});

export const addBook = mutation({
  args: {
    translationId: v.string(),
    bookOrder: v.number(),
    name: v.string(),
    abbreviation: v.string(),
    testament: v.union(v.literal('old'), v.literal('new')),
    chapterCount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('bibleBooks', args);
  },
});

export const batchAddVerses = mutation({
  args: {
    verses: v.array(v.object({
      translationId: v.string(),
      bookAbbrev: v.string(),
      chapter: v.number(),
      verse: v.number(),
      text: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    for (const verse of args.verses) {
      await ctx.db.insert('bibleVerses', verse);
    }
    return args.verses.length;
  },
});

export const markTranslationComplete = mutation({
  args: { translationId: v.string() },
  handler: async (ctx, args) => {
    const translation = await ctx.db
      .query('bibleTranslations')
      .withIndex('by_translation_id', (q) => q.eq('translationId', args.translationId))
      .first();

    if (translation) {
      await ctx.db.patch(translation._id, {
        isComplete: true,
        lastSynced: Date.now(),
      });
    }
  },
});
