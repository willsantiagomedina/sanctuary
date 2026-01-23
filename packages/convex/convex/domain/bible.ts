import { z } from "zod";
import { Id } from "../_generated/dataModel";

const BibleVersionIdSchema = z
  .string()
  .transform((value) => value as Id<"bibleVersions">);
const BibleBookIdSchema = z
  .string()
  .transform((value) => value as Id<"bibleBooks">);

export const BibleVersionLanguageArgsSchema = z.object({
  language: z.string(),
});

export const BibleBooksArgsSchema = z.object({
  versionId: BibleVersionIdSchema,
});

export const BibleBooksByVersionCodeArgsSchema = z.object({
  versionCode: z.string(),
});

export const BibleChapterArgsSchema = z.object({
  bookId: BibleBookIdSchema,
  chapter: z.number(),
});

export const BibleChapterByReferenceArgsSchema = z.object({
  versionCode: z.string(),
  book: z.string(),
  chapter: z.number(),
});

export const BibleVerseArgsSchema = z.object({
  versionCode: z.string(),
  book: z.string(),
  chapter: z.number(),
  verse: z.number(),
});

export const BibleSearchArgsSchema = z.object({
  versionCode: z.string(),
  query: z.string(),
  limit: z.number().optional(),
});

export const BibleVersionSeedInputSchema = z.object({
  code: z.string(),
  name: z.string(),
  language: z.string(),
  copyright: z.string().optional(),
  bookCount: z.number(),
  verseCount: z.number(),
});

export const BibleBookSeedInputSchema = z.object({
  versionId: BibleVersionIdSchema,
  bookNumber: z.number(),
  name: z.string(),
  shortName: z.string(),
  testament: z.enum(["old", "new"]),
  chapters: z.number(),
});

export const BibleChapterSeedInputSchema = z.object({
  bookId: BibleBookIdSchema,
  chapter: z.number(),
  verses: z.array(
    z.object({
      verse: z.number(),
      text: z.string(),
    })
  ),
});

export const BibleImportArgsSchema = z.object({
  version: BibleVersionSeedInputSchema,
  books: z.array(
    z.object({
      bookNumber: z.number(),
      name: z.string(),
      shortName: z.string(),
      testament: z.enum(["old", "new"]),
      chapters: z.array(
        z.object({
          chapter: z.number(),
          verses: z.array(
            z.object({
              verse: z.number(),
              text: z.string(),
            })
          ),
        })
      ),
    })
  ),
});
