import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Play,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Copy,
  Trash2,
  Type,
  BookOpen,
  Music,
  Image,
  Video,
} from 'lucide-react';
import { Button, cn, ScrollArea, Separator, Tooltip, TooltipContent, TooltipTrigger } from '@sanctuary/ui';

// Mock data - will be replaced with Convex
const mockSlides = [
  { id: '1', type: 'title', title: 'Welcome to Worship', subtitle: 'January 19, 2026' },
  { id: '2', type: 'bible', reference: 'John 3:16', text: 'For God so loved the world...' },
  { id: '3', type: 'lyrics', title: 'Amazing Grace', verse: 1 },
  { id: '4', type: 'announcement', title: 'Upcoming Events' },
];

const slideTypes = [
  { type: 'title', icon: Type, label: 'Title' },
  { type: 'bible', icon: BookOpen, label: 'Bible' },
  { type: 'lyrics', icon: Music, label: 'Lyrics' },
  { type: 'image', icon: Image, label: 'Image' },
  { type: 'video', icon: Video, label: 'Video' },
];

export function PresentationEditor() {
  const { id } = useParams();
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slides, setSlides] = useState(mockSlides);

  const activeSlide = slides[activeSlideIndex];

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="font-medium">Sunday Service - Jan 19</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Play className="h-4 w-4 mr-2" />
            Present
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide types sidebar */}
        <aside className="w-16 border-r bg-card flex flex-col items-center py-4 gap-2">
          {slideTypes.map((st) => (
            <Tooltip key={st.type} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => {
                    setSlides([...slides, { id: Date.now().toString(), type: st.type, title: `New ${st.label}` }]);
                  }}
                >
                  <st.icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Add {st.label}</TooltipContent>
            </Tooltip>
          ))}
        </aside>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col bg-muted/30 p-6">
          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center">
            <div className="editor-canvas max-w-4xl w-full">
              <SlideCanvas slide={activeSlide} />
            </div>
          </div>

          {/* Slide actions */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4 mr-2" />
              Fullscreen
            </Button>
          </div>
        </div>

        {/* Properties panel */}
        <aside className="w-72 border-l bg-card p-4">
          <h3 className="font-medium mb-4">Slide Properties</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <p className="text-sm text-muted-foreground capitalize">{activeSlide?.type}</p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium">Background</label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {['#1a1a2e', '#16213e', '#0f3460', '#533483', '#2c3e50'].map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-md border-2 border-transparent hover:border-primary"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium">Transition</label>
              <select className="w-full mt-2 rounded-md border bg-background px-3 py-2 text-sm">
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
                <option value="zoom">Zoom</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </aside>
      </div>

      {/* Filmstrip */}
      <div className="h-32 border-t bg-card">
        <ScrollArea className="h-full">
          <div className="flex items-center gap-2 p-3 h-full">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setActiveSlideIndex(index)}
                className={cn(
                  'filmstrip-item flex-shrink-0 w-32',
                  index === activeSlideIndex && 'active'
                )}
              >
                <div className="h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-2">
                  <span className="text-white/70 text-xs text-center truncate">
                    {slide.title || slide.type}
                  </span>
                </div>
                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                  {index + 1}
                </div>
              </button>
            ))}
            <Button
              variant="outline"
              className="h-full aspect-video flex-shrink-0 border-dashed"
              onClick={() => setSlides([...slides, { id: Date.now().toString(), type: 'blank', title: 'New Slide' }])}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function SlideCanvas({ slide }: { slide: any }) {
  if (!slide) return null;

  return (
    <div className="w-full h-full flex items-center justify-center p-8 text-white">
      {slide.type === 'title' && (
        <div className="text-center">
          <h1 className="slide-title">{slide.title}</h1>
          {slide.subtitle && <p className="slide-subtitle mt-4">{slide.subtitle}</p>}
        </div>
      )}
      {slide.type === 'bible' && (
        <div className="text-center max-w-2xl">
          <p className="verse-text">{slide.text}</p>
          <p className="verse-reference mt-6">— {slide.reference}</p>
        </div>
      )}
      {slide.type === 'lyrics' && (
        <div className="text-center">
          <p className="verse-text">Amazing grace, how sweet the sound</p>
          <p className="verse-text">That saved a wretch like me</p>
          <p className="text-sm text-white/50 mt-6">{slide.title} - Verse {slide.verse}</p>
        </div>
      )}
      {slide.type === 'announcement' && (
        <div className="text-center">
          <h2 className="slide-title">{slide.title}</h2>
        </div>
      )}
      {slide.type === 'blank' && (
        <p className="text-white/30">Click to add content</p>
      )}
    </div>
  );
}
