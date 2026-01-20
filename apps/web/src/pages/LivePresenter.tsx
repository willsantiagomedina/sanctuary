import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Monitor,
  Maximize2,
  Settings,
  Eye,
} from 'lucide-react';
import { Button, cn } from '@sanctuary/ui';

// Mock data
const mockSlides = [
  { id: '1', type: 'title', title: 'Welcome to Worship', subtitle: 'January 19, 2026' },
  { id: '2', type: 'bible', reference: 'John 3:16', text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.' },
  { id: '3', type: 'lyrics', text: "Amazing grace, how sweet the sound\nThat saved a wretch like me", label: 'Amazing Grace - Verse 1' },
  { id: '4', type: 'lyrics', text: "'Twas grace that taught my heart to fear\nAnd grace my fears relieved", label: 'Amazing Grace - Verse 2' },
  { id: '5', type: 'title', title: 'Announcements' },
];

export function LivePresenter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [viewerCount] = useState(12);

  const currentSlide = mockSlides[currentIndex];

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < mockSlides.length) {
      setCurrentIndex(index);
    }
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen?.();
          } else {
            navigate('/');
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, isFullscreen, navigate]);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {/* Main slide display */}
      <div className="h-full w-full flex items-center justify-center">
        <SlideDisplay slide={currentSlide} />
      </div>

      {/* Controls overlay */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/')}
            >
              <X className="h-4 w-4 mr-2" />
              Exit
            </Button>
            
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>{viewerCount} viewers</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Monitor className="h-4 w-4" />
                <span>Live</span>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors',
            currentIndex === 0 && 'invisible'
          )}
          onClick={prevSlide}
        >
          <ChevronLeft className="h-12 w-12" />
        </button>
        <button
          className={cn(
            'absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors',
            currentIndex === mockSlides.length - 1 && 'invisible'
          )}
          onClick={nextSlide}
        >
          <ChevronRight className="h-12 w-12" />
        </button>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-4 max-w-4xl mx-auto">
            {mockSlides.map((slide, index) => (
              <button
                key={slide.id}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  index === currentIndex ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
                )}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>

          {/* Slide counter */}
          <div className="text-center text-white/70 text-sm">
            {currentIndex + 1} / {mockSlides.length}
          </div>
        </div>
      </div>

      {/* Preview panel (for presenter view) */}
      <div
        className={cn(
          'absolute bottom-20 right-4 w-64 bg-black/80 rounded-lg overflow-hidden border border-white/20 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="p-2 border-b border-white/10 flex items-center gap-2 text-white/70 text-xs">
          <Eye className="h-3 w-3" />
          <span>Next slide</span>
        </div>
        <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 p-4 flex items-center justify-center">
          {currentIndex < mockSlides.length - 1 ? (
            <SlidePreview slide={mockSlides[currentIndex + 1]!} />
          ) : (
            <span className="text-white/30 text-xs">End of presentation</span>
          )}
        </div>
      </div>
    </div>
  );
}

function SlideDisplay({ slide }: { slide: typeof mockSlides[0] }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-8 md:p-16 text-white bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {slide.type === 'title' && (
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">{slide.title}</h1>
          {slide.subtitle && (
            <p className="text-2xl md:text-3xl text-white/70 mt-6">{slide.subtitle}</p>
          )}
        </div>
      )}
      {slide.type === 'bible' && (
        <div className="text-center max-w-4xl animate-fade-in">
          <p className="text-3xl md:text-5xl leading-relaxed font-medium">
            "{slide.text}"
          </p>
          <p className="text-xl md:text-2xl text-white/70 mt-8">— {slide.reference}</p>
        </div>
      )}
      {slide.type === 'lyrics' && (
        <div className="text-center animate-fade-in">
          <p className="text-3xl md:text-5xl leading-relaxed font-medium whitespace-pre-line">
            {slide.text}
          </p>
          {slide.label && (
            <p className="text-lg text-white/50 mt-8">{slide.label}</p>
          )}
        </div>
      )}
    </div>
  );
}

function SlidePreview({ slide }: { slide: typeof mockSlides[0] }) {
  return (
    <div className="text-center text-white text-xs">
      {slide.type === 'title' && <span className="font-medium">{slide.title}</span>}
      {slide.type === 'bible' && <span>{slide.reference}</span>}
      {slide.type === 'lyrics' && <span className="line-clamp-2">{slide.text}</span>}
    </div>
  );
}
