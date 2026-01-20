import { useState } from 'react';
import { Plus, Search, Music, Edit, Trash2, Copy } from 'lucide-react';
import { Button, Input, ScrollArea, Separator, cn } from '@sanctuary/ui';

// Mock data
const mockSongs = [
  {
    id: '1',
    title: 'Amazing Grace',
    author: 'John Newton',
    language: 'en',
    verses: [
      { id: '1', label: 'Verse 1', text: "Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now I'm found\nWas blind, but now I see" },
      { id: '2', label: 'Verse 2', text: "'Twas grace that taught my heart to fear\nAnd grace my fears relieved\nHow precious did that grace appear\nThe hour I first believed" },
      { id: '3', label: 'Chorus', text: "My chains are gone, I've been set free\nMy God, my Savior has ransomed me\nAnd like a flood His mercy reigns\nUnending love, amazing grace" },
    ],
  },
  {
    id: '2',
    title: '主の祈り',
    author: 'Traditional',
    language: 'ja',
    verses: [
      { id: '1', label: '1番', text: "天にまします われらの父よ\n願わくは 御名をあがめさせたまえ" },
    ],
  },
  {
    id: '3',
    title: 'How Great Is Our God',
    author: 'Chris Tomlin',
    language: 'en',
    verses: [
      { id: '1', label: 'Verse 1', text: "The splendor of the King\nClothed in majesty\nLet all the earth rejoice\nAll the earth rejoice" },
    ],
  },
];

export function SongLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(mockSongs[0]);
  const [filterLanguage, setFilterLanguage] = useState<string>('all');

  const filteredSongs = mockSongs.filter((song) => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = filterLanguage === 'all' || song.language === filterLanguage;
    return matchesSearch && matchesLanguage;
  });

  return (
    <div className="h-screen flex">
      {/* Song list */}
      <aside className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Song Library</h2>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Song
            </Button>
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-1">
            {['all', 'en', 'ja', 'es'].map((lang) => (
              <Button
                key={lang}
                variant={filterLanguage === lang ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLanguage(lang)}
              >
                {lang === 'all' ? 'All' : lang.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredSongs.map((song) => (
              <button
                key={song.id}
                onClick={() => setSelectedSong(song)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors',
                  selectedSong?.id === song.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <div className="flex items-start gap-3">
                  <Music className="h-5 w-5 mt-0.5 opacity-60" />
                  <div>
                    <p className="font-medium">{song.title}</p>
                    {song.author && (
                      <p className="text-sm opacity-70">{song.author}</p>
                    )}
                    <p className="text-xs opacity-50 mt-1">
                      {song.verses.length} verses • {song.language.toUpperCase()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Song editor */}
      <main className="flex-1 flex flex-col">
        {selectedSong ? (
          <>
            {/* Header */}
            <header className="p-6 border-b bg-card">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{selectedSong.title}</h1>
                  {selectedSong.author && (
                    <p className="text-muted-foreground mt-1">{selectedSong.author}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </header>

            {/* Verses */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                {selectedSong.verses.map((verse, index) => (
                  <div
                    key={verse.id}
                    className="p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-primary">{verse.label}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Add to slide
                      </Button>
                    </div>
                    <p className={cn(
                      'whitespace-pre-line leading-relaxed',
                      selectedSong.language === 'ja' && 'font-ja'
                    )}>
                      {verse.text}
                    </p>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full border-dashed">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Verse
                </Button>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a song to view
          </div>
        )}
      </main>
    </div>
  );
}
