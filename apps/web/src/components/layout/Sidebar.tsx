import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Music,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  Command,
} from 'lucide-react';
import { useStore } from '../../stores/app';
import { useAuth } from '../../contexts/AuthContext';
import { Button, cn, Separator, Tooltip, TooltipContent, TooltipTrigger, Avatar, AvatarFallback, AvatarImage } from '@sanctuary/ui';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/', description: 'Home' },
  { icon: BookOpen, label: 'Bible', path: '/bible', description: 'Scripture explorer' },
  { icon: Music, label: 'Songs', path: '/songs', description: 'Worship library' },
  { icon: Settings, label: 'Settings', path: '/settings', description: 'Preferences' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen, setCommandPaletteOpen, resolvedTheme, setTheme } = useStore();
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const { user, currentOrganization, logout } = useAuth();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Use the correct logo based on theme
  const logoSrc = resolvedTheme === 'dark' 
    ? '/sanctuary-icon-dark.png' 
    : '/sanctuary-icon-light.png';

  // Get user initials for avatar
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r transition-all duration-300 ease-in-out',
        'bg-background/80 backdrop-blur-xl',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-3 border-b">
          {sidebarOpen ? (
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <img 
                  src={logoSrc}
                  alt="Sanctuary" 
                  className="w-8 h-8 rounded-lg object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent items-center justify-center hidden">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
              <span className="font-semibold text-lg tracking-tight">Sanctuary</span>
            </Link>
          ) : (
            <Link to="/" className="mx-auto">
              <img 
                src={logoSrc}
                alt="Sanctuary" 
                className="w-8 h-8 rounded-lg object-cover hover:scale-105 transition-transform"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 shrink-0 hover:bg-secondary', !sidebarOpen && 'hidden')}
            onClick={toggleSidebar}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Search / Command */}
        <div className="p-3">
          {sidebarOpen ? (
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm",
                "bg-secondary/50 text-muted-foreground",
                "hover:bg-secondary hover:text-foreground transition-all",
                "border border-transparent hover:border-border"
              )}
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-10 hover:bg-secondary"
                  onClick={() => setCommandPaletteOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span>Search</span>
                <kbd className="ml-2 text-[10px] bg-muted px-1 rounded">⌘K</kbd>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* New Presentation */}
        <div className="px-3">
          {sidebarOpen ? (
            <Button
              className="w-full justify-start shadow-sm hover:shadow-md transition-all"
              onClick={() => {
                const newId = `pres-${Date.now()}`;
                navigate(`/presentations/${newId}`);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Presentation
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className="w-full h-10 shadow-sm"
                  onClick={() => {
                    const newId = `pres-${Date.now()}`;
                    navigate(`/presentations/${newId}`);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New Presentation</TooltipContent>
            </Tooltip>
          )}
        </div>

        <Separator className="my-3" />

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return sidebarOpen ? (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />
                )}
              </Link>
            ) : (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center justify-center p-2.5 rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground text-xs block">{item.description}</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t space-y-2">
          {/* Theme toggle */}
          {sidebarOpen ? (
            <button
              onClick={toggleTheme}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>{resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className={cn(
                    "w-full flex items-center justify-center p-2.5 rounded-xl transition-all",
                    "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {resolvedTheme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Toggle theme</TooltipContent>
            </Tooltip>
          )}

          {/* User info */}
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/50">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentOrganization?.name || user?.email}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" 
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={logout}
                  className={cn(
                    "w-full flex items-center justify-center p-2.5 rounded-xl transition-all",
                    "text-muted-foreground hover:bg-secondary hover:text-destructive"
                  )}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Collapse button (when collapsed) */}
        {!sidebarOpen && (
          <div className="p-3 border-t">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full h-10" onClick={toggleSidebar}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </aside>
  );
}
