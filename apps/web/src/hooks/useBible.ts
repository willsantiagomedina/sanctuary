import { useState, useEffect, useCallback, useRef } from 'react';
import { bibleCache } from '../lib/bible-cache';
import { AVAILABLE_TRANSLATIONS, type BibleTranslation, type SupportedLanguage } from '@sanctuary/shared';
import {
  getSeedChapterVerses,
  getSeedBookEntries,
  getSeedChapters,
  getSeedTranslationMeta,
  searchSeedVerses,
  seedTranslationToCache,
} from '../lib/bible-seed';

// Hook for managing Bible translations
export function useBibleTranslations(language?: SupportedLanguage) {
  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const cached = await bibleCache.listTranslations(language);

        const available = AVAILABLE_TRANSLATIONS.filter((translation) =>
          language ? translation.language === language : true
        ).map((translation) => ({
          ...translation,
          isDownloaded: false,
          lastSynced: undefined,
        }));

        const merged = available.map((translation) => {
          const cachedTranslation = cached.find((item) => item.id === translation.id);
          return cachedTranslation ? { ...translation, ...cachedTranslation } : translation;
        });

        const extraCached = cached.filter(
          (translation) => !merged.some((item) => item.id === translation.id)
        );

        setTranslations([...merged, ...extraCached]);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to available translations
        const fallback = AVAILABLE_TRANSLATIONS.filter((t) =>
          language ? t.language === language : true
        ).map((t) => ({ ...t, isDownloaded: false, lastSynced: undefined }));
        setTranslations(fallback);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [language]);

  return { translations, loading };
}

export function useBibleBooks(translationId: string) {
  const [books, setBooks] = useState<Array<{ name: string; chapterCount: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!translationId) return;
      setLoading(true);

      try {
        const seedBooks = getSeedBookEntries(translationId);
        if (seedBooks.length > 0) {
          setBooks(seedBooks);
          return;
        }

        // No server fallback - just return empty
        setBooks([]);
      } catch (error) {
        console.error('Failed to load books:', error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [translationId]);

  return { books, loading };
}

export function useBibleChapters(translationId: string, book: string, chapterCount?: number) {
  const [chapters, setChapters] = useState<number[]>([]);

  useEffect(() => {
    if (!translationId || !book) return;

    const seedChapters = getSeedChapters(translationId, book);
    if (seedChapters.length > 0) {
      setChapters(seedChapters);
      return;
    }

    if (chapterCount && chapterCount > 0) {
      setChapters(Array.from({ length: chapterCount }, (_, i) => i + 1));
      return;
    }

    setChapters([]);
  }, [translationId, book, chapterCount]);

  return { chapters };
}

// Hook for fetching verses
export function useBibleVerses(
  translationId: string,
  bookAbbrev: string,
  chapter: number
) {
  const [verses, setVerses] = useState<Awaited<ReturnType<typeof bibleCache.getChapterVerses>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadVerses() {
      if (!translationId || !bookAbbrev || !chapter) return;

      setLoading(true);
      setError(null);

      try {
        // First try to get from cache
        const cached = await bibleCache.getChapterVerses(translationId, bookAbbrev, chapter);

        if (cached.length > 0) {
          setVerses(cached);
          setLoading(false);
          return;
        }

        const seedVerses = getSeedChapterVerses(translationId, bookAbbrev, chapter);
        if (seedVerses.length > 0) {
          await bibleCache.saveVerses(seedVerses);
          setVerses(seedVerses);
          setLoading(false);
          return;
        }

        console.log('Verses not in cache or seed data');
        setVerses([]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load verses'));
      } finally {
        setLoading(false);
      }
    }

    loadVerses();
  }, [translationId, bookAbbrev, chapter]);

  return { verses, loading, error };
}

// Hook for searching verses
export function useBibleSearch(translationId: string, query: string) {
  const [results, setResults] = useState<Awaited<ReturnType<typeof bibleCache.searchVerses>>>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async () => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const searchResults = await bibleCache.searchVerses(translationId, query);
      if (searchResults.length > 0) {
        setResults(searchResults);
        return;
      }

      const seedResults = searchSeedVerses(translationId, query);
      if (seedResults.length > 0) {
        setResults(seedResults);
        return;
      }

      setResults([]);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [translationId, query]);

  useEffect(() => {
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return { results, searching };
}

// Hook for downloading a translation
export function useBibleDownload(translationId: string) {
  const [progress, setProgress] = useState<{
    status: 'idle' | 'downloading' | 'complete' | 'error';
    downloadedVerses: number;
    totalVerses: number;
    error?: string;
  }>({
    status: 'idle',
    downloadedVerses: 0,
    totalVerses: 0,
  });
  const cancelRef = useRef(false);

  useEffect(() => {
    async function loadProgress() {
      const [saved, cachedTranslation] = await Promise.all([
        bibleCache.getDownloadProgress(translationId),
        bibleCache.getTranslation(translationId),
      ]);

      const seedMeta = getSeedTranslationMeta(translationId);
      const totalVerses =
        cachedTranslation?.verseCount ||
        seedMeta?.verseCount ||
        saved?.totalVerses ||
        0;

      const status =
        cachedTranslation?.isDownloaded ? 'complete' : saved?.status || 'idle';
      const normalizedStatus = status === 'pending' ? 'idle' : status;

      setProgress({
        status: normalizedStatus === 'complete' ? 'complete' : normalizedStatus,
        downloadedVerses:
          saved?.downloadedVerses ||
          (cachedTranslation?.isDownloaded ? totalVerses : 0),
        totalVerses,
        error: saved?.error,
      });
    }
    loadProgress();
  }, [translationId]);

  const startDownload = useCallback(async () => {
    cancelRef.current = false;
    const seedMeta = getSeedTranslationMeta(translationId);

    if (seedMeta) {
      setProgress((p) => ({
        ...p,
        status: 'downloading',
        totalVerses: seedMeta.verseCount,
        downloadedVerses: 0,
        error: undefined,
      }));

      const result = await seedTranslationToCache(translationId, {
        onProgress: (downloadedVerses, totalVerses) => {
          setProgress((p) => ({
            ...p,
            status: 'downloading',
            downloadedVerses,
            totalVerses,
          }));
        },
        shouldCancel: () => cancelRef.current,
      });

      if (!result.ok) {
        setProgress((p) => ({
          ...p,
          status: result.cancelled ? 'idle' : 'error',
          error: result.error,
        }));
        return;
      }

      setProgress((p) => ({ ...p, status: 'complete' }));
      return;
    }

    // No seed data available for this translation
    setProgress((p) => ({
      ...p,
      status: 'error',
      error: 'Translation not available. Connect to server to download.',
    }));
  }, [translationId]);

  const cancelDownload = useCallback(() => {
    cancelRef.current = true;
    setProgress((p) => ({ ...p, status: 'idle' }));
  }, []);

  return { progress, startDownload, cancelDownload };
}
