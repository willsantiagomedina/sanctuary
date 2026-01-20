import { useState, useEffect, useCallback, useRef } from 'react';
import { useConvex } from 'convex/react';
import { bibleCache } from '../lib/bible-cache';
import { AVAILABLE_TRANSLATIONS, type BibleTranslation, type SupportedLanguage } from '@sanctuary/shared';
import { api } from '../../convex/_generated/api.js';
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
  const [serverAvailableIds, setServerAvailableIds] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const convex = useConvex();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const cached = await bibleCache.listTranslations(language);
        const serverVersions = await convex.query(api.bible.getVersions, {});
        setServerAvailableIds(serverVersions.map((version: { code: string }) => version.code));
        setServerError(null);
        const availableMap = new Map(AVAILABLE_TRANSLATIONS.map((t) => [t.id, t]));

        const serverTranslations: BibleTranslation[] = serverVersions
          .filter((version: { language: string }) => (language ? version.language === language : true))
          .map((version: { code: string; name: string; language: string; copyright?: string; bookCount: number; verseCount: number }) => ({
            id: version.code,
            name: version.name,
            abbreviation: availableMap.get(version.code)?.abbreviation || version.code.toUpperCase(),
            language: version.language as SupportedLanguage,
            copyright: version.copyright || '',
            bookCount: version.bookCount,
            verseCount: version.verseCount,
            isDownloaded: false,
            lastSynced: undefined,
          }));

        const available = AVAILABLE_TRANSLATIONS.filter((translation) =>
          language ? translation.language === language : true
        )
          .map((translation) => ({
            ...translation,
            isDownloaded: false,
            lastSynced: undefined,
          }))
          .filter(
            (translation) =>
              serverTranslations.length === 0 ||
              serverTranslations.some((server) => server.id === translation.id)
          );

        const merged = [...serverTranslations, ...available].map((translation) => {
          const cachedTranslation = cached.find((item) => item.id === translation.id);
          return cachedTranslation ? { ...translation, ...cachedTranslation } : translation;
        });

        const extraCached = cached.filter(
          (translation) => !merged.some((item) => item.id === translation.id)
        );

        setTranslations([...merged, ...extraCached]);
      } catch (error) {
        console.error('Failed to load translations:', error);
        setServerAvailableIds([]);
        setServerError('Server unavailable');
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
  }, [convex, language]);

  return { translations, loading, serverAvailableIds, serverError };
}

export function useBibleBooks(translationId: string) {
  const [books, setBooks] = useState<Array<{ name: string; chapterCount: number }>>([]);
  const [loading, setLoading] = useState(false);
  const convex = useConvex();

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

        const serverBooks = await convex.query(api.bible.getBooksByVersionCode, {
          versionCode: translationId,
        });

        setBooks(
          serverBooks.map((book: { name: string; chapters: number }) => ({
            name: book.name,
            chapterCount: book.chapters,
          }))
        );
      } catch (error) {
        console.error('Failed to load books:', error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [convex, translationId]);

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
  const convex = useConvex();

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

        const serverChapter = await convex.query(api.bible.getChapterByReference, {
          versionCode: translationId,
          book: bookAbbrev,
          chapter,
        });

        if (serverChapter?.verses?.length) {
          const normalized = serverChapter.verses.map((verse: { verse: number; text: string }) => ({
            id: '',
            translationId,
            bookAbbrev,
            chapter,
            verse: verse.verse,
            text: verse.text,
          }));

          await bibleCache.saveVerses(normalized);
          setVerses(normalized);
          setLoading(false);
          return;
        }

        setVerses([]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load verses'));
      } finally {
        setLoading(false);
      }
    }

    loadVerses();
  }, [convex, translationId, bookAbbrev, chapter]);

  return { verses, loading, error };
}

