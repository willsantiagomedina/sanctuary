import { useState, useEffect, useCallback } from 'react';
import { bibleCache } from '../lib/bible-cache';
import type { SupportedLanguage } from '@sanctuary/shared';

// Hook for managing Bible translations
export function useBibleTranslations(language?: SupportedLanguage) {
  const [translations, setTranslations] = useState<Awaited<ReturnType<typeof bibleCache.listTranslations>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const cached = await bibleCache.listTranslations(language);
        setTranslations(cached);
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [language]);

  return { translations, loading };
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
        } else {
          // TODO: Fetch from Convex and cache
          console.log('Verses not in cache, would fetch from server');
          setVerses([]);
        }
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
      setResults(searchResults);
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

  useEffect(() => {
    async function loadProgress() {
      const saved = await bibleCache.getDownloadProgress(translationId);
      if (saved) {
        setProgress({
          status: saved.status === 'complete' ? 'complete' : 'idle',
          downloadedVerses: saved.downloadedVerses,
          totalVerses: saved.totalVerses,
        });
      }
    }
    loadProgress();
  }, [translationId]);

  const startDownload = useCallback(async () => {
    // TODO: Implement actual download from Convex
    setProgress((p) => ({ ...p, status: 'downloading' }));
    
    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200));
      setProgress((p) => ({
        ...p,
        downloadedVerses: Math.floor((i / 100) * p.totalVerses),
      }));
    }
    
    setProgress((p) => ({ ...p, status: 'complete' }));
  }, [translationId]);

  const cancelDownload = useCallback(() => {
    setProgress((p) => ({ ...p, status: 'idle' }));
  }, []);

  return { progress, startDownload, cancelDownload };
}
