import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// ============================================================================
// CONVEX SCHEMA FOR SANCTUARY
// ============================================================================

export default defineSchema({
  // --------------------------------------------------------------------------
  // BIBLE TABLES
  // --------------------------------------------------------------------------
  
  bibleTranslations: defineTable({
    translationId: v.string(), // e.g., "niv", "esv", "kougo"
    name: v.string(),
    abbreviation: v.string(),
    language: v.union(v.literal('en'), v.literal('ja'), v.literal('es')),
    copyright: v.string(),
    bookCount: v.number(),
    verseCount: v.number(),
    isComplete: v.boolean(),
    lastSynced: v.optional(v.number()),
  })
    .index('by_translation_id', ['translationId'])
    .index('by_language', ['language']),

  bibleBooks: defineTable({
    translationId: v.string(),
    bookOrder: v.number(),
    name: v.string(),
    abbreviation: v.string(),
    testament: v.union(v.literal('old'), v.literal('new')),
    chapterCount: v.number(),
  })
    .index('by_translation', ['translationId'])
    .index('by_translation_order', ['translationId', 'bookOrder']),

  bibleVerses: defineTable({
    translationId: v.string(),
    bookAbbrev: v.string(),
    chapter: v.number(),
    verse: v.number(),
    text: v.string(),
  })
    .index('by_reference', ['translationId', 'bookAbbrev', 'chapter', 'verse'])
    .index('by_chapter', ['translationId', 'bookAbbrev', 'chapter'])
    .searchIndex('search_text', { searchField: 'text', filterFields: ['translationId'] }),

  // --------------------------------------------------------------------------
  // ORGANIZATION/CHURCH TABLES
  // --------------------------------------------------------------------------

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    logoUrl: v.optional(v.string()),
    primaryLanguage: v.union(v.literal('en'), v.literal('ja'), v.literal('es')),
    supportedLanguages: v.array(v.union(v.literal('en'), v.literal('ja'), v.literal('es'))),
    timezone: v.string(),
    settings: v.object({
      defaultBibleTranslation: v.optional(v.string()),
      defaultTheme: v.optional(v.string()),
      allowGuestAccess: v.boolean(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug']),

  organizationMembers: defineTable({
    organizationId: v.id('organizations'),
    userId: v.id('users'),
    role: v.union(
      v.literal('owner'),
      v.literal('admin'),
      v.literal('editor'),
      v.literal('viewer')
    ),
    joinedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_user', ['userId'])
    .index('by_org_user', ['organizationId', 'userId']),

  // --------------------------------------------------------------------------
  // USER TABLES
  // --------------------------------------------------------------------------

  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    preferredLanguage: v.union(v.literal('en'), v.literal('ja'), v.literal('es')),
    authId: v.string(), // BetterAuth user ID
    createdAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_auth_id', ['authId']),

  userPreferences: defineTable({
    userId: v.id('users'),
    theme: v.union(v.literal('light'), v.literal('dark'), v.literal('system')),
    defaultBibleTranslation: v.optional(v.string()),
    fontSize: v.number(),
    fontFamily: v.string(),
    keyboardShortcutsEnabled: v.boolean(),
    reducedMotion: v.boolean(),
  })
    .index('by_user', ['userId']),

  // --------------------------------------------------------------------------
  // PRESENTATION TABLES
  // --------------------------------------------------------------------------

  presentations: defineTable({
    organizationId: v.id('organizations'),
    title: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id('users'),
    slideOrder: v.array(v.id('slides')),
    isArchived: v.boolean(),
    tags: v.array(v.string()),
    thumbnail: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_creator', ['createdBy'])
    .index('by_org_archived', ['organizationId', 'isArchived'])
    .searchIndex('search_title', { searchField: 'title', filterFields: ['organizationId'] }),

  slides: defineTable({
    presentationId: v.id('presentations'),
    type: v.union(
      v.literal('blank'),
      v.literal('title'),
      v.literal('bible'),
      v.literal('lyrics'),
      v.literal('image'),
      v.literal('video'),
      v.literal('announcement')
    ),
    content: v.object({
      title: v.optional(v.string()),
      subtitle: v.optional(v.string()),
      body: v.optional(v.string()),
      bibleReference: v.optional(v.object({
        book: v.string(),
        chapter: v.number(),
        verseStart: v.number(),
        verseEnd: v.optional(v.number()),
        translationId: v.optional(v.string()),
      })),
      lyrics: v.optional(v.object({
        songId: v.optional(v.id('songs')),
        verse: v.number(),
        text: v.string(),
        label: v.optional(v.string()),
      })),
      mediaId: v.optional(v.id('mediaAssets')),
    }),
    background: v.object({
      type: v.union(v.literal('color'), v.literal('gradient'), v.literal('image'), v.literal('video')),
      value: v.string(),
      opacity: v.optional(v.number()),
      blur: v.optional(v.number()),
    }),
    transition: v.object({
      type: v.union(v.literal('none'), v.literal('fade'), v.literal('slide'), v.literal('zoom'), v.literal('flip')),
      duration: v.number(),
      direction: v.optional(v.union(v.literal('left'), v.literal('right'), v.literal('up'), v.literal('down'))),
    }),
    notes: v.optional(v.string()),
    duration: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_presentation', ['presentationId']),

  // --------------------------------------------------------------------------
  // SONGS/LYRICS TABLES
  // --------------------------------------------------------------------------

  songs: defineTable({
    organizationId: v.id('organizations'),
    title: v.string(),
    author: v.optional(v.string()),
    copyright: v.optional(v.string()),
    ccliNumber: v.optional(v.string()),
    language: v.union(v.literal('en'), v.literal('ja'), v.literal('es')),
    verses: v.array(v.object({
      id: v.string(),
      label: v.string(),
      text: v.string(),
      order: v.number(),
    })),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_org_language', ['organizationId', 'language'])
    .searchIndex('search_title', { searchField: 'title', filterFields: ['organizationId'] }),

  // --------------------------------------------------------------------------
  // MEDIA TABLES
  // --------------------------------------------------------------------------

  mediaAssets: defineTable({
    organizationId: v.id('organizations'),
    name: v.string(),
    type: v.union(v.literal('image'), v.literal('video'), v.literal('audio')),
    mimeType: v.string(),
    size: v.number(),
    storageId: v.string(), // Convex storage ID or R2 key
    url: v.string(),
    thumbnailUrl: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    duration: v.optional(v.number()),
    uploadedBy: v.id('users'),
    uploadedAt: v.number(),
    tags: v.array(v.string()),
  })
    .index('by_organization', ['organizationId'])
    .index('by_type', ['organizationId', 'type'])
    .index('by_uploader', ['uploadedBy']),

  // --------------------------------------------------------------------------
  // REAL-TIME COLLABORATION TABLES
  // --------------------------------------------------------------------------

  presence: defineTable({
    presentationId: v.id('presentations'),
    userId: v.id('users'),
    slideId: v.optional(v.id('slides')),
    cursor: v.optional(v.object({ x: v.number(), y: v.number() })),
    selection: v.optional(v.array(v.string())),
    lastSeen: v.number(),
  })
    .index('by_presentation', ['presentationId'])
    .index('by_user', ['userId']),

  liveSessions: defineTable({
    presentationId: v.id('presentations'),
    organizationId: v.id('organizations'),
    currentSlideIndex: v.number(),
    isLive: v.boolean(),
    startedAt: v.optional(v.number()),
    startedBy: v.optional(v.id('users')),
    viewerIds: v.array(v.id('users')),
  })
    .index('by_presentation', ['presentationId'])
    .index('by_organization_live', ['organizationId', 'isLive']),

  // --------------------------------------------------------------------------
  // SCHEDULES/SERVICES
  // --------------------------------------------------------------------------

  serviceSchedules: defineTable({
    organizationId: v.id('organizations'),
    name: v.string(),
    scheduledFor: v.number(),
    presentationId: v.optional(v.id('presentations')),
    notes: v.optional(v.string()),
    createdBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_date', ['organizationId', 'scheduledFor']),
});
