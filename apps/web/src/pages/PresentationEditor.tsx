import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Play,
  Save,
  Type,
  Image,
  BookOpen,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Trash2,
  Copy,
  Palette,
  Layers,
  Settings,
  ChevronDown,
  GripVertical,
  MoreHorizontal,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  Upload,
  Link,
  X,
  Keyboard,
  Monitor,
  Maximize,
} from 'lucide-react';
import { Button, cn, Input, Label, ScrollArea, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Popover, PopoverContent, PopoverTrigger, Tabs, TabsList, TabsTrigger, TabsContent, Slider } from '@sanctuary/ui';
import { FONT_FAMILIES, FONT_SIZES, TEXT_COLORS, BACKGROUND_COLORS, GRADIENTS } from '../data/fonts';
import { ALL_SONGS, getSongsByLanguage, type Song, type SongSection } from '../data/songs';
import { useBibleBooks, useBibleChapters, useBibleSearch, useBibleTranslations, useBibleVerses } from '../hooks/useBible';
import { getSeedVerseNumbers, getSeedVerseText } from '../lib/bible-seed';
import { EditorMenuBar } from '../components/editor/EditorMenuBar';
import { FormattingToolbar } from '../components/editor/FormattingToolbar';
import { KeyboardShortcutsDialog } from '../components/editor';

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
}

interface Presentation {
  id: string;
  name: string;
  slides: Slide[];
  createdAt: number;
  updatedAt: number;
}

// Default slide
const createDefaultSlide = (): Slide => ({
  id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  background: { type: 'color', value: '#1e3a8a' },
  elements: [],
});

