import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'verse';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    opacity?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    padding?: number;
    lineHeight?: number;
    letterSpacing?: number;
  };
  verseData?: {
    book: string;
    chapter: number;
    verse: number;
    translation: string;
  };
  locked?: boolean;
  rotation?: number;
}

export interface SlideVariant {
  id: string;
  label: string; // 'default', 'short', 'long', 'bilingual', 'spanish', 'japanese'
  elements: SlideElement[];
}

export interface Slide {
  id: string;
  title?: string;
  background: {
    type: 'color' | 'gradient' | 'image';
    value: string;
  };
  elements: SlideElement[];
  variants?: SlideVariant[];
  activeVariantId?: string;
  notes?: string;
  transition?: 'none' | 'fade' | 'slide' | 'zoom';
  hidden?: boolean;
}

export interface Presentation {
  id: string;
  name: string;
  slides: Slide[];
  stylePresets?: StylePreset[];
  createdAt: number;
  updatedAt: number;
}

export interface StylePreset {
  id: string;
  name: string;
  category: 'verse' | 'title' | 'chorus' | 'caption' | 'body' | 'custom';
  style: Partial<SlideElement['style']>;
  isDefault?: boolean;
}

// Command for undo/redo
interface Command {
  id: string;
  type: string;
  timestamp: number;
  data: any;
  slideId?: string;
}

// Recent command for command palette
export interface RecentCommand {
  id: string;
  label: string;
  action: string;
  timestamp: number;
}

// Presence
export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursorX?: number;
  cursorY?: number;
  selectedElementId?: string;
  currentSlideIndex?: number;
  lastActive: number;
}

// Search result
export interface SearchResult {
  id: string;
  type: 'slide' | 'verse' | 'song' | 'note';
  title: string;
  content: string;
  slideIndex?: number;
  presentationId?: string;
  relevance: number;
}

interface EditorState {
  // Current editing
  currentPresentationId: string | null;
  currentSlideIndex: number;
  selectedElementIds: string[];
  editingTextId: string | null;
  copiedStyle: Partial<SlideElement['style']> | null;
  
  // UI State
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showPropertiesPanel: boolean;
  propertiesPanelTab: 'format' | 'animation' | 'notes';
  
  // Dialogs
  showBibleDialog: boolean;
  showSongDialog: boolean;
  showSearchDialog: boolean;
  showShortcutsDialog: boolean;
  showPresetsDialog: boolean;
  showVariantsDialog: boolean;
  
  // Undo/Redo (command-based)
  undoStack: Command[];
  redoStack: Command[];
  maxHistorySize: number;
  
  // Recent actions for command palette
  recentCommands: RecentCommand[];
  
  // Search
  searchQuery: string;
  searchResults: SearchResult[];
  recentSearches: string[];
  
  // Style presets
  stylePresets: StylePreset[];
  
  // Presence
  collaborators: UserPresence[];
  localUser: UserPresence | null;
  
  // Actions
  setCurrentPresentationId: (id: string | null) => void;
  setCurrentSlideIndex: (index: number) => void;
  setSelectedElementIds: (ids: string[]) => void;
  toggleElementSelection: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  setEditingTextId: (id: string | null) => void;
  setCopiedStyle: (style: Partial<SlideElement['style']> | null) => void;
  
  setZoom: (zoom: number) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setShowPropertiesPanel: (show: boolean) => void;
  setPropertiesPanelTab: (tab: 'format' | 'animation' | 'notes') => void;
  
  setShowBibleDialog: (show: boolean) => void;
  setShowSongDialog: (show: boolean) => void;
  setShowSearchDialog: (show: boolean) => void;
  setShowShortcutsDialog: (show: boolean) => void;
  setShowPresetsDialog: (show: boolean) => void;
  setShowVariantsDialog: (show: boolean) => void;
  
  pushCommand: (command: Omit<Command, 'id' | 'timestamp'>) => void;
  undo: () => Command | null;
  redo: () => Command | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  addRecentCommand: (label: string, action: string) => void;
  
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  addRecentSearch: (query: string) => void;
  
  addStylePreset: (preset: Omit<StylePreset, 'id'>) => void;
  removeStylePreset: (id: string) => void;
  updateStylePreset: (id: string, updates: Partial<StylePreset>) => void;
  
  setCollaborators: (users: UserPresence[]) => void;
  setLocalUser: (user: UserPresence | null) => void;
  updateLocalCursor: (x: number, y: number) => void;
}

