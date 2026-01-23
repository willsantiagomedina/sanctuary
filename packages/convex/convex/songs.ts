import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrgMember, requireOrgRole, requireUser } from "./auth";
import {
  SongCreateInputSchema,
  SongIdArgsSchema,
  SongLanguageArgsSchema,
  SongListArgsSchema,
  SongSearchArgsSchema,
  SongSeedInputSchema,
} from "./domain/songs";

// Get songs by language
export const getSongsByLanguage = query({
  args: { language: v.string() },
  handler: async (ctx, args) => {
    const { language } = SongLanguageArgsSchema.parse(args);
    const { user } = await requireUser(ctx);
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const orgIds = new Set(memberships.map((m) => m.organizationId));
    const songs = await ctx.db
      .query("songs")
      .withIndex("by_language", (q) => q.eq("language", language))
      .collect();
    return songs.filter((song) => !song.organizationId || orgIds.has(song.organizationId));
  },
});

// Search songs
export const searchSongs = query({
  args: {
    query: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { query, language } = SongSearchArgsSchema.parse(args);
    const { user } = await requireUser(ctx);
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const orgIds = new Set(memberships.map((m) => m.organizationId));
    if (language) {
      const songs = await ctx.db
        .query("songs")
        .withSearchIndex("search_title", (q) =>
          q.search("title", query).eq("language", language)
        )
        .take(50);
      return songs.filter((song) => !song.organizationId || orgIds.has(song.organizationId));
    }
    const songs = await ctx.db
      .query("songs")
      .withSearchIndex("search_title", (q) => q.search("title", query))
      .take(50);
    return songs.filter((song) => !song.organizationId || orgIds.has(song.organizationId));
  },
});

// Get song by ID
export const getSong = query({
  args: { id: v.id("songs") },
  handler: async (ctx, args) => {
    const { id } = SongIdArgsSchema.parse(args);
    const song = await ctx.db.get(id);
    if (!song) return null;
    if (song.organizationId) {
      await requireOrgMember(ctx, song.organizationId);
    } else {
      await requireUser(ctx);
    }
    return song;
  },
});

// Get all songs (paginated)
export const getAllSongs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit } = SongListArgsSchema.parse(args);
    const { user } = await requireUser(ctx);
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const orgIds = new Set(memberships.map((m) => m.organizationId));
    const songs = await ctx.db
      .query("songs")
      .order("desc")
      .take(limit || 100);
    return songs.filter((song) => !song.organizationId || orgIds.has(song.organizationId));
  },
});

// Add a song (for organization custom songs)
export const addSong = mutation({
  args: {
    title: v.string(),
    artist: v.optional(v.string()),
    language: v.string(),
    lyrics: v.string(),
    sections: v.array(v.object({
      type: v.string(),
      label: v.string(),
      lines: v.array(v.string()),
    })),
    copyright: v.optional(v.string()),
    ccliNumber: v.optional(v.string()),
    tempo: v.optional(v.string()),
    key: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const input = SongCreateInputSchema.parse(args);
    await requireUser(ctx);
    if (input.organizationId) {
      await requireOrgRole(ctx, input.organizationId, ["owner", "admin", "editor"]);
    }
    return await ctx.db.insert("songs", {
      ...input,
      createdAt: Date.now(),
    });
  },
});

// Seed song (internal)
export const seedSong = internalMutation({
  args: {
    title: v.string(),
    artist: v.optional(v.string()),
    language: v.string(),
    lyrics: v.string(),
    sections: v.array(v.object({
      type: v.string(),
      label: v.string(),
      lines: v.array(v.string()),
    })),
    copyright: v.optional(v.string()),
    ccliNumber: v.optional(v.string()),
    tempo: v.optional(v.string()),
    key: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const input = SongSeedInputSchema.parse(args);
    // Check if already exists
    const existing = await ctx.db
      .query("songs")
      .withSearchIndex("search_title", (q) =>
        q.search("title", input.title).eq("language", input.language)
      )
      .first();
    
    if (existing) return existing._id;

    return await ctx.db.insert("songs", {
      ...input,
      createdAt: Date.now(),
    });
  },
});
