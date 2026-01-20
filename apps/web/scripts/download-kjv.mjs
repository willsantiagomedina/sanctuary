#!/usr/bin/env node
/**
 * Downloads the complete KJV Bible from GitHub and converts it
 * to the format needed by the app's bible.ts seed data.
 */

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const KJV_URL = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/sources/en/KJV/KJV.json';

async function downloadKJV() {
  console.log('Downloading KJV Bible from GitHub...');
  const response = await fetch(KJV_URL);
  const data = await response.json();
  
  console.log(`Found ${data.books.length} books`);
  
  // Convert to our format: { book: { chapter: { verse: text } } }
  const kjvData = {};
  let totalVerses = 0;
  let totalChapters = 0;
  
  for (const book of data.books) {
    kjvData[book.name] = {};
    
    for (const chapter of book.chapters) {
      kjvData[book.name][chapter.chapter] = {};
      totalChapters++;
      
      for (const verse of chapter.verses) {
        kjvData[book.name][chapter.chapter][verse.verse] = verse.text;
        totalVerses++;
      }
    }
  }
  
  console.log(`Processed ${totalChapters} chapters, ${totalVerses} verses`);
  
  // Generate TypeScript file
  const output = `// Auto-generated KJV Bible data - DO NOT EDIT
// Generated: ${new Date().toISOString()}
// Source: ${KJV_URL}
// Total: ${totalVerses} verses across ${totalChapters} chapters

export const KJV_COMPLETE: Record<string, Record<number, Record<number, string>>> = ${JSON.stringify(kjvData, null, 2)};
`;

  const outputPath = join(__dirname, '../src/data/kjv-complete.ts');
  writeFileSync(outputPath, output, 'utf-8');
  console.log(`Written to ${outputPath}`);
  
  // Also output stats
  console.log('\nBook stats:');
  for (const book of data.books) {
    const chapterCount = book.chapters.length;
    const verseCount = book.chapters.reduce((sum, ch) => sum + ch.verses.length, 0);
    console.log(`  ${book.name}: ${chapterCount} chapters, ${verseCount} verses`);
  }
}

downloadKJV().catch(console.error);
