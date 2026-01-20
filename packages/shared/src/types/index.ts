// ============================================================================
// BIBLE TYPES
// ============================================================================

export type SupportedLanguage = 'en' | 'ja' | 'es';

export type BibleTranslation = {
  id: string;
  name: string;
  abbreviation: string;
  language: SupportedLanguage;
  copyright: string;
  isDownloaded: boolean;
  lastSynced?: number;
  bookCount: number;
  verseCount: number;
};

export type BibleBook = {
  id: string;
  translationId: string;
  order: number;
  name: string;
  abbreviation: string;
  testament: 'old' | 'new';
  chapterCount: number;
};

export type BibleChapter = {
  id: string;
  bookId: string;
  number: number;
  verseCount: number;
};

export type BibleVerse = {
  id: string;
  chapterId: string;
  bookId: string;
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

export type BibleReference = {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  translationId?: string;
};

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  timezone: string;
  createdAt: number;
  updatedAt: number;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: number;
};

// ============================================================================
// USER TYPES
// ============================================================================

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferredLanguage: SupportedLanguage;
  createdAt: number;
  lastActiveAt: number;
};

export type UserPreferences = {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  defaultBibleTranslation?: string;
  fontSize: number;
  fontFamily: string;
};

// ============================================================================
// PRESENTATION TYPES
// ============================================================================

export type Presentation = {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  slideOrder: string[];
  isArchived: boolean;
  tags: string[];
};

export type SlideType = 
  | 'blank'
  | 'title'
  | 'bible'
  | 'lyrics'
  | 'image'
  | 'video'
  | 'announcement';

export type Slide = {
  id: string;
  presentationId: string;
  type: SlideType;
  content: SlideContent;
  background: SlideBackground;
  transition: SlideTransition;
  notes?: string;
  duration?: number; // Auto-advance in seconds
  createdAt: number;
  updatedAt: number;
};

export type SlideContent = {
  title?: string;
  subtitle?: string;
  body?: string;
  bibleReference?: BibleReference;
  lyrics?: LyricsContent;
  mediaId?: string;
  customHtml?: string;
};

export type LyricsContent = {
  songId?: string;
  verse: number;
  text: string;
  label?: string; // "Verse 1", "Chorus", etc.
};

export type SlideBackground = {
  type: 'color' | 'gradient' | 'image' | 'video';
  value: string; // Color hex, gradient CSS, or media URL
  opacity?: number;
  blur?: number;
};

export type SlideTransition = {
  type: 'none' | 'fade' | 'slide' | 'zoom' | 'flip';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
};

// ============================================================================
// SONG/LYRICS TYPES
// ============================================================================

export type Song = {
  id: string;
  organizationId: string;
  title: string;
  author?: string;
  copyright?: string;
  ccliNumber?: string;
  language: SupportedLanguage;
  verses: SongVerse[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

export type SongVerse = {
  id: string;
  label: string;
  text: string;
  order: number;
};

// ============================================================================
// MEDIA TYPES
// ============================================================================

export type MediaAsset = {
  id: string;
  organizationId: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  uploadedBy: string;
  uploadedAt: number;
  tags: string[];
};

// ============================================================================
// REAL-TIME COLLABORATION TYPES
// ============================================================================

export type Presence = {
  odId: string;
  slideId?: string;
  cursor?: { x: number; y: number };
  selection?: string[];
  lastSeen: number;
};

export type LiveSession = {
  id: string;
  presentationId: string;
  organizationId: string;
  currentSlideIndex: number;
  isLive: boolean;
  startedAt?: number;
  startedBy?: string;
  viewers: string[];
};
