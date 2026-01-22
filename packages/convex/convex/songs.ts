import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Get songs by language
export const getSongsByLanguage = query({
  args: { language: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("songs")
      .withIndex("by_language", (q) => q.eq("language", args.language))
      .collect();
  },
});

// Search songs
export const searchSongs = query({
  args: {
    query: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.language) {
      const language = args.language;
      return await ctx.db
        .query("songs")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.query).eq("language", language)
        )
        .take(50);
    }
    return await ctx.db
      .query("songs")
      .withSearchIndex("search_title", (q) => q.search("title", args.query))
      .take(50);
  },
});

// Get song by ID
export const getSong = query({
  args: { id: v.id("songs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all songs (paginated)
export const getAllSongs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("songs")
      .order("desc")
      .take(args.limit || 100);
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
    return await ctx.db.insert("songs", {
      ...args,
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
    // Check if already exists
    const existing = await ctx.db
      .query("songs")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.title).eq("language", args.language)
      )
      .first();
    
    if (existing) return existing._id;

    return await ctx.db.insert("songs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
