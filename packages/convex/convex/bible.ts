import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./auth";
import {
  BibleBookSeedInputSchema,
  BibleBooksArgsSchema,
  BibleBooksByVersionCodeArgsSchema,
  BibleChapterArgsSchema,
  BibleChapterByReferenceArgsSchema,
  BibleChapterSeedInputSchema,
  BibleSearchArgsSchema,
  BibleVerseArgsSchema,
  BibleVersionLanguageArgsSchema,
  BibleVersionSeedInputSchema,
} from "./domain/bible";

// Get all Bible versions
export const getVersions = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return await ctx.db.query("bibleVersions").collect();
  },
});

// Get versions by language
export const getVersionsByLanguage = query({
  args: { language: v.string() },
  handler: async (ctx, args) => {
    const { language } = BibleVersionLanguageArgsSchema.parse(args);
    await requireIdentity(ctx);
    return await ctx.db
      .query("bibleVersions")
      .withIndex("by_language", (q) => q.eq("language", language))
      .collect();
  },
});

// Get books for a version
export const getBooks = query({
  args: { versionId: v.id("bibleVersions") },
  handler: async (ctx, args) => {
    const { versionId } = BibleBooksArgsSchema.parse(args);
    await requireIdentity(ctx);
    return await ctx.db
      .query("bibleBooks")
      .withIndex("by_version", (q) => q.eq("versionId", versionId))
      .collect();
  },
});

export const getBooksByVersionCode = query({
  args: { versionCode: v.string() },
  handler: async (ctx, args) => {
    const { versionCode } = BibleBooksByVersionCodeArgsSchema.parse(args);
    await requireIdentity(ctx);
    const normalizedCode = versionCode.toLowerCase();
    let version = await ctx.db
      .query("bibleVersions")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();
    if (!version && normalizedCode !== versionCode) {
      version = await ctx.db
        .query("bibleVersions")
        .withIndex("by_code", (q) => q.eq("code", versionCode))
        .first();
    }
    if (!version) return [];

    const books = await ctx.db
      .query("bibleBooks")
      .withIndex("by_version", (q) => q.eq("versionId", version._id))
      .collect();

    return books.sort((a, b) => a.bookNumber - b.bookNumber);
  },
});

// Get a chapter
export const getChapter = query({
  args: {
    bookId: v.id("bibleBooks"),
    chapter: v.number(),
  },
  handler: async (ctx, args) => {
    const { bookId, chapter } = BibleChapterArgsSchema.parse(args);
    await requireIdentity(ctx);
    return await ctx.db
      .query("bibleChapters")
      .withIndex("by_book_chapter", (q) => 
        q.eq("bookId", bookId).eq("chapter", chapter)
      )
      .first();
  },
});

export const getChapterByReference = query({
  args: {
    versionCode: v.string(),
    book: v.string(),
    chapter: v.number(),
  },
  handler: async (ctx, args) => {
    const { versionCode, book, chapter } = BibleChapterByReferenceArgsSchema.parse(args);
    await requireIdentity(ctx);
    const normalizedCode = versionCode.toLowerCase();
    let version = await ctx.db
      .query("bibleVersions")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();
    if (!version && normalizedCode !== versionCode) {
      version = await ctx.db
        .query("bibleVersions")
        .withIndex("by_code", (q) => q.eq("code", versionCode))
        .first();
    }
    if (!version) return null;

    const bookRecord = await ctx.db
      .query("bibleBooks")
      .withIndex("by_version", (q) => q.eq("versionId", version._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("name"), book),
          q.eq(q.field("shortName"), book)
        )
      )
      .first();
    if (!bookRecord) return null;

    return await ctx.db
      .query("bibleChapters")
      .withIndex("by_book_chapter", (q) =>
        q.eq("bookId", bookRecord._id).eq("chapter", chapter)
      )
      .first();
  },
});

