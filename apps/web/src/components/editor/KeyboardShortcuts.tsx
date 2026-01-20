import React from 'react';
import { Keyboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, ScrollArea, Separator } from '@sanctuary/ui';
import { useEditorStore } from '../../stores/editor';
import { formatShortcut, SHORTCUT_CATEGORIES } from '../../hooks/useKeyboardShortcuts';

// All keyboard shortcuts organized by category
const ALL_SHORTCUTS = {
  navigation: [
    { keys: ['meta', 'k'], label: 'Command Palette', description: 'Open command palette' },
    { keys: ['meta', 'p'], label: 'Global Search', description: 'Search everything' },
    { keys: ['meta', 'g'], label: 'Jump to Slide', description: 'Go to specific slide' },
    { keys: ['meta', 'b'], label: 'Bible Explorer', description: 'Open Bible explorer' },
  ],
  editing: [
    { keys: ['meta', 'z'], label: 'Undo', description: 'Undo last action' },
    { keys: ['meta', 'shift', 'z'], label: 'Redo', description: 'Redo last action' },
    { keys: ['meta', 'd'], label: 'Duplicate', description: 'Duplicate selection or slide' },
    { keys: ['meta', 'c'], label: 'Copy', description: 'Copy selection' },
    { keys: ['meta', 'v'], label: 'Paste', description: 'Paste clipboard' },
    { keys: ['meta', 'x'], label: 'Cut', description: 'Cut selection' },
    { keys: ['meta', 'a'], label: 'Select All', description: 'Select all elements' },
    { keys: ['delete'], label: 'Delete', description: 'Delete selection' },
    { keys: ['escape'], label: 'Deselect', description: 'Clear selection' },
    { keys: ['arrowup'], label: 'Nudge Up', description: 'Move element up 1px' },
    { keys: ['arrowdown'], label: 'Nudge Down', description: 'Move element down 1px' },
    { keys: ['arrowleft'], label: 'Nudge Left', description: 'Move element left 1px' },
    { keys: ['arrowright'], label: 'Nudge Right', description: 'Move element right 1px' },
    { keys: ['shift', 'arrowup'], label: 'Large Nudge Up', description: 'Move element up 10px' },
    { keys: ['shift', 'arrowdown'], label: 'Large Nudge Down', description: 'Move element down 10px' },
    { keys: ['shift', 'arrowleft'], label: 'Large Nudge Left', description: 'Move element left 10px' },
    { keys: ['shift', 'arrowright'], label: 'Large Nudge Right', description: 'Move element right 10px' },
  ],
  formatting: [
    { keys: ['meta', 'b'], label: 'Bold', description: 'Toggle bold text' },
    { keys: ['meta', 'i'], label: 'Italic', description: 'Toggle italic text' },
    { keys: ['meta', 'u'], label: 'Underline', description: 'Toggle underline' },
    { keys: ['meta', 'shift', 'c'], label: 'Copy Style', description: 'Copy element style' },
    { keys: ['meta', 'shift', 'v'], label: 'Paste Style', description: 'Paste element style' },
    { keys: ['meta', 'shift', 's'], label: 'Style Presets', description: 'Open style presets' },
  ],
  view: [
    { keys: ['meta', '='], label: 'Zoom In', description: 'Increase canvas zoom' },
    { keys: ['meta', '-'], label: 'Zoom Out', description: 'Decrease canvas zoom' },
    { keys: ['meta', '0'], label: 'Reset Zoom', description: 'Reset to 100% zoom' },
    { keys: ['meta', "'"], label: 'Toggle Grid', description: 'Show/hide grid' },
    { keys: ['meta', 'shift', 'p'], label: 'Properties Panel', description: 'Toggle properties' },
  ],
  presentation: [
    { keys: ['meta', 'enter'], label: 'Present', description: 'Start presentation mode' },
    { keys: ['escape'], label: 'Exit Present', description: 'Exit presentation' },
    { keys: ['arrowright'], label: 'Next Slide', description: 'Go to next slide' },
    { keys: ['arrowleft'], label: 'Previous Slide', description: 'Go to previous slide' },
    { keys: ['home'], label: 'First Slide', description: 'Go to first slide' },
    { keys: ['end'], label: 'Last Slide', description: 'Go to last slide' },
  ],
};

// Format shortcut keys for display
const ShortcutKeys = ({ keys }: { keys: string[] }) => {
  const formatted = formatShortcut(keys);
  return (
    <div className="flex items-center gap-0.5">
      {formatted.split('').map((char, i) => {
        // Check if it's a modifier symbol
        const isModifier = ['⌘', '⇧', '⌥', '⌃', '↵'].includes(char);
        const isArrow = ['↑', '↓', '←', '→'].includes(char);
        
        if (isModifier || isArrow) {
          return (
            <kbd
              key={i}
              className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium bg-muted rounded border border-border"
            >
              {char}
            </kbd>
          );
        }
        
        // Regular character
        return (
          <kbd
            key={i}
            className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium bg-muted rounded border border-border"
          >
            {char}
          </kbd>
        );
      })}
    </div>
  );
};

export function KeyboardShortcutsDialog({ 
  open, 
  onOpenChange 
}: { 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void;
}) {
  const store = useEditorStore();
  
  // Use props if provided, otherwise fall back to store
  const isOpen = open !== undefined ? open : store.showShortcutsDialog;
  const setIsOpen = onOpenChange || store.setShowShortcutsDialog;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {SHORTCUT_CATEGORIES.map((category) => (
              <div key={category.id}>
                <h3 className="text-sm font-semibold mb-3 text-foreground">
                  {category.label}
                </h3>
                <div className="space-y-1">
                  {ALL_SHORTCUTS[category.id as keyof typeof ALL_SHORTCUTS]?.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-sm">{shortcut.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {shortcut.description}
                        </div>
                      </div>
                      <ShortcutKeys keys={shortcut.keys} />
                    </div>
                  ))}
                </div>
                {category.id !== 'presentation' && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="border-t pt-4 text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded">⌘/</kbd> anytime to view shortcuts
        </div>
      </DialogContent>
    </Dialog>
  );
}
