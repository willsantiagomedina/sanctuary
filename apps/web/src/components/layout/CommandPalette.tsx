import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Music,
  Settings,
  Plus,
  Moon,
  Sun,
  Monitor,
  Globe,
  Type,
  Image,
  Play,
  Square,
  Search,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  History,
  Keyboard,
  Palette,
  Layers,
  Eye,
  Grid,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@sanctuary/ui';
import { useStore } from '../../stores/app';
import { useEditorStore } from '../../stores/editor';

interface CommandPaletteContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode: 'command' | 'search' | 'slide';
  setMode: (mode: 'command' | 'search' | 'slide') => void;
}

const CommandPaletteContext = React.createContext<CommandPaletteContextType | null>(null);

export function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}

// Editor context detection
function useEditorContext() {
  const location = useLocation();
  const { selectedElementIds, currentSlideIndex } = useEditorStore();
  
  const isInEditor = location.pathname.startsWith('/editor/');
  const hasSelection = selectedElementIds.length > 0;
  const hasMultipleSelection = selectedElementIds.length > 1;
  
  return { isInEditor, hasSelection, hasMultipleSelection, currentSlideIndex };
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { commandPaletteOpen, setCommandPaletteOpen, setTheme, theme, language, setLanguage } = useStore();
  const [mode, setMode] = useState<'command' | 'search' | 'slide'>('command');
  
  const { isInEditor, hasSelection } = useEditorContext();
  
  const {
    recentCommands,
    addRecentCommand,
    setShowBibleDialog,
    setShowSongDialog,
    setShowSearchDialog,
    setShowShortcutsDialog,
    setShowPresetsDialog,
    setShowVariantsDialog,
    showGrid,
    setShowGrid,
    zoom,
    setZoom,
    canUndo,
    canRedo,
  } = useEditorStore();

  // Reset mode when opening
  useEffect(() => {
    if (commandPaletteOpen) {
      setMode('command');
    }
  }, [commandPaletteOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Cmd/Ctrl+K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setMode('command');
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      // Cmd/Ctrl+P for global search
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setMode('search');
        setCommandPaletteOpen(true);
      }
      // Cmd/Ctrl+G for jump to slide (in editor)
      if ((e.metaKey || e.ctrlKey) && e.key === 'g' && isInEditor) {
        e.preventDefault();
        setMode('slide');
        setCommandPaletteOpen(true);
      }
    },
    [commandPaletteOpen, setCommandPaletteOpen, isInEditor]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const runCommand = useCallback(
    (command: () => void, label?: string, action?: string) => {
      setCommandPaletteOpen(false);
      command();
      if (label && action) {
        addRecentCommand(label, action);
      }
    },
    [setCommandPaletteOpen, addRecentCommand]
  );

  // Create new presentation
  const createPresentation = useCallback(() => {
    const id = `pres-${Date.now()}`;
    navigate(`/editor/${id}`);
  }, [navigate]);

  // Get placeholder text based on mode
  const placeholder = useMemo(() => {
    switch (mode) {
      case 'search': return 'Search slides, verses, songs...';
      case 'slide': return 'Jump to slide by number or title...';
      default: return 'Type a command or search...';
    }
  }, [mode]);

  return (
    <CommandPaletteContext.Provider
      value={{ open: commandPaletteOpen, setOpen: setCommandPaletteOpen, mode, setMode }}
    >
      {children}
      <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
        <CommandInput placeholder={placeholder} />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Recent Commands - show first for quick access */}
          {mode === 'command' && recentCommands.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recentCommands.slice(0, 5).map((cmd) => (
                  <CommandItem
                    key={cmd.id}
                    onSelect={() => {
                      // Re-trigger the action based on stored action
                      if (cmd.action === 'insert-verse') setShowBibleDialog(true);
                      if (cmd.action === 'insert-song') setShowSongDialog(true);
                      if (cmd.action === 'global-search') setShowSearchDialog(true);
                      if (cmd.action === 'new-presentation') createPresentation();
                      setCommandPaletteOpen(false);
                    }}
                  >
                    <History className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{cmd.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Editor-specific commands */}
          {isInEditor && mode === 'command' && (
            <>
              <CommandGroup heading="Insert">
                <CommandItem onSelect={() => runCommand(() => {}, 'Insert Text', 'insert-text')}>
                  <Type className="mr-2 h-4 w-4" />
                  <span>Insert Text</span>
                  <CommandShortcut>T</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => setShowBibleDialog(true), 'Insert Verse', 'insert-verse')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Insert Verse</span>
                  <CommandShortcut>⌘⇧V</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => setShowSongDialog(true), 'Insert Song', 'insert-song')}>
                  <Music className="mr-2 h-4 w-4" />
                  <span>Insert Song</span>
                  <CommandShortcut>⌘⇧S</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => {}, 'Insert Image', 'insert-image')}>
                  <Image className="mr-2 h-4 w-4" />
                  <span>Insert Image</span>
                  <CommandShortcut>I</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => {}, 'Insert Shape', 'insert-shape')}>
                  <Square className="mr-2 h-4 w-4" />
                  <span>Insert Shape</span>
                  <CommandShortcut>S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              
              <CommandGroup heading="Edit">
                <CommandItem 
                  onSelect={() => runCommand(() => {}, 'Undo', 'undo')}
                  disabled={!canUndo()}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  <span>Undo</span>
                  <CommandShortcut>⌘Z</CommandShortcut>
                </CommandItem>
                <CommandItem 
                  onSelect={() => runCommand(() => {}, 'Redo', 'redo')}
                  disabled={!canRedo()}
                >
                  <Redo2 className="mr-2 h-4 w-4" />
                  <span>Redo</span>
                  <CommandShortcut>⌘⇧Z</CommandShortcut>
                </CommandItem>
                {hasSelection && (
                  <>
                    <CommandItem onSelect={() => runCommand(() => {}, 'Duplicate', 'duplicate')}>
                      <Copy className="mr-2 h-4 w-4" />
                      <span>Duplicate Selection</span>
                      <CommandShortcut>⌘D</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => {}, 'Delete', 'delete')}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Selection</span>
                      <CommandShortcut>⌫</CommandShortcut>
                    </CommandItem>
                  </>
                )}
              </CommandGroup>
              <CommandSeparator />

              <CommandGroup heading="View">
                <CommandItem onSelect={() => runCommand(() => setShowGrid(!showGrid), 'Toggle Grid', 'toggle-grid')}>
                  <Grid className="mr-2 h-4 w-4" />
                  <span>Toggle Grid</span>
                  {showGrid && <span className="ml-auto text-xs">✓</span>}
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => setZoom(Math.min(200, zoom + 25)), 'Zoom In', 'zoom-in')}>
                  <ZoomIn className="mr-2 h-4 w-4" />
                  <span>Zoom In</span>
                  <CommandShortcut>⌘+</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => setZoom(Math.max(25, zoom - 25)), 'Zoom Out', 'zoom-out')}>
                  <ZoomOut className="mr-2 h-4 w-4" />
                  <span>Zoom Out</span>
                  <CommandShortcut>⌘-</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => setZoom(100), 'Reset Zoom', 'zoom-reset')}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Reset Zoom (100%)</span>
                  <CommandShortcut>⌘0</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />

              <CommandGroup heading="Format">
                <CommandItem onSelect={() => runCommand(() => setShowPresetsDialog(true), 'Style Presets', 'style-presets')}>
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Apply Style Preset</span>
                  <CommandShortcut>⌘⇧S</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => setShowVariantsDialog(true), 'Slide Variants', 'slide-variants')}>
                  <Layers className="mr-2 h-4 w-4" />
                  <span>Slide Variants</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />

              <CommandGroup heading="Presentation">
                <CommandItem onSelect={() => runCommand(() => {
                  const id = location.pathname.split('/').pop();
                  if (id) window.open(`/present/${id}`, '_blank');
                }, 'Present', 'present')}>
                  <Play className="mr-2 h-4 w-4" />
                  <span>Start Presentation</span>
                  <CommandShortcut>⌘↵</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Global Navigation */}
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/bible'))}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Bible Explorer</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/songs'))}>
              <Music className="mr-2 h-4 w-4" />
              <span>Song Library</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => runCommand(createPresentation, 'New Presentation', 'new-presentation')}>
              <Plus className="mr-2 h-4 w-4" />
              <span>New Presentation</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => {
              setMode('search');
            })}>
              <Search className="mr-2 h-4 w-4" />
              <span>Global Search</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setShowShortcutsDialog(true), 'Shortcuts', 'shortcuts')}>
              <Keyboard className="mr-2 h-4 w-4" />
              <span>Keyboard Shortcuts</span>
              <CommandShortcut>⌘/</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Mode</span>
              {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Mode</span>
              {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System Default</span>
              {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Language">
            <CommandItem onSelect={() => runCommand(() => setLanguage('en'))}>
              <Globe className="mr-2 h-4 w-4" />
              <span>English</span>
              {language === 'en' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLanguage('ja'))}>
              <Globe className="mr-2 h-4 w-4" />
              <span>日本語</span>
              {language === 'ja' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLanguage('es'))}>
              <Globe className="mr-2 h-4 w-4" />
              <span>Español</span>
              {language === 'es' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}