// Hook for searching verses
export function useBibleSearch(translationId: string, query: string) {
  const [results, setResults] = useState<Awaited<ReturnType<typeof bibleCache.searchVerses>>>([]);
  const [searching, setSearching] = useState(false);
  const convex = useConvex();

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
        await bibleCache.saveVerses(seedResults);
        setResults(seedResults);
        return;
      }

      const serverResults = await convex.query(api.bible.searchVerses, {
        versionCode: translationId,
        query,
      });

      if (serverResults.length > 0) {
        const normalized = serverResults.map((verse: { book: string; chapter: number; verse: number; text: string }) => ({
          id: '',
          translationId,
          bookAbbrev: verse.book,
          chapter: verse.chapter,
          verse: verse.verse,
          text: verse.text,
        }));

        await bibleCache.saveVerses(normalized);
        setResults(normalized);
        return;
      }

      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [convex, translationId, query]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      search();
    }, 300);

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
  const convex = useConvex();

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

    const serverVersions = await convex.query(api.bible.getVersions, {});
    const version = serverVersions.find((item: { code: string }) => item.code === translationId);
    if (!version) {
      setProgress((p) => ({
        ...p,
        status: 'error',
        error: 'Translation not available on server.',
      }));
      return;
    }

    setProgress((p) => ({
      ...p,
      status: 'downloading',
      totalVerses: version.verseCount,
      downloadedVerses: 0,
      error: undefined,
    }));

    await bibleCache.saveTranslation({
      id: version.code,
      name: version.name,
      abbreviation: version.code.toUpperCase(),
      language: version.language as SupportedLanguage,
      copyright: version.copyright || '',
      bookCount: version.bookCount,
      verseCount: version.verseCount,
      isDownloaded: false,
      lastSynced: Date.now(),
    });

    await bibleCache.updateDownloadProgress({
      translationId,
      totalVerses: version.verseCount,
      downloadedVerses: 0,
      status: 'downloading',
    });

    const books = await convex.query(api.bible.getBooksByVersionCode, {
      versionCode: translationId,
    });

    let downloadedVerses = 0;
    for (const book of books) {
      for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
        if (cancelRef.current) {
          await bibleCache.updateDownloadProgress({
            translationId,
            totalVerses: version.verseCount,
            downloadedVerses,
            status: 'pending',
          });
          setProgress((p) => ({ ...p, status: 'idle' }));
          return;
        }

        const chapterData = await convex.query(api.bible.getChapterByReference, {
          versionCode: translationId,
          book: book.name,
          chapter,
        });

        if (!chapterData?.verses?.length) continue;

        const normalized = chapterData.verses.map((verse: { verse: number; text: string }) => ({
          id: '',
          translationId,
          bookAbbrev: book.name,
          chapter,
          verse: verse.verse,
          text: verse.text,
        }));

        await bibleCache.saveVerses(normalized);
        downloadedVerses += normalized.length;

        await bibleCache.updateDownloadProgress({
          translationId,
          totalVerses: version.verseCount,
          downloadedVerses,
          status: 'downloading',
        });

        setProgress((p) => ({
          ...p,
          status: 'downloading',
          downloadedVerses,
          totalVerses: version.verseCount,
        }));
      }
    }

    await bibleCache.saveTranslation({
      id: version.code,
      name: version.name,
      abbreviation: version.code.toUpperCase(),
      language: version.language as SupportedLanguage,
      copyright: version.copyright || '',
      bookCount: version.bookCount,
      verseCount: version.verseCount,
      isDownloaded: true,
      lastSynced: Date.now(),
      downloadedAt: Date.now(),
    });

    await bibleCache.updateDownloadProgress({
      translationId,
      totalVerses: version.verseCount,
      downloadedVerses: version.verseCount,
      status: 'complete',
    });

    setProgress((p) => ({ ...p, status: 'complete' }));
  }, [convex, translationId]);

  const cancelDownload = useCallback(() => {
    cancelRef.current = true;
    setProgress((p) => ({ ...p, status: 'idle' }));
  }, []);

  return { progress, startDownload, cancelDownload };
}
