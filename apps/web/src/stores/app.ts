import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportedLanguage, Presentation, Slide } from '@sanctuary/shared';

interface AppState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Language
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;

  // Active organization
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Active presentation context
  activePresentation: Presentation | null;
  setActivePresentation: (presentation: Presentation | null) => void;
  activeSlideId: string | null;
  setActiveSlideId: (id: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Language
      language: 'en',
      setLanguage: (language) => set({ language }),

      // Organization
      activeOrganizationId: null,
      setActiveOrganizationId: (id) => set({ activeOrganizationId: id }),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // Presentation context
      activePresentation: null,
      setActivePresentation: (presentation) => set({ activePresentation: presentation }),
      activeSlideId: null,
      setActiveSlideId: (id) => set({ activeSlideId: id }),
    }),
    {
      name: 'sanctuary-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        activeOrganizationId: state.activeOrganizationId,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
