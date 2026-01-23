import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Play,
  Trash2,
  Copy,
  Settings,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  RotateCcw,
  Upload,
  Link,
  X,
  Monitor,
  MonitorPlay,
  Maximize,
  MessageSquare,
  LayoutGrid,
} from 'lucide-react';
import { Button, cn, Input, Label, ScrollArea, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, Popover, PopoverContent, PopoverTrigger, Tabs, TabsList, TabsTrigger, TabsContent, Slider, Switch } from '@sanctuary/ui';
import { TEXT_COLORS, BACKGROUND_COLORS, GRADIENTS } from '../data/fonts';
import { ALL_SONGS, getSongsByLanguage, type Song, type SongSection } from '../data/songs';
import { useBibleBooks, useBibleChapters, useBibleSearch, useBibleTranslations, useBibleVerses } from '../hooks/useBible';
import { getSeedVerseNumbers, getSeedVerseText } from '../lib/bible-seed';
import { EditorMenuBar } from '../components/editor/EditorMenuBar';
import { FormattingToolbar } from '../components/editor/FormattingToolbar';
import { KeyboardShortcutsDialog } from '../components/editor';
import { useMenuEvents } from '../hooks/useElectron';
import { useEditorStore } from '../stores/editor';

// Types
interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'verse';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  imageUrl?: string; // For image elements
  style: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    opacity?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    padding?: number;
    objectFit?: 'cover' | 'contain' | 'fill';
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

interface Slide {
  id: string;
  background: {
    type: 'color' | 'gradient' | 'image';
    value: string;
  };
  elements: SlideElement[];
  notes?: string;
}

interface Presentation {
  id: string;
  name: string;
  slides: Slide[];
  rotationGroups?: RotationGroup[];
  createdAt: number;
  updatedAt: number;
}

interface RotationGroup {
  id: string;
  name: string;
  slideIds: string[];
  intervalSeconds: number;
  mode: 'loop' | 'ping-pong';
  loop: boolean;
  stopOnInteraction: boolean;
  transition: 'fade' | 'none';
}

interface SpacingGuide {
  orientation: 'horizontal' | 'vertical';
  x: number;
  y: number;
  length: number;
}

interface GuideState {
  vertical: number[];
  horizontal: number[];
  spacing: SpacingGuide[];
}

const ALL_SELECTION_ID = 'all-elements';

// Default slide
const createDefaultSlide = (): Slide => ({
  id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  background: { type: 'color', value: '#1e3a8a' },
  elements: [],
  notes: '',
});

// Default presentation
const createDefaultPresentation = (id: string): Presentation => ({
  id,
  name: 'Untitled Presentation',
  slides: [createDefaultSlide()],
  rotationGroups: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

interface LayoutTheme {
  id: string;
  name: string;
  background: Slide['background'];
  titleColor: string;
  bodyColor: string;
  mutedColor: string;
  accent: string;
  titleFont: string;
  bodyFont: string;
  placeholderFill: string;
  previewFill: string;
}

interface LayoutContent {
  title?: string;
  subtitle?: string;
  body?: string;
  body2?: string;
  imageUrl?: string;
}

interface LayoutTemplate {
  id: 'title' | 'section' | 'two-column' | 'image-text';
  name: string;
  description: string;
  build: (theme: LayoutTheme, content: LayoutContent) => { background: Slide['background']; elements: SlideElement[] };
}

const LAYOUT_THEMES: LayoutTheme[] = [
  {
    id: 'calm-light',
    name: 'Calm Light',
    background: { type: 'color', value: '#f6f3ee' },
    titleColor: '#1f2937',
    bodyColor: '#334155',
    mutedColor: '#64748b',
    accent: '#2563eb',
    titleFont: 'Instrument Sans',
    bodyFont: 'Newsreader',
    placeholderFill: 'rgba(15,23,42,0.08)',
    previewFill: 'rgba(15,23,42,0.65)',
  },
  {
    id: 'slate',
    name: 'Slate',
    background: { type: 'color', value: '#0f172a' },
    titleColor: '#f8fafc',
    bodyColor: '#e2e8f0',
    mutedColor: '#cbd5f5',
    accent: '#38bdf8',
    titleFont: 'Instrument Sans',
    bodyFont: 'Newsreader',
    placeholderFill: 'rgba(255,255,255,0.12)',
    previewFill: 'rgba(248,250,252,0.8)',
  },
  {
    id: 'mist',
    name: 'Mist',
    background: { type: 'gradient', value: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)' },
    titleColor: '#1f2937',
    bodyColor: '#374151',
    mutedColor: '#6b7280',
    accent: '#6366f1',
    titleFont: 'Instrument Sans',
    bodyFont: 'Newsreader',
    placeholderFill: 'rgba(15,23,42,0.08)',
    previewFill: 'rgba(17,24,39,0.6)',
  },
];

const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'title',
    name: 'Title',
    description: 'Big headline with subtitle',
    build: (theme, content) => {
      const baseId = Date.now();
      return {
        background: theme.background,
        elements: [
          {
            id: `el-${baseId}-title`,
            type: 'text',
            x: 80,
            y: 170,
            width: 800,
            height: 120,
            content: content.title || 'Add a title',
            style: {
              fontFamily: theme.titleFont,
              fontSize: 56,
              fontWeight: '700',
              color: theme.titleColor,
              textAlign: 'center',
              verticalAlign: 'middle',
              padding: 8,
            },
          },
          {
            id: `el-${baseId}-subtitle`,
            type: 'text',
            x: 160,
            y: 300,
            width: 640,
            height: 80,
            content: content.subtitle || 'Add a subtitle',
            style: {
              fontFamily: theme.bodyFont,
              fontSize: 28,
              fontWeight: '400',
              color: theme.mutedColor,
              textAlign: 'center',
              verticalAlign: 'middle',
              padding: 4,
            },
          },
        ],
      };
    },
  },
  {
    id: 'section',
    name: 'Section',
    description: 'Section header with divider',
    build: (theme, content) => {
      const baseId = Date.now();
      return {
        background: theme.background,
        elements: [
          {
            id: `el-${baseId}-title`,
            type: 'text',
            x: 80,
            y: 80,
            width: 800,
            height: 90,
            content: content.title || 'Section title',
            style: {
              fontFamily: theme.titleFont,
              fontSize: 46,
              fontWeight: '700',
              color: theme.titleColor,
              textAlign: 'left',
              verticalAlign: 'middle',
              padding: 4,
            },
          },
          {
            id: `el-${baseId}-divider`,
            type: 'shape',
            x: 80,
            y: 170,
            width: 140,
            height: 6,
            content: '',
            style: {
              backgroundColor: theme.accent,
              borderRadius: 999,
            },
          },
          {
            id: `el-${baseId}-body`,
            type: 'text',
            x: 80,
            y: 200,
            width: 800,
            height: 240,
            content: content.body || 'Add section details or supporting points here.',
            style: {
              fontFamily: theme.bodyFont,
              fontSize: 26,
              fontWeight: '400',
              color: theme.bodyColor,
              textAlign: 'left',
              verticalAlign: 'top',
              padding: 4,
            },
          },
        ],
      };
    },
  },
  {
    id: 'two-column',
    name: 'Two Column',
    description: 'Split content with two columns',
    build: (theme, content) => {
      const baseId = Date.now();
      return {
        background: theme.background,
        elements: [
          {
            id: `el-${baseId}-title`,
            type: 'text',
            x: 80,
            y: 50,
            width: 800,
            height: 80,
            content: content.title || 'Two-column layout',
            style: {
              fontFamily: theme.titleFont,
              fontSize: 40,
              fontWeight: '700',
              color: theme.titleColor,
              textAlign: 'left',
              verticalAlign: 'middle',
              padding: 4,
            },
          },
          {
            id: `el-${baseId}-left`,
            type: 'text',
            x: 80,
            y: 150,
            width: 360,
            height: 320,
            content: content.body || 'Left column content goes here.',
            style: {
              fontFamily: theme.bodyFont,
              fontSize: 24,
              fontWeight: '400',
              color: theme.bodyColor,
              textAlign: 'left',
              verticalAlign: 'top',
              padding: 4,
            },
          },
          {
            id: `el-${baseId}-right`,
            type: 'text',
            x: 520,
            y: 150,
            width: 360,
            height: 320,
            content: content.body2 || 'Right column content goes here.',
            style: {
              fontFamily: theme.bodyFont,
              fontSize: 24,
              fontWeight: '400',
              color: theme.bodyColor,
              textAlign: 'left',
              verticalAlign: 'top',
              padding: 4,
            },
          },
        ],
      };
    },
  },
  {
    id: 'image-text',
    name: 'Image + Text',
    description: 'Visual on left, text on right',
    build: (theme, content) => {
      const baseId = Date.now();
      const imageElement: SlideElement = content.imageUrl
        ? {
            id: `el-${baseId}-image`,
            type: 'image',
            x: 80,
            y: 120,
            width: 360,
            height: 300,
            content: content.title || 'Image',
            imageUrl: content.imageUrl,
            style: {
              borderRadius: 16,
              objectFit: 'cover',
            },
          }
        : {
            id: `el-${baseId}-image`,
            type: 'shape',
            x: 80,
            y: 120,
            width: 360,
            height: 300,
            content: 'Image',
            style: {
              fontFamily: theme.bodyFont,
              fontSize: 18,
              fontWeight: '500',
              color: theme.mutedColor,
              textAlign: 'center',
              verticalAlign: 'middle',
              backgroundColor: theme.placeholderFill,
              borderRadius: 16,
              padding: 12,
            },
          };

      return {
        background: theme.background,
        elements: [
          imageElement,
          {
            id: `el-${baseId}-title`,
            type: 'text',
            x: 480,
            y: 130,
            width: 400,
            height: 90,
            content: content.title || 'Image headline',
            style: {
              fontFamily: theme.titleFont,
              fontSize: 38,
              fontWeight: '700',
              color: theme.titleColor,
              textAlign: 'left',
              verticalAlign: 'middle',
              padding: 4,
            },
          },
          {
            id: `el-${baseId}-body`,
            type: 'text',
            x: 480,
            y: 230,
            width: 400,
            height: 240,
            content: content.body || 'Use this space for supporting details and context.',
            style: {
              fontFamily: theme.bodyFont,
              fontSize: 24,
              fontWeight: '400',
              color: theme.bodyColor,
              textAlign: 'left',
              verticalAlign: 'top',
              padding: 4,
            },
          },
        ],
      };
    },
  },
];

const LAYOUT_PREVIEWS: Record<
  LayoutTemplate['id'],
  { x: number; y: number; width: number; height: number; kind?: 'accent' | 'image' }[]
> = {
  title: [
    { x: 10, y: 38, width: 80, height: 16 },
    { x: 20, y: 58, width: 60, height: 10 },
  ],
  section: [
    { x: 10, y: 18, width: 60, height: 12 },
    { x: 10, y: 34, width: 20, height: 3, kind: 'accent' },
    { x: 10, y: 42, width: 80, height: 30 },
  ],
  'two-column': [
    { x: 10, y: 12, width: 50, height: 10 },
    { x: 10, y: 28, width: 36, height: 48 },
    { x: 54, y: 28, width: 36, height: 48 },
  ],
  'image-text': [
    { x: 10, y: 22, width: 40, height: 50, kind: 'image' },
    { x: 56, y: 26, width: 32, height: 12 },
    { x: 56, y: 42, width: 32, height: 26 },
  ],
};

