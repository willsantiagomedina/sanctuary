import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Presentation,
  BookOpen,
  Music,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from 'lucide-react';
import { useStore } from '../../stores/app';
import { Button, cn, ScrollArea, Separator, Tooltip, TooltipContent, TooltipTrigger } from '@sanctuary/ui';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Presentation, label: 'Presentations', path: '/presentations' },
  { icon: BookOpen, label: 'Bible', path: '/bible' },
  { icon: Music, label: 'Songs', path: '/songs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, setCommandPaletteOpen } = useStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-liturgical-advent to-liturgical-pentecost flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-lg">Sanctuary</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Quick actions */}
        <div className="p-2 space-y-1">
          <Button
            variant="outline"
            className={cn('w-full justify-start gap-2', !sidebarOpen && 'justify-center px-0')}
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search className="h-4 w-4" />
            {sidebarOpen && (
              <>
                <span className="flex-1 text-left">Search...</span>
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </>
            )}
          </Button>
          <Button
            variant="default"
            className={cn('w-full justify-start gap-2', !sidebarOpen && 'justify-center px-0')}
          >
            <Plus className="h-4 w-4" />
            {sidebarOpen && <span>New Presentation</span>}
          </Button>
        </div>

        <Separator />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-2">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));

              const linkContent = (
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    !sidebarOpen && 'justify-center px-0'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );

              if (!sidebarOpen) {
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.path}>{linkContent}</div>;
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-2">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 rounded-md px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">Grace Church</p>
              </div>
            </div>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex justify-center py-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center cursor-pointer">
                    <span className="text-sm font-medium">JD</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">John Doe - Grace Church</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </aside>
  );
}
