import { z } from 'zod';

const OptionalStringParamSchema = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  z.string().optional()
);

export const BibleReferenceSchema = z.object({
  book: z.string(),
  chapter: z.number(),
  verseStart: z.number().optional(),
  verseEnd: z.number().optional(),
  version: z.string().optional(),
});

export type BibleReference = z.infer<typeof BibleReferenceSchema>;

export const BibleSearchParamsSchema = z.object({
  query: z.string().min(1),
  version: OptionalStringParamSchema,
});

export const BibleVersionSchema = z.object({
  code: z.string(),
  name: z.string(),
  language: z.string(),
});

export const BibleVersionsResponseSchema = z.object({
  versions: z.array(BibleVersionSchema),
});

export const BibleSearchResultSchema = z.object({
  book: z.string(),
  chapter: z.number(),
  verse: z.number(),
  text: z.string(),
});

export const BibleSearchResponseSchema = z.object({
  query: z.string(),
  version: z.string(),
  results: z.array(BibleSearchResultSchema),
  message: z.string().optional(),
});

export const BibleVerseResponseSchema = z.object({
  reference: BibleReferenceSchema,
  text: z.string(),
  message: z.string().optional(),
});
