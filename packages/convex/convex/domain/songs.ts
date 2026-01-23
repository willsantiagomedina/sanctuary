import { z } from "zod";
import { Id } from "../_generated/dataModel";

const OrganizationIdSchema = z
  .string()
  .transform((value) => value as Id<"organizations">);
const SongIdSchema = z.string().transform((value) => value as Id<"songs">);

export const SongSectionSchema = z.object({
  type: z.string(),
  label: z.string(),
  lines: z.array(z.string()),
});

const SongBaseInputSchema = z.object({
  title: z.string(),
  artist: z.string().optional(),
  language: z.string(),
  lyrics: z.string(),
  sections: z.array(SongSectionSchema),
  copyright: z.string().optional(),
  ccliNumber: z.string().optional(),
  tempo: z.string().optional(),
  key: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const SongCreateInputSchema = SongBaseInputSchema.extend({
  organizationId: OrganizationIdSchema.optional(),
});

export const SongSeedInputSchema = SongBaseInputSchema;

export const SongLanguageArgsSchema = z.object({
  language: z.string(),
});

export const SongSearchArgsSchema = z.object({
  query: z.string(),
  language: z.string().optional(),
});

export const SongListArgsSchema = z.object({
  limit: z.number().optional(),
});

export const SongIdArgsSchema = z.object({
  id: SongIdSchema,
});
