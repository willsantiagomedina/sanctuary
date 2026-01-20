import { mkdir, readFile, writeFile } from 'node:fs/promises';

const books = [
  { num: 1, name: 'Genesis', short: 'Gen', testament: 'old' },
  { num: 2, name: 'Exodus', short: 'Exod', testament: 'old' },
  { num: 3, name: 'Leviticus', short: 'Lev', testament: 'old' },
  { num: 4, name: 'Numbers', short: 'Num', testament: 'old' },
  { num: 5, name: 'Deuteronomy', short: 'Deut', testament: 'old' },
  { num: 6, name: 'Joshua', short: 'Josh', testament: 'old' },
  { num: 7, name: 'Judges', short: 'Judg', testament: 'old' },
  { num: 8, name: 'Ruth', short: 'Ruth', testament: 'old' },
  { num: 9, name: '1 Samuel', short: '1Sam', testament: 'old' },
  { num: 10, name: '2 Samuel', short: '2Sam', testament: 'old' },
  { num: 11, name: '1 Kings', short: '1Kgs', testament: 'old' },
  { num: 12, name: '2 Kings', short: '2Kgs', testament: 'old' },
  { num: 13, name: '1 Chronicles', short: '1Chr', testament: 'old' },
  { num: 14, name: '2 Chronicles', short: '2Chr', testament: 'old' },
  { num: 15, name: 'Ezra', short: 'Ezra', testament: 'old' },
  { num: 16, name: 'Nehemiah', short: 'Neh', testament: 'old' },
  { num: 17, name: 'Esther', short: 'Esth', testament: 'old' },
  { num: 18, name: 'Job', short: 'Job', testament: 'old' },
  { num: 19, name: 'Psalms', short: 'Ps', testament: 'old' },
  { num: 20, name: 'Proverbs', short: 'Prov', testament: 'old' },
  { num: 21, name: 'Ecclesiastes', short: 'Eccl', testament: 'old' },
  { num: 22, name: 'Song of Solomon', short: 'Song', testament: 'old' },
  { num: 23, name: 'Isaiah', short: 'Isa', testament: 'old' },
  { num: 24, name: 'Jeremiah', short: 'Jer', testament: 'old' },
  { num: 25, name: 'Lamentations', short: 'Lam', testament: 'old' },
  { num: 26, name: 'Ezekiel', short: 'Ezek', testament: 'old' },
  { num: 27, name: 'Daniel', short: 'Dan', testament: 'old' },
  { num: 28, name: 'Hosea', short: 'Hos', testament: 'old' },
  { num: 29, name: 'Joel', short: 'Joel', testament: 'old' },
  { num: 30, name: 'Amos', short: 'Amos', testament: 'old' },
  { num: 31, name: 'Obadiah', short: 'Obad', testament: 'old' },
  { num: 32, name: 'Jonah', short: 'Jonah', testament: 'old' },
  { num: 33, name: 'Micah', short: 'Mic', testament: 'old' },
  { num: 34, name: 'Nahum', short: 'Nah', testament: 'old' },
  { num: 35, name: 'Habakkuk', short: 'Hab', testament: 'old' },
  { num: 36, name: 'Zephaniah', short: 'Zeph', testament: 'old' },
  { num: 37, name: 'Haggai', short: 'Hag', testament: 'old' },
  { num: 38, name: 'Zechariah', short: 'Zech', testament: 'old' },
  { num: 39, name: 'Malachi', short: 'Mal', testament: 'old' },
  { num: 40, name: 'Matthew', short: 'Matt', testament: 'new' },
  { num: 41, name: 'Mark', short: 'Mark', testament: 'new' },
  { num: 42, name: 'Luke', short: 'Luke', testament: 'new' },
  { num: 43, name: 'John', short: 'John', testament: 'new' },
  { num: 44, name: 'Acts', short: 'Acts', testament: 'new' },
  { num: 45, name: 'Romans', short: 'Rom', testament: 'new' },
  { num: 46, name: '1 Corinthians', short: '1Cor', testament: 'new' },
  { num: 47, name: '2 Corinthians', short: '2Cor', testament: 'new' },
  { num: 48, name: 'Galatians', short: 'Gal', testament: 'new' },
  { num: 49, name: 'Ephesians', short: 'Eph', testament: 'new' },
  { num: 50, name: 'Philippians', short: 'Phil', testament: 'new' },
  { num: 51, name: 'Colossians', short: 'Col', testament: 'new' },
  { num: 52, name: '1 Thessalonians', short: '1Thess', testament: 'new' },
  { num: 53, name: '2 Thessalonians', short: '2Thess', testament: 'new' },
  { num: 54, name: '1 Timothy', short: '1Tim', testament: 'new' },
  { num: 55, name: '2 Timothy', short: '2Tim', testament: 'new' },
  { num: 56, name: 'Titus', short: 'Titus', testament: 'new' },
  { num: 57, name: 'Philemon', short: 'Phlm', testament: 'new' },
  { num: 58, name: 'Hebrews', short: 'Heb', testament: 'new' },
  { num: 59, name: 'James', short: 'Jas', testament: 'new' },
  { num: 60, name: '1 Peter', short: '1Pet', testament: 'new' },
  { num: 61, name: '2 Peter', short: '2Pet', testament: 'new' },
  { num: 62, name: '1 John', short: '1John', testament: 'new' },
  { num: 63, name: '2 John', short: '2John', testament: 'new' },
  { num: 64, name: '3 John', short: '3John', testament: 'new' },
  { num: 65, name: 'Jude', short: 'Jude', testament: 'new' },
  { num: 66, name: 'Revelation', short: 'Rev', testament: 'new' },
];

