import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Grid,
  List,
  MoreHorizontal,
  Trash2,
  Copy,
  Play,
  Clock,
  FolderOpen,
  Edit2,
  ChevronDown,
  BookOpen,
  Music,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { 
  Button, 
  cn, 
  Input, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  ScrollArea, 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  Card,
  CardContent,
  Badge,
  Skeleton,
} from '@sanctuary/ui';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';

interface Presentation {
  id: string;
  name: string;
  slides: any[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

// Skeleton loader for presentation cards
function PresentationCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// Quick action card component
function QuickActionCard({ 
  icon: Icon, 
  title, 
  description, 
  onClick,
  tone = 'primary',
}: { 
  icon: any; 
  title: string; 
  description: string; 
  onClick: () => void;
  tone?: 'primary' | 'accent' | 'muted' | 'info';
}) {
  const toneStyles: Record<string, string> = {
    primary: 'bg-primary/10 text-primary ring-primary/20',
    accent: 'bg-accent/10 text-accent ring-accent/20',
    muted: 'bg-muted text-foreground/70 ring-border/60',
    info: 'bg-secondary text-foreground/70 ring-border/60',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border border-border/60 bg-card/70 p-4 text-left shadow-sm transition-colors",
        "hover:border-border hover:bg-card"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset",
            toneStyles[tone]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'created'>('recent');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Load presentations from localStorage
  useEffect(() => {
    const loadPresentations = () => {
      setIsLoading(true);
      const presToLoad: Presentation[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('presentation-')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '');
            presToLoad.push(data);
          } catch (e) {
            console.error('Failed to parse presentation:', key);
          }
        }
      }
      setPresentations(presToLoad);
      // Simulate loading for smooth transition
      setTimeout(() => setIsLoading(false), 300);
    };

    loadPresentations();
    window.addEventListener('storage', loadPresentations);
    return () => window.removeEventListener('storage', loadPresentations);
  }, []);

