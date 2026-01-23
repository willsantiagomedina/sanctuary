import { useState, useCallback } from 'react';
import type { Presentation, Slide, SlideType } from '@sanctuary/shared';

// Local state management for presentation editing
// Will be replaced with Convex queries/mutations

export function usePresentation(presentationId: string) {
  const [presentation, _setPresentation] = useState<Presentation | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const activeSlide = slides[activeSlideIndex] || null;

  const addSlide = useCallback((type: SlideType, insertAfterIndex?: number) => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      presentationId,
      type,
      content: {},
      background: {
        type: 'gradient',
        value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        opacity: 1,
      },
      transition: {
        type: 'fade',
        duration: 300,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSlides((prev) => {
      const insertIndex = insertAfterIndex !== undefined ? insertAfterIndex + 1 : prev.length;
      return [...prev.slice(0, insertIndex), newSlide, ...prev.slice(insertIndex)];
    });

    // Select the new slide
    setActiveSlideIndex(insertAfterIndex !== undefined ? insertAfterIndex + 1 : slides.length);

    return newSlide.id;
  }, [presentationId, slides.length]);

  const updateSlide = useCallback((slideId: string, updates: Partial<Slide>) => {
    setSlides((prev) =>
      prev.map((slide) =>
        slide.id === slideId
          ? { ...slide, ...updates, updatedAt: Date.now() }
          : slide
      )
    );
  }, []);

  const deleteSlide = useCallback((slideId: string) => {
    const index = slides.findIndex((s) => s.id === slideId);
    if (index === -1) return;

    setSlides((prev) => prev.filter((s) => s.id !== slideId));
    
    // Adjust active index if needed
    if (activeSlideIndex >= slides.length - 1) {
      setActiveSlideIndex(Math.max(0, slides.length - 2));
    } else if (index <= activeSlideIndex) {
      setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
    }
  }, [slides, activeSlideIndex]);

  const duplicateSlide = useCallback((slideId: string) => {
    const slide = slides.find((s) => s.id === slideId);
    if (!slide) return;

    const index = slides.findIndex((s) => s.id === slideId);
    const newSlide: Slide = {
      ...slide,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSlides((prev) => [
      ...prev.slice(0, index + 1),
      newSlide,
      ...prev.slice(index + 1),
    ]);

    setActiveSlideIndex(index + 1);
    return newSlide.id;
  }, [slides]);

  const reorderSlides = useCallback((fromIndex: number, toIndex: number) => {
    setSlides((prev) => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed!);
      return result;
    });

    // Update active index if it was affected
    if (activeSlideIndex === fromIndex) {
      setActiveSlideIndex(toIndex);
    } else if (fromIndex < activeSlideIndex && toIndex >= activeSlideIndex) {
      setActiveSlideIndex(activeSlideIndex - 1);
    } else if (fromIndex > activeSlideIndex && toIndex <= activeSlideIndex) {
      setActiveSlideIndex(activeSlideIndex + 1);
    }
  }, [activeSlideIndex]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setActiveSlideIndex(index);
    }
  }, [slides.length]);

  const nextSlide = useCallback(() => {
    goToSlide(activeSlideIndex + 1);
  }, [activeSlideIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(activeSlideIndex - 1);
  }, [activeSlideIndex, goToSlide]);

  return {
    presentation,
    slides,
    activeSlide,
    activeSlideIndex,
    addSlide,
    updateSlide,
    deleteSlide,
    duplicateSlide,
    reorderSlides,
    goToSlide,
    nextSlide,
    prevSlide,
    setActiveSlideIndex,
  };
}
