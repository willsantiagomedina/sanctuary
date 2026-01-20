import type { BibleTranslation, SupportedLanguage } from '@sanctuary/shared';
import { bibleCache } from './bible-cache';
import { bibleData, BIBLE_BOOKS } from '../data/bible';

type SeedBookData = Record<number, Record<number, string>>;
type SeedTranslationData = Record<string, SeedBookData>;

type SeedTranslation = {
  id: string;
  name: string;
  abbreviation: string;
  language: SupportedLanguage;
  copyright: string;
  data: SeedTranslationData;
  bookCount: number;
  verseCount: number;
};

type SeedVerse = {
  id: string;
  translationId: string;
  bookAbbrev: string;
  chapter: number;
  verse: number;
  text: string;
};

const countSeedVerses = (data: SeedTranslationData): number => {
  let total = 0;
  for (const chapters of Object.values(data)) {
    for (const verses of Object.values(chapters)) {
      total += Object.keys(verses).length;
    }
  }
  return total;
};

const SEED_TRANSLATIONS: SeedTranslation[] = [
  {
    id: 'kjv',
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'en',
    copyright: 'Public Domain',
    data: bibleData.KJV || {},
    bookCount: Object.keys(bibleData.KJV || {}).length,
    verseCount: countSeedVerses(bibleData.KJV || {}),
  },
];

const flattenSeedVerses = (translationId: string, data: SeedTranslationData): SeedVerse[] => {
  const verses: SeedVerse[] = [];
  for (const [book, chapters] of Object.entries(data)) {
    for (const [chapter, verseMap] of Object.entries(chapters)) {
      for (const [verse, text] of Object.entries(verseMap)) {
        verses.push({
          id: '',
          translationId,
          bookAbbrev: book,
          chapter: Number(chapter),
          verse: Number(verse),
          text,
        });
      }
    }
  }
  return verses;
};

export function getSeedTranslation(translationId: string): SeedTranslation | undefined {
  return SEED_TRANSLATIONS.find((translation) => translation.id === translationId);
}

export function getSeedTranslationMeta(
  translationId: string
): Omit<BibleTranslation, 'isDownloaded' | 'lastSynced'> | undefined {
  const seed = getSeedTranslation(translationId);
  if (!seed) return undefined;
  return {
    id: seed.id,
    name: seed.name,
    abbreviation: seed.abbreviation,
    language: seed.language,
    copyright: seed.copyright,
    bookCount: seed.bookCount,
    verseCount: seed.verseCount,
  };
}

export function getSeedBooks(translationId: string): string[] {
  const seed = getSeedTranslation(translationId);
  if (!seed) return [];
  const available = new Set(Object.keys(seed.data));
  return BIBLE_BOOKS.filter((book) => available.has(book));
}

export function getSeedBookEntries(
  translationId: string
): Array<{ name: string; chapterCount: number }> {
  const seed = getSeedTranslation(translationId);
  if (!seed) return [];
  return getSeedBooks(translationId).map((book) => ({
    name: book,
    chapterCount: getSeedChapters(translationId, book).length,
  }));
}

export function getSeedChapters(translationId: string, bookAbbrev: string): number[] {
  const seed = getSeedTranslation(translationId);
  if (!seed) return [];
  const chapters = seed.data?.[bookAbbrev];
  if (!chapters) return [];
  return Object.keys(chapters).map(Number).sort((a, b) => a - b);
}

export function getSeedVerseNumbers(
  translationId: string,
  bookAbbrev: string,
  chapter: number
): number[] {
  const seed = getSeedTranslation(translationId);
  if (!seed) return [];
  const verses = seed.data?.[bookAbbrev]?.[chapter];
  if (!verses) return [];
  return Object.keys(verses).map(Number).sort((a, b) => a - b);
}

export function getSeedVerseText(
  translationId: string,
  bookAbbrev: string,
  chapter: number,
  verse: number
): string | null {
  const seed = getSeedTranslation(translationId);
  if (!seed) return null;
  return seed.data?.[bookAbbrev]?.[chapter]?.[verse] || null;
}

export function getSeedChapterVerses(
  translationId: string,
  bookAbbrev: string,
  chapter: number
): SeedVerse[] {
  const seed = getSeedTranslation(translationId);
  if (!seed) return [];
  const verses = seed.data?.[bookAbbrev]?.[chapter];
  if (!verses) return [];
  return Object.entries(verses).map(([verse, text]) => ({
    id: '',
    translationId,
    bookAbbrev,
    chapter,
    verse: Number(verse),
    text,
  }));
}

export function searchSeedVerses(
  translationId: string,
  query: string,
  limit = 50
): SeedVerse[] {
  const seed = getSeedTranslation(translationId);
  if (!seed || !query) return [];

  const results: SeedVerse[] = [];
  const queryLower = query.toLowerCase();

  for (const [book, chapters] of Object.entries(seed.data)) {
    for (const [chapter, verseMap] of Object.entries(chapters)) {
      for (const [verse, text] of Object.entries(verseMap)) {
        if (text.toLowerCase().includes(queryLower)) {
          results.push({
            id: '',
            translationId,
            bookAbbrev: book,
            chapter: Number(chapter),
            verse: Number(verse),
            text,
          });
          if (results.length >= limit) return results;
        }
      }
    }
  }

  return results;
}

type SeedDownloadOptions = {
  onProgress?: (downloadedVerses: number, totalVerses: number) => void;
  shouldCancel?: () => boolean;
};

export async function seedTranslationToCache(
  translationId: string,
  options: SeedDownloadOptions = {}
): Promise<{ ok: boolean; totalVerses?: number; cancelled?: boolean; error?: string }> {
  const seed = getSeedTranslation(translationId);
  if (!seed) {
    return { ok: false, error: 'Seed translation not available' };
  }

  const totalVerses = seed.verseCount;
  const verses = flattenSeedVerses(translationId, seed.data);
  const chunkSize = 500;

  await bibleCache.saveTranslation({
    id: seed.id,
    name: seed.name,
    abbreviation: seed.abbreviation,
    language: seed.language,
    copyright: seed.copyright,
    bookCount: seed.bookCount,
    verseCount: seed.verseCount,
    isDownloaded: false,
    lastSynced: Date.now(),
  });

  await bibleCache.updateDownloadProgress({
    translationId,
    totalVerses,
    downloadedVerses: 0,
    status: 'downloading',
  });

  for (let i = 0; i < verses.length; i += chunkSize) {
    if (options.shouldCancel?.()) {
      await bibleCache.updateDownloadProgress({
        translationId,
        totalVerses,
        downloadedVerses: i,
        status: 'pending',
      });
      return { ok: false, cancelled: true, totalVerses };
    }

    const slice = verses.slice(i, i + chunkSize);
    await bibleCache.saveVerses(slice);

    const downloadedVerses = Math.min(i + slice.length, totalVerses);
    await bibleCache.updateDownloadProgress({
      translationId,
      totalVerses,
      downloadedVerses,
      status: 'downloading',
    });
    options.onProgress?.(downloadedVerses, totalVerses);
  }

  await bibleCache.saveTranslation({
    id: seed.id,
    name: seed.name,
    abbreviation: seed.abbreviation,
    language: seed.language,
    copyright: seed.copyright,
    bookCount: seed.bookCount,
    verseCount: seed.verseCount,
    isDownloaded: true,
    lastSynced: Date.now(),
    downloadedAt: Date.now(),
  });

  await bibleCache.updateDownloadProgress({
    translationId,
    totalVerses,
    downloadedVerses: totalVerses,
    status: 'complete',
  });

  return { ok: true, totalVerses };
}