  // Filtered and sorted presentations
  const filteredPresentations = useMemo(() => {
    let result = presentations.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'created':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'recent':
      default:
        result.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
    }

    return result;
  }, [presentations, searchQuery, sortBy]);

  // Recent presentations (last 4)
  const recentPresentations = useMemo(() => {
    return [...presentations]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 4);
  }, [presentations]);

  const createNewPresentation = () => {
    const id = `pres-${Date.now()}`;
    navigate(`/presentations/${id}`);
  };

  const handleDelete = () => {
    if (selectedPresentation) {
      localStorage.removeItem(`presentation-${selectedPresentation.id}`);
      setPresentations(prev => prev.filter(p => p.id !== selectedPresentation.id));
      setDeleteDialogOpen(false);
      setSelectedPresentation(null);
    }
  };

  const handleRename = () => {
    if (selectedPresentation && newName.trim()) {
      const updated = { ...selectedPresentation, name: newName.trim(), updatedAt: Date.now() };
      localStorage.setItem(`presentation-${selectedPresentation.id}`, JSON.stringify(updated));
      setPresentations(prev => prev.map(p => p.id === selectedPresentation.id ? updated : p));
      setRenameDialogOpen(false);
      setSelectedPresentation(null);
      setNewName('');
    }
  };

  const handleDuplicate = (pres: Presentation) => {
    const newId = `pres-${Date.now()}`;
    const newPres = {
      ...JSON.parse(JSON.stringify(pres)),
      id: newId,
      name: `${pres.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    localStorage.setItem(`presentation-${newId}`, JSON.stringify(newPres));
    setPresentations(prev => [newPres, ...prev]);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getBackgroundStyle = (pres: Presentation) => {
    const bg = pres.slides?.[0]?.background;
    if (!bg) return { backgroundColor: '#1e3a8a' };
    if (bg.type === 'gradient') return { background: bg.value };
    if (bg.type === 'image') return { backgroundImage: `url(${bg.value})`, backgroundSize: 'cover' };
    return { backgroundColor: bg.value };
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title={
          <>
            {greeting}, {user?.name?.split(' ')[0] || 'there'} <span>👋</span>
          </>
        }
        description={
          presentations.length > 0
            ? `You have ${presentations.length} presentation${presentations.length !== 1 ? 's' : ''} ready`
            : 'Create your first presentation to get started'
        }
        icon={<Sparkles className="h-5 w-5" />}
        actions={
          <Button size="lg" onClick={createNewPresentation} className="shadow-sm">
            <Plus className="h-5 w-5" />
            New Presentation
          </Button>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <section className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              icon={Plus}
              title="Blank Presentation"
              description="Start from scratch"
              onClick={createNewPresentation}
              tone="primary"
            />
            <QuickActionCard
              icon={BookOpen}
              title="Bible Verse"
              description="Add scripture slides"
              onClick={() => navigate('/bible')}
              tone="accent"
            />
            <QuickActionCard
              icon={Music}
              title="Song Lyrics"
              description="Browse worship songs"
              onClick={() => navigate('/songs')}
              tone="muted"
            />
            <QuickActionCard
              icon={Sparkles}
              title="Templates"
              description="Coming soon"
              onClick={() => {}}
              tone="info"
            />
          </div>
        </section>

        {/* Recent Section - Only show if there are presentations */}
        {recentPresentations.length > 0 && !searchQuery && (
          <section className="mb-10 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Recent</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <PresentationCardSkeleton key={i} />
                ))
              ) : (
                recentPresentations.map((pres) => (
                  <Link
                    key={pres.id}
                    to={`/presentations/${pres.id}`}
                    className="group block"
                  >
                    <Card className="overflow-hidden card-hover border-2 border-transparent hover:border-primary/20">
                      <div 
                        className="aspect-video relative" 
                        style={getBackgroundStyle(pres)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          <span className="text-white/70 text-sm text-center line-clamp-2">
                            {pres.slides?.[0]?.elements?.[0]?.content?.substring(0, 60) || 'Empty slide'}
                          </span>
                        </div>
                        <Badge className="absolute bottom-2 right-2 bg-black/50 border-0 text-white">
                          {pres.slides?.length || 0} slides
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                          {pres.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(pres.updatedAt)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </section>
        )}

        {/* All Presentations Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">All Presentations</h2>
              <Badge variant="secondary" className="ml-2">
                {filteredPresentations.length}
              </Badge>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search presentations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[130px] h-10">
                    {sortBy === 'recent' ? 'Last edited' : sortBy === 'name' ? 'Name' : 'Created'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('recent')}>
                    <Clock className="h-4 w-4 mr-2" />
                    Last edited
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('name')}>
                    <span className="h-4 w-4 mr-2 text-center font-bold">A</span>
                    Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('created')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Created
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex bg-secondary rounded-lg p-1">
                <button
                  className={cn(
                    "p-2 rounded-md transition-all",
                    viewMode === 'grid' 
                      ? 'bg-background shadow-sm text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  className={cn(
                    "p-2 rounded-md transition-all",
                    viewMode === 'list' 
                      ? 'bg-background shadow-sm text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <PresentationCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredPresentations.length === 0 ? (
            <div className="empty-state py-20 border-2 border-dashed rounded-2xl">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <FolderOpen className="h-10 w-10 text-primary/50" />
              </div>
              <h3 className="empty-state-title text-xl">
                {searchQuery ? 'No matching presentations' : 'No presentations yet'}
              </h3>
              <p className="empty-state-description mb-6">
                {searchQuery 
                  ? 'Try a different search term or create a new presentation'
                  : 'Create your first presentation to start building worship slides'
                }
              </p>
              {!searchQuery && (
                <Button onClick={createNewPresentation} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Presentation
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPresentations.map((pres, index) => (
                <div
                  key={pres.id}
                  className="group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card className="overflow-hidden card-hover border-2 border-transparent hover:border-primary/20">
                    {/* Thumbnail */}
                    <Link to={`/presentations/${pres.id}`}>
                      <div 
                        className="aspect-video relative" 
                        style={getBackgroundStyle(pres)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          <span className="text-white/70 text-sm text-center line-clamp-2">
                            {pres.slides?.[0]?.elements?.[0]?.content?.substring(0, 60) || 'Empty slide'}
                          </span>
                        </div>
                        <Badge className="absolute bottom-2 right-2 bg-black/50 border-0 text-white">
                          {pres.slides?.length || 0} slides
                        </Badge>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="sm" variant="secondary" className="shadow-lg">
                            <Play className="h-4 w-4 mr-1" /> Present
                          </Button>
                        </div>
                      </div>
                    </Link>

                    {/* Info */}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/presentations/${pres.id}`} className="flex-1 min-w-0">
                          <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                            {pres.name}
                          </h3>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 -mr-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => navigate(`/present/${pres.id}`)}>
                              <Play className="h-4 w-4 mr-2" /> Present
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedPresentation(pres); setNewName(pres.name); setRenameDialogOpen(true); }}>
                              <Edit2 className="h-4 w-4 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(pres)}>
                              <Copy className="h-4 w-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => { setSelectedPresentation(pres); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(pres.updatedAt)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Slides</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Created</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Modified</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPresentations.map((pres, index) => (
                    <tr 
                      key={pres.id} 
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors animate-fade-in group"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="p-4">
                        <Link to={`/presentations/${pres.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                          <div 
                            className="w-14 h-10 rounded-lg shrink-0 shadow-sm" 
                            style={getBackgroundStyle(pres)}
                          />
                          <span className="font-medium truncate">{pres.name}</span>
                        </Link>
                      </td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">
                        <Badge variant="secondary">{pres.slides?.length || 0}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm hidden md:table-cell">
                        {new Date(pres.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {formatDate(pres.updatedAt)}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => navigate(`/present/${pres.id}`)}>
                              <Play className="h-4 w-4 mr-2" /> Present
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedPresentation(pres); setNewName(pres.name); setRenameDialogOpen(true); }}>
                              <Edit2 className="h-4 w-4 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(pres)}>
                              <Copy className="h-4 w-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => { setSelectedPresentation(pres); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </section>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Presentation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPresentation?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Presentation</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Presentation name"
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