const bookIndex = new Map(books.map((book) => [book.name, book]));
const bookAliases = new Map([
  ['Psalm', 'Psalms'],
  ['Canticles', 'Song of Solomon'],
  ['Song of Songs', 'Song of Solomon'],
  ['Revelation of John', 'Revelation'],
]);

const normalizeBookName = (name) => {
  const alias = bookAliases.get(name);
  if (alias) return alias;

  const romanMatch = name.match(/^(I|II|III)\s+(.*)$/);
  if (romanMatch) {
    const roman = romanMatch[1];
    const rest = romanMatch[2];
    const numeric = roman === 'I' ? '1' : roman === 'II' ? '2' : '3';
    return `${numeric} ${rest}`;
  }

  return name;
};

const loadDatasets = async () => {
  const file = await readFile(new URL('./bible-datasets.json', import.meta.url), 'utf8');
  return JSON.parse(file);
};

const convertTranslation = (meta, raw) => {
  let verseCount = 0;

  const convertedBooks = raw.books.map((book) => {
    const normalizedName = normalizeBookName(book.name);
    const bookMeta = bookIndex.get(normalizedName);
    if (!bookMeta) {
      throw new Error(`Missing book metadata for ${book.name}`);
    }

    const chapters = book.chapters.map((chapter) => {
      verseCount += chapter.verses.length;
      return {
        chapter: chapter.chapter,
        verses: chapter.verses.map((verse) => ({
          verse: verse.verse,
          text: verse.text,
        })),
      };
    });

    return {
      bookNumber: bookMeta.num,
      name: bookMeta.name,
      shortName: bookMeta.short,
      testament: bookMeta.testament,
      chapters,
    };
  });

  convertedBooks.sort((a, b) => a.bookNumber - b.bookNumber);

  if (convertedBooks.length !== 66) {
    throw new Error(`Expected 66 books, found ${convertedBooks.length} for ${meta.code}`);
  }

  return {
    version: {
      code: meta.code,
      name: meta.name,
      language: meta.language,
      copyright: meta.copyright,
      bookCount: convertedBooks.length,
      verseCount,
    },
    books: convertedBooks,
  };
};

const run = async () => {
  const datasets = await loadDatasets();
  const rawDir = new URL('../data/bibles/raw/', import.meta.url);
  const outputDir = new URL('../data/bibles/converted/', import.meta.url);
  await mkdir(outputDir, { recursive: true });

  for (const dataset of datasets) {
    const rawFile = await readFile(new URL(`${dataset.code}.json`, rawDir), 'utf8');
    const rawData = JSON.parse(rawFile);
    const converted = convertTranslation(dataset, rawData);
    const target = new URL(`${dataset.code}.json`, outputDir);
    await writeFile(target, JSON.stringify(converted));
    console.log(`Converted ${dataset.code} -> ${target.pathname}`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