export default function PresentationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedSlideIds, setSelectedSlideIds] = useState<string[]>([]);
  const [slideSelectionAnchor, setSlideSelectionAnchor] = useState<number | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const showPropertiesPanel = useEditorStore(state => state.showPropertiesPanel);
  const setShowPropertiesPanel = useEditorStore(state => state.setShowPropertiesPanel);
  const showBibleDialog = useEditorStore(state => state.showBibleDialog);
  const setShowBibleDialog = useEditorStore(state => state.setShowBibleDialog);
  const showSongDialog = useEditorStore(state => state.showSongDialog);
  const setShowSongDialog = useEditorStore(state => state.setShowSongDialog);
  const showGrid = useEditorStore(state => state.showGrid);
  const setShowGrid = useEditorStore(state => state.setShowGrid);
  const snapToGrid = useEditorStore(state => state.snapToGrid);
  const setSnapToGrid = useEditorStore(state => state.setSnapToGrid);
  const zoom = useEditorStore(state => state.zoom);
  const setZoom = useEditorStore(state => state.setZoom);
  const copiedStyle = useEditorStore(state => state.copiedStyle);
  const setCopiedStyle = useEditorStore(state => state.setCopiedStyle);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [layoutThemeId, setLayoutThemeId] = useState(LAYOUT_THEMES[0]?.id || 'calm-light');
  const [layoutTarget, setLayoutTarget] = useState<'current' | 'new'>('current');
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [showRotationDialog, setShowRotationDialog] = useState(false);
  const [activeRotationGroupId, setActiveRotationGroupId] = useState<string | null>(null);
  const [rotationSelectionIds, setRotationSelectionIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Presentation[]>([]);
  const [redoStack, setRedoStack] = useState<Presentation[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [activeGuides, setActiveGuides] = useState<GuideState>({ vertical: [], horizontal: [], spacing: [] });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useMenuEvents({
    onInsertSong: () => setShowSongDialog(true),
  });

  // Load presentation
  useEffect(() => {
    if (!id) return;
    
    const stored = localStorage.getItem(`presentation-${id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!parsed.rotationGroups) parsed.rotationGroups = [];
      setPresentation(parsed);
    } else {
      const newPres = createDefaultPresentation(id);
      setPresentation(newPres);
      localStorage.setItem(`presentation-${id}`, JSON.stringify(newPres));
    }
  }, [id]);

  // Auto-save
  useEffect(() => {
    if (presentation && id) {
      localStorage.setItem(`presentation-${id}`, JSON.stringify({
        ...presentation,
        updatedAt: Date.now(),
      }));
    }
  }, [presentation, id]);

  // Helper functions
  const saveToHistory = useCallback(() => {
    if (presentation) {
      setUndoStack(prev => [...prev.slice(-20), JSON.parse(JSON.stringify(presentation))]);
      setRedoStack([]);
    }
  }, [presentation]);

  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      const prev = undoStack[undoStack.length - 1];
      setRedoStack(r => [...r, JSON.parse(JSON.stringify(presentation))]);
      setUndoStack(u => u.slice(0, -1));
      setPresentation(prev);
    }
  }, [undoStack, presentation]);

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];
      setUndoStack(u => [...u, JSON.parse(JSON.stringify(presentation))]);
      setRedoStack(r => r.slice(0, -1));
      setPresentation(next);
    }
  }, [redoStack, presentation]);

  const currentSlide = useMemo(() => {
    return presentation?.slides?.[currentSlideIndex] || null;
  }, [presentation, currentSlideIndex]);

  useEffect(() => {
    if (!presentation) return;
    setSelectedSlideIds(prev => {
      const validIds = prev.filter(id => presentation.slides.some(slide => slide.id === id));
      if (validIds.length > 0) return validIds;
      const currentId = presentation.slides[currentSlideIndex]?.id;
      return currentId ? [currentId] : [];
    });
  }, [presentation, currentSlideIndex]);


  const isAllSelected = selectedElementId === ALL_SELECTION_ID;

  const selectedElements = useMemo(() => {
    if (!currentSlide) return [];
    if (isAllSelected) return currentSlide.elements || [];
    if (!selectedElementId) return [];
    const element = currentSlide.elements?.find(e => e.id === selectedElementId);
    return element ? [element] : [];
  }, [currentSlide, selectedElementId, isAllSelected]);

  const selectedElement = useMemo(() => {
    if (!currentSlide || !selectedElementId || isAllSelected) return null;
    return currentSlide.elements?.find(e => e.id === selectedElementId) || null;
  }, [currentSlide, selectedElementId, isAllSelected]);

  const selectSlideByIndex = useCallback((
    index: number,
    options?: { range?: boolean; toggle?: boolean }
  ) => {
    if (!presentation) return;
    const slide = presentation.slides[index];
    if (!slide) return;
    const slideId = slide.id;

    setCurrentSlideIndex(index);
    setSelectedElementId(null);
    setEditingTextId(null);

    setSelectedSlideIds(prev => {
      const exists = prev.includes(slideId);
      if (options?.range && slideSelectionAnchor !== null) {
        const start = Math.min(slideSelectionAnchor, index);
        const end = Math.max(slideSelectionAnchor, index);
        return presentation.slides.slice(start, end + 1).map(s => s.id);
      }
      if (options?.toggle) {
        if (exists && prev.length === 1) return prev;
        return exists ? prev.filter(id => id !== slideId) : [...prev, slideId];
      }
      return [slideId];
    });

    setSlideSelectionAnchor(prevAnchor => {
      if (options?.range && prevAnchor !== null) return prevAnchor;
      return index;
    });
  }, [presentation, slideSelectionAnchor]);

  const rotationGroups = presentation?.rotationGroups || [];
  const activeRotationGroup = rotationGroups.find(group => group.id === activeRotationGroupId) || null;
  const orderedRotationSelectionIds = useMemo(() => {
    if (!presentation) return [];
    const selectedSet = new Set(rotationSelectionIds);
    return presentation.slides.filter(slide => selectedSet.has(slide.id)).map(slide => slide.id);
  }, [presentation, rotationSelectionIds]);

  const createRotationGroup = useCallback((slideIds: string[]) => {
    if (!presentation || slideIds.length === 0) return;
    const uniqueSlideIds = Array.from(new Set(slideIds));
    if (uniqueSlideIds.length === 0) return;
    saveToHistory();
    const nextIndex = rotationGroups.length + 1;
    const group: RotationGroup = {
      id: `rotation-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: `Rotation Group ${nextIndex}`,
      slideIds: uniqueSlideIds,
      intervalSeconds: 12,
      mode: 'loop',
      loop: true,
      stopOnInteraction: true,
      transition: 'fade',
    };
    setPresentation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rotationGroups: [...(prev.rotationGroups || []), group],
      };
    });
    setActiveRotationGroupId(group.id);
  }, [presentation, rotationGroups.length, saveToHistory]);

  const updateRotationGroup = useCallback((groupId: string, updates: Partial<RotationGroup>) => {
    if (!presentation) return;
    setPresentation(prev => {
      if (!prev) return prev;
      const nextGroups = (prev.rotationGroups || []).map(group =>
        group.id === groupId ? { ...group, ...updates } : group
      );
      return { ...prev, rotationGroups: nextGroups };
    });
  }, [presentation]);

  const deleteRotationGroup = useCallback((groupId: string) => {
    if (!presentation) return;
    saveToHistory();
    setPresentation(prev => {
      if (!prev) return prev;
      const nextGroups = (prev.rotationGroups || []).filter(group => group.id !== groupId);
      return { ...prev, rotationGroups: nextGroups };
    });
    setActiveRotationGroupId(prev => (prev === groupId ? null : prev));
  }, [presentation, saveToHistory]);

  const replaceRotationGroupSlides = useCallback((groupId: string, slideIds: string[]) => {
    const uniqueSlideIds = Array.from(new Set(slideIds));
    updateRotationGroup(groupId, { slideIds: uniqueSlideIds });
  }, [updateRotationGroup]);

  const addSlidesToRotationGroup = useCallback((groupId: string, slideIds: string[]) => {
    if (!presentation || slideIds.length === 0) return;
    const group = rotationGroups.find(item => item.id === groupId);
    if (!group) return;
    const nextIds = [...group.slideIds];
    for (const slideId of slideIds) {
      if (!nextIds.includes(slideId)) {
        nextIds.push(slideId);
      }
    }
    updateRotationGroup(groupId, { slideIds: nextIds });
  }, [presentation, rotationGroups, updateRotationGroup]);

  const removeSlideFromRotationGroup = useCallback((groupId: string, slideId: string) => {
    const group = rotationGroups.find(item => item.id === groupId);
    if (!group) return;
    const nextIds = group.slideIds.filter(id => id !== slideId);
    updateRotationGroup(groupId, { slideIds: nextIds });
  }, [rotationGroups, updateRotationGroup]);

  const moveRotationGroupSlide = useCallback((groupId: string, index: number, direction: -1 | 1) => {
    const group = rotationGroups.find(item => item.id === groupId);
    if (!group) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= group.slideIds.length) return;
    const nextIds = [...group.slideIds];
    const [moved] = nextIds.splice(index, 1);
    nextIds.splice(targetIndex, 0, moved);
    updateRotationGroup(groupId, { slideIds: nextIds });
  }, [rotationGroups, updateRotationGroup]);

  useEffect(() => {
    if (!presentation || rotationGroups.length === 0) return;
    const slideIdSet = new Set(presentation.slides.map(slide => slide.id));
    let changed = false;
    const nextGroups = rotationGroups
      .map(group => {
        const nextIds = group.slideIds.filter(id => slideIdSet.has(id));
        if (nextIds.length !== group.slideIds.length) changed = true;
        return nextIds.length === group.slideIds.length ? group : { ...group, slideIds: nextIds };
      })
      .filter(group => {
        if (group.slideIds.length === 0) {
          changed = true;
          return false;
        }
        return true;
      });
    if (changed) {
      setPresentation(prev => (prev ? { ...prev, rotationGroups: nextGroups } : prev));
      if (activeRotationGroupId && !nextGroups.some(group => group.id === activeRotationGroupId)) {
        setActiveRotationGroupId(nextGroups[0]?.id || null);
      }
    }
  }, [presentation, rotationGroups, activeRotationGroupId]);

  useEffect(() => {
    if (!showRotationDialog) return;
    if (!activeRotationGroupId && rotationGroups.length > 0) {
      setActiveRotationGroupId(rotationGroups[0].id);
    }
  }, [showRotationDialog, activeRotationGroupId, rotationGroups]);

  useEffect(() => {
    if (!presentation) return;
    setRotationSelectionIds(prev => {
      const validIds = prev.filter(id => presentation.slides.some(slide => slide.id === id));
      return validIds;
    });
  }, [presentation]);

  const slideIndexById = useMemo(() => {
    if (!presentation) return new Map<string, number>();
    return new Map(presentation.slides.map((slide, index) => [slide.id, index]));
  }, [presentation]);

  const slideById = useMemo(() => {
    if (!presentation) return new Map<string, Slide>();
    return new Map(presentation.slides.map(slide => [slide.id, slide]));
  }, [presentation]);

  const toggleRotationSelection = useCallback((slideId: string) => {
    setRotationSelectionIds(prev => (
      prev.includes(slideId) ? prev.filter(id => id !== slideId) : [...prev, slideId]
    ));
  }, []);

  const selectAllRotationSlides = useCallback(() => {
    if (!presentation) return;
    setRotationSelectionIds(presentation.slides.map(slide => slide.id));
  }, [presentation]);

  const clearRotationSelection = useCallback(() => {
    setRotationSelectionIds([]);
  }, []);

  const layoutTheme = useMemo(() => {
    return LAYOUT_THEMES.find(theme => theme.id === layoutThemeId) || LAYOUT_THEMES[0];
  }, [layoutThemeId]);

  const getLayoutContent = useCallback((slide: Slide | null): LayoutContent => {
    if (!slide) return {};
    const textElements = (slide.elements || []).filter(el => el.type === 'text' || el.type === 'verse');
    const imageElement = (slide.elements || []).find(el => el.type === 'image' && el.imageUrl);
    const [title, subtitle, body, body2] = textElements.map(el => el.content);
    return {
      title,
      subtitle,
      body,
      body2,
      imageUrl: imageElement?.imageUrl,
    };
  }, []);

  const applyLayout = useCallback((layoutId: LayoutTemplate['id']) => {
    if (!presentation) return;
    const template = LAYOUT_TEMPLATES.find(layout => layout.id === layoutId);
    if (!template || !layoutTheme) return;

    const content = getLayoutContent(currentSlide);
    const { background, elements } = template.build(layoutTheme, content);
    const primaryElementId = elements.find(el => el.type === 'text')?.id || null;

    saveToHistory();
    if (layoutTarget === 'current') {
      setPresentation(prev => {
        if (!prev) return prev;
        const newSlides = [...prev.slides];
        newSlides[currentSlideIndex] = {
          ...newSlides[currentSlideIndex],
          background,
          elements,
        };
        return { ...prev, slides: newSlides };
      });
      setSelectedElementId(primaryElementId);
      return;
    }

    const newSlide: Slide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      background,
      elements,
      notes: '',
    };
    const insertIndex = Math.min(currentSlideIndex + 1, presentation.slides.length);
    setPresentation(prev => {
      if (!prev) return prev;
      const slides = [...prev.slides];
      slides.splice(insertIndex, 0, newSlide);
      return { ...prev, slides };
    });
    setCurrentSlideIndex(insertIndex);
    setSelectedElementId(primaryElementId);
  }, [
    presentation,
    currentSlide,
    currentSlideIndex,
    layoutTheme,
    layoutTarget,
    getLayoutContent,
    saveToHistory,
  ]);

  // Element operations
  const addElement = useCallback((type: SlideElement['type'], content = '', extraData?: Partial<SlideElement>) => {
    if (!presentation) return;
    saveToHistory();

    const isImage = type === 'image';
    const newElement: SlideElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: 100,
      y: 100,
      width: isImage ? 400 : type === 'text' || type === 'verse' ? 400 : 200,
      height: isImage ? 300 : type === 'text' || type === 'verse' ? 100 : 200,
      content: content || (type === 'text' ? 'Click to edit' : ''),
      imageUrl: extraData?.imageUrl,
      style: {
        fontFamily: 'Instrument Sans',
        fontSize: type === 'verse' ? 32 : 24,
        fontWeight: '400',
        color: '#ffffff',
        textAlign: 'center',
        verticalAlign: 'middle',
        opacity: 1,
        borderRadius: isImage ? 8 : 0,
        padding: isImage ? 0 : 16,
        objectFit: 'cover',
      },
      ...extraData,
    };

    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: [...(newSlides[currentSlideIndex].elements || []), newElement],
      };
      return { ...prev, slides: newSlides };
    });

    setSelectedElementId(newElement.id);
  }, [presentation, currentSlideIndex, saveToHistory]);

  const updateElement = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    if (!presentation) return;

    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      const elements = newSlides[currentSlideIndex].elements || [];
      const idx = elements.findIndex(e => e.id === elementId);
      if (idx === -1) return prev;
      
      elements[idx] = { ...elements[idx], ...updates };
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], elements };
      return { ...prev, slides: newSlides };
    });
  }, [presentation, currentSlideIndex]);

  const updateElementStyle = useCallback((elementId: string, styleUpdates: Partial<SlideElement['style']>) => {
    if (!presentation) return;

    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      const elements = newSlides[currentSlideIndex].elements || [];
      const idx = elements.findIndex(e => e.id === elementId);
      if (idx === -1) return prev;
      
      elements[idx] = { 
        ...elements[idx], 
        style: { ...elements[idx].style, ...styleUpdates } 
      };
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], elements };
      return { ...prev, slides: newSlides };
    });
  }, [presentation, currentSlideIndex]);

  const deleteSelection = useCallback(() => {
    if (!presentation || !currentSlide || selectedElements.length === 0) return;
    saveToHistory();

    const ids = new Set(selectedElements.map(el => el.id));
    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      const elements = (newSlides[currentSlideIndex].elements || []).filter(el => !ids.has(el.id));
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], elements };
      return { ...prev, slides: newSlides };
    });
    setSelectedElementId(null);
  }, [presentation, currentSlide, selectedElements, currentSlideIndex, saveToHistory]);

  const duplicateSelection = useCallback(() => {
    if (!presentation || !currentSlide || selectedElements.length === 0) return;
    saveToHistory();

    const baseId = Date.now();
    const newElements = selectedElements.map((element, index) => ({
      ...JSON.parse(JSON.stringify(element)),
      id: `el-${baseId}-${Math.random().toString(36).substr(2, 9)}-${index}`,
      x: element.x + 20,
      y: element.y + 20,
    }));

    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: [...(newSlides[currentSlideIndex].elements || []), ...newElements],
      };
      return { ...prev, slides: newSlides };
    });
    setSelectedElementId(newElements.length === 1 ? newElements[0].id : ALL_SELECTION_ID);
  }, [presentation, currentSlide, selectedElements, currentSlideIndex, saveToHistory]);

  const selectAllElements = useCallback(() => {
    if (!currentSlide || (currentSlide.elements || []).length === 0) return;
    setSelectedElementId(ALL_SELECTION_ID);
  }, [currentSlide]);

  const copySelection = useCallback(() => {
    if (selectedElements.length === 0) return;
    const payload = selectedElements.length === 1 ? selectedElements[0] : selectedElements;
    navigator.clipboard.writeText(JSON.stringify(payload));
  }, [selectedElements]);

  const cutSelection = useCallback(() => {
    if (selectedElements.length === 0) return;
    copySelection();
    deleteSelection();
  }, [selectedElements, copySelection, deleteSelection]);

  const pasteSelection = useCallback(async () => {
    if (!presentation) return;
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      let elements: SlideElement[] = [];
      if (Array.isArray(parsed)) {
        elements = parsed;
      } else if (parsed && typeof parsed === 'object' && 'type' in parsed && 'style' in parsed) {
        elements = [parsed as SlideElement];
      }
      if (elements.length === 0) return;

      saveToHistory();
      const baseId = Date.now();
      const newElements = elements.map((element, index) => ({
        ...JSON.parse(JSON.stringify(element)),
        id: `el-${baseId}-${Math.random().toString(36).substr(2, 9)}-${index}`,
        x: Math.max(0, element.x + 20),
        y: Math.max(0, element.y + 20),
      }));

      setPresentation(prev => {
        if (!prev) return prev;
        const newSlides = [...prev.slides];
        newSlides[currentSlideIndex] = {
          ...newSlides[currentSlideIndex],
          elements: [...(newSlides[currentSlideIndex].elements || []), ...newElements],
        };
        return { ...prev, slides: newSlides };
      });
      setSelectedElementId(newElements.length === 1 ? newElements[0].id : ALL_SELECTION_ID);
    } catch {}
  }, [presentation, currentSlideIndex, saveToHistory]);

  const copyElementStyle = useCallback(() => {
    if (!selectedElement) return;
    setCopiedStyle(selectedElement.style || null);
  }, [selectedElement, setCopiedStyle]);

  const pasteElementStyle = useCallback(() => {
    if (!presentation || !copiedStyle || selectedElements.length === 0) return;
    saveToHistory();

    const ids = new Set(selectedElements.map(el => el.id));
    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      const elements = (newSlides[currentSlideIndex].elements || []).map(el => {
        if (!ids.has(el.id)) return el;
        return {
          ...el,
          style: { ...el.style, ...copiedStyle },
        };
      });
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], elements };
      return { ...prev, slides: newSlides };
    });
  }, [presentation, copiedStyle, selectedElements, currentSlideIndex, saveToHistory]);

  const setLockSelection = useCallback((locked: boolean) => {
    if (!presentation || selectedElements.length === 0) return;
    saveToHistory();

    const ids = new Set(selectedElements.map(el => el.id));
    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      const elements = (newSlides[currentSlideIndex].elements || []).map(el => {
        if (!ids.has(el.id)) return el;
        return { ...el, locked };
      });
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], elements };
      return { ...prev, slides: newSlides };
    });
  }, [presentation, selectedElements, currentSlideIndex, saveToHistory]);

  const toggleLockSelection = useCallback(() => {
    if (selectedElements.length === 0) return;
    const shouldLock = selectedElements.some(el => !el.locked);
    setLockSelection(shouldLock);
  }, [selectedElements, setLockSelection]);

  const nudgeSelection = useCallback((direction: string, delta: number) => {
    if (!presentation || selectedElements.length === 0) return;

    const ids = new Set(selectedElements.map(el => el.id));
    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      const elements = (newSlides[currentSlideIndex].elements || []).map(el => {
        if (!ids.has(el.id)) return el;
        switch (direction) {
          case 'ArrowUp':
            return { ...el, y: el.y - delta };
          case 'ArrowDown':
            return { ...el, y: el.y + delta };
          case 'ArrowLeft':
            return { ...el, x: el.x - delta };
          case 'ArrowRight':
            return { ...el, x: el.x + delta };
          default:
            return el;
        }
      });
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], elements };
      return { ...prev, slides: newSlides };
    });
  }, [presentation, selectedElements, currentSlideIndex]);

  // Image operations
  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        addElement('image', file.name, { imageUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  }, [addElement]);

  const handleImageUrlInsert = useCallback((url: string) => {
    addElement('image', url, { imageUrl: url });
  }, [addElement]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
      setShowImageDialog(false);
    }
  }, [handleImageUpload]);

  // Arrange operations
  const bringForward = useCallback(() => {
    if (!selectedElementId || !currentSlide) return;
    const elements = currentSlide.elements || [];
    const idx = elements.findIndex(e => e.id === selectedElementId);
    if (idx === -1 || idx === elements.length - 1) return;
    
    saveToHistory();
    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      const els = [...newSlides[currentSlideIndex].elements];
      [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], elements: els };
      return { ...prev, slides: newSlides };
    });
  }, [selectedElementId, currentSlide, currentSlideIndex, saveToHistory]);

  const sendBackward = useCallback(() => {
    if (!selectedElementId || !currentSlide) return;
    const elements = currentSlide.elements || [];
    const idx = elements.findIndex(e => e.id === selectedElementId);
    if (idx <= 0) return;
    
    saveToHistory();
    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      const els = [...newSlides[currentSlideIndex].elements];
      [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], elements: els };
      return { ...prev, slides: newSlides };
    });
  }, [selectedElementId, currentSlide, currentSlideIndex, saveToHistory]);

  const bringToFront = useCallback(() => {
    if (!selectedElementId || !currentSlide) return;
    const elements = currentSlide.elements || [];
    const idx = elements.findIndex(e => e.id === selectedElementId);
    if (idx === -1 || idx === elements.length - 1) return;
    
    saveToHistory();
    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      const els = [...newSlides[currentSlideIndex].elements];
      const [el] = els.splice(idx, 1);
      els.push(el);
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], elements: els };
      return { ...prev, slides: newSlides };
    });
  }, [selectedElementId, currentSlide, currentSlideIndex, saveToHistory]);

  const sendToBack = useCallback(() => {
    if (!selectedElementId || !currentSlide) return;
    const elements = currentSlide.elements || [];
    const idx = elements.findIndex(e => e.id === selectedElementId);
    if (idx <= 0) return;
    
    saveToHistory();
    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      const els = [...newSlides[currentSlideIndex].elements];
      const [el] = els.splice(idx, 1);
      els.unshift(el);
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], elements: els };
      return { ...prev, slides: newSlides };
    });
  }, [selectedElementId, currentSlide, currentSlideIndex, saveToHistory]);

  // Slide operations
  const addSlide = useCallback(() => {
    if (!presentation) return;
    saveToHistory();

    const newSlide = createDefaultSlide();
    const nextIndex = presentation.slides.length;
    setPresentation(prev => {
      if (!prev) return prev;
      return { ...prev, slides: [...prev.slides, newSlide] };
    });
    setCurrentSlideIndex(nextIndex);
    setSelectedSlideIds([newSlide.id]);
    setSlideSelectionAnchor(nextIndex);
  }, [presentation, saveToHistory]);

  const duplicateSlide = useCallback((index: number) => {
    if (!presentation) return;
    saveToHistory();

    const slide = presentation.slides[index];
    const newSlide = {
      ...JSON.parse(JSON.stringify(slide)),
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    const nextIndex = index + 1;

    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      newSlides.splice(nextIndex, 0, newSlide);
      return { ...prev, slides: newSlides };
    });
    setCurrentSlideIndex(nextIndex);
    setSelectedSlideIds([newSlide.id]);
    setSlideSelectionAnchor(nextIndex);
  }, [presentation, saveToHistory]);

  const deleteSlide = useCallback((index: number) => {
    if (!presentation || presentation.slides.length <= 1) return;
    saveToHistory();

    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = prev.slides.filter((_, i) => i !== index);
      return { ...prev, slides: newSlides };
    });
    const nextIndex = currentSlideIndex >= index ? Math.max(currentSlideIndex - 1, 0) : currentSlideIndex;
    setCurrentSlideIndex(nextIndex);
    const nextSlideId = presentation.slides.filter((_, i) => i !== index)[nextIndex]?.id;
    if (nextSlideId) {
      setSelectedSlideIds([nextSlideId]);
      setSlideSelectionAnchor(nextIndex);
    }
  }, [presentation, currentSlideIndex, saveToHistory]);

  const updateSlideBackground = useCallback((background: Slide['background']) => {
    if (!presentation) return;
    saveToHistory();

    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], background };
      return { ...prev, slides: newSlides };
    });
  }, [presentation, currentSlideIndex, saveToHistory]);

  const updateSlideNotes = useCallback((notes: string) => {
    if (!presentation) return;
    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], notes };
      return { ...prev, slides: newSlides };
    });
  }, [presentation, currentSlideIndex]);

  const SLIDE_WIDTH = 960;
  const SLIDE_HEIGHT = 540;
  const GRID_SIZE = 20;
  const GUIDE_SNAP_THRESHOLD = 6;
  const snapValue = useCallback(
    (value: number) => (snapToGrid ? Math.round(value / GRID_SIZE) * GRID_SIZE : value),
    [snapToGrid]
  );
  const clampSize = useCallback(
    (value: number) => {
      const clamped = Math.max(50, value);
      if (!snapToGrid) return clamped;
      return Math.max(50, Math.round(clamped / GRID_SIZE) * GRID_SIZE);
    },
    [snapToGrid]
  );

  const clearGuides = useCallback(() => {
    setActiveGuides({ vertical: [], horizontal: [], spacing: [] });
  }, []);

  useEffect(() => {
    clearGuides();
  }, [currentSlideIndex, clearGuides]);

  const getDragSnap = useCallback(
    (
      rect: { x: number; y: number; width: number; height: number },
      elements: SlideElement[],
      selectedId: string
    ) => {
      const guides: GuideState = { vertical: [], horizontal: [], spacing: [] };
      let next = { ...rect };

      const rectBounds = (r: typeof rect) => ({
        left: r.x,
        right: r.x + r.width,
        top: r.y,
        bottom: r.y + r.height,
        centerX: r.x + r.width / 2,
        centerY: r.y + r.height / 2,
        width: r.width,
        height: r.height,
      });

      const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
        Math.min(aEnd, bEnd) - Math.max(aStart, bStart) > 0;

      const others = elements
        .filter(el => el.id !== selectedId)
        .map(el => ({
          left: el.x,
          right: el.x + el.width,
          top: el.y,
          bottom: el.y + el.height,
          centerX: el.x + el.width / 2,
          centerY: el.y + el.height / 2,
        }));

      const xTargets = [0, SLIDE_WIDTH / 2, SLIDE_WIDTH];
      const yTargets = [0, SLIDE_HEIGHT / 2, SLIDE_HEIGHT];

      others.forEach(o => {
        xTargets.push(o.left, o.centerX, o.right);
        yTargets.push(o.top, o.centerY, o.bottom);
      });

      const bounds = rectBounds(next);
      const xCandidates: { delta: number; line: number }[] = [];
      const yCandidates: { delta: number; line: number }[] = [];

      xTargets.forEach(target => {
        xCandidates.push({ delta: target - bounds.left, line: target });
        xCandidates.push({ delta: target - bounds.centerX, line: target });
        xCandidates.push({ delta: target - bounds.right, line: target });
      });

      yTargets.forEach(target => {
        yCandidates.push({ delta: target - bounds.top, line: target });
        yCandidates.push({ delta: target - bounds.centerY, line: target });
        yCandidates.push({ delta: target - bounds.bottom, line: target });
      });

      const pickBest = (candidates: { delta: number; line: number }[]) =>
        candidates
          .filter(candidate => Math.abs(candidate.delta) <= GUIDE_SNAP_THRESHOLD)
          .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))[0];

      const bestX = pickBest(xCandidates);
      if (bestX) {
        next.x += bestX.delta;
        guides.vertical = [bestX.line];
      }

      const bestY = pickBest(yCandidates);
      if (bestY) {
        next.y += bestY.delta;
        guides.horizontal = [bestY.line];
      }

      let snappedX = !!bestX;
      let snappedY = !!bestY;

      const postBounds = rectBounds(next);

      if (!snappedX) {
        let leftNeighbor: typeof others[number] | null = null;
        let rightNeighbor: typeof others[number] | null = null;
        for (const other of others) {
          if (!overlaps(other.top, other.bottom, postBounds.top, postBounds.bottom)) continue;
          if (other.right <= postBounds.left) {
            if (!leftNeighbor || other.right > leftNeighbor.right) leftNeighbor = other;
          } else if (other.left >= postBounds.right) {
            if (!rightNeighbor || other.left < rightNeighbor.left) rightNeighbor = other;
          }
        }

        if (leftNeighbor && rightNeighbor) {
          const leftGap = postBounds.left - leftNeighbor.right;
          const rightGap = rightNeighbor.left - postBounds.right;
          if (leftGap >= 0 && rightGap >= 0 && Math.abs(leftGap - rightGap) <= GUIDE_SNAP_THRESHOLD) {
            const targetGap = (leftGap + rightGap) / 2;
            const delta = leftNeighbor.right + targetGap - postBounds.left;
            next.x += delta;
            snappedX = true;
            const snappedLeft = postBounds.left + delta;
            const snappedRight = snappedLeft + postBounds.width;
            guides.spacing.push(
              { orientation: 'horizontal', x: leftNeighbor.right, y: postBounds.centerY, length: targetGap },
              { orientation: 'horizontal', x: snappedRight, y: postBounds.centerY, length: targetGap }
            );
          }
        }
      }

      if (!snappedY) {
        let topNeighbor: typeof others[number] | null = null;
        let bottomNeighbor: typeof others[number] | null = null;
        for (const other of others) {
          if (!overlaps(other.left, other.right, postBounds.left, postBounds.right)) continue;
          if (other.bottom <= postBounds.top) {
            if (!topNeighbor || other.bottom > topNeighbor.bottom) topNeighbor = other;
          } else if (other.top >= postBounds.bottom) {
            if (!bottomNeighbor || other.top < bottomNeighbor.top) bottomNeighbor = other;
          }
        }

        if (topNeighbor && bottomNeighbor) {
          const topGap = postBounds.top - topNeighbor.bottom;
          const bottomGap = bottomNeighbor.top - postBounds.bottom;
          if (topGap >= 0 && bottomGap >= 0 && Math.abs(topGap - bottomGap) <= GUIDE_SNAP_THRESHOLD) {
            const targetGap = (topGap + bottomGap) / 2;
            const delta = topNeighbor.bottom + targetGap - postBounds.top;
            next.y += delta;
            snappedY = true;
            const snappedTop = postBounds.top + delta;
            const snappedBottom = snappedTop + postBounds.height;
            guides.spacing.push(
              { orientation: 'vertical', x: postBounds.centerX, y: topNeighbor.bottom, length: targetGap },
              { orientation: 'vertical', x: postBounds.centerX, y: snappedBottom, length: targetGap }
            );
          }
        }
      }

      if (!snappedX && snapToGrid) {
        next.x = Math.round(next.x / GRID_SIZE) * GRID_SIZE;
      }
      if (!snappedY && snapToGrid) {
        next.y = Math.round(next.y / GRID_SIZE) * GRID_SIZE;
      }

      return { rect: next, guides };
    },
    [GRID_SIZE, GUIDE_SNAP_THRESHOLD, SLIDE_HEIGHT, SLIDE_WIDTH, snapToGrid]
  );

  // Drag and resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string, handle?: string) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
    clearGuides();
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
    saveToHistory();
  }, [clearGuides, saveToHistory]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selectedElementId || !selectedElement) return;

    const scale = zoom / 100;
    const deltaX = (e.clientX - dragStart.x) / scale;
    const deltaY = (e.clientY - dragStart.y) / scale;

    if (isDragging) {
      const nextX = Math.max(0, selectedElement.x + deltaX);
      const nextY = Math.max(0, selectedElement.y + deltaY);
      const { rect, guides } = getDragSnap(
        { x: nextX, y: nextY, width: selectedElement.width, height: selectedElement.height },
        currentSlide?.elements || [],
        selectedElementId
      );
      updateElement(selectedElementId, { x: rect.x, y: rect.y });
      setActiveGuides(guides);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isResizing && resizeHandle) {
      let updates: Partial<SlideElement> = {};
      
      switch (resizeHandle) {
        case 'se':
          updates = {
            width: clampSize(selectedElement.width + deltaX),
            height: clampSize(selectedElement.height + deltaY),
          };
          break;
        case 'sw':
          updates = {
            x: snapValue(selectedElement.x + deltaX),
            width: clampSize(selectedElement.width - deltaX),
            height: clampSize(selectedElement.height + deltaY),
          };
          break;
        case 'ne':
          updates = {
            y: snapValue(selectedElement.y + deltaY),
            width: clampSize(selectedElement.width + deltaX),
            height: clampSize(selectedElement.height - deltaY),
          };
          break;
        case 'nw':
          updates = {
            x: snapValue(selectedElement.x + deltaX),
            y: snapValue(selectedElement.y + deltaY),
            width: clampSize(selectedElement.width - deltaX),
            height: clampSize(selectedElement.height - deltaY),
          };
          break;
        case 'e':
          updates = { width: clampSize(selectedElement.width + deltaX) };
          break;
        case 'w':
          updates = {
            x: snapValue(selectedElement.x + deltaX),
            width: clampSize(selectedElement.width - deltaX),
          };
          break;
        case 'n':
          updates = {
            y: snapValue(selectedElement.y + deltaY),
            height: clampSize(selectedElement.height - deltaY),
          };
          break;
        case 's':
          updates = { height: clampSize(selectedElement.height + deltaY) };
          break;
      }
      
      updateElement(selectedElementId, updates);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [
    selectedElementId,
    selectedElement,
    isDragging,
    isResizing,
    resizeHandle,
    dragStart,
    zoom,
    updateElement,
    snapValue,
    clampSize,
    getDragSnap,
    currentSlide,
  ]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    clearGuides();
  }, [clearGuides]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElementId(null);
      setEditingTextId(null);
      clearGuides();
    }
  }, [clearGuides]);

  const handleElementDoubleClick = useCallback((elementId: string, type: string) => {
    if (type === 'text' || type === 'verse') {
      setEditingTextId(elementId);
      setTimeout(() => textInputRef.current?.focus(), 0);
    }
  }, []);

  const [showPresentDialog, setShowPresentDialog] = useState(false);

  const startPresentation = useCallback((mode: 'window' | 'fullscreen' | 'newWindow' = 'newWindow') => {
    if (!id) return;
    
    if (mode === 'fullscreen') {
      // Present in current window fullscreen
      navigate(`/present/${id}`);
      setTimeout(() => {
        document.documentElement.requestFullscreen?.();
      }, 100);
    } else if (mode === 'window') {
      // Present in current tab (not fullscreen)
      navigate(`/present/${id}`);
    } else {
      // Open in new window (for second monitor)
      const width = window.screen.availWidth;
      const height = window.screen.availHeight;
      window.open(
        `/present/${id}`,
        'SanctuaryPresenter',
        `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no`
      );
    }
    setShowPresentDialog(false);
  }, [id, navigate]);

  const handlePresentClick = useCallback(() => {
    setShowPresentDialog(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditable = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;
      if (isEditable && e.key !== 'Escape') return;

      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (!isMod && !e.altKey) {
        if (key === 't') {
          e.preventDefault();
          addElement('text');
          return;
        }
        if (key === 'i') {
          e.preventDefault();
          setShowImageDialog(true);
          return;
        }
        if (key === 'v') {
          e.preventDefault();
          setShowBibleDialog(true);
          return;
        }
        if (key === 's') {
          e.preventDefault();
          setShowSongDialog(true);
          return;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElements.length > 0) {
          e.preventDefault();
          deleteSelection();
        }
        return;
      }

      if (isMod && e.shiftKey && key === 'c') {
        if (selectedElement) {
          e.preventDefault();
          copyElementStyle();
        }
        return;
      }

      if (isMod && e.shiftKey && key === 'v') {
        if (copiedStyle && selectedElements.length > 0) {
          e.preventDefault();
          pasteElementStyle();
        }
        return;
      }

      if (isMod && key === 'c') {
        if (selectedElements.length > 0) {
          e.preventDefault();
          copySelection();
        }
        return;
      }

      if (isMod && key === 'x') {
        if (selectedElements.length > 0) {
          e.preventDefault();
          cutSelection();
        }
        return;
      }

      if (isMod && key === 'v') {
        e.preventDefault();
        pasteSelection();
        return;
      }

      if (isMod && key === 'a') {
        e.preventDefault();
        selectAllElements();
        return;
      }

      if (isMod && key === 'd') {
        e.preventDefault();
        if (selectedElements.length > 0) {
          duplicateSelection();
        } else {
          duplicateSlide(currentSlideIndex);
        }
        return;
      }

      if (isMod && key === 'm') {
        e.preventDefault();
        addSlide();
        return;
      }

      if (isMod && key === 'b') {
        if (selectedElement && (selectedElement.type === 'text' || selectedElement.type === 'verse' || selectedElement.type === 'shape')) {
          e.preventDefault();
          updateElementStyle(selectedElement.id, {
            fontWeight: selectedElement.style.fontWeight === '700' ? '400' : '700',
          });
        }
        return;
      }

      if (isMod && key === 'i') {
        if (selectedElement && (selectedElement.type === 'text' || selectedElement.type === 'verse' || selectedElement.type === 'shape')) {
          e.preventDefault();
          updateElementStyle(selectedElement.id, {
            fontStyle: selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic',
          });
        }
        return;
      }

      if (isMod && key === 'u') {
        if (selectedElement && (selectedElement.type === 'text' || selectedElement.type === 'verse' || selectedElement.type === 'shape')) {
          e.preventDefault();
          updateElementStyle(selectedElement.id, {
            textDecoration: selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline',
          });
        }
        return;
      }

      if (isMod && e.key === "'") {
        e.preventDefault();
        setShowGrid(!showGrid);
        return;
      }

      if (isMod && e.shiftKey && key === 'p') {
        e.preventDefault();
        setShowPropertiesPanel(!showPropertiesPanel);
        return;
      }

      if (isMod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (isMod && key === 'enter') {
        e.preventDefault();
        startPresentation();
        return;
      }

      if (e.key === 'Escape') {
        setSelectedElementId(null);
        setEditingTextId(null);
        return;
      }

      if (selectedElements.length === 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (!presentation) return;
        e.preventDefault();
        const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = Math.min(
          Math.max(currentSlideIndex + delta, 0),
          presentation.slides.length - 1
        );
        if (nextIndex !== currentSlideIndex) {
          selectSlideByIndex(nextIndex, { range: e.shiftKey });
        }
        return;
      }

      // Arrow key nudging
      if (selectedElements.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        nudgeSelection(e.key, delta);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedElements,
    selectedElement,
    currentSlideIndex,
    presentation,
    copiedStyle,
    showGrid,
    showPropertiesPanel,
    deleteSelection,
    duplicateSelection,
    duplicateSlide,
    addSlide,
    addElement,
    copySelection,
    cutSelection,
    pasteSelection,
    selectAllElements,
    copyElementStyle,
    pasteElementStyle,
    updateElementStyle,
    redo,
    undo,
    startPresentation,
    nudgeSelection,
    selectSlideByIndex,
    setShowGrid,
    setShowPropertiesPanel,
    setShowImageDialog,
    setShowBibleDialog,
    setShowSongDialog,
  ]);

  // Song insertion
  const handleInsertSong = useCallback((song: Song, section?: SongSection) => {
    if (!presentation || !currentSlide) return;
    saveToHistory();

    const sections = section
      ? [section]
      : song.sections?.length
        ? song.sections
        : [{ type: 'verse', label: 'Lyrics', lyrics: song.lyrics }];
    const background = { ...currentSlide.background };
    const baseId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newSlides: Slide[] = sections.map((part, index) => ({
      id: `slide-${baseId}-${index}`,
      background: { ...background },
      elements: [
        {
          id: `el-${baseId}-${index}`,
          type: 'text',
          x: 80,
          y: 110,
          width: 800,
          height: 320,
          content: part.lyrics,
          style: {
            fontFamily: 'Instrument Sans',
            fontSize: 36,
            fontWeight: '400',
            color: '#ffffff',
            textAlign: 'center',
            verticalAlign: 'middle',
            padding: 24,
          },
        },
      ],
    }));

    const insertIndex = Math.min(currentSlideIndex + 1, presentation.slides.length);
    setPresentation(prev => {
      if (!prev) return prev;
      const slides = [...prev.slides];
      slides.splice(insertIndex, 0, ...newSlides);
      return { ...prev, slides };
    });
    setCurrentSlideIndex(insertIndex);
    setShowSongDialog(false);
  }, [presentation, currentSlide, currentSlideIndex, saveToHistory]);

  // Bible insertion
  const handleInsertVerse = useCallback((book: string, chapter: number, verse: number, text: string, translation: string) => {
    const content = `"${text}"\n— ${book} ${chapter}:${verse} (${translation})`;
    addElement('verse', content, {
      verseData: { book, chapter, verse, translation },
      style: {
        fontFamily: 'Newsreader',
        fontSize: 28,
        fontWeight: '400',
        color: '#ffffff',
        textAlign: 'center',
        verticalAlign: 'middle',
        padding: 24,
      },
      width: 600,
      height: 200,
    });
    setShowBibleDialog(false);
  }, [addElement]);

  if (!presentation || !currentSlide) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const getBackgroundStyle = (bg: Slide['background']) => {
    if (bg.type === 'gradient') return { background: bg.value };
    if (bg.type === 'image') return { backgroundImage: `url(${bg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    return { backgroundColor: bg.value };
  };
  const canvasScale = zoom / 100;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Application Header with Menu Bar */}
      <header className="h-12 border-b bg-card flex items-center px-2 gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {isRenaming ? (
          <Input
            value={presentation.name}
            onChange={(e) => setPresentation(p => p ? { ...p, name: e.target.value } : p)}
            onBlur={() => setIsRenaming(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsRenaming(false)}
            className="w-48 h-7 text-sm font-medium"
            autoFocus
          />
        ) : (
          <button
            className="px-2 py-1 text-sm font-medium hover:bg-accent rounded-md transition-colors"
            onClick={() => setIsRenaming(true)}
          >
            {presentation.name}
          </button>
        )}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Menu Bar */}
        <EditorMenuBar
          // File
          onNew={() => {
            const newId = `pres-${Date.now()}`;
            localStorage.setItem(`presentation-${newId}`, JSON.stringify(createDefaultPresentation(newId)));
            navigate(`/presentations/${newId}`);
          }}
          onDuplicate={() => {
            if (!presentation) return;
            const newId = `pres-${Date.now()}`;
            const newPres = { ...presentation, id: newId, name: `${presentation.name} (Copy)` };
            localStorage.setItem(`presentation-${newId}`, JSON.stringify(newPres));
            navigate(`/presentations/${newId}`);
          }}
          onRename={() => setIsRenaming(true)}
          onExportPDF={() => window.print()}
          onExportPPTX={() => {}}
          onPrint={() => window.print()}
          
          // Edit
          onUndo={undo}
          onRedo={redo}
          onCut={cutSelection}
          onCopy={copySelection}
          onPaste={pasteSelection}
          onSelectAll={selectAllElements}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          hasSelection={selectedElements.length > 0}
          
          // View
          zoom={zoom}
          onZoomIn={() => setZoom(Math.min(200, zoom + 25))}
          onZoomOut={() => setZoom(Math.max(25, zoom - 25))}
          onResetZoom={() => setZoom(100)}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          showRulers={showRulers}
          onToggleRulers={() => setShowRulers(!showRulers)}
          snapToGrid={snapToGrid}
          onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
          showSpeakerNotes={showSpeakerNotes}
          onToggleSpeakerNotes={() => setShowSpeakerNotes(!showSpeakerNotes)}
          onFullscreen={() => document.documentElement.requestFullscreen?.()}
          onPresent={handlePresentClick}
          onPresenterView={() => id && navigate(`/presenter/${id}`)}
          
          // Insert
          onInsertText={() => addElement('text')}
          onInsertImage={() => setShowImageDialog(true)}
          onInsertShape={(shape) => addElement('shape', '', { 
            style: { 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderRadius: shape === 'circle' ? 999 : 0 
            } 
          })}
          onInsertVerse={() => setShowBibleDialog(true)}
          onInsertSong={() => setShowSongDialog(true)}
          onInsertSlide={addSlide}
          onChangeBackground={() => setShowBackgroundPicker(true)}
          
          // Slide
          onNewSlide={addSlide}
          onDuplicateSlide={() => duplicateSlide(currentSlideIndex)}
          onDeleteSlide={() => deleteSlide(currentSlideIndex)}
          onSkipSlide={() => {}}
          canDeleteSlide={presentation.slides.length > 1}
          
          // Arrange
          onBringForward={bringForward}
          onSendBackward={sendBackward}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onAlignLeft={() => selectedElementId && updateElement(selectedElementId, { x: 0 })}
          onAlignCenter={() => selectedElementId && selectedElement && updateElement(selectedElementId, { x: (SLIDE_WIDTH - selectedElement.width) / 2 })}
          onAlignRight={() => selectedElementId && selectedElement && updateElement(selectedElementId, { x: SLIDE_WIDTH - selectedElement.width })}
          onAlignTop={() => selectedElementId && updateElement(selectedElementId, { y: 0 })}
          onAlignMiddle={() => selectedElementId && selectedElement && updateElement(selectedElementId, { y: (SLIDE_HEIGHT - selectedElement.height) / 2 })}
          onAlignBottom={() => selectedElementId && selectedElement && updateElement(selectedElementId, { y: SLIDE_HEIGHT - selectedElement.height })}
          onDistributeH={() => {}}
          onDistributeV={() => {}}
          onGroup={() => {}}
          onUngroup={() => {}}
          onLock={() => setLockSelection(true)}
          onUnlock={() => setLockSelection(false)}
          
          // Help
          onShowShortcuts={() => setShowShortcutsDialog(true)}
          onShowHelp={() => window.open('/help', '_blank')}
        />

        <div className="flex-1" />

        {/* Right side controls */}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", showSpeakerNotes && "bg-muted")}
          onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
          title="Toggle Speaker Notes"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
          title="Toggle Properties Panel"
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        <Button onClick={handlePresentClick} size="sm" className="ml-2">
          <Play className="h-4 w-4 mr-1.5" />
          Present
        </Button>
      </header>

      {/* Formatting Toolbar */}
      <FormattingToolbar
        selectedElementType={selectedElement?.type || null}
        selectedElementId={selectedElementId}
        fontFamily={selectedElement?.style.fontFamily}
        fontSize={selectedElement?.style.fontSize}
        fontWeight={selectedElement?.style.fontWeight}
        textAlign={selectedElement?.style.textAlign}
        color={selectedElement?.style.color}
        backgroundColor={selectedElement?.style.backgroundColor}
        opacity={selectedElement?.style.opacity}
        borderRadius={selectedElement?.style.borderRadius}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={undo}
        onRedo={redo}
        onFontFamilyChange={(font) => selectedElement && updateElementStyle(selectedElement.id, { fontFamily: font })}
        onFontSizeChange={(size) => selectedElement && updateElementStyle(selectedElement.id, { fontSize: size })}
        onBoldToggle={() => selectedElement && updateElementStyle(selectedElement.id, { 
          fontWeight: selectedElement.style.fontWeight === '700' ? '400' : '700' 
        })}
        onItalicToggle={() => selectedElement && updateElementStyle(selectedElement.id, { 
          fontStyle: selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic' 
        })}
        onUnderlineToggle={() => selectedElement && updateElementStyle(selectedElement.id, { 
          textDecoration: selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline' 
        })}
        onTextAlignChange={(align) => selectedElement && updateElementStyle(selectedElement.id, { textAlign: align })}
        onTextColorChange={(color) => selectedElement && updateElementStyle(selectedElement.id, { color })}
        onFillColorChange={(color) => selectedElement && updateElementStyle(selectedElement.id, { backgroundColor: color })}
        onOpacityChange={(opacity) => selectedElement && updateElementStyle(selectedElement.id, { opacity })}
        onBorderRadiusChange={(radius) => selectedElement && updateElementStyle(selectedElement.id, { borderRadius: radius })}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onDuplicate={duplicateSelection}
        onDelete={deleteSelection}
        onLock={toggleLockSelection}
        onImageUpload={handleImageUpload}
        onImageUrlInsert={handleImageUrlInsert}
        zoom={zoom}
        onZoomIn={() => setZoom(Math.min(200, zoom + 25))}
        onZoomOut={() => setZoom(Math.max(25, zoom - 25))}
        onPresent={handlePresentClick}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Slide filmstrip */}
        <div className="w-48 border-r bg-card/50 flex flex-col shrink-0">
          <div className="p-2 border-b space-y-2">
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={addSlide}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
            <Popover open={showLayoutPicker} onOpenChange={setShowLayoutPicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Layouts
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] p-3" align="start">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Apply layout
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                    <button
                      className={cn(
                        "px-2.5 py-1 text-[11px] rounded-full transition-colors",
                        layoutTarget === 'current' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setLayoutTarget('current')}
                    >
                      Current
                    </button>
                    <button
                      className={cn(
                        "px-2.5 py-1 text-[11px] rounded-full transition-colors",
                        layoutTarget === 'new' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setLayoutTarget('new')}
                    >
                      New slide
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {LAYOUT_THEMES.map(theme => {
                    const swatchStyle = theme.background.type === 'gradient'
                      ? { backgroundImage: theme.background.value }
                      : { backgroundColor: theme.background.value };
                    return (
                      <button
                        key={theme.id}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-2 py-1 text-xs transition-colors",
                          layoutThemeId === theme.id ? "border-primary/60 bg-primary/5" : "border-border/60 hover:bg-muted"
                        )}
                        onClick={() => setLayoutThemeId(theme.id)}
                      >
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full border",
                            layoutThemeId === theme.id ? "border-primary/60 ring-2 ring-primary/30" : "border-border/60"
                          )}
                          style={swatchStyle}
                        />
                        {theme.name}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {LAYOUT_TEMPLATES.map(layout => {
                    const previewStyle = layoutTheme.background.type === 'gradient'
                      ? { backgroundImage: layoutTheme.background.value }
                      : { backgroundColor: layoutTheme.background.value };
                    const blocks = LAYOUT_PREVIEWS[layout.id];
                    return (
                      <button
                        key={layout.id}
                        className="group rounded-lg border border-border/60 p-2 text-left transition-colors hover:bg-muted/60"
                        onClick={() => {
                          applyLayout(layout.id);
                          setShowLayoutPicker(false);
                        }}
                      >
                        <div className="aspect-video rounded-md border border-border/40 overflow-hidden" style={previewStyle}>
                          <div className="relative h-full w-full">
                            {blocks.map((block, idx) => {
                              const blockColor = block.kind === 'accent'
                                ? layoutTheme.accent
                                : block.kind === 'image'
                                  ? layoutTheme.placeholderFill
                                  : layoutTheme.previewFill;
                              return (
                                <div
                                  key={`${layout.id}-${idx}`}
                                  className="absolute rounded-sm"
                                  style={{
                                    left: `${block.x}%`,
                                    top: `${block.y}%`,
                                    width: `${block.width}%`,
                                    height: `${block.height}%`,
                                    backgroundColor: blockColor,
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                        <div className="mt-2 space-y-0.5">
                          <div className="text-xs font-medium">{layout.name}</div>
                          <div className="text-[11px] text-muted-foreground">{layout.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={() => {
                setRotationSelectionIds(selectedSlideIds);
                setShowRotationDialog(true);
              }}
            >
              <span className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Rotation
              </span>
              <span className="text-[11px] text-muted-foreground">{rotationGroups.length}</span>
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {presentation.slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={cn(
                    "slide-thumbnail group",
                    selectedSlideIds.includes(slide.id) && "selected",
                    idx === currentSlideIndex && "active"
                  )}
                  onClick={(e) => {
                    selectSlideByIndex(idx, { range: e.shiftKey, toggle: e.metaKey || e.ctrlKey });
                  }}
                >
                  <div
                    className="aspect-video rounded"
                    style={getBackgroundStyle(slide.background)}
                  >
                    <div className="w-full h-full p-1">
                      {(slide.elements || []).slice(0, 3).map(el => (
                        <div
                          key={el.id}
                          className="text-[4px] text-white/60 truncate"
                          style={{ 
                            textAlign: el.style.textAlign || 'center',
                            fontFamily: el.style.fontFamily,
                          }}
                        >
                          {el.content?.substring(0, 30)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-1 text-[10px] text-muted-foreground bg-background/80 px-1 rounded">
                    {idx + 1}
                  </div>
                  {slide.notes?.trim() && (
                    <div className="absolute top-1 left-1 text-[10px] text-muted-foreground bg-background/80 px-1 rounded">
                      <MessageSquare className="h-3 w-3" />
                    </div>
                  )}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 bg-background/80">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-1" align="end">
                        <button
                          className="w-full px-2 py-1.5 text-left text-sm hover:bg-secondary rounded flex items-center gap-2"
                          onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }}
                        >
                          <Copy className="h-3 w-3" /> Duplicate
                        </button>
                        <button
                          className="w-full px-2 py-1.5 text-left text-sm hover:bg-destructive/10 text-destructive rounded flex items-center gap-2"
                          onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                          disabled={presentation.slides.length <= 1}
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Canvas area */}
        <div className={cn("flex-1 overflow-auto bg-muted/30 p-8", showGrid && "slide-canvas")}>
          <div className="flex flex-col items-center justify-center min-h-full gap-6">
            <div
              ref={canvasRef}
              className="relative shadow-2xl rounded-lg overflow-hidden"
              style={{
                width: `${960 * (zoom / 100)}px`,
                height: `${540 * (zoom / 100)}px`,
                ...getBackgroundStyle(currentSlide.background),
              }}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {activeGuides.vertical.map((position, idx) => (
                <div
                  key={`guide-v-${idx}`}
                  className="guide-line vertical"
                  style={{ left: position * canvasScale }}
                />
              ))}
              {activeGuides.horizontal.map((position, idx) => (
                <div
                  key={`guide-h-${idx}`}
                  className="guide-line horizontal"
                  style={{ top: position * canvasScale }}
                />
              ))}
              {activeGuides.spacing.map((guide, idx) => (
                <div
                  key={`guide-s-${idx}`}
                  className={cn("spacing-guide", guide.orientation === 'horizontal' ? "horizontal" : "vertical")}
                  style={
                    guide.orientation === 'horizontal'
                      ? {
                          left: guide.x * canvasScale,
                          top: guide.y * canvasScale,
                          width: guide.length * canvasScale,
                        }
                      : {
                          left: guide.x * canvasScale,
                          top: guide.y * canvasScale,
                          height: guide.length * canvasScale,
                        }
                  }
                />
              ))}
              {(currentSlide.elements || []).map((element) => (
                <div
                  key={element.id}
                  className={cn(
                    "absolute",
                    element.locked ? "cursor-not-allowed" : "cursor-move",
                    (selectedElementId === element.id || isAllSelected) && "ring-2 ring-primary ring-offset-1"
                  )}
                  style={{
                    left: element.x * (zoom / 100),
                    top: element.y * (zoom / 100),
                    width: element.width * (zoom / 100),
                    height: element.height * (zoom / 100),
                    opacity: element.style.opacity,
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedElementId(element.id); }}
                  onMouseDown={(e) => !element.locked && handleMouseDown(e, element.id)}
                  onDoubleClick={() => handleElementDoubleClick(element.id, element.type)}
                >
                  {/* Element content based on type */}
                  {element.type === 'image' && element.imageUrl ? (
                    <img
                      src={element.imageUrl}
                      alt={element.content || 'Image'}
                      className="w-full h-full pointer-events-none"
                      style={{
                        borderRadius: element.style.borderRadius,
                        objectFit: element.style.objectFit || 'cover',
                      }}
                      draggable={false}
                    />
                  ) : editingTextId === element.id ? (
                    <textarea
                      ref={textInputRef}
                      value={element.content}
                      onChange={(e) => updateElement(element.id, { content: e.target.value })}
                      onBlur={() => setEditingTextId(null)}
                      className="w-full h-full bg-transparent resize-none outline-none"
                      style={{
                        fontFamily: element.style.fontFamily,
                        fontSize: `${(element.style.fontSize || 24) * (zoom / 100)}px`,
                        fontWeight: element.style.fontWeight,
                        fontStyle: element.style.fontStyle,
                        textDecoration: element.style.textDecoration,
                        color: element.style.color,
                        textAlign: element.style.textAlign,
                        padding: `${(element.style.padding || 0) * (zoom / 100)}px`,
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex"
                      style={{
                        fontFamily: element.style.fontFamily,
                        fontSize: `${(element.style.fontSize || 24) * (zoom / 100)}px`,
                        fontWeight: element.style.fontWeight,
                        fontStyle: element.style.fontStyle,
                        textDecoration: element.style.textDecoration,
                        color: element.style.color,
                        textAlign: element.style.textAlign,
                        backgroundColor: element.type === 'shape' ? (element.style.backgroundColor || 'rgba(255,255,255,0.1)') : 'transparent',
                        borderRadius: element.style.borderRadius,
                        padding: `${(element.style.padding || 0) * (zoom / 100)}px`,
                        alignItems: element.style.verticalAlign === 'top' ? 'flex-start' : element.style.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                        justifyContent: element.style.textAlign === 'left' ? 'flex-start' : element.style.textAlign === 'right' ? 'flex-end' : 'center',
                      }}
                    >
                      <span style={{ whiteSpace: 'pre-wrap', width: '100%' }}>{element.content}</span>
                    </div>
                  )}

                  {/* Resize handles */}
                  {selectedElementId === element.id && !isAllSelected && (
                    <>
                      <div className="resize-handle nw" onMouseDown={(e) => handleMouseDown(e, element.id, 'nw')} />
                      <div className="resize-handle n" onMouseDown={(e) => handleMouseDown(e, element.id, 'n')} />
                      <div className="resize-handle ne" onMouseDown={(e) => handleMouseDown(e, element.id, 'ne')} />
                      <div className="resize-handle w" onMouseDown={(e) => handleMouseDown(e, element.id, 'w')} />
                      <div className="resize-handle e" onMouseDown={(e) => handleMouseDown(e, element.id, 'e')} />
                      <div className="resize-handle sw" onMouseDown={(e) => handleMouseDown(e, element.id, 'sw')} />
                      <div className="resize-handle s" onMouseDown={(e) => handleMouseDown(e, element.id, 's')} />
                      <div className="resize-handle se" onMouseDown={(e) => handleMouseDown(e, element.id, 'se')} />
                    </>
                  )}
                </div>
                ))}
            </div>
            {showSpeakerNotes && (
              <div className="w-full max-w-[960px] rounded-lg border border-border/60 bg-card/80 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Speaker Notes
                  </div>
                  <div className="text-xs text-muted-foreground">Slide {currentSlideIndex + 1}</div>
                </div>
                <textarea
                  className="min-h-[120px] w-full resize-y rounded-md border border-border/60 bg-background/60 p-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Add notes for the presenter..."
                  value={currentSlide.notes || ''}
                  onFocus={() => saveToHistory()}
                  onChange={(e) => updateSlideNotes(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Properties panel */}
        {showPropertiesPanel && (
          <div className="w-72 border-l bg-card/50 flex flex-col shrink-0">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Properties</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => setShowPropertiesPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {selectedElement ? (
                  <>
                    {/* Element Info */}
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground">
                        {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Element
                      </p>
                    </div>

                    {/* Position & Size */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">Position & Size</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">X</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.x)}
                            onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.y)}
                            onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Width</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.width)}
                            onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Height</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.height)}
                            onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Appearance */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-muted-foreground">Appearance</h4>
                      <div>
                        <Label className="text-xs">Opacity</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Slider
                            value={[(selectedElement.style.opacity || 1) * 100]}
                            min={0}
                            max={100}
                            step={5}
                            className="flex-1"
                            onValueChange={([v]) => updateElementStyle(selectedElement.id, { opacity: v / 100 })}
                          />
                          <span className="text-xs w-10 text-right">
                            {Math.round((selectedElement.style.opacity || 1) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Corner Radius</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Slider
                            value={[selectedElement.style.borderRadius || 0]}
                            min={0}
                            max={100}
                            step={1}
                            className="flex-1"
                            onValueChange={([v]) => updateElementStyle(selectedElement.id, { borderRadius: v })}
                          />
                          <span className="text-xs w-10 text-right">
                            {selectedElement.style.borderRadius || 0}px
                          </span>
                        </div>
                      </div>
                      {selectedElement.type === 'shape' && (
                        <div>
                          <Label className="text-xs">Fill Color</Label>
                          <div className="grid grid-cols-6 gap-1.5 mt-2">
                            {BACKGROUND_COLORS.map(color => (
                              <button
                                key={color}
                                className={cn(
                                  "w-6 h-6 rounded border-2 transition-all",
                                  selectedElement.style.backgroundColor === color
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-transparent hover:border-border"
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => updateElementStyle(selectedElement.id, { backgroundColor: color })}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {(selectedElement.type === 'text' || selectedElement.type === 'verse') && (
                        <div>
                          <Label className="text-xs">Text Color</Label>
                          <div className="grid grid-cols-6 gap-1.5 mt-2">
                            {TEXT_COLORS.map(color => (
                              <button
                                key={color}
                                className={cn(
                                  "w-6 h-6 rounded border-2 transition-all",
                                  selectedElement.style.color === color
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-transparent hover:border-border"
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => updateElementStyle(selectedElement.id, { color })}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedElement.type === 'image' && (
                        <div>
                          <Label className="text-xs">Object Fit</Label>
                          <div className="flex gap-1 mt-2">
                            {(['cover', 'contain', 'fill'] as const).map(fit => (
                              <button
                                key={fit}
                                className={cn(
                                  "flex-1 px-2 py-1.5 text-xs rounded-md transition-colors",
                                  selectedElement.style.objectFit === fit
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary hover:bg-secondary/80"
                                )}
                                onClick={() => updateElementStyle(selectedElement.id, { objectFit: fit })}
                              >
                                {fit.charAt(0).toUpperCase() + fit.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={duplicateSelection}
                        >
                          <Copy className="h-3 w-3 mr-2" />
                          Duplicate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={toggleLockSelection}
                        >
                          {selectedElement.locked ? (
                            <>Unlock</>
                          ) : (
                            <>Lock</>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="col-span-2"
                          onClick={deleteSelection}
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete Element
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Slide Properties */}
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground">
                        Slide {currentSlideIndex + 1} of {presentation.slides.length}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-muted-foreground">Background</h4>
                      <BackgroundPicker
                        currentBackground={currentSlide.background}
                        onChange={updateSlideBackground}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">Slide Actions</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => duplicateSlide(currentSlideIndex)}
                        >
                          <Copy className="h-3 w-3 mr-2" />
                          Duplicate Slide
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="justify-start"
                          onClick={() => deleteSlide(currentSlideIndex)}
                          disabled={presentation.slides.length <= 1}
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete Slide
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Song Insert Dialog */}
      <Dialog open={showSongDialog} onOpenChange={setShowSongDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Insert Song</DialogTitle>
          </DialogHeader>
          <SongSelector onInsert={handleInsertSong} />
        </DialogContent>
      </Dialog>

      {/* Bible Verse Dialog */}
      <Dialog open={showBibleDialog} onOpenChange={setShowBibleDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Insert Bible Verse</DialogTitle>
          </DialogHeader>
          <BibleSelector onSelect={handleInsertVerse} />
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-sm font-medium">Upload from computer</Label>
              <Button 
                variant="outline" 
                className="w-full mt-2 justify-start h-12"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose file...
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Insert from URL</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value) {
                        handleImageUrlInsert(input.value);
                        setShowImageDialog(false);
                      }
                    }
                  }}
                />
                <Button onClick={() => {
                  const input = document.getElementById('image-url') as HTMLInputElement;
                  if (input?.value) {
                    handleImageUrlInsert(input.value);
                    setShowImageDialog(false);
                  }
                }}>
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Background Picker Dialog */}
      <Dialog open={showBackgroundPicker} onOpenChange={setShowBackgroundPicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Slide Background</DialogTitle>
          </DialogHeader>
          <BackgroundPicker
            currentBackground={currentSlide.background}
            onChange={(bg) => {
              updateSlideBackground(bg);
              setShowBackgroundPicker(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Rotation Groups Dialog */}
      <Dialog open={showRotationDialog} onOpenChange={setShowRotationDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary" />
              Rotation Groups
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Groups
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => createRotationGroup(orderedRotationSelectionIds)}
                  disabled={orderedRotationSelectionIds.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  New from selection
                </Button>
              </div>
              <ScrollArea className="h-[360px] pr-2">
                {rotationGroups.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Choose slides below or in the filmstrip, then create your first rotation group.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rotationGroups.map(group => {
                      const isActive = group.id === activeRotationGroupId;
                      const repeatLabel = group.loop ? 'Repeat' : 'Once';
                      return (
                        <button
                          key={group.id}
                          className={cn(
                            "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                            isActive ? "border-primary/60 bg-primary/5" : "border-border/60 hover:bg-muted"
                          )}
                          onClick={() => setActiveRotationGroupId(group.id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium">{group.name}</div>
                            <div className="text-xs text-muted-foreground">{group.slideIds.length} slides</div>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            {group.intervalSeconds}s · {group.mode === 'ping-pong' ? 'Ping-pong' : 'Loop'} · {repeatLabel}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Selection
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {orderedRotationSelectionIds.length} chosen
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <button
                    className="hover:text-foreground"
                    onClick={() => setRotationSelectionIds(selectedSlideIds)}
                  >
                    Use filmstrip
                  </button>
                  <button className="hover:text-foreground" onClick={selectAllRotationSlides}>
                    Select all
                  </button>
                  <button className="hover:text-foreground" onClick={clearRotationSelection}>
                    Clear
                  </button>
                </div>
                <ScrollArea className="h-28 pr-2">
                  <div className="grid grid-cols-6 gap-1">
                    {presentation.slides.map((slide, idx) => {
                      const isSelected = rotationSelectionIds.includes(slide.id);
                      return (
                        <button
                          key={`rotation-select-${slide.id}`}
                          className={cn(
                            "h-7 rounded-md text-[11px] font-medium transition-colors",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
                          )}
                          onClick={() => toggleRotationSelection(slide.id)}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="space-y-4">
              {activeRotationGroup ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Group name</Label>
                      <Input
                        value={activeRotationGroup.name}
                        onChange={(e) => updateRotationGroup(activeRotationGroup.id, { name: e.target.value })}
                        placeholder="Rotation group"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-6"
                      onClick={() => deleteRotationGroup(activeRotationGroup.id)}
                    >
                      Delete
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Interval</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Slider
                            value={[activeRotationGroup.intervalSeconds]}
                            min={5}
                            max={60}
                            step={1}
                            className="flex-1"
                            onValueChange={([value]) => updateRotationGroup(activeRotationGroup.id, { intervalSeconds: value })}
                          />
                          <span className="text-xs w-10 text-right">
                            {activeRotationGroup.intervalSeconds}s
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Mode</Label>
                        <div className="flex gap-2 mt-2">
                          {(['loop', 'ping-pong'] as const).map(mode => (
                            <button
                              key={mode}
                              className={cn(
                                "flex-1 px-2 py-1.5 text-xs rounded-md transition-colors",
                                activeRotationGroup.mode === mode
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary hover:bg-secondary/80"
                              )}
                              onClick={() => updateRotationGroup(activeRotationGroup.id, { mode })}
                            >
                              {mode === 'loop' ? 'Loop' : 'Ping-pong'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Transition</Label>
                        <div className="flex gap-2 mt-2">
                          {(['fade', 'none'] as const).map(transition => (
                            <button
                              key={transition}
                              className={cn(
                                "flex-1 px-2 py-1.5 text-xs rounded-md transition-colors",
                                activeRotationGroup.transition === transition
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary hover:bg-secondary/80"
                              )}
                              onClick={() => updateRotationGroup(activeRotationGroup.id, { transition })}
                            >
                              {transition === 'fade' ? 'Fade' : 'None'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                        <div>
                          <div className="text-sm font-medium">Repeat</div>
                          <div className="text-xs text-muted-foreground">Loop the group continuously</div>
                        </div>
                        <Switch
                          checked={activeRotationGroup.loop}
                          onCheckedChange={(checked) => updateRotationGroup(activeRotationGroup.id, { loop: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                        <div>
                          <div className="text-sm font-medium">Stop on interaction</div>
                          <div className="text-xs text-muted-foreground">Return to manual control</div>
                        </div>
                        <Switch
                          checked={activeRotationGroup.stopOnInteraction}
                          onCheckedChange={(checked) => updateRotationGroup(activeRotationGroup.id, { stopOnInteraction: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Slides in group
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => replaceRotationGroupSlides(activeRotationGroup.id, orderedRotationSelectionIds)}
                        disabled={orderedRotationSelectionIds.length === 0}
                      >
                        Replace with selection
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addSlidesToRotationGroup(activeRotationGroup.id, orderedRotationSelectionIds)}
                        disabled={orderedRotationSelectionIds.length === 0}
                      >
                        Add selection
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[240px] pr-2">
                    <div className="space-y-2">
                      {activeRotationGroup.slideIds.map((slideId, index) => {
                        const slideIndex = slideIndexById.get(slideId);
                        const slide = slideById.get(slideId);
                        const slideLabel = slideIndex !== undefined ? `Slide ${slideIndex + 1}` : 'Missing slide';
                        return (
                          <div key={slideId} className="flex items-center gap-3 rounded-lg border border-border/60 p-2">
                            <div
                              className="h-12 w-20 rounded-md border border-border/60 overflow-hidden flex items-end justify-start"
                              style={slide ? getBackgroundStyle(slide.background) : { backgroundColor: '#1e3a8a' }}
                            >
                              <div className="text-[10px] text-white/80 bg-black/40 px-1.5 py-0.5">
                                {slideIndex !== undefined ? slideIndex + 1 : '--'}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{slideLabel}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {slide?.elements?.[0]?.content || 'Empty slide'}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => moveRotationGroupSlide(activeRotationGroup.id, index, -1)}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => moveRotationGroupSlide(activeRotationGroup.id, index, 1)}
                                disabled={index === activeRotationGroup.slideIds.length - 1}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => removeSlideFromRotationGroup(activeRotationGroup.id, slideId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="h-full flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  Select a rotation group to edit its settings.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog 
        open={showShortcutsDialog} 
        onOpenChange={setShowShortcutsDialog} 
      />

      {/* Present Options Dialog */}
      <Dialog open={showPresentDialog} onOpenChange={setShowPresentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Start Presentation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <button
              onClick={() => startPresentation('fullscreen')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Maximize className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">Fullscreen</div>
                <div className="text-xs text-muted-foreground">Present in fullscreen on this display</div>
              </div>
            </button>
            
            <button
              onClick={() => startPresentation('newWindow')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Monitor className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="font-medium">New Window</div>
                <div className="text-xs text-muted-foreground">Open in new window (drag to second monitor)</div>
              </div>
            </button>

            <button
              onClick={() => {
                if (id) {
                  navigate(`/presenter/${id}`);
                  setShowPresentDialog(false);
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                <MonitorPlay className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <div className="font-medium">Presenter View</div>
                <div className="text-xs text-muted-foreground">Notes, next slide preview, and timers</div>
              </div>
            </button>
            
            <button
              onClick={() => startPresentation('window')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <Play className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="font-medium">This Tab</div>
                <div className="text-xs text-muted-foreground">Present in current browser tab</div>
              </div>
            </button>
          </div>
          <div className="text-xs text-muted-foreground text-center pb-2">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Esc</kbd> to exit presentation
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Song Selector Component
function SongSelector({ onInsert }: { onInsert: (song: Song, section?: SongSection) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'en' | 'es' | 'ja'>('all');
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!expandedSongId) return;
    if (!filteredSongs.some(song => song.id === expandedSongId)) {
      setExpandedSongId(null);
    }
  }, [expandedSongId, filteredSongs]);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search songs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Tabs value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as 'all' | 'en' | 'es' | 'ja')}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="en" className="flex-1">English</TabsTrigger>
          <TabsTrigger value="es" className="flex-1">Spanish</TabsTrigger>
          <TabsTrigger value="ja" className="flex-1">Japanese</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredSongs.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-10">
          No songs found.
        </div>
      ) : (
        <ScrollArea className="h-96 pr-2">
          <div className="space-y-2">
            {filteredSongs.map(song => {
              const isExpanded = expandedSongId === song.id;
              return (
                <div key={song.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      className="flex-1 text-left"
                      onClick={() => setExpandedSongId(isExpanded ? null : song.id)}
                    >
                      <div className="text-sm font-medium">{song.title}</div>
                      <div className="text-xs text-muted-foreground">{song.artist}</div>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="secondary" onClick={() => onInsert(song)}>
                        Insert Song
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setExpandedSongId(isExpanded ? null : song.id)}
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {song.sections.map((section, index) => {
                        const preview = section.lyrics.split('\n')[0] || section.lyrics;
                        return (
                          <button
                            key={`${song.id}-${index}`}
                            className="w-full text-left border rounded-md px-2 py-1.5 hover:bg-secondary transition-colors"
                            onClick={() => onInsert(song, section)}
                          >
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              {section.label}
                            </div>
                            <div className="text-xs text-muted-foreground">{preview}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// Bible Selector Component
function BibleSelector({ onSelect }: { onSelect: (book: string, chapter: number, verse: number, text: string, translation: string) => void }) {
  const { translations } = useBibleTranslations();
  const [selectedTranslationId, setSelectedTranslationId] = useState('kjv');
  const [selectedBook, setSelectedBook] = useState('John');
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [selectedVerse, setSelectedVerse] = useState(16);
  const [searchQuery, setSearchQuery] = useState('');

  const { verses } = useBibleVerses(selectedTranslationId, selectedBook, selectedChapter);
  const { results: searchResults } = useBibleSearch(selectedTranslationId, searchQuery);
  const { books } = useBibleBooks(selectedTranslationId);

  const selectedTranslation = useMemo(() => {
    return translations.find((translation) => translation.id === selectedTranslationId);
  }, [translations, selectedTranslationId]);

  const resolveBookName = useCallback(
    (book: string) => {
      const names = books.map((entry) => entry.name);
      if (names.includes(book)) return book;
      if (book === 'Psalm' && names.includes('Psalms')) return 'Psalms';
      if (book === 'Psalms' && names.includes('Psalm')) return 'Psalm';
      return book;
    },
    [books]
  );

  const selectedBookMeta = useMemo(() => {
    return books.find((book) => book.name === selectedBook) || null;
  }, [books, selectedBook]);

  const { chapters } = useBibleChapters(
    selectedTranslationId,
    selectedBook,
    selectedBookMeta?.chapterCount
  );

  const verseNumbers = useMemo(() => {
    const seedVerses = getSeedVerseNumbers(selectedTranslationId, selectedBook, selectedChapter);
    if (seedVerses.length > 0) return seedVerses;
    return verses.map((verse) => verse.verse).sort((a, b) => a - b);
  }, [selectedTranslationId, selectedBook, selectedChapter, verses]);

  const selectedText =
    verses.find((verse) => verse.verse === selectedVerse)?.text || '';

  useEffect(() => {
    if (books.length === 0) return;
    const names = books.map((book) => book.name);
    if (!names.includes(selectedBook)) {
      setSelectedBook(names[0]);
      setSelectedChapter(1);
      setSelectedVerse(1);
    }
  }, [books, selectedBook]);

  useEffect(() => {
    if (chapters.length === 0) return;
    if (!chapters.includes(selectedChapter)) {
      setSelectedChapter(chapters[0]);
      setSelectedVerse(1);
    }
  }, [chapters, selectedChapter]);

  useEffect(() => {
    if (verseNumbers.length === 0) return;
    if (!verseNumbers.includes(selectedVerse)) {
      setSelectedVerse(verseNumbers[0]);
    }
  }, [verseNumbers, selectedVerse]);

  const popularVerses = [
    { book: 'John', chapter: 3, verse: 16, preview: 'For God so loved the world...' },
    { book: 'Psalm', chapter: 23, verse: 1, preview: 'The Lord is my shepherd...' },
    { book: 'Jeremiah', chapter: 29, verse: 11, preview: 'For I know the plans I have for you...' },
    { book: 'Philippians', chapter: 4, verse: 13, preview: 'I can do all things through Christ...' },
    { book: 'Romans', chapter: 8, verse: 28, preview: 'And we know that all things work together...' },
    { book: 'Proverbs', chapter: 3, verse: 5, preview: 'Trust in the Lord with all your heart...' },
    { book: 'Isaiah', chapter: 40, verse: 31, preview: 'But they that wait upon the Lord...' },
    { book: 'Matthew', chapter: 28, verse: 19, preview: 'Go therefore and make disciples...' },
  ];

  return (
    <Tabs defaultValue="browse" className="w-full">
      <div className="flex gap-2 mb-3 flex-wrap">
        {translations.map((translation) => (
          <button
            key={translation.id}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              selectedTranslationId === translation.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            )}
            onClick={() => {
              setSelectedTranslationId(translation.id);
              setSelectedBook('John');
              setSelectedChapter(3);
              setSelectedVerse(16);
            }}
          >
            {translation.abbreviation}
          </button>
        ))}
      </div>
      <TabsList className="w-full">
        <TabsTrigger value="browse" className="flex-1">Browse</TabsTrigger>
        <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
        <TabsTrigger value="popular" className="flex-1">Popular</TabsTrigger>
      </TabsList>

      <TabsContent value="browse" className="space-y-4 mt-4">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>Book</Label>
            <ScrollArea className="h-40 border rounded-md mt-1">
              {books.map(book => (
                <button
                  key={book.name}
                  className={cn(
                    "w-full px-2 py-1 text-left text-sm hover:bg-secondary",
                    selectedBook === book.name && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => { setSelectedBook(book.name); setSelectedChapter(1); setSelectedVerse(1); }}
                >
                  {book.name}
                </button>
              ))}
            </ScrollArea>
          </div>
          <div>
            <Label>Chapter</Label>
            <ScrollArea className="h-40 border rounded-md mt-1">
              {chapters.map(ch => (
                <button
                  key={ch}
                  className={cn(
                    "w-full px-2 py-1 text-left text-sm hover:bg-secondary",
                    selectedChapter === ch && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => { setSelectedChapter(ch); setSelectedVerse(1); }}
                >
                  {ch}
                </button>
              ))}
            </ScrollArea>
          </div>
          <div>
            <Label>Verse</Label>
            <ScrollArea className="h-40 border rounded-md mt-1">
              {verseNumbers.map(v => (
                <button
                  key={v}
                  className={cn(
                    "w-full px-2 py-1 text-left text-sm hover:bg-secondary",
                    selectedVerse === v && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setSelectedVerse(v)}
                >
                  {v}
                </button>
              ))}
            </ScrollArea>
          </div>
        </div>

        {selectedText && (
          <div className="p-4 bg-secondary rounded-lg">
            <p className="text-sm italic">"{selectedText}"</p>
            <p className="text-xs text-muted-foreground mt-2">
              — {selectedBook} {selectedChapter}:{selectedVerse} ({selectedTranslation?.abbreviation || selectedTranslationId.toUpperCase()})
            </p>
          </div>
        )}

        <Button
          className="w-full"
          onClick={() =>
            onSelect(
              selectedBook,
              selectedChapter,
              selectedVerse,
              selectedText,
              selectedTranslation?.abbreviation || selectedTranslationId.toUpperCase()
            )
          }
          disabled={!selectedText}
        >
          Insert Verse
        </Button>
      </TabsContent>

      <TabsContent value="search" className="space-y-4 mt-4">
        <Input
          placeholder="Search verses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery.length < 3 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Enter at least 3 characters to search
          </p>
        ) : searchResults.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No results found for "{searchQuery}"
          </p>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  className="w-full p-3 text-left rounded-lg hover:bg-secondary transition-colors"
                  onClick={() =>
                    onSelect(
                      result.bookAbbrev,
                      result.chapter,
                      result.verse,
                      result.text,
                      selectedTranslation?.abbreviation || selectedTranslationId.toUpperCase()
                    )
                  }
                >
                  <p className="text-sm font-medium">
                    {result.bookAbbrev} {result.chapter}:{result.verse}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{result.text}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </TabsContent>

      <TabsContent value="popular" className="mt-4">
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {popularVerses.map((v, i) => {
              const resolvedBook = resolveBookName(v.book);
              const text =
                getSeedVerseText(selectedTranslationId, resolvedBook, v.chapter, v.verse) ||
                getSeedVerseText(selectedTranslationId, v.book, v.chapter, v.verse) ||
                v.preview;
              return (
                <button
                  key={i}
                  className="w-full p-3 text-left rounded-lg hover:bg-secondary transition-colors"
                  onClick={() =>
                    onSelect(
                      resolvedBook,
                      v.chapter,
                      v.verse,
                      text,
                      selectedTranslation?.abbreviation || selectedTranslationId.toUpperCase()
                    )
                  }
                >
                  <p className="text-sm font-medium">{v.book} {v.chapter}:{v.verse}</p>
                  <p className="text-xs text-muted-foreground truncate">{text}</p>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

// Background Picker Component
function BackgroundPicker({ currentBackground, onChange }: { 
  currentBackground: Slide['background'];
  onChange: (bg: Slide['background']) => void;
}) {
  return (
    <Tabs defaultValue="color">
      <TabsList className="w-full">
        <TabsTrigger value="color" className="flex-1">Solid</TabsTrigger>
        <TabsTrigger value="gradient" className="flex-1">Gradient</TabsTrigger>
      </TabsList>

      <TabsContent value="color" className="mt-4">
        <div className="grid grid-cols-4 gap-2">
          {BACKGROUND_COLORS.map(color => (
            <button
              key={color}
              className={cn(
                "w-full aspect-square rounded-lg border-2 transition-all",
                currentBackground.type === 'color' && currentBackground.value === color
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent hover:border-border"
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange({ type: 'color', value: color })}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="gradient" className="mt-4">
        <div className="grid grid-cols-2 gap-2">
          {GRADIENTS.map(gradient => (
            <button
              key={gradient.name}
              className={cn(
                "w-full aspect-video rounded-lg border-2 transition-all",
                currentBackground.type === 'gradient' && currentBackground.value === gradient.value
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent hover:border-border"
              )}
              style={{ background: gradient.value }}
              onClick={() => onChange({ type: 'gradient', value: gradient.value })}
            >
              <span className="text-[10px] text-white/70">{gradient.name}</span>
            </button>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
