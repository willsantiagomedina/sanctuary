import { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Plus,
  Star,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { 
  Button, 
  cn, 
  Input, 
  ScrollArea, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent, 
  Card,
  CardContent,
  Badge,
  Text,
} from '@sanctuary/ui';
import { formatReference } from '../data/bible';
import { useBibleBooks, useBibleChapters, useBibleSearch, useBibleTranslations, useBibleVerses } from '../hooks/useBible';
import { getSeedVerseNumbers, getSeedVerseText } from '../lib/bible-seed';
import { PageHeader } from '../components/layout/PageHeader';

const POPULAR_VERSES = [
  { book: 'John', chapter: 3, verse: 16, preview: 'For God so loved the world...' },
  { book: 'Psalm', chapter: 23, verse: 1, preview: 'The LORD is my shepherd...' },
  { book: 'Jeremiah', chapter: 29, verse: 11, preview: 'For I know the plans I have for you...' },
  { book: 'Philippians', chapter: 4, verse: 13, preview: 'I can do all things through Christ...' },
  { book: 'Romans', chapter: 8, verse: 28, preview: 'All things work together for good...' },
  { book: 'Proverbs', chapter: 3, verse: 5, preview: 'Trust in the LORD with all your heart...' },
  { book: 'Isaiah', chapter: 40, verse: 31, preview: 'They that wait upon the LORD...' },
  { book: 'Matthew', chapter: 28, verse: 19, preview: 'Go therefore and make disciples...' },
  { book: 'Romans', chapter: 12, verse: 2, preview: 'Be not conformed to this world...' },
  { book: 'Psalm', chapter: 91, verse: 1, preview: 'He that dwelleth in the secret place...' },
  { book: 'Ephesians', chapter: 2, verse: 8, preview: 'For by grace are ye saved...' },
  { book: 'John', chapter: 14, verse: 6, preview: 'I am the way, the truth, and the life...' },
];

export default function BibleExplorer() {
  const navigate = useNavigate();
  const { translations } = useBibleTranslations();
  const [selectedVersion, setSelectedVersion] = useState('kjv');
  const [selectedBook, setSelectedBook] = useState('John');
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(16);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);
  const { verses } = useBibleVerses(selectedVersion, selectedBook, selectedChapter);
  const { results: searchResults } = useBibleSearch(selectedVersion, searchQuery);
  const { books } = useBibleBooks(selectedVersion);

  const selectedTranslation = useMemo(() => {
    return translations.find((translation) => translation.id === selectedVersion);
  }, [translations, selectedVersion]);

  // Get available books for current version
  const availableBooks = useMemo(() => {
    return books.map((book) => book.name);
  }, [books]);

  const resolveBookName = useCallback(
    (book: string) => {
      if (availableBooks.includes(book)) return book;
      if (book === 'Psalm' && availableBooks.includes('Psalms')) return 'Psalms';
      if (book === 'Psalms' && availableBooks.includes('Psalm')) return 'Psalm';
      return book;
    },
    [availableBooks]
  );

  const selectedBookMeta = useMemo(() => {
    return books.find((book) => book.name === selectedBook) || null;
  }, [books, selectedBook]);

  // Get available chapters for selected book
  const { chapters: availableChapters } = useBibleChapters(
    selectedVersion,
    selectedBook,
    selectedBookMeta?.chapterCount
  );

  // Get available verses for selected chapter
  const availableVerses = useMemo(() => {
    const seedVerses = getSeedVerseNumbers(selectedVersion, selectedBook, selectedChapter);
    if (seedVerses.length > 0) return seedVerses;
    return verses.map((verse) => verse.verse).sort((a, b) => a - b);
  }, [selectedBook, selectedChapter, selectedVersion, verses]);

  // Get selected verse text
  const selectedVerseText = useMemo(() => {
    if (!selectedVerse) return null;
    return verses.find((verse) => verse.verse === selectedVerse)?.text || null;
  }, [selectedVerse, verses]);

  useEffect(() => {
    if (availableBooks.length === 0) return;
    if (!availableBooks.includes(selectedBook)) {
      const nextBook = availableBooks[0];
      setSelectedBook(nextBook);
      setSelectedChapter(1);
      setSelectedVerse(null);
    }
  }, [availableBooks, selectedBook, selectedVersion]);

  useEffect(() => {
    if (availableChapters.length === 0) return;
    if (!availableChapters.includes(selectedChapter)) {
      setSelectedChapter(availableChapters[0]);
      setSelectedVerse(null);
    }
  }, [availableChapters, selectedChapter]);

  useEffect(() => {
    if (availableVerses.length === 0) return;
    if (selectedVerse && !availableVerses.includes(selectedVerse)) {
      setSelectedVerse(null);
    }
  }, [availableVerses, selectedVerse]);

  const handleInsertVerse = (book: string, chapter: number, verse: number, text: string) => {
    // Create a new presentation with this verse
    const presId = `pres-${Date.now()}`;
    const reference = formatReference(
      book,
      chapter,
      verse,
      selectedTranslation?.abbreviation || selectedVersion.toUpperCase()
    );
    
    const presentation = {
      id: presId,
      name: reference,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      slides: [{
        id: `slide-${Date.now()}`,
        background: { type: 'gradient', value: 'linear-gradient(180deg, #1e3a8a 0%, #312e81 100%)' },
        elements: [{
          id: `el-${Date.now()}`,
          type: 'verse',
          x: 80,
          y: 120,
          width: 800,
          height: 300,
          content: `"${text}"\n\n— ${reference}`,
          style: {
            fontFamily: 'Newsreader',
            fontSize: 32,
            fontWeight: '400',
            color: '#ffffff',
            textAlign: 'center',
            verticalAlign: 'middle',
            padding: 32,
          },
        }],
      }],
    };

    localStorage.setItem(`presentation-${presId}`, JSON.stringify(presentation));
    navigate(`/presentations/${presId}`);
  };

  const handleCopyVerse = (text: string, reference: string) => {
    navigator.clipboard.writeText(`"${text}" — ${reference}`);
    setCopiedVerse(reference);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Bible Explorer"
        description="Find and add scripture to your presentations"
        icon={<BookOpen className="h-5 w-5" />}
      />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Version selector */}
        <div className="flex gap-2 flex-wrap mb-6">
          {translations.map((translation) => (
            <button
              key={translation.id}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors ring-1 ring-inset",
                selectedVersion === translation.id
                  ? "bg-primary/10 text-foreground ring-primary/20"
                  : "bg-card/70 text-muted-foreground ring-border/60 hover:bg-card"
              )}
              onClick={() => {
                setSelectedVersion(translation.id);
                setSelectedBook('John');
                setSelectedChapter(3);
                setSelectedVerse(16);
              }}
            >
              {translation.abbreviation}
            </button>
          ))}
        </div>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="browse" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="popular" className="gap-2">
              <Star className="h-4 w-4" />
              Popular
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Books */}
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b">
                    <Text variant="label">Book</Text>
                  </div>
                  <ScrollArea className="h-[50vh]">
                    <div className="p-2">
                      {availableBooks.map(book => (
                        <button
                          key={book}
                          className={cn(
                            "w-full px-3 py-2.5 text-left text-sm rounded-lg transition-all",
                            selectedBook === book
                              ? "bg-primary text-primary-foreground font-medium"
                              : "hover:bg-secondary"
                          )}
                          onClick={() => {
                            setSelectedBook(book);
                            setSelectedChapter(1);
                            setSelectedVerse(null);
                          }}
                        >
                          {book}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chapters */}
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b">
                    <Text variant="label">Chapter</Text>
                  </div>
                  <ScrollArea className="h-[50vh]">
                    <div className="p-3 grid grid-cols-5 gap-2">
                      {availableChapters.map(ch => (
                        <button
                          key={ch}
                          className={cn(
                            "p-2.5 text-center text-sm rounded-lg transition-all font-medium",
                            selectedChapter === ch
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary/50 hover:bg-secondary"
                          )}
                          onClick={() => {
                            setSelectedChapter(ch);
                            setSelectedVerse(null);
                          }}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Verses */}
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b">
                    <Text variant="label">Verse</Text>
                  </div>
                  <ScrollArea className="h-[50vh]">
                    <div className="p-3 grid grid-cols-5 gap-2">
                      {availableVerses.map(v => (
                        <button
                          key={v}
                          className={cn(
                            "p-2.5 text-center text-sm rounded-lg transition-all font-medium",
                            selectedVerse === v
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary/50 hover:bg-secondary"
                          )}
                          onClick={() => setSelectedVerse(v)}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Selected verse preview */}
            {selectedVerseText && selectedVerse && (
              <Card className="mt-6 border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Text variant="body" className="text-lg italic leading-relaxed">
                        "{selectedVerseText}"
                      </Text>
                      <Text variant="muted" weight="medium" className="mt-3">
                        — {formatReference(
                          selectedBook,
                          selectedChapter,
                          selectedVerse,
                          selectedTranslation?.abbreviation || selectedVersion.toUpperCase()
                        )}
                      </Text>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={() => handleInsertVerse(selectedBook, selectedChapter, selectedVerse, selectedVerseText)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Slide
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleCopyVerse(
                              selectedVerseText,
                              formatReference(
                                selectedBook,
                                selectedChapter,
                                selectedVerse,
                                selectedTranslation?.abbreviation || selectedVersion.toUpperCase()
                              )
                            )
                          }
                        >
                          {copiedVerse === formatReference(
                            selectedBook,
                            selectedChapter,
                            selectedVerse,
                            selectedTranslation?.abbreviation || selectedVersion.toUpperCase()
                          ) ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="mt-0">
            <Card>
              <CardContent className="p-6">
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search for words or phrases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base"
                  />
                </div>

                <ScrollArea className="h-[50vh]">
                  {searchQuery.length < 3 ? (
                    <div className="text-center py-16">
                      <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <Text variant="muted">
                        Enter at least 3 characters to search
                      </Text>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-16">
                      <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <Text variant="muted">
                        No results found for "{searchQuery}"
                      </Text>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {searchResults.map((result, idx) => (
                        <button
                          key={idx}
                          className="w-full p-4 text-left rounded-xl border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all group"
                          onClick={() =>
                            handleInsertVerse(result.bookAbbrev, result.chapter, result.verse, result.text)
                          }
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="font-semibold">
                              {result.bookAbbrev} {result.chapter}:{result.verse}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <Text
                            variant="small"
                            className="prose prose-sm max-w-none text-foreground/90 line-clamp-2 leading-relaxed"
                          >
                            {result.text}
                          </Text>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Popular Tab */}
          <TabsContent value="popular" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {POPULAR_VERSES.map((verse, idx) => {
                const resolvedBook = resolveBookName(verse.book);
                const text =
                  getSeedVerseText(selectedVersion, resolvedBook, verse.chapter, verse.verse) ||
                  getSeedVerseText(selectedVersion, verse.book, verse.chapter, verse.verse);
                const reference = `${resolvedBook} ${verse.chapter}:${verse.verse}`;
                return (
                  <Card 
                    key={idx}
                    className={cn(
                      "group cursor-pointer transition-all hover:shadow-md",
                      text ? "hover:border-primary/30" : "opacity-50"
                    )}
                    onClick={() => text && handleInsertVerse(resolvedBook, verse.chapter, verse.verse, text)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="font-semibold">
                          {reference}
                        </Badge>
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      </div>
                      <Text
                        variant="small"
                        className="prose prose-sm max-w-none text-muted-foreground line-clamp-3 leading-relaxed"
                      >
                        {text || verse.preview}
                      </Text>
                      {text && (
                        <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="secondary" className="h-8">
                            <Plus className="h-3 w-3 mr-1" />
                            Add to slide
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