// Get a specific verse
export const getVerse = query({
  args: {
    versionCode: v.string(),
    book: v.string(),
    chapter: v.number(),
    verse: v.number(),
  },
  handler: async (ctx, args) => {
    const { versionCode, book, chapter, verse } = BibleVerseArgsSchema.parse(args);
    await requireIdentity(ctx);
    const normalizedCode = versionCode.toLowerCase();
    let version = await ctx.db
      .query("bibleVersions")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();
    if (!version && normalizedCode !== versionCode) {
      version = await ctx.db
        .query("bibleVersions")
        .withIndex("by_code", (q) => q.eq("code", versionCode))
        .first();
    }
    
    if (!version) return null;

    const bookRecord = await ctx.db
      .query("bibleBooks")
      .withIndex("by_version", (q) => q.eq("versionId", version._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("name"), book),
          q.eq(q.field("shortName"), book)
        )
      )
      .first();
    
    if (!bookRecord) return null;

    const chapterData = await ctx.db
      .query("bibleChapters")
      .withIndex("by_book_chapter", (q) => 
        q.eq("bookId", bookRecord._id).eq("chapter", chapter)
      )
      .first();
    
    if (!chapterData) return null;

    const verseData = chapterData.verses.find((v) => v.verse === verse);
    return verseData ? { ...verseData, book, chapter } : null;
  },
});

// Search verses
export const searchVerses = query({
  args: {
    versionCode: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { versionCode, query, limit } = BibleSearchArgsSchema.parse(args);
    await requireIdentity(ctx);
    const normalizedCode = versionCode.toLowerCase();
    let version = await ctx.db
      .query("bibleVersions")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();
    if (!version && normalizedCode !== versionCode) {
      version = await ctx.db
        .query("bibleVersions")
        .withIndex("by_code", (q) => q.eq("code", versionCode))
        .first();
    }
    
    if (!version) return [];

    const books = await ctx.db
      .query("bibleBooks")
      .withIndex("by_version", (q) => q.eq("versionId", version._id))
      .collect();

    const results: Array<{
      book: string;
      chapter: number;
      verse: number;
      text: string;
    }> = [];

    const searchLower = query.toLowerCase();
    const effectiveLimit = limit || 50;

    for (const book of books) {
      if (results.length >= effectiveLimit) break;
      
      const chapters = await ctx.db
        .query("bibleChapters")
        .withIndex("by_book", (q) => q.eq("bookId", book._id))
        .collect();

      for (const chapter of chapters) {
        if (results.length >= effectiveLimit) break;
        
        for (const verse of chapter.verses) {
          if (results.length >= effectiveLimit) break;
          
          if (verse.text.toLowerCase().includes(searchLower)) {
            results.push({
              book: book.name,
              chapter: chapter.chapter,
              verse: verse.verse,
              text: verse.text,
            });
          }
        }
      }
    }

    return results;
  },
});

// Seed Bible version
export const seedBibleVersion = internalMutation({
  args: {
    code: v.string(),
    name: v.string(),
    language: v.string(),
    copyright: v.optional(v.string()),
    bookCount: v.number(),
    verseCount: v.number(),
  },
  handler: async (ctx, args) => {
    const input = BibleVersionSeedInputSchema.parse(args);
    // Check if already exists
    const existing = await ctx.db
      .query("bibleVersions")
      .withIndex("by_code", (q) => q.eq("code", input.code))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: input.name,
        language: input.language,
        copyright: input.copyright,
        bookCount: input.bookCount,
        verseCount: input.verseCount,
      });
      return existing._id;
    }

    return await ctx.db.insert("bibleVersions", {
      code: input.code,
      name: input.name,
      language: input.language,
      copyright: input.copyright,
      bookCount: input.bookCount,
      verseCount: input.verseCount,
    });
  },
});

// Seed Bible book
export const seedBibleBook = internalMutation({
  args: {
    versionId: v.id("bibleVersions"),
    bookNumber: v.number(),
    name: v.string(),
    shortName: v.string(),
    testament: v.union(v.literal("old"), v.literal("new")),
    chapters: v.number(),
  },
  handler: async (ctx, args) => {
    const input = BibleBookSeedInputSchema.parse(args);
    // Check if already exists
    const existing = await ctx.db
      .query("bibleBooks")
      .withIndex("by_version_number", (q) => 
        q.eq("versionId", input.versionId).eq("bookNumber", input.bookNumber)
      )
      .first();
    
    if (existing) return existing._id;

    return await ctx.db.insert("bibleBooks", input);
  },
});

// Seed Bible chapter
export const seedBibleChapter = internalMutation({
  args: {
    bookId: v.id("bibleBooks"),
    chapter: v.number(),
    verses: v.array(v.object({
      verse: v.number(),
      text: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const input = BibleChapterSeedInputSchema.parse(args);
    // Check if already exists
    const existing = await ctx.db
      .query("bibleChapters")
      .withIndex("by_book_chapter", (q) => 
        q.eq("bookId", input.bookId).eq("chapter", input.chapter)
      )
      .first();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, { verses: input.verses });
      return existing._id;
    }

    return await ctx.db.insert("bibleChapters", input);
  },
});
