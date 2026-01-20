import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Presentation,
  BookOpen,
  Music,
  Settings,
  Plus,
  Moon,
  Sun,
  Monitor,
  Globe,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@sanctuary/ui';
import { useStore } from '../../stores/app';

interface CommandPaletteContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPaletteContext = React.createContext<CommandPaletteContextType | null>(null);

export function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen, setTheme, theme, language, setLanguage } = useStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    },
    [commandPaletteOpen, setCommandPaletteOpen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const runCommand = useCallback(
    (command: () => void) => {
      setCommandPaletteOpen(false);
      command();
    },
    [setCommandPaletteOpen]
  );

  return (
    <CommandPaletteContext.Provider
      value={{ open: commandPaletteOpen, setOpen: setCommandPaletteOpen }}
    >
      {children}
      <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/bible'))}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Bible</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/songs'))}>
              <Music className="mr-2 h-4 w-4" />
              <span>Songs</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => runCommand(() => console.log('New presentation'))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>New Presentation</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => console.log('New slide'))}>
              <Presentation className="mr-2 h-4 w-4" />
              <span>Add Slide</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
              {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
              {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
              {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Language">
            <CommandItem onSelect={() => runCommand(() => setLanguage('en'))}>
              <Globe className="mr-2 h-4 w-4" />
              <span>English</span>
              {language === 'en' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLanguage('ja'))}>
              <Globe className="mr-2 h-4 w-4" />
              <span>日本語</span>
              {language === 'ja' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLanguage('es'))}>
              <Globe className="mr-2 h-4 w-4" />
              <span>Español</span>
              {language === 'es' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}
