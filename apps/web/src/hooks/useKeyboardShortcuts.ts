import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '../stores/editor';

// Shortcut definition
export interface Shortcut {
  id: string;
  keys: string[];
  label: string;
  description: string;
  category: 'navigation' | 'editing' | 'formatting' | 'view' | 'presentation';
  action: () => void;
  when?: () => boolean; // Condition to enable shortcut
}

// Platform detection
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

// Key display helpers
export const getModifierSymbol = (modifier: string): string => {
  const symbols: Record<string, string> = {
    meta: isMac ? '⌘' : 'Ctrl',
    ctrl: isMac ? '⌃' : 'Ctrl',
    alt: isMac ? '⌥' : 'Alt',
    shift: '⇧',
  };
  return symbols[modifier.toLowerCase()] || modifier;
};

export const formatShortcut = (keys: string[]): string => {
  return keys.map(key => {
    if (key === 'meta' || key === 'ctrl') return isMac ? '⌘' : 'Ctrl';
    if (key === 'alt') return isMac ? '⌥' : 'Alt';
    if (key === 'shift') return '⇧';
    if (key === 'enter') return '↵';
    if (key === 'escape') return 'Esc';
    if (key === 'delete') return 'Del';
    if (key === 'backspace') return '⌫';
    if (key === 'arrowup') return '↑';
    if (key === 'arrowdown') return '↓';
    if (key === 'arrowleft') return '←';
    if (key === 'arrowright') return '→';
    return key.toUpperCase();
  }).join(isMac ? '' : '+');
};

// Global shortcut registry
let shortcuts: Shortcut[] = [];

// Keyboard shortcuts hook
export function useKeyboardShortcuts(customShortcuts?: Shortcut[]) {
  const {
    setShowSearchDialog,
    setShowBibleDialog,
    setShowShortcutsDialog,
    setShowPresetsDialog,
    selectedElementIds,
    clearSelection,
    zoom,
    setZoom,
    addRecentCommand,
  } = useEditorStore();
  
  const shortcutsRef = useRef<Shortcut[]>([]);
  
  // Build shortcut list
  useEffect(() => {
    shortcutsRef.current = [
      // Search & Navigation
      {
        id: 'global-search',
        keys: ['meta', 'p'],
        label: 'Global Search',
        description: 'Search slides, verses, songs, and notes',
        category: 'navigation',
        action: () => {
          setShowSearchDialog(true);
          addRecentCommand('Global Search', 'global-search');
        },
      },
      {
        id: 'show-shortcuts',
        keys: ['meta', '/'],
        label: 'Keyboard Shortcuts',
        description: 'Show all keyboard shortcuts',
        category: 'navigation',
        action: () => {
          setShowShortcutsDialog(true);
        },
      },
      
      // Editing
      {
        id: 'insert-verse',
        keys: ['meta', 'shift', 'b'],
        label: 'Insert Verse',
        description: 'Open Bible verse selector',
        category: 'editing',
        action: () => {
          setShowBibleDialog(true);
          addRecentCommand('Insert Verse', 'insert-verse');
        },
      },
      {
        id: 'show-presets',
        keys: ['meta', 'shift', 's'],
        label: 'Style Presets',
        description: 'Apply a style preset',
        category: 'formatting',
        action: () => {
          setShowPresetsDialog(true);
          addRecentCommand('Style Presets', 'show-presets');
        },
      },
      {
        id: 'escape',
        keys: ['escape'],
        label: 'Deselect',
        description: 'Clear selection / Close dialogs',
        category: 'editing',
        action: () => {
          clearSelection();
        },
      },
      
      // View
      {
        id: 'zoom-in',
        keys: ['meta', '='],
        label: 'Zoom In',
        description: 'Increase canvas zoom',
        category: 'view',
        action: () => {
          setZoom(Math.min(200, zoom + 10));
        },
      },
      {
        id: 'zoom-out',
        keys: ['meta', '-'],
        label: 'Zoom Out',
        description: 'Decrease canvas zoom',
        category: 'view',
        action: () => {
          setZoom(Math.max(25, zoom - 10));
        },
      },
      {
        id: 'zoom-reset',
        keys: ['meta', '0'],
        label: 'Reset Zoom',
        description: 'Reset to 100% zoom',
        category: 'view',
        action: () => {
          setZoom(100);
        },
      },
      
      // Add custom shortcuts
      ...(customShortcuts || []),
    ];
    
    shortcuts = shortcutsRef.current;
  }, [
    setShowSearchDialog,
    setShowBibleDialog,
    setShowShortcutsDialog,
    setShowPresetsDialog,
    selectedElementIds,
    clearSelection,
    zoom,
    setZoom,
    addRecentCommand,
    customShortcuts,
  ]);
  
  // Keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if typing in input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow escape to work in inputs
      if (e.key !== 'Escape') return;
    }
    
    // Build pressed keys set
    const pressedKeys = new Set<string>();
    if (e.metaKey || e.ctrlKey) pressedKeys.add('meta');
    if (e.altKey) pressedKeys.add('alt');
    if (e.shiftKey) pressedKeys.add('shift');
    pressedKeys.add(e.key.toLowerCase());
    
    // Find matching shortcut
    for (const shortcut of shortcutsRef.current) {
      const shortcutKeys = new Set(shortcut.keys.map(k => k.toLowerCase()));
      
      // Check if all shortcut keys are pressed
      if (shortcutKeys.size !== pressedKeys.size) continue;
      
      let match = true;
      for (const key of shortcutKeys) {
        if (!pressedKeys.has(key)) {
          match = false;
          break;
        }
      }
      
      if (match) {
        // Check condition
        if (shortcut.when && !shortcut.when()) continue;
        
        e.preventDefault();
        e.stopPropagation();
        shortcut.action();
        return;
      }
    }
  }, []);
  
  // Attach listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return {
    shortcuts: shortcutsRef.current,
    formatShortcut,
    getModifierSymbol,
  };
}

// Get all registered shortcuts (for display)
export function getShortcuts(): Shortcut[] {
  return shortcuts;
}

// Shortcut categories for display
export const SHORTCUT_CATEGORIES = [
  { id: 'navigation', label: 'Navigation' },
  { id: 'editing', label: 'Editing' },
  { id: 'formatting', label: 'Formatting' },
  { id: 'view', label: 'View' },
  { id: 'presentation', label: 'Presentation' },
] as const;
