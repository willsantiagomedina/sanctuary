import { useState } from 'react';
import { Search, Book, Download, Check, Loader2 } from 'lucide-react';
import { Button, Input, ScrollArea, Separator, cn } from '@sanctuary/ui';
import { AVAILABLE_TRANSLATIONS, BIBLE_BOOKS, LANGUAGES } from '@sanctuary/shared/constants';
import type { SupportedLanguage } from '@sanctuary/shared';

export function BibleExplorer() {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [selectedTranslation, setSelectedTranslation] = useState('niv');
  const [selectedBook, setSelectedBook] = useState('John');
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');

  const translations = AVAILABLE_TRANSLATIONS.filter((t) => t.language === selectedLanguage);
  const books = BIBLE_BOOKS[selectedLanguage] || BIBLE_BOOKS.en;

  return (
    <div className="h-screen flex">
      {/* Left panel - Navigation */}
      <aside className="w-72 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg mb-4">Bible Explorer</h2>
          
          {/* Language selector */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Language</label>
            <div className="flex gap-1">
              {(Object.keys(LANGUAGES) as SupportedLanguage[]).map((lang) => (
                <Button
                  key={lang}
                  variant={selectedLanguage === lang ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLanguage(lang)}
                >
                  {LANGUAGES[lang].nativeName}
                </Button>
              ))}
            </div>
          </div>

          {/* Translation selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Translation</label>
            <select
              value={selectedTranslation}
              onChange={(e) => setSelectedTranslation(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {translations.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.abbreviation} - {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Book list */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {books.map((book, index) => (
              <button
                key={book.abbrev}
                onClick={() => {
                  setSelectedBook(book.name);
                  setSelectedChapter(1);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  selectedBook === book.name
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                {book.name}
                <span className="text-xs opacity-60 ml-2">({book.chapters})</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Search bar */}
        <div className="p-4 border-b bg-card">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search verses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chapter navigation */}
        <div className="p-4 border-b bg-card flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{selectedBook}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: books.find((b) => b.name === selectedBook)?.chapters || 1 }, (_, i) => (
              <Button
                key={i + 1}
                variant={selectedChapter === i + 1 ? 'default' : 'ghost'}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setSelectedChapter(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>

        {/* Verses */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">
              {selectedBook} {selectedChapter}
            </h1>
            <div className="space-y-4">
              {/* Mock verses */}
              {Array.from({ length: 20 }, (_, i) => (
                <p key={i} className="leading-relaxed group">
                  <sup className="text-primary font-medium mr-2">{i + 1}</sup>
                  <span className="group-hover:bg-primary/10 rounded px-1 -mx-1 cursor-pointer">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Add to slide
                  </Button>
                </p>
              ))}
            </div>
          </div>
        </ScrollArea>
      </main>

      {/* Right panel - Version management */}
      <aside className="w-72 border-l bg-card p-4">
        <h3 className="font-semibold mb-4">Bible Versions</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Download Bible versions for offline use
        </p>
        <div className="space-y-2">
          {AVAILABLE_TRANSLATIONS.slice(0, 6).map((translation) => (
            <div
              key={translation.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium text-sm">{translation.abbreviation}</p>
                <p className="text-xs text-muted-foreground">{translation.name}</p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