// Default style presets
const DEFAULT_STYLE_PRESETS: StylePreset[] = [
  {
    id: 'verse-default',
    name: 'Scripture Verse',
    category: 'verse',
    style: {
      fontFamily: 'Merriweather',
      fontSize: 32,
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.6,
    },
    isDefault: true,
  },
  {
    id: 'title-default',
    name: 'Title',
    category: 'title',
    style: {
      fontFamily: 'Inter',
      fontSize: 48,
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'center',
    },
    isDefault: true,
  },
  {
    id: 'chorus-default',
    name: 'Chorus',
    category: 'chorus',
    style: {
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: '600',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.5,
    },
    isDefault: true,
  },
  {
    id: 'caption-default',
    name: 'Caption',
    category: 'caption',
    style: {
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: '400',
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
    },
    isDefault: true,
  },
  {
    id: 'body-default',
    name: 'Body Text',
    category: 'body',
    style: {
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.5,
    },
    isDefault: true,
  },
];

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentPresentationId: null,
      currentSlideIndex: 0,
      selectedElementIds: [],
      editingTextId: null,
      copiedStyle: null,
      
      zoom: 100,
      showGrid: false,
      snapToGrid: true,
      gridSize: 20,
      showPropertiesPanel: false,
      propertiesPanelTab: 'format',
      
      showBibleDialog: false,
      showSongDialog: false,
      showSearchDialog: false,
      showShortcutsDialog: false,
      showPresetsDialog: false,
      showVariantsDialog: false,
      
      undoStack: [],
      redoStack: [],
      maxHistorySize: 50,
      
      recentCommands: [],
      
      searchQuery: '',
      searchResults: [],
      recentSearches: [],
      
      stylePresets: DEFAULT_STYLE_PRESETS,
      
      collaborators: [],
      localUser: null,
      
      // Actions
      setCurrentPresentationId: (id) => set({ currentPresentationId: id }),
      setCurrentSlideIndex: (index) => set({ currentSlideIndex: index }),
      setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),
      
      toggleElementSelection: (id, multi = false) => {
        const { selectedElementIds } = get();
        if (multi) {
          const exists = selectedElementIds.includes(id);
          set({
            selectedElementIds: exists
              ? selectedElementIds.filter(eid => eid !== id)
              : [...selectedElementIds, id],
          });
        } else {
          set({ selectedElementIds: [id] });
        }
      },
      
      clearSelection: () => set({ selectedElementIds: [], editingTextId: null }),
      setEditingTextId: (id) => set({ editingTextId: id }),
      setCopiedStyle: (style) => set({ copiedStyle: style }),
      
      setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(200, zoom)) }),
      setShowGrid: (show) => set({ showGrid: show }),
      setSnapToGrid: (snap) => set({ snapToGrid: snap }),
      setShowPropertiesPanel: (show) => set({ showPropertiesPanel: show }),
      setPropertiesPanelTab: (tab) => set({ propertiesPanelTab: tab }),
      
      setShowBibleDialog: (show) => set({ showBibleDialog: show }),
      setShowSongDialog: (show) => set({ showSongDialog: show }),
      setShowSearchDialog: (show) => set({ showSearchDialog: show }),
      setShowShortcutsDialog: (show) => set({ showShortcutsDialog: show }),
      setShowPresetsDialog: (show) => set({ showPresetsDialog: show }),
      setShowVariantsDialog: (show) => set({ showVariantsDialog: show }),
      
      pushCommand: (command) => {
        const { undoStack, maxHistorySize } = get();
        const newCommand: Command = {
          ...command,
          id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        set({
          undoStack: [...undoStack.slice(-maxHistorySize + 1), newCommand],
          redoStack: [],
        });
      },
      
      undo: () => {
        const { undoStack, redoStack } = get();
        if (undoStack.length === 0) return null;
        
        const command = undoStack[undoStack.length - 1];
        set({
          undoStack: undoStack.slice(0, -1),
          redoStack: [...redoStack, command],
        });
        return command;
      },
      
      redo: () => {
        const { undoStack, redoStack } = get();
        if (redoStack.length === 0) return null;
        
        const command = redoStack[redoStack.length - 1];
        set({
          redoStack: redoStack.slice(0, -1),
          undoStack: [...undoStack, command],
        });
        return command;
      },
      
      canUndo: () => get().undoStack.length > 0,
      canRedo: () => get().redoStack.length > 0,
      
      addRecentCommand: (label, action) => {
        const { recentCommands } = get();
        const newCommand: RecentCommand = {
          id: `rc-${Date.now()}`,
          label,
          action,
          timestamp: Date.now(),
        };
        set({
          recentCommands: [newCommand, ...recentCommands.filter(c => c.action !== action)].slice(0, 10),
        });
      },
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results }),
      
      addRecentSearch: (query) => {
        if (!query.trim()) return;
        const { recentSearches } = get();
        set({
          recentSearches: [query, ...recentSearches.filter(s => s !== query)].slice(0, 10),
        });
      },
      
      addStylePreset: (preset) => {
        const { stylePresets } = get();
        const newPreset: StylePreset = {
          ...preset,
          id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        set({ stylePresets: [...stylePresets, newPreset] });
      },
      
      removeStylePreset: (id) => {
        const { stylePresets } = get();
        set({ stylePresets: stylePresets.filter(p => p.id !== id && !p.isDefault) });
      },
      
      updateStylePreset: (id, updates) => {
        const { stylePresets } = get();
        set({
          stylePresets: stylePresets.map(p => p.id === id ? { ...p, ...updates } : p),
        });
      },
      
      setCollaborators: (users) => set({ collaborators: users }),
      setLocalUser: (user) => set({ localUser: user }),
      
      updateLocalCursor: (x, y) => {
        const { localUser } = get();
        if (localUser) {
          set({ localUser: { ...localUser, cursorX: x, cursorY: y, lastActive: Date.now() } });
        }
      },
    }),
    {
      name: 'sanctuary-editor-store',
      partialize: (state) => ({
        zoom: state.zoom,
        showGrid: state.showGrid,
        snapToGrid: state.snapToGrid,
        stylePresets: state.stylePresets,
        recentCommands: state.recentCommands,
        recentSearches: state.recentSearches,
      }),
    }
  )
);
