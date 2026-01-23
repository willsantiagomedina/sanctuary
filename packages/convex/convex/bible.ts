import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./auth";

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
    await requireIdentity(ctx);
    return await ctx.db
      .query("bibleVersions")
      .withIndex("by_language", (q) => q.eq("language", args.language))
      .collect();
  },
});

// Get books for a version
export const getBooks = query({
  args: { versionId: v.id("bibleVersions") },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    return await ctx.db
      .query("bibleBooks")
      .withIndex("by_version", (q) => q.eq("versionId", args.versionId))
      .collect();
  },
});

export const getBooksByVersionCode = query({
  args: { versionCode: v.string() },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const normalizedCode = args.versionCode.toLowerCase();
    let version = await ctx.db
      .query("bibleVersions")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();
    if (!version && normalizedCode !== args.versionCode) {
      version = await ctx.db
        .query("bibleVersions")
        .withIndex("by_code", (q) => q.eq("code", args.versionCode))
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
    await requireIdentity(ctx);
    return await ctx.db
      .query("bibleChapters")
      .withIndex("by_book_chapter", (q) => 
        q.eq("bookId", args.bookId).eq("chapter", args.chapter)
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
    await requireIdentity(ctx);
    const normalizedCode = args.versionCode.toLowerCase();
    let version = await ctx.db
      .query("bibleVersions")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();
    if (!version && normalizedCode !== args.versionCode) {
      version = await ctx.db
        .query("bibleVersions")
        .withIndex("by_code", (q) => q.eq("code", args.versionCode))
        .first();
    }
    if (!version) return null;

    const bookRecord = await ctx.db
      .query("bibleBooks")
      .withIndex("by_version", (q) => q.eq("versionId", version._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("name"), args.book),
          q.eq(q.field("shortName"), args.book)
        )
      )
      .first();
    if (!bookRecord) return null;

    return await ctx.db
      .query("bibleChapters")
      .withIndex("by_book_chapter", (q) =>
        q.eq("bookId", bookRecord._id).eq("chapter", args.chapter)
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
    await requireIdentity(ctx);
    const normalizedCode = args.versionCode.toLowerCase();
    let version = await ctx.db
      .query("bibleVersions")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();
    if (!version && normalizedCode !== args.versionCode) {
      version = await ctx.db
        .query("bibleVersions")
        .withIndex("by_code", (q) => q.eq("code", args.versionCode))
        .first();
    }
    
    if (!version) return null;

    const bookRecord = await ctx.db
      .query("bibleBooks")
      .withIndex("by_version", (q) => q.eq("versionId", version._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("name"), args.book),
          q.eq(q.field("shortName"), args.book)
        )
      )
      .first();
    
    if (!bookRecord) return null;

    const chapterData = await ctx.db
      .query("bibleChapters")
      .withIndex("by_book_chapter", (q) => 
        q.eq("bookId", bookRecord._id).eq("chapter", args.chapter)
      )
      .first();
    
    if (!chapterData) return null;

    const verseData = chapterData.verses.find((v) => v.verse === args.verse);
    return verseData ? { ...verseData, book: args.book, chapter: args.chapter } : null;
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
    await requireIdentity(ctx);
    const normalizedCode = args.versionCode.toLowerCase();
    let version = await ctx.db
      .query("bibleVersions")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();
    if (!version && normalizedCode !== args.versionCode) {
      version = await ctx.db
        .query("bibleVersions")
        .withIndex("by_code", (q) => q.eq("code", args.versionCode))
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

    const searchLower = args.query.toLowerCase();
    const limit = args.limit || 50;

    for (const book of books) {
      if (results.length >= limit) break;
      
      const chapters = await ctx.db
        .query("bibleChapters")
        .withIndex("by_book", (q) => q.eq("bookId", book._id))
        .collect();

      for (const chapter of chapters) {
        if (results.length >= limit) break;
        
        for (const verse of chapter.verses) {
          if (results.length >= limit) break;
          
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
    // Check if already exists
    const existing = await ctx.db
      .query("bibleVersions")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        language: args.language,
        copyright: args.copyright,
        bookCount: args.bookCount,
        verseCount: args.verseCount,
      });
      return existing._id;
    }

    return await ctx.db.insert("bibleVersions", {
      code: args.code,
      name: args.name,
      language: args.language,
      copyright: args.copyright,
      bookCount: args.bookCount,
      verseCount: args.verseCount,
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
    // Check if already exists
    const existing = await ctx.db
      .query("bibleBooks")
      .withIndex("by_version_number", (q) => 
        q.eq("versionId", args.versionId).eq("bookNumber", args.bookNumber)
      )
      .first();
    
    if (existing) return existing._id;

    return await ctx.db.insert("bibleBooks", args);
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
    // Check if already exists
    const existing = await ctx.db
      .query("bibleChapters")
      .withIndex("by_book_chapter", (q) => 
        q.eq("bookId", args.bookId).eq("chapter", args.chapter)
      )
      .first();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, { verses: args.verses });
      return existing._id;
    }

    return await ctx.db.insert("bibleChapters", args);
  },
});
