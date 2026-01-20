import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Organizations (Churches)
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]).index("by_owner", ["ownerId"]),

  // Organization Members
  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
  }).index("by_org", ["organizationId"]).index("by_user", ["userId"]),

  // Presentations
  presentations: defineTable({
    title: v.string(),
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    slides: v.array(v.object({
      id: v.string(),
      elements: v.array(v.object({
        id: v.string(),
        type: v.string(),
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
        content: v.string(),
        reference: v.optional(v.string()),
        style: v.object({
          fontSize: v.optional(v.number()),
          fontFamily: v.optional(v.string()),
          fontWeight: v.optional(v.string()),
          fontStyle: v.optional(v.string()),
          textAlign: v.optional(v.string()),
          color: v.optional(v.string()),
          backgroundColor: v.optional(v.string()),
          borderRadius: v.optional(v.number()),
          borderColor: v.optional(v.string()),
          borderWidth: v.optional(v.number()),
          opacity: v.optional(v.number()),
          rotation: v.optional(v.number()),
        }),
      })),
      background: v.object({
        type: v.string(),
        value: v.string(),
      }),
      notes: v.optional(v.string()),
      transition: v.optional(v.string()),
    })),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_org", ["organizationId"]).index("by_creator", ["createdBy"]),

  // Bible Versions
  bibleVersions: defineTable({
    code: v.string(), // e.g., "kjv", "niv", "esv"
    name: v.string(), // e.g., "King James Version"
    language: v.string(), // e.g., "en", "es", "ja"
    copyright: v.optional(v.string()),
    description: v.optional(v.string()),
    bookCount: v.number(),
    verseCount: v.number(),
  }).index("by_code", ["code"]).index("by_language", ["language"]),

  // Bible Books
  bibleBooks: defineTable({
    versionId: v.id("bibleVersions"),
    bookNumber: v.number(), // 1-66
    name: v.string(),
    shortName: v.string(),
    testament: v.union(v.literal("old"), v.literal("new")),
    chapters: v.number(), // total chapters in this book
  }).index("by_version", ["versionId"]).index("by_version_number", ["versionId", "bookNumber"]),

  // Bible Verses (stored by chapter for efficiency)
  bibleChapters: defineTable({
    bookId: v.id("bibleBooks"),
    chapter: v.number(),
    verses: v.array(v.object({
      verse: v.number(),
      text: v.string(),
    })),
  }).index("by_book", ["bookId"]).index("by_book_chapter", ["bookId", "chapter"]),

  // Songs
  songs: defineTable({
    title: v.string(),
    artist: v.optional(v.string()),
    language: v.string(), // "en", "es", "ja"
    lyrics: v.string(), // Full lyrics with verse markers
    sections: v.array(v.object({
      type: v.string(), // "verse", "chorus", "bridge", "intro", "outro"
      label: v.string(), // "Verse 1", "Chorus", etc.
      lines: v.array(v.string()),
    })),
    copyright: v.optional(v.string()),
    ccliNumber: v.optional(v.string()),
    tempo: v.optional(v.string()),
    key: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    organizationId: v.optional(v.id("organizations")), // null for global songs
    createdAt: v.number(),
  }).index("by_language", ["language"]).index("by_org", ["organizationId"]).searchIndex("search_title", {
    searchField: "title",
    filterFields: ["language"],
  }),

  // Service Plans (optional future feature)
  servicePlans: defineTable({
    title: v.string(),
    date: v.string(),
    organizationId: v.id("organizations"),
    items: v.array(v.object({
      type: v.union(v.literal("presentation"), v.literal("song"), v.literal("note")),
      referenceId: v.optional(v.string()),
      title: v.string(),
      duration: v.optional(v.number()),
    })),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_org", ["organizationId"]).index("by_date", ["organizationId", "date"]),
});
