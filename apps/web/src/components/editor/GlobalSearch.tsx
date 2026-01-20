import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  FileText,
  BookOpen,
  Music,
  StickyNote,
  Clock,
  X,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, Input, ScrollArea, cn } from '@sanctuary/ui';
import { useEditorStore, SearchResult } from '../../stores/editor';

// Search across different content types
function searchContent(query: string): SearchResult[] {
  if (!query.trim()) return [];
  
  const results: SearchResult[] = [];
  const normalizedQuery = query.toLowerCase();
  
  // Search presentations from localStorage
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('presentation-'));
    for (const key of keys) {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      if (data.name?.toLowerCase().includes(normalizedQuery)) {
        results.push({
          id: `pres-${data.id}`,
          type: 'slide',
          title: data.name,
          content: `${data.slides?.length || 0} slides`,
          presentationId: data.id,
          relevance: data.name.toLowerCase().startsWith(normalizedQuery) ? 100 : 50,
        });
      }
      
      // Search slide content
      data.slides?.forEach((slide: any, index: number) => {
        const elements = slide.elements || [];
        for (const el of elements) {
          if (el.content?.toLowerCase().includes(normalizedQuery)) {
            results.push({
              id: `slide-${data.id}-${index}`,
              type: 'slide',
              title: `${data.name} - Slide ${index + 1}`,
              content: el.content.substring(0, 100) + (el.content.length > 100 ? '...' : ''),
              slideIndex: index,
              presentationId: data.id,
              relevance: el.content.toLowerCase().startsWith(normalizedQuery) ? 80 : 40,
            });
            break; // Only one result per slide
          }
        }
        
        // Search notes
        if (slide.notes?.toLowerCase().includes(normalizedQuery)) {
          results.push({
            id: `note-${data.id}-${index}`,
            type: 'note',
            title: `Notes: ${data.name} - Slide ${index + 1}`,
            content: slide.notes.substring(0, 100) + (slide.notes.length > 100 ? '...' : ''),
            slideIndex: index,
            presentationId: data.id,
            relevance: 30,
          });
        }
      });
    }
  } catch (e) {
    console.error('Search error:', e);
  }
  
  // Search Bible verses (sample - would connect to real Bible data)
  const bibleBooks = ['Genesis', 'Exodus', 'Psalms', 'Proverbs', 'Isaiah', 'Matthew', 'John', 'Romans', 'Revelation'];
  for (const book of bibleBooks) {
    if (book.toLowerCase().includes(normalizedQuery)) {
      results.push({
        id: `bible-${book}`,
        type: 'verse',
        title: book,
        content: 'Bible Book',
        relevance: 60,
      });
    }
  }
  
  // Popular search patterns
  const versePatterns = [
    { ref: 'John 3:16', text: 'For God so loved the world...' },
    { ref: 'Psalm 23:1', text: 'The Lord is my shepherd...' },
    { ref: 'Romans 8:28', text: 'And we know that in all things God works...' },
    { ref: 'Philippians 4:13', text: 'I can do all things through Christ...' },
    { ref: 'Jeremiah 29:11', text: 'For I know the plans I have for you...' },
  ];
  
  for (const verse of versePatterns) {
    if (verse.ref.toLowerCase().includes(normalizedQuery) || 
        verse.text.toLowerCase().includes(normalizedQuery)) {
      results.push({
        id: `verse-${verse.ref}`,
        type: 'verse',
        title: verse.ref,
        content: verse.text,
        relevance: 70,
      });
    }
  }
  
  // Sort by relevance
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 20);
}

// Result type icons
const ResultIcon = ({ type }: { type: SearchResult['type'] }) => {
  switch (type) {
    case 'slide': return <FileText className="h-4 w-4" />;
    case 'verse': return <BookOpen className="h-4 w-4" />;
    case 'song': return <Music className="h-4 w-4" />;
    case 'note': return <StickyNote className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

// Result type colors
const getTypeColor = (type: SearchResult['type']) => {
  switch (type) {
    case 'slide': return 'text-blue-500';
    case 'verse': return 'text-amber-500';
    case 'song': return 'text-purple-500';
    case 'note': return 'text-green-500';
    default: return 'text-muted-foreground';
  }
};

export function GlobalSearchDialog() {
  const navigate = useNavigate();
  const {
    showSearchDialog,
    setShowSearchDialog,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    recentSearches,
    addRecentSearch,
  } = useEditorStore();
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const timer = setTimeout(() => {
      const results = searchContent(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
      setSelectedIndex(0);
    }, 150);
    
    return () => clearTimeout(timer);
  }, [searchQuery, setSearchResults]);
  
  // Reset state when dialog opens
  useEffect(() => {
    if (showSearchDialog) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedIndex(0);
    }
  }, [showSearchDialog, setSearchQuery, setSearchResults]);
  
  // Handle result selection
  const handleSelect = useCallback((result: SearchResult) => {
    addRecentSearch(searchQuery);
    setShowSearchDialog(false);
    
    if (result.presentationId) {
      navigate(`/editor/${result.presentationId}`);
      // If specific slide, could dispatch action to go to that slide
    } else if (result.type === 'verse') {
      navigate('/bible');
    } else if (result.type === 'song') {
      navigate('/songs');
    }
  }, [navigate, addRecentSearch, searchQuery, setShowSearchDialog]);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = searchQuery ? searchResults : recentSearches.map((s, i) => ({ id: `recent-${i}`, title: s }));
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (searchQuery && searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex]);
        } else if (!searchQuery && recentSearches[selectedIndex]) {
          setSearchQuery(recentSearches[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSearchDialog(false);
        break;
    }
  }, [searchQuery, searchResults, recentSearches, selectedIndex, handleSelect, setSearchQuery, setShowSearchDialog]);
  
  return (
    <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search slides, verses, songs, notes..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        
        {/* Results */}
        <ScrollArea className="max-h-[400px]">
          {/* Recent searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => setSearchQuery(search)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    selectedIndex === index ? 'bg-accent' : 'hover:bg-muted'
                  )}
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{search}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
          )}
          
          {/* Search results */}
          {searchQuery && (
            <div className="p-2">
              {isSearching ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  {searchResults.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={cn(
                        'w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left',
                        selectedIndex === index ? 'bg-accent' : 'hover:bg-muted'
                      )}
                    >
                      <div className={cn('mt-0.5', getTypeColor(result.type))}>
                        <ResultIcon type={result.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {result.content}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {result.type}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
          
          {/* Empty state */}
          {!searchQuery && recentSearches.length === 0 && (
            <div className="px-3 py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Search for slides, Bible verses, songs, or notes
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘P</kbd> anytime to open search
              </p>
            </div>
          )}
        </ScrollArea>
        
        {/* Footer hints */}
        <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded">↵</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> Close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
