import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Music,
  Plus,
  ChevronRight,
  Globe,
  Tag,
  Heart,
  Play,
  Clock,
  Users,
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  Card,
  CardContent,
  Badge,
} from '@sanctuary/ui';
import { ALL_SONGS, getSongsByLanguage, searchSongs, Song, SongSection } from '../data/songs';

export default function SongLibrary() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'en' | 'es' | 'ja'>('all');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showSongModal, setShowSongModal] = useState(false);

  const filteredSongs = useMemo(() => {
    let songs = selectedLanguage === 'all' ? ALL_SONGS : getSongsByLanguage(selectedLanguage);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      songs = songs.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.artist.toLowerCase().includes(query) ||
        s.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    return songs;
  }, [selectedLanguage, searchQuery]);

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setShowSongModal(true);
  };

  const handleInsertToSlide = (song: Song, section?: SongSection) => {
    // Create a new presentation with this song
    const presId = `pres-${Date.now()}`;
    const text = section ? section.lyrics : song.sections[0]?.lyrics || song.lyrics;
    
    const presentation = {
      id: presId,
      name: song.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      slides: [{
        id: `slide-${Date.now()}`,
        background: { type: 'gradient', value: 'linear-gradient(180deg, #1e3a8a 0%, #312e81 100%)' },
        elements: [{
          id: `el-${Date.now()}`,
          type: 'text',
          x: 80,
          y: 120,
          width: 800,
          height: 300,
          content: text,
          style: {
            fontFamily: 'Inter',
            fontSize: 36,
            fontWeight: '400',
            color: '#ffffff',
            textAlign: 'center',
            verticalAlign: 'middle',
            padding: 24,
          },
        }],
      }],
    };

    localStorage.setItem(`presentation-${presId}`, JSON.stringify(presentation));
    setShowSongModal(false);
    navigate(`/presentations/${presId}`);
  };

  const languageLabels = {
    all: 'All Songs',
    en: 'English',
    es: 'Español',
    ja: '日本語',
  };

  const languageFlags = {
    en: '🇺🇸',
    es: '🇪🇸',
    ja: '🇯🇵',
  };

  const languageColors = {
    en: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    es: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    ja: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800',
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-gradient-to-br from-pink-500/5 via-background to-purple-500/5">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Music className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Song Library</h1>
              <p className="text-muted-foreground">Browse and add worship songs to your presentations</p>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mt-6 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search songs, artists, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Language tabs */}
        <Tabs value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as any)}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <Globe className="h-4 w-4" />
                All ({ALL_SONGS.length})
              </TabsTrigger>
              <TabsTrigger value="en" className="gap-2">
                <span>🇺🇸</span>
                English ({getSongsByLanguage('en').length})
              </TabsTrigger>
              <TabsTrigger value="es" className="gap-2">
                <span>🇪🇸</span>
                Español ({getSongsByLanguage('es').length})
              </TabsTrigger>
              <TabsTrigger value="ja" className="gap-2">
                <span>🇯🇵</span>
                日本語 ({getSongsByLanguage('ja').length})
              </TabsTrigger>
            </TabsList>
            <Badge variant="secondary" className="font-medium">
              {filteredSongs.length} songs
            </Badge>
          </div>

          {/* Songs list */}
          {filteredSongs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Music className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">No songs found</h3>
                  <p className="text-sm text-muted-foreground">Try a different search term or filter</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSongs.map((song, index) => (
                <Card 
                  key={song.id}
                  className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30 animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => handleSelectSong(song)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                          {song.title}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3" />
                          {song.artist}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs font-medium",
                          languageColors[song.language]
                        )}
                      >
                        {languageFlags[song.language]} {languageLabels[song.language]}
                      </Badge>
                      {song.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary" className="h-8">
                        <Plus className="h-3 w-3 mr-1" />
                        Create slide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Tabs>
      </div>

      {/* Song Detail Modal */}
      <Dialog open={showSongModal} onOpenChange={setShowSongModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          {selectedSong && (
            <>
              <DialogHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Music className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl truncate">{selectedSong.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {selectedSong.artist}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex gap-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "font-medium",
                    languageColors[selectedSong.language]
                  )}
                >
                  <Globe className="h-3 w-3 mr-1" />
                  {languageLabels[selectedSong.language]}
                </Badge>
                {selectedSong.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
                <div className="space-y-3 pb-4">
                  {selectedSong.sections.map((section, idx) => (
                    <Card
                      key={idx}
                      className="cursor-pointer hover:bg-secondary/50 hover:border-primary/30 transition-all group"
                      onClick={() => handleInsertToSlide(selectedSong, section)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs uppercase tracking-wide">
                            {section.label}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {section.lyrics}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2 pt-4 border-t">
                <Button className="flex-1" onClick={() => handleInsertToSlide(selectedSong)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Full Presentation
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
