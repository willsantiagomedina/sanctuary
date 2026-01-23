import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize,
  Minimize,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { Button, cn } from '@sanctuary/ui';

interface SlideElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  opacity?: number;
  borderRadius?: number;
  padding?: number;
  lineHeight?: number;
  letterSpacing?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
  fontStyle?: string;
  textDecoration?: string;
}

interface SlideElement {
  id: string;
  type: string;
  content: string;
  imageUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: SlideElementStyle;
}

interface Slide {
  id: string;
  background: { type: string; value: string };
  elements: SlideElement[];
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

interface Presentation {
  id: string;
  name: string;
  slides: Slide[];
  rotationGroups?: RotationGroup[];
}

type RotationState = {
  active: boolean;
  groupId: string | null;
  updatedAt: number;
};

export default function LivePresenter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [rotationState, setRotationState] = useState<RotationState>({
    active: false,
    groupId: null,
    updatedAt: 0,
  });
  const rotationStateRef = useRef(rotationState);
  const rotationDirectionRef = useRef<1 | -1>(1);
  const [isFading, setIsFading] = useState(false);
  const lastIndexRef = useRef(currentIndex);
  const controlKey = id ? `presentation-control-${id}` : null;
  const rotationKey = id ? `presentation-rotation-${id}` : null;

  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem(`presentation-${id}`);
      if (stored) {
        setPresentation(JSON.parse(stored));
      }
    }
  }, [id]);

  useEffect(() => {
    if (!controlKey) return;
    const stored = localStorage.getItem(controlKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed.index === 'number') {
        setCurrentIndex(parsed.index);
      }
    } catch {}
  }, [controlKey]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (!controlKey) return;
    localStorage.setItem(controlKey, JSON.stringify({ index: currentIndex, updatedAt: Date.now() }));
  }, [controlKey, currentIndex]);

  useEffect(() => {
    if (!controlKey) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== controlKey || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (typeof parsed.index === 'number' && parsed.index !== currentIndexRef.current) {
          setCurrentIndex(parsed.index);
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [controlKey]);

  useEffect(() => {
    rotationStateRef.current = rotationState;
  }, [rotationState]);

  useEffect(() => {
    if (!rotationKey) return;
    const stored = localStorage.getItem(rotationKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed.active === 'boolean') {
        setRotationState({
          active: parsed.active,
          groupId: typeof parsed.groupId === 'string' ? parsed.groupId : null,
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
        });
      }
    } catch {}
  }, [rotationKey]);

  useEffect(() => {
    if (!rotationKey) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== rotationKey || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (typeof parsed.active === 'boolean') {
          setRotationState({
            active: parsed.active,
            groupId: typeof parsed.groupId === 'string' ? parsed.groupId : null,
            updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
          });
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [rotationKey]);

  const rotationGroups = presentation?.rotationGroups || [];
  const slideIndexById = useMemo(() => {
    if (!presentation) return new Map<string, number>();
    return new Map(presentation.slides.map((slide, index) => [slide.id, index]));
  }, [presentation]);

  const activeRotationGroup = useMemo(() => {
    if (!rotationState.groupId) return null;
    return rotationGroups.find(group => group.id === rotationState.groupId) || null;
  }, [rotationGroups, rotationState.groupId]);

  const rotationIndices = useMemo(() => {
    if (!activeRotationGroup) return [];
    return activeRotationGroup.slideIds
      .map(id => slideIndexById.get(id))
      .filter((index): index is number => typeof index === 'number');
  }, [activeRotationGroup, slideIndexById]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let isInitialLoad = true;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      // Longer timeout on initial load
      timeout = setTimeout(() => setShowControls(false), isInitialLoad ? 5000 : 3000);
      isInitialLoad = false;
    };

    // Show controls initially
    handleMouseMove();
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const writeRotationState = useCallback((next: RotationState) => {
    if (!rotationKey) return;
    localStorage.setItem(rotationKey, JSON.stringify(next));
    setRotationState(next);
  }, [rotationKey]);

  const stopRotation = useCallback(() => {
    if (!rotationKey) return;
    writeRotationState({
      active: false,
      groupId: rotationStateRef.current.groupId,
      updatedAt: Date.now(),
    });
  }, [rotationKey, writeRotationState]);

  useEffect(() => {
    if (!rotationState.active) return;
    if (!activeRotationGroup || rotationIndices.length === 0) {
      stopRotation();
    }
  }, [rotationState.active, activeRotationGroup, rotationIndices.length, stopRotation]);

  const stopRotationOnInteraction = useCallback(() => {
    if (!rotationStateRef.current.active) return;
    if (activeRotationGroup && !activeRotationGroup.stopOnInteraction) return;
    stopRotation();
  }, [activeRotationGroup, stopRotation]);

  const getNextRotationIndex = useCallback((current: number) => {
    if (!activeRotationGroup || rotationIndices.length === 0) return null;
    const currentPos = rotationIndices.indexOf(current);
    if (currentPos === -1) return rotationIndices[0];

    if (activeRotationGroup.mode === 'ping-pong') {
      let nextPos = currentPos + rotationDirectionRef.current;
      if (nextPos >= rotationIndices.length || nextPos < 0) {
        if (!activeRotationGroup.loop) return null;
        rotationDirectionRef.current = rotationDirectionRef.current === 1 ? -1 : 1;
        nextPos = currentPos + rotationDirectionRef.current;
      }
      return rotationIndices[Math.max(0, Math.min(nextPos, rotationIndices.length - 1))];
    }

    const nextPos = currentPos + 1;
    if (nextPos >= rotationIndices.length) {
      if (!activeRotationGroup.loop) return null;
      return rotationIndices[0];
    }
    return rotationIndices[nextPos];
  }, [activeRotationGroup, rotationIndices]);

  useEffect(() => {
    if (!rotationState.active || !activeRotationGroup) return;
    rotationDirectionRef.current = 1;
  }, [rotationState.active, activeRotationGroup?.id]);

  useEffect(() => {
    if (!rotationState.active || !activeRotationGroup || rotationIndices.length === 0) return;
    if (!rotationIndices.includes(currentIndex)) {
      setCurrentIndex(rotationIndices[0]);
    }
  }, [rotationState.active, activeRotationGroup, rotationIndices, currentIndex]);

  useEffect(() => {
    if (!rotationState.active || !activeRotationGroup || rotationIndices.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = getNextRotationIndex(prev);
        if (nextIndex === null) {
          stopRotation();
          return prev;
        }
        return nextIndex;
      });
    }, activeRotationGroup.intervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [rotationState.active, activeRotationGroup, rotationIndices, getNextRotationIndex, stopRotation]);

  useEffect(() => {
    if (!rotationState.active || activeRotationGroup?.transition !== 'fade') {
      lastIndexRef.current = currentIndex;
      setIsFading(false);
      return;
    }
    if (lastIndexRef.current === currentIndex) return;
    setIsFading(true);
    const timeout = setTimeout(() => setIsFading(false), 320);
    lastIndexRef.current = currentIndex;
    return () => clearTimeout(timeout);
  }, [currentIndex, rotationState.active, activeRotationGroup?.transition]);

  const exitPresentation = useCallback(async () => {
    // Exit fullscreen first if we're in it
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (e) {
        // Ignore fullscreen errors
      }
    }
    
    // Try to close the window (only works if opened by script)
    try {
      window.close();
    } catch (e) {
      // Ignore close errors
    }
    
    // Always navigate back as fallback (after a tiny delay to let close() work)
    setTimeout(() => {
      // If we're still here, navigate back
      navigate(`/presentations/${id}`);
    }, 50);
  }, [navigate, id]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'Enter':
      case 'PageDown':
        e.preventDefault();
        stopRotationOnInteraction();
        setCurrentIndex(i => Math.min(i + 1, (presentation?.slides?.length || 1) - 1));
        break;
      case 'ArrowLeft':
      case 'Backspace':
      case 'PageUp':
        e.preventDefault();
        stopRotationOnInteraction();
        setCurrentIndex(i => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        stopRotationOnInteraction();
        setCurrentIndex(0);
        break;
      case 'End':
        e.preventDefault();
        stopRotationOnInteraction();
        setCurrentIndex((presentation?.slides?.length || 1) - 1);
        break;
      case 'Escape':
        e.preventDefault();
        exitPresentation();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  }, [presentation, exitPresentation, stopRotationOnInteraction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => document.removeEventListener('fullscreenchange', handleFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const goNext = () => {
    if (presentation && currentIndex < presentation.slides.length - 1) {
      stopRotationOnInteraction();
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      stopRotationOnInteraction();
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!presentation) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading presentation...</div>
      </div>
    );
  }

  const currentSlide = presentation.slides[currentIndex];
  const totalSlides = presentation.slides.length;

  const getBackgroundStyle = (bg: Slide['background']) => {
    if (bg?.type === 'gradient') return { background: bg.value };
    if (bg?.type === 'image') return { 
      backgroundImage: `url(${bg.value})`, 
      backgroundSize: 'cover', 
      backgroundPosition: 'center' 
    };
    return { backgroundColor: bg?.value || '#1e3a8a' };
  };

  return (
    <div 
      className="fixed inset-0 bg-black"
      style={{ cursor: showControls ? 'default' : 'none' }}
      onClick={(e) => {
        // Don't navigate if clicking on controls
        if ((e.target as HTMLElement).closest('button')) return;
        
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x > rect.width / 2) {
          goNext();
        } else {
          goPrev();
        }
      }}
    >
      {/* Slide */}
      <div 
        className={cn(
          "w-full h-full flex items-center justify-center transition-all duration-300",
          isFading && "slide-fade"
        )}
        style={getBackgroundStyle(currentSlide?.background)}
      >
        {(currentSlide?.elements || []).map((element) => (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: `${(element.x / 960) * 100}%`,
              top: `${(element.y / 540) * 100}%`,
              width: `${(element.width / 960) * 100}%`,
              height: `${(element.height / 540) * 100}%`,
              opacity: element.style?.opacity ?? 1,
            }}
          >
            {element.type === 'image' && element.imageUrl ? (
              <img
                src={element.imageUrl}
                alt=""
                className="w-full h-full"
                style={{
                  objectFit: element.style?.objectFit || 'cover',
                  borderRadius: element.style?.borderRadius || 0,
                }}
              />
            ) : (
              <div
                className="w-full h-full flex"
                style={{
                  fontFamily: element.style?.fontFamily || 'Instrument Sans',
                  fontSize: `${(element.style?.fontSize || 24) / 540 * 100}vh`,
                  fontWeight: element.style?.fontWeight || '400',
                  fontStyle: element.style?.fontStyle || 'normal',
                  textDecoration: element.style?.textDecoration || 'none',
                  color: element.style?.color || '#ffffff',
                  textAlign: element.style?.textAlign || 'center',
                  alignItems: element.style?.verticalAlign === 'top' ? 'flex-start' : element.style?.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                  justifyContent: element.style?.textAlign === 'left' ? 'flex-start' : element.style?.textAlign === 'right' ? 'flex-end' : 'center',
                  padding: element.style?.padding ? `${(element.style.padding / 540) * 100}vh` : 0,
                  backgroundColor: element.type === 'shape' ? (element.style?.backgroundColor || 'rgba(255,255,255,0.1)') : 'transparent',
                  borderRadius: element.style?.borderRadius || 0,
                }}
              >
                <span style={{ whiteSpace: 'pre-wrap', width: '100%' }}>{element.content}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controls overlay */}
      <div 
        className={`fixed inset-0 pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center px-4 pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-white bg-red-600/90 hover:bg-red-600 gap-2 font-medium"
            onClick={(e) => { e.stopPropagation(); exitPresentation(); }}
          >
            <X className="h-4 w-4" />
            Exit Presentation
          </Button>
          <span className="text-white/70 ml-4 text-sm">{presentation.name}</span>
          {rotationState.active && activeRotationGroup && (
            <div className="ml-4 flex items-center gap-2 text-white/70 text-sm">
              <RotateCcw className="h-4 w-4" />
              <span>{activeRotationGroup.name}</span>
              <span className="text-white/50">• {activeRotationGroup.intervalSeconds}s</span>
            </div>
          )}
          <div className="flex-1" />
          {rotationState.active && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white bg-white/10 hover:bg-white/20 gap-2 mr-2"
              onClick={(e) => { e.stopPropagation(); stopRotation(); }}
            >
              <Pause className="h-4 w-4" />
              Stop Rotation
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-4 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-12 w-12"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          
          <div className="text-white text-base min-w-[120px] text-center font-medium">
            {currentIndex + 1} / {totalSlides}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-12 w-12"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            disabled={currentIndex === totalSlides - 1}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
          {presentation.slides.map((_, idx) => (
            <button
              key={idx}
              className={cn(
                "h-2 rounded-full transition-all",
                idx === currentIndex 
                  ? 'bg-white w-8' 
                  : 'bg-white/40 hover:bg-white/60 w-2'
              )}
              onClick={(e) => {
                e.stopPropagation();
                stopRotationOnInteraction();
                setCurrentIndex(idx);
              }}
            />
          ))}
        </div>
      </div>

      {/* Keyboard hints */}
      <div className={cn(
        "fixed bottom-4 right-4 text-white/60 text-xs transition-opacity duration-300 bg-black/40 px-3 py-1.5 rounded-full",
        showControls ? 'opacity-100' : 'opacity-0'
      )}>
        ← → Navigate • F Fullscreen • ESC Exit
      </div>
    </div>
  );
}
