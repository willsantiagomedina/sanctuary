import { useState } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  User,
  Globe,
  Palette,
  Download,
  Check,
  Keyboard,
  Bell,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { 
  Button, 
  cn, 
  Input, 
  Label, 
  Separator, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Switch,
  Badge,
  Progress,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@sanctuary/ui';
import { useStore } from '../stores/app';
import { useAuth } from '../contexts/AuthContext';
import { useBibleDownload, useBibleTranslations } from '../hooks/useBible';
import { getSeedTranslationMeta } from '../lib/bible-seed';
import type { BibleTranslation } from '@sanctuary/shared';

function BibleVersionRow({
  translation,
  canDownload,
  unavailableReason,
}: {
  translation: BibleTranslation;
  canDownload: boolean;
  unavailableReason?: string;
}) {
  const { progress, startDownload, cancelDownload } = useBibleDownload(translation.id);
  const isDownloading = progress.status === 'downloading';
  const isDownloaded = translation.isDownloaded || progress.status === 'complete';
  const hasError = progress.status === 'error';
  const totalVerses = progress.totalVerses || translation.verseCount || 0;
  const downloadedVerses = progress.downloadedVerses || (isDownloaded ? totalVerses : 0);
  const percent = totalVerses > 0 ? Math.min(100, Math.round((downloadedVerses / totalVerses) * 100)) : 0;

  const handleAction = () => {
    if (isDownloading) {
      cancelDownload();
      return;
    }
    if (canDownload) {
      startDownload();
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col gap-3 p-4 rounded-xl transition-colors",
        isDownloaded ? "bg-primary/5 border border-primary/20" : "bg-secondary/50"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isDownloaded && (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{translation.name}</p>
            <p className="text-xs text-muted-foreground">
              {translation.abbreviation || translation.id.toUpperCase()}
              {translation.bookCount ? ` • ${translation.bookCount} books` : ''}
              {translation.verseCount ? ` • ${translation.verseCount.toLocaleString()} verses` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            {translation.language}
          </Badge>
          <Button
            variant={isDownloaded ? "outline" : "default"}
            size="sm"
            disabled={!canDownload && !isDownloaded && !isDownloading}
            onClick={handleAction}
          >
            {isDownloading
              ? 'Cancel'
              : isDownloaded
                ? 'Available'
                : !canDownload
                  ? 'Unavailable'
                  : hasError
                    ? 'Retry'
                    : 'Download'}
          </Button>
        </div>
      </div>
      {unavailableReason && !canDownload && !isDownloaded && (
        <div className="text-xs text-muted-foreground">{unavailableReason}</div>
      )}
      {(isDownloading || hasError) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{hasError ? progress.error || 'Download failed' : 'Downloading...'}</span>
            <span>
              {downloadedVerses.toLocaleString()} / {totalVerses.toLocaleString()}
            </span>
          </div>
          <Progress value={percent} />
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme, resolvedTheme } = useStore();
  const { user } = useAuth();
  const { translations, loading: translationsLoading, serverAvailableIds, serverError } = useBibleTranslations();
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const themes = [
    { id: 'light', label: 'Light', icon: Sun, description: 'Clean & bright' },
    { id: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { id: 'system', label: 'System', icon: Monitor, description: 'Match device' },
  ] as const;

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    showSaved();
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U';

  const keyboardShortcuts = [
    { keys: ['⌘', 'K'], action: 'Open command palette' },
    { keys: ['⌘', 'Enter'], action: 'Start presentation' },
    { keys: ['⌘', 'D'], action: 'Duplicate slide/element' },
    { keys: ['⌘', 'Z'], action: 'Undo' },
    { keys: ['⌘', '⇧', 'Z'], action: 'Redo' },
    { keys: ['Delete'], action: 'Delete selected' },
    { keys: ['Esc'], action: 'Deselect' },
    { keys: ['Arrow keys'], action: 'Nudge element' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Customize your Sanctuary experience</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Account Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Account</CardTitle>
            </div>
            <CardDescription>Manage your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-lg font-semibold">{user?.name || 'User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm">Edit Profile</Button>
            </div>

            <Separator />

            <div className="grid gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
                <Input 
                  id="name" 
                  defaultValue={user?.name || ''} 
                  placeholder="Your name"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input 
                  id="email" 
                  defaultValue={user?.email || ''} 
                  disabled
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">Contact support to change your email</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent>
            <Label className="text-sm font-medium mb-4 block">Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {themes.map(({ id, label, icon: Icon, description }) => (
                <button
                  key={id}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                    theme === id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent bg-secondary/50 hover:bg-secondary hover:border-border"
                  )}
                  onClick={() => handleThemeChange(id)}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    theme === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <span className={cn(
                      "text-sm font-medium block",
                      theme === id ? "text-primary" : "text-foreground"
                    )}>
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </div>
                  {theme === id && (
                    <Badge variant="default" className="absolute -top-2 -right-2">
                      <Check className="h-3 w-3" />
                    </Badge>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {theme === 'system' 
                ? `Using system preference (currently ${resolvedTheme} mode)`
                : `Using ${theme} mode`
              }
            </p>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Preferences</CardTitle>
            </div>
            <CardDescription>Configure app behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium">Auto-save presentations</Label>
                <p className="text-xs text-muted-foreground">Automatically save changes as you work</p>
              </div>
              <Switch 
                checked={autoSave} 
                onCheckedChange={(checked) => {
                  setAutoSave(checked);
                  showSaved();
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium">Desktop notifications</Label>
                <p className="text-xs text-muted-foreground">Get notified about important updates</p>
              </div>
              <Switch 
                checked={notifications} 
                onCheckedChange={(checked) => {
                  setNotifications(checked);
                  showSaved();
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bible Versions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <CardTitle>Bible Versions</CardTitle>
            </div>
            <CardDescription>Available translations for your presentations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {translationsLoading ? (
                <div className="text-sm text-muted-foreground">Loading translations...</div>
              ) : translations.length === 0 ? (
                <div className="text-sm text-muted-foreground">No translations available.</div>
              ) : (
                translations.map((translation) => {
                  const seedAvailable = Boolean(getSeedTranslationMeta(translation.id));
                  const serverAvailable = serverAvailableIds.includes(translation.id);
                  const canDownload = seedAvailable || serverAvailable;
                  const unavailableReason = serverError
                    ? 'Server offline. Connect to download.'
                    : 'Not available on the server.';

                  return (
                    <BibleVersionRow
                      key={translation.id}
                      translation={translation}
                      canDownload={canDownload}
                      unavailableReason={canDownload ? undefined : unavailableReason}
                    />
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Language Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>Language</CardTitle>
            </div>
            <CardDescription>Choose your interface language</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { code: 'en', label: 'English', flag: '🇺🇸' },
                { code: 'es', label: 'Español', flag: '🇪🇸' },
                { code: 'ja', label: '日本語', flag: '🇯🇵' },
              ].map(lang => (
                <button
                  key={lang.code}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    lang.code === 'en'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  <span className="text-lg">{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-primary" />
              <CardTitle>Keyboard Shortcuts</CardTitle>
            </div>
            <CardDescription>Quick reference for power users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {keyboardShortcuts.map((shortcut, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <kbd 
                        key={i}
                        className="px-2 py-1 text-xs font-mono bg-muted rounded border shadow-sm"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <CardTitle>Help & Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">
                Documentation
              </Button>
              <Button variant="outline">
                Contact Support
              </Button>
              <Button variant="outline">
                Report a Bug
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Sanctuary v0.1.0 • Made with ❤️ for worship teams
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Saved notification */}
      {saved && (
        <div className="fixed bottom-6 right-6 bg-primary text-primary-foreground px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in-bottom z-50">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Check className="h-3 w-3" />
          </div>
          Settings saved
        </div>
      )}
    </div>
  );
}
