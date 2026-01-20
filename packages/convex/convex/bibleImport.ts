import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const importBibleDataset = action({
  args: {
    version: v.object({
      code: v.string(),
      name: v.string(),
      language: v.string(),
      copyright: v.optional(v.string()),
      bookCount: v.number(),
      verseCount: v.number(),
    }),
    books: v.array(
      v.object({
        bookNumber: v.number(),
        name: v.string(),
        shortName: v.string(),
        testament: v.union(v.literal("old"), v.literal("new")),
        chapters: v.array(
          v.object({
            chapter: v.number(),
            verses: v.array(
              v.object({
                verse: v.number(),
                text: v.string(),
              })
            ),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const versionId = await ctx.runMutation(internal.bible.seedBibleVersion, {
      code: args.version.code,
      name: args.version.name,
      language: args.version.language,
      copyright: args.version.copyright,
      bookCount: args.version.bookCount,
      verseCount: args.version.verseCount,
    });

    for (const book of args.books) {
      const bookId = await ctx.runMutation(internal.bible.seedBibleBook, {
        versionId,
        bookNumber: book.bookNumber,
        name: book.name,
        shortName: book.shortName,
        testament: book.testament,
        chapters: book.chapters.length,
      });

      for (const chapter of book.chapters) {
        await ctx.runMutation(internal.bible.seedBibleChapter, {
          bookId,
          chapter: chapter.chapter,
          verses: chapter.verses,
        });
      }
    }
  },
});
