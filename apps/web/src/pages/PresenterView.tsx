import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  Play,
  Pause,
  RotateCcw,
  Timer,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, ScrollArea, cn } from '@sanctuary/ui';

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
  notes?: string;
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

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

type RotationState = {
  active: boolean;
  groupId: string | null;
  updatedAt: number;
};

function SlidePreview({
  slide,
  className,
}: {
  slide: Slide | null;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const nextScale = entry.contentRect.width / SLIDE_WIDTH;
      setScale(nextScale);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const getBackgroundStyle = (bg: Slide['background']) => {
    if (!bg) return { backgroundColor: '#1e3a8a' };
    if (bg.type === 'gradient') return { background: bg.value };
    if (bg.type === 'image') {
      return {
        backgroundImage: `url(${bg.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return { backgroundColor: bg.value };
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full aspect-video rounded-xl overflow-hidden border border-border/60 shadow-sm", className)}
      style={getBackgroundStyle(slide?.background || { type: 'color', value: '#1e3a8a' })}
    >
      {slide && (
        <div
          className="absolute left-0 top-0"
          style={{
            width: `${SLIDE_WIDTH}px`,
            height: `${SLIDE_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {(slide.elements || []).map(element => (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
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
                    fontSize: `${element.style?.fontSize || 24}px`,
                    fontWeight: element.style?.fontWeight || '400',
                    fontStyle: element.style?.fontStyle || 'normal',
                    textDecoration: element.style?.textDecoration || 'none',
                    color: element.style?.color || '#ffffff',
                    textAlign: element.style?.textAlign || 'center',
                    alignItems: element.style?.verticalAlign === 'top' ? 'flex-start' : element.style?.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                    justifyContent: element.style?.textAlign === 'left' ? 'flex-start' : element.style?.textAlign === 'right' ? 'flex-end' : 'center',
                    padding: element.style?.padding || 0,
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
      )}
    </div>
  );
}

export default function PresenterView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [rotationState, setRotationState] = useState<RotationState>({
    active: false,
    groupId: null,
    updatedAt: 0,
  });
  const rotationStateRef = useRef(rotationState);
  const rotationDirectionRef = useRef<1 | -1>(1);
  const [selectedRotationGroupId, setSelectedRotationGroupId] = useState<string | null>(null);

  const controlKey = id ? `presentation-control-${id}` : null;
  const rotationKey = id ? `presentation-rotation-${id}` : null;

  useEffect(() => {
    if (!id) return;
    const stored = localStorage.getItem(`presentation-${id}`);
    if (stored) {
      setPresentation(JSON.parse(stored));
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
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

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

  const selectedRotationGroup = useMemo(() => {
    if (!selectedRotationGroupId) return null;
    return rotationGroups.find(group => group.id === selectedRotationGroupId) || null;
  }, [rotationGroups, selectedRotationGroupId]);

  const activeRotationGroup = useMemo(() => {
    if (!rotationState.groupId) return null;
    return rotationGroups.find(group => group.id === rotationState.groupId) || null;
  }, [rotationGroups, rotationState.groupId]);

  const activeRotationIndices = useMemo(() => {
    if (!activeRotationGroup) return [];
    return activeRotationGroup.slideIds
      .map(id => slideIndexById.get(id))
      .filter((index): index is number => typeof index === 'number');
  }, [activeRotationGroup, slideIndexById]);

  const selectedRotationIndices = useMemo(() => {
    if (!selectedRotationGroup) return [];
    return selectedRotationGroup.slideIds
      .map(id => slideIndexById.get(id))
      .filter((index): index is number => typeof index === 'number');
  }, [selectedRotationGroup, slideIndexById]);

  useEffect(() => {
    if (!selectedRotationGroupId && rotationGroups.length > 0) {
      setSelectedRotationGroupId(rotationGroups[0].id);
    } else if (
      selectedRotationGroupId &&
      rotationGroups.length > 0 &&
      !rotationGroups.some(group => group.id === selectedRotationGroupId)
    ) {
      setSelectedRotationGroupId(rotationGroups[0].id);
    }
  }, [rotationGroups, selectedRotationGroupId]);

  const writeRotationState = useCallback((next: RotationState) => {
    if (!rotationKey) return;
    localStorage.setItem(rotationKey, JSON.stringify(next));
    setRotationState(next);
  }, [rotationKey]);

  const startRotation = useCallback(() => {
    if (!selectedRotationGroup || selectedRotationIndices.length === 0) return;
    writeRotationState({
      active: true,
      groupId: selectedRotationGroup.id,
      updatedAt: Date.now(),
    });

    if (!selectedRotationIndices.includes(currentIndex)) {
      setCurrentIndex(selectedRotationIndices[0]);
    }
  }, [selectedRotationGroup, selectedRotationIndices, currentIndex, writeRotationState]);

  const stopRotation = useCallback(() => {
    if (!rotationKey) return;
    writeRotationState({
      active: false,
      groupId: rotationStateRef.current.groupId,
      updatedAt: Date.now(),
    });
  }, [rotationKey, writeRotationState]);

  const stopRotationOnInteraction = useCallback(() => {
    if (!rotationStateRef.current.active) return;
    if (activeRotationGroup && !activeRotationGroup.stopOnInteraction) return;
    stopRotation();
  }, [activeRotationGroup, stopRotation]);

  const getNextRotationIndex = useCallback((current: number) => {
    if (!activeRotationGroup || activeRotationIndices.length === 0) return null;
    const currentPos = activeRotationIndices.indexOf(current);
    if (currentPos === -1) return activeRotationIndices[0];

    if (activeRotationGroup.mode === 'ping-pong') {
      let nextPos = currentPos + rotationDirectionRef.current;
      if (nextPos >= activeRotationIndices.length || nextPos < 0) {
        if (!activeRotationGroup.loop) return null;
        rotationDirectionRef.current = rotationDirectionRef.current === 1 ? -1 : 1;
        nextPos = currentPos + rotationDirectionRef.current;
      }
      return activeRotationIndices[Math.max(0, Math.min(nextPos, activeRotationIndices.length - 1))];
    }

    const nextPos = currentPos + 1;
    if (nextPos >= activeRotationIndices.length) {
      if (!activeRotationGroup.loop) return null;
      return activeRotationIndices[0];
    }
    return activeRotationIndices[nextPos];
  }, [activeRotationGroup, activeRotationIndices]);

  useEffect(() => {
    if (!rotationState.active) return;
    if (!activeRotationGroup || activeRotationIndices.length === 0) {
      stopRotation();
    }
  }, [rotationState.active, activeRotationGroup, activeRotationIndices.length, stopRotation]);

  useEffect(() => {
    if (!rotationState.active || !activeRotationGroup) return;
    rotationDirectionRef.current = 1;
  }, [rotationState.active, activeRotationGroup?.id]);

  useEffect(() => {
    if (!rotationState.active || !activeRotationGroup || activeRotationIndices.length === 0) return;
    if (!activeRotationIndices.includes(currentIndex)) {
      setCurrentIndex(activeRotationIndices[0]);
    }
  }, [rotationState.active, activeRotationGroup, activeRotationIndices, currentIndex]);

  useEffect(() => {
    if (!rotationState.active || !activeRotationGroup || activeRotationIndices.length === 0) return;
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
  }, [rotationState.active, activeRotationGroup, activeRotationIndices, getNextRotationIndex, stopRotation]);

  const goNext = useCallback(() => {
    if (!presentation) return;
    stopRotationOnInteraction();
    setCurrentIndex(idx => Math.min(idx + 1, presentation.slides.length - 1));
  }, [presentation, stopRotationOnInteraction]);

  const goPrev = useCallback(() => {
    stopRotationOnInteraction();
    setCurrentIndex(idx => Math.max(idx - 1, 0));
  }, [stopRotationOnInteraction]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
      case 'Enter':
        e.preventDefault();
        goNext();
        break;
      case 'ArrowLeft':
      case 'PageUp':
      case 'Backspace':
        e.preventDefault();
        goPrev();
        break;
      case 'Escape':
        e.preventDefault();
        navigate(`/presentations/${id}`);
        break;
    }
  }, [goNext, goPrev, navigate, id]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const openPresentationWindow = () => {
    if (!id) return;
    const width = window.screen.availWidth;
    const height = window.screen.availHeight;
    window.open(
      `/present/${id}`,
      'SanctuaryPresenter',
      `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no`
    );
  };

  if (!presentation) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    );
  }

  const currentSlide = presentation.slides[currentIndex] || null;
  const nextSlide = presentation.slides[currentIndex + 1] || null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-12 border-b bg-card/80 backdrop-blur flex items-center px-3 gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/presentations/${id}`)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="text-sm font-semibold">{presentation.name}</div>
          <div className="text-[11px] text-muted-foreground">Presenter view</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openPresentationWindow}>
            <MonitorPlay className="h-4 w-4 mr-2" />
            Open Presentation
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 items-start">
          <div className="flex flex-col gap-4">
            <SlidePreview slide={currentSlide} className="shadow-xl" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goPrev} disabled={currentIndex === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goNext}
                  disabled={currentIndex === presentation.slides.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Slide {currentIndex + 1} of {presentation.slides.length}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Next Slide</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {nextSlide ? (
                  <SlidePreview slide={nextSlide} className="shadow-none" />
                ) : (
                  <div className="aspect-video rounded-lg border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground">
                    End of deck
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Speaker Notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-32 pr-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {currentSlide?.notes?.trim() || 'No notes for this slide.'}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Timer
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="text-3xl font-semibold tracking-tight">{formatTime(timerElapsed)}</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setTimerRunning(r => !r)}>
                    {timerRunning ? <Pause className="h-4 w-4 mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
                    {timerRunning ? 'Pause' : 'Start'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setTimerRunning(false); setTimerElapsed(0); }}>
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rotation Groups</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {rotationGroups.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                    Create rotation groups in the editor to automate slide sequences.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {rotationGroups.map(group => {
                        const isSelected = group.id === selectedRotationGroupId;
                        const isRunning = rotationState.active && rotationState.groupId === group.id;
                        return (
                          <button
                            key={group.id}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
                            )}
                            onClick={() => setSelectedRotationGroupId(group.id)}
                          >
                            {group.name}
                            {isRunning && <span className="ml-1">•</span>}
                          </button>
                        );
                      })}
                    </div>

                    {selectedRotationGroup ? (
                      <div className="rounded-lg border border-border/60 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{selectedRotationGroup.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedRotationGroup.slideIds.length} slides
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedRotationGroup.intervalSeconds}s ·{' '}
                          {selectedRotationGroup.mode === 'ping-pong' ? 'Ping-pong' : 'Loop'} ·{' '}
                          {selectedRotationGroup.loop ? 'Repeat' : 'Once'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={startRotation}
                            disabled={rotationState.active && rotationState.groupId === selectedRotationGroup.id}
                          >
                            <Play className="h-4 w-4 mr-1.5" />
                            Start
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={stopRotation}
                            disabled={!rotationState.active}
                          >
                            <Pause className="h-4 w-4 mr-1.5" />
                            Stop
                          </Button>
                        </div>
                        {selectedRotationIndices.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {selectedRotationIndices.map((index, idx) => {
                              const isActive = currentIndex === index;
                              return (
                                <span
                                  key={`${selectedRotationGroup.id}-${idx}`}
                                  className={cn(
                                    "h-7 w-7 rounded-md text-[11px] font-medium flex items-center justify-center",
                                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {index + 1}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {rotationState.active && rotationState.groupId === selectedRotationGroup.id && (
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            Live rotation running
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Select a rotation group to view details.
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