// Default presentation
const createDefaultPresentation = (id: string): Presentation => ({
  id,
  name: 'Untitled Presentation',
  slides: [createDefaultSlide()],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export default function PresentationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [showBibleDialog, setShowBibleDialog] = useState(false);
  const [showSongDialog, setShowSongDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Presentation[]>([]);
  const [redoStack, setRedoStack] = useState<Presentation[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load presentation
  useEffect(() => {
    if (!id) return;
    
    const stored = localStorage.getItem(`presentation-${id}`);
    if (stored) {
      setPresentation(JSON.parse(stored));
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

  const selectedElement = useMemo(() => {
    if (!currentSlide || !selectedElementId) return null;
    return currentSlide.elements?.find(e => e.id === selectedElementId) || null;
  }, [currentSlide, selectedElementId]);

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
        fontFamily: 'Inter',
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

  const deleteElement = useCallback((elementId: string) => {
    if (!presentation) return;
    saveToHistory();

    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      const elements = (newSlides[currentSlideIndex].elements || []).filter(e => e.id !== elementId);
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], elements };
      return { ...prev, slides: newSlides };
    });
    setSelectedElementId(null);
  }, [presentation, currentSlideIndex, saveToHistory]);

  const duplicateElement = useCallback((elementId: string) => {
    if (!presentation || !currentSlide) return;
    saveToHistory();

    const element = currentSlide.elements?.find(e => e.id === elementId);
    if (!element) return;

    const newElement = {
      ...JSON.parse(JSON.stringify(element)),
      id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + 20,
      y: element.y + 20,
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
  }, [presentation, currentSlide, currentSlideIndex, saveToHistory]);

  const nudgeElement = useCallback((elementId: string, direction: string, delta: number) => {
    if (!presentation) return;

    const updates: Partial<SlideElement> = {};
    switch (direction) {
      case 'ArrowUp': updates.y = (selectedElement?.y || 0) - delta; break;
      case 'ArrowDown': updates.y = (selectedElement?.y || 0) + delta; break;
      case 'ArrowLeft': updates.x = (selectedElement?.x || 0) - delta; break;
      case 'ArrowRight': updates.x = (selectedElement?.x || 0) + delta; break;
    }
    updateElement(elementId, updates);
  }, [presentation, selectedElement, updateElement]);

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
    setPresentation(prev => {
      if (!prev) return prev;
      return { ...prev, slides: [...prev.slides, newSlide] };
    });
    setCurrentSlideIndex(presentation.slides.length);
  }, [presentation, saveToHistory]);

  const duplicateSlide = useCallback((index: number) => {
    if (!presentation) return;
    saveToHistory();

    const slide = presentation.slides[index];
    const newSlide = {
      ...JSON.parse(JSON.stringify(slide)),
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = [...prev.slides];
      newSlides.splice(index + 1, 0, newSlide);
      return { ...prev, slides: newSlides };
    });
    setCurrentSlideIndex(index + 1);
  }, [presentation, saveToHistory]);

  const deleteSlide = useCallback((index: number) => {
    if (!presentation || presentation.slides.length <= 1) return;
    saveToHistory();

    setPresentation(prev => {
      if (!prev) return prev;
      const newSlides = prev.slides.filter((_, i) => i !== index);
      return { ...prev, slides: newSlides };
    });
    if (currentSlideIndex >= index && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
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

  // Drag and resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string, handle?: string) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
    saveToHistory();
  }, [saveToHistory]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selectedElementId || !selectedElement) return;

    const scale = zoom / 100;
    const deltaX = (e.clientX - dragStart.x) / scale;
    const deltaY = (e.clientY - dragStart.y) / scale;

    if (isDragging) {
      updateElement(selectedElementId, {
        x: Math.max(0, selectedElement.x + deltaX),
        y: Math.max(0, selectedElement.y + deltaY),
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isResizing && resizeHandle) {
      let updates: Partial<SlideElement> = {};
      
      switch (resizeHandle) {
        case 'se':
          updates = {
            width: Math.max(50, selectedElement.width + deltaX),
            height: Math.max(50, selectedElement.height + deltaY),
          };
          break;
        case 'sw':
          updates = {
            x: selectedElement.x + deltaX,
            width: Math.max(50, selectedElement.width - deltaX),
            height: Math.max(50, selectedElement.height + deltaY),
          };
          break;
        case 'ne':
          updates = {
            y: selectedElement.y + deltaY,
            width: Math.max(50, selectedElement.width + deltaX),
            height: Math.max(50, selectedElement.height - deltaY),
          };
          break;
        case 'nw':
          updates = {
            x: selectedElement.x + deltaX,
            y: selectedElement.y + deltaY,
            width: Math.max(50, selectedElement.width - deltaX),
            height: Math.max(50, selectedElement.height - deltaY),
          };
          break;
        case 'e':
          updates = { width: Math.max(50, selectedElement.width + deltaX) };
          break;
        case 'w':
          updates = {
            x: selectedElement.x + deltaX,
            width: Math.max(50, selectedElement.width - deltaX),
          };
          break;
        case 'n':
          updates = {
            y: selectedElement.y + deltaY,
            height: Math.max(50, selectedElement.height - deltaY),
          };
          break;
        case 's':
          updates = { height: Math.max(50, selectedElement.height + deltaY) };
          break;
      }
      
      updateElement(selectedElementId, updates);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [selectedElementId, selectedElement, isDragging, isResizing, resizeHandle, dragStart, zoom, updateElement]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElementId(null);
      setEditingTextId(null);
    }
  }, []);

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          deleteElement(selectedElementId);
          e.preventDefault();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedElementId) {
          duplicateElement(selectedElementId);
        } else {
          duplicateSlide(currentSlideIndex);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        startPresentation();
      }
      if (e.key === 'Escape') {
        setSelectedElementId(null);
        setEditingTextId(null);
      }
      // Arrow key nudging
      if (selectedElementId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        nudgeElement(selectedElementId, e.key, delta);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedElementId,
    currentSlideIndex,
    deleteElement,
    duplicateElement,
    duplicateSlide,
    redo,
    undo,
    startPresentation,
    nudgeElement,
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
    const newSlides = sections.map((part, index) => ({
      id: `slide-${baseId}-${index}`,
      background,
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
            fontFamily: 'Inter',
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
        fontFamily: 'Merriweather',
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
          onCut={() => {
            if (selectedElementId) {
              navigator.clipboard.writeText(JSON.stringify(selectedElement));
              deleteElement(selectedElementId);
            }
          }}
          onCopy={() => {
            if (selectedElement) {
              navigator.clipboard.writeText(JSON.stringify(selectedElement));
            }
          }}
          onPaste={async () => {
            try {
              const text = await navigator.clipboard.readText();
              const el = JSON.parse(text);
              if (el.type && el.style) {
                addElement(el.type, el.content, { ...el, x: el.x + 20, y: el.y + 20 });
              }
            } catch {}
          }}
          onSelectAll={() => {}}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          hasSelection={!!selectedElementId}
          
          // View
          zoom={zoom}
          onZoomIn={() => setZoom(z => Math.min(200, z + 25))}
          onZoomOut={() => setZoom(z => Math.max(25, z - 25))}
          onResetZoom={() => setZoom(100)}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          showRulers={showRulers}
          onToggleRulers={() => setShowRulers(!showRulers)}
          onFullscreen={() => document.documentElement.requestFullscreen?.()}
          onPresent={handlePresentClick}
          
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
          onAlignCenter={() => selectedElementId && selectedElement && updateElement(selectedElementId, { x: (960 - selectedElement.width) / 2 })}
          onAlignRight={() => selectedElementId && selectedElement && updateElement(selectedElementId, { x: 960 - selectedElement.width })}
          onAlignTop={() => selectedElementId && updateElement(selectedElementId, { y: 0 })}
          onAlignMiddle={() => selectedElementId && selectedElement && updateElement(selectedElementId, { y: (540 - selectedElement.height) / 2 })}
          onAlignBottom={() => selectedElementId && selectedElement && updateElement(selectedElementId, { y: 540 - selectedElement.height })}
          onDistributeH={() => {}}
          onDistributeV={() => {}}
          onGroup={() => {}}
          onUngroup={() => {}}
          onLock={() => selectedElementId && updateElement(selectedElementId, { locked: true })}
          onUnlock={() => selectedElementId && updateElement(selectedElementId, { locked: false })}
          
          // Help
          onShowShortcuts={() => setShowShortcutsDialog(true)}
          onShowHelp={() => window.open('/help', '_blank')}
        />

        <div className="flex-1" />

        {/* Right side controls */}
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
        onFontFamilyChange={(font) => selectedElementId && updateElementStyle(selectedElementId, { fontFamily: font })}
        onFontSizeChange={(size) => selectedElementId && updateElementStyle(selectedElementId, { fontSize: size })}
        onBoldToggle={() => selectedElementId && selectedElement && updateElementStyle(selectedElementId, { 
          fontWeight: selectedElement.style.fontWeight === '700' ? '400' : '700' 
        })}
        onItalicToggle={() => selectedElementId && selectedElement && updateElementStyle(selectedElementId, { 
          fontStyle: selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic' 
        })}
        onUnderlineToggle={() => selectedElementId && selectedElement && updateElementStyle(selectedElementId, { 
          textDecoration: selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline' 
        })}
        onTextAlignChange={(align) => selectedElementId && updateElementStyle(selectedElementId, { textAlign: align })}
        onTextColorChange={(color) => selectedElementId && updateElementStyle(selectedElementId, { color })}
        onFillColorChange={(color) => selectedElementId && updateElementStyle(selectedElementId, { backgroundColor: color })}
        onOpacityChange={(opacity) => selectedElementId && updateElementStyle(selectedElementId, { opacity })}
        onBorderRadiusChange={(radius) => selectedElementId && updateElementStyle(selectedElementId, { borderRadius: radius })}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onDuplicate={() => selectedElementId && duplicateElement(selectedElementId)}
        onDelete={() => selectedElementId && deleteElement(selectedElementId)}
        onLock={() => selectedElementId && updateElement(selectedElementId, { locked: !selectedElement?.locked })}
        onImageUpload={handleImageUpload}
        onImageUrlInsert={handleImageUrlInsert}
        zoom={zoom}
        onZoomIn={() => setZoom(z => Math.min(200, z + 25))}
        onZoomOut={() => setZoom(z => Math.max(25, z - 25))}
        onPresent={handlePresentClick}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Slide filmstrip */}
        <div className="w-48 border-r bg-card/50 flex flex-col shrink-0">
          <div className="p-2 border-b">
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={addSlide}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {presentation.slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={cn(
                    "slide-thumbnail group",
                    idx === currentSlideIndex && "active"
                  )}
                  onClick={() => {
                    setCurrentSlideIndex(idx);
                    setSelectedElementId(null);
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
        <div className="flex-1 overflow-auto bg-muted/30 slide-canvas p-8">
          <div className="flex items-center justify-center min-h-full">
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
              {(currentSlide.elements || []).map((element) => (
                <div
                  key={element.id}
                  className={cn(
                    "absolute",
                    element.locked ? "cursor-not-allowed" : "cursor-move",
                    selectedElementId === element.id && "ring-2 ring-primary ring-offset-1"
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
                  {selectedElementId === element.id && (
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
                            onChange={(e) => updateElement(selectedElementId!, { x: Number(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.y)}
                            onChange={(e) => updateElement(selectedElementId!, { y: Number(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Width</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.width)}
                            onChange={(e) => updateElement(selectedElementId!, { width: Number(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Height</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.height)}
                            onChange={(e) => updateElement(selectedElementId!, { height: Number(e.target.value) })}
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
                            onValueChange={([v]) => updateElementStyle(selectedElementId!, { opacity: v / 100 })}
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
                            onValueChange={([v]) => updateElementStyle(selectedElementId!, { borderRadius: v })}
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
                                onClick={() => updateElementStyle(selectedElementId!, { backgroundColor: color })}
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
                                onClick={() => updateElementStyle(selectedElementId!, { color })}
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
                                onClick={() => updateElementStyle(selectedElementId!, { objectFit: fit })}
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
                          onClick={() => duplicateElement(selectedElementId!)}
                        >
                          <Copy className="h-3 w-3 mr-2" />
                          Duplicate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => updateElement(selectedElementId!, { locked: !selectedElement.locked })}
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
                          onClick={() => deleteElement(selectedElementId!)}
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
