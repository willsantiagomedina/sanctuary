import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { BibleTranslation, BibleVerse, SupportedLanguage } from '@sanctuary/shared';

// ============================================================================
// IndexedDB Schema for Bible Caching
// ============================================================================

interface BibleDB extends DBSchema {
  translations: {
    key: string;
    value: {
      id: string;
      name: string;
      abbreviation: string;
      language: SupportedLanguage;
      copyright: string;
      bookCount: number;
      verseCount: number;
      isDownloaded: boolean;
      lastSynced: number;
      downloadedAt?: number;
    };
    indexes: { 'by-language': SupportedLanguage };
  };
  verses: {
    key: string; // Composite: translationId:book:chapter:verse
    value: {
      id: string;
      translationId: string;
      bookAbbrev: string;
      chapter: number;
      verse: number;
      text: string;
    };
    indexes: {
      'by-translation': string;
      'by-chapter': [string, string, number]; // [translationId, bookAbbrev, chapter]
    };
  };
  downloadProgress: {
    key: string; // translationId
    value: {
      translationId: string;
      totalVerses: number;
      downloadedVerses: number;
      status: 'pending' | 'downloading' | 'complete' | 'error';
      error?: string;
    };
  };
}

// ============================================================================
// Bible Cache Service
// ============================================================================

class BibleCacheService {
  private db: IDBPDatabase<BibleDB> | null = null;
  private dbName = 'sanctuary-bible-cache';
  private version = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<BibleDB>(this.dbName, this.version, {
      upgrade(db) {
        // Translations store
        const translationsStore = db.createObjectStore('translations', { keyPath: 'id' });
        translationsStore.createIndex('by-language', 'language');

        // Verses store
        const versesStore = db.createObjectStore('verses', { keyPath: 'id' });
        versesStore.createIndex('by-translation', 'translationId');
        versesStore.createIndex('by-chapter', ['translationId', 'bookAbbrev', 'chapter']);

        // Download progress store
        db.createObjectStore('downloadProgress', { keyPath: 'translationId' });
      },
    });
  }

  private async ensureDb(): Promise<IDBPDatabase<BibleDB>> {
    if (!this.db) await this.init();
    return this.db!;
  }

  // -------------------------------------------------------------------------
  // Translation Management
  // -------------------------------------------------------------------------

  async getTranslation(translationId: string): Promise<BibleDB['translations']['value'] | undefined> {
    const db = await this.ensureDb();
    return db.get('translations', translationId);
  }

  async listTranslations(language?: SupportedLanguage): Promise<BibleDB['translations']['value'][]> {
    const db = await this.ensureDb();
    if (language) {
      return db.getAllFromIndex('translations', 'by-language', language);
    }
    return db.getAll('translations');
  }

  async saveTranslation(translation: BibleDB['translations']['value']): Promise<void> {
    const db = await this.ensureDb();
    await db.put('translations', translation);
  }

  async deleteTranslation(translationId: string): Promise<void> {
    const db = await this.ensureDb();
    
    // Delete all verses for this translation
    const tx = db.transaction(['translations', 'verses', 'downloadProgress'], 'readwrite');
    
    // Delete translation
    await tx.objectStore('translations').delete(translationId);
    
    // Delete all verses
    const versesStore = tx.objectStore('verses');
    const verseIndex = versesStore.index('by-translation');
    let cursor = await verseIndex.openCursor(translationId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    
    // Delete progress
    await tx.objectStore('downloadProgress').delete(translationId);
    
    await tx.done;
  }

  // -------------------------------------------------------------------------
  // Verse Management
  // -------------------------------------------------------------------------

  async getVerse(
    translationId: string,
    bookAbbrev: string,
    chapter: number,
    verse: number
  ): Promise<BibleDB['verses']['value'] | undefined> {
    const db = await this.ensureDb();
    const id = `${translationId}:${bookAbbrev}:${chapter}:${verse}`;
    return db.get('verses', id);
  }

  async getChapterVerses(
    translationId: string,
    bookAbbrev: string,
    chapter: number
  ): Promise<BibleDB['verses']['value'][]> {
    const db = await this.ensureDb();
    return db.getAllFromIndex('verses', 'by-chapter', [translationId, bookAbbrev, chapter]);
  }

  async getVerseRange(
    translationId: string,
    bookAbbrev: string,
    chapter: number,
    verseStart: number,
    verseEnd: number
  ): Promise<BibleDB['verses']['value'][]> {
    const allVerses = await this.getChapterVerses(translationId, bookAbbrev, chapter);
    return allVerses.filter((v) => v.verse >= verseStart && v.verse <= verseEnd);
  }

  async saveVerses(verses: BibleDB['verses']['value'][]): Promise<void> {
    const db = await this.ensureDb();
    const tx = db.transaction('verses', 'readwrite');
    
    for (const verse of verses) {
      verse.id = `${verse.translationId}:${verse.bookAbbrev}:${verse.chapter}:${verse.verse}`;
      await tx.store.put(verse);
    }
    
    await tx.done;
  }

  // -------------------------------------------------------------------------
  // Download Progress
  // -------------------------------------------------------------------------

  async getDownloadProgress(translationId: string): Promise<BibleDB['downloadProgress']['value'] | undefined> {
    const db = await this.ensureDb();
    return db.get('downloadProgress', translationId);
  }

  async updateDownloadProgress(progress: BibleDB['downloadProgress']['value']): Promise<void> {
    const db = await this.ensureDb();
    await db.put('downloadProgress', progress);
  }

  // -------------------------------------------------------------------------
  // Search (basic text search in cached verses)
  // -------------------------------------------------------------------------

  async searchVerses(
    translationId: string,
    query: string,
    limit = 50
  ): Promise<BibleDB['verses']['value'][]> {
    const db = await this.ensureDb();
    const allVerses = await db.getAllFromIndex('verses', 'by-translation', translationId);
    
    const queryLower = query.toLowerCase();
    const results: BibleDB['verses']['value'][] = [];
    
    for (const verse of allVerses) {
      if (verse.text.toLowerCase().includes(queryLower)) {
        results.push(verse);
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }

  // -------------------------------------------------------------------------
  // Storage Info
  // -------------------------------------------------------------------------

  async getStorageUsage(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
      };
    }
    return { used: 0, available: 0 };
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDb();
    const tx = db.transaction(['translations', 'verses', 'downloadProgress'], 'readwrite');
    await tx.objectStore('translations').clear();
    await tx.objectStore('verses').clear();
    await tx.objectStore('downloadProgress').clear();
    await tx.done;
  }
}

// Singleton instance
export const bibleCache = new BibleCacheService();
