import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    preferredLanguage: v.union(v.literal("en"), v.literal("ja"), v.literal("es")),
    authId: v.string(),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_auth_id", ["authId"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    defaultBibleTranslation: v.optional(v.string()),
    fontSize: v.number(),
    fontFamily: v.string(),
    keyboardShortcutsEnabled: v.boolean(),
    reducedMotion: v.boolean(),
  }).index("by_user", ["userId"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    logoUrl: v.optional(v.string()),
    primaryLanguage: v.union(v.literal("en"), v.literal("ja"), v.literal("es")),
    supportedLanguages: v.array(v.union(v.literal("en"), v.literal("ja"), v.literal("es"))),
    timezone: v.string(),
    settings: v.object({
      defaultBibleTranslation: v.optional(v.string()),
      defaultTheme: v.optional(v.string()),
      allowGuestAccess: v.boolean(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer")
    ),
    joinedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_org_user", ["organizationId", "userId"]),

  presentations: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    slideOrder: v.array(v.id("slides")),
    isArchived: v.boolean(),
    tags: v.array(v.string()),
    thumbnail: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_creator", ["createdBy"])
    .index("by_org_archived", ["organizationId", "isArchived"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["organizationId"],
    }),

  slides: defineTable({
    presentationId: v.id("presentations"),
    type: v.union(
      v.literal("blank"),
      v.literal("title"),
      v.literal("bible"),
      v.literal("lyrics"),
      v.literal("image"),
      v.literal("video"),
      v.literal("announcement")
    ),
    content: v.object({
      title: v.optional(v.string()),
      subtitle: v.optional(v.string()),
      body: v.optional(v.string()),
      bibleReference: v.optional(
        v.object({
          book: v.string(),
          chapter: v.number(),
          verseStart: v.number(),
          verseEnd: v.optional(v.number()),
          translationId: v.optional(v.string()),
        })
      ),
      lyrics: v.optional(
        v.object({
          songId: v.optional(v.id("songs")),
          verse: v.number(),
          text: v.string(),
          label: v.optional(v.string()),
        })
      ),
      mediaId: v.optional(v.id("mediaAssets")),
    }),
    background: v.object({
      type: v.union(
        v.literal("color"),
        v.literal("gradient"),
        v.literal("image"),
        v.literal("video")
      ),
      value: v.string(),
      opacity: v.optional(v.number()),
      blur: v.optional(v.number()),
    }),
    transition: v.object({
      type: v.union(
        v.literal("none"),
        v.literal("fade"),
        v.literal("slide"),
        v.literal("zoom"),
        v.literal("flip")
      ),
      duration: v.number(),
      direction: v.optional(
        v.union(
          v.literal("left"),
          v.literal("right"),
          v.literal("up"),
          v.literal("down")
        )
      ),
    }),
    notes: v.optional(v.string()),
    duration: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_presentation", ["presentationId"]),

  mediaAssets: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    type: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
    mimeType: v.string(),
    size: v.number(),
    storageId: v.string(),
    url: v.string(),
    thumbnailUrl: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    duration: v.optional(v.number()),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    tags: v.array(v.string()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_type", ["organizationId", "type"])
    .index("by_uploader", ["uploadedBy"]),

  presence: defineTable({
    presentationId: v.id("presentations"),
    userId: v.id("users"),
    slideId: v.optional(v.id("slides")),
    cursor: v.optional(v.object({ x: v.number(), y: v.number() })),
    selection: v.optional(v.array(v.string())),
    lastSeen: v.number(),
  })
    .index("by_presentation", ["presentationId"])
    .index("by_user", ["userId"]),

  liveSessions: defineTable({
    presentationId: v.id("presentations"),
    organizationId: v.id("organizations"),
    currentSlideIndex: v.number(),
    isLive: v.boolean(),
    startedAt: v.optional(v.number()),
    startedBy: v.optional(v.id("users")),
    viewerIds: v.array(v.id("users")),
  })
    .index("by_presentation", ["presentationId"])
    .index("by_organization_live", ["organizationId", "isLive"]),

  bibleVersions: defineTable({
    code: v.string(),
    name: v.string(),
    language: v.string(),
    copyright: v.optional(v.string()),
    description: v.optional(v.string()),
    bookCount: v.number(),
    verseCount: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_language", ["language"]),

  bibleBooks: defineTable({
    versionId: v.id("bibleVersions"),
    bookNumber: v.number(),
    name: v.string(),
    shortName: v.string(),
    testament: v.union(v.literal("old"), v.literal("new")),
    chapters: v.number(),
  })
    .index("by_version", ["versionId"])
    .index("by_version_number", ["versionId", "bookNumber"]),

  bibleChapters: defineTable({
    bookId: v.id("bibleBooks"),
    chapter: v.number(),
    verses: v.array(
      v.object({
        verse: v.number(),
        text: v.string(),
      })
    ),
  })
    .index("by_book", ["bookId"])
    .index("by_book_chapter", ["bookId", "chapter"]),

  songs: defineTable({
    title: v.string(),
    artist: v.optional(v.string()),
    language: v.string(),
    lyrics: v.string(),
    sections: v.array(
      v.object({
        type: v.string(),
        label: v.string(),
        lines: v.array(v.string()),
      })
    ),
    copyright: v.optional(v.string()),
    ccliNumber: v.optional(v.string()),
    tempo: v.optional(v.string()),
    key: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    organizationId: v.optional(v.id("organizations")),
    createdAt: v.number(),
  })
    .index("by_language", ["language"])
    .index("by_org", ["organizationId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["language"],
    }),

  servicePlans: defineTable({
    title: v.string(),
    date: v.string(),
    organizationId: v.id("organizations"),
    items: v.array(
      v.object({
        type: v.union(
          v.literal("presentation"),
          v.literal("song"),
          v.literal("note")
        ),
        referenceId: v.optional(v.string()),
        title: v.string(),
        duration: v.optional(v.number()),
      })
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_date", ["organizationId", "date"]),
});
