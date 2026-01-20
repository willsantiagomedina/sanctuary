import { useState } from 'react';
import { Moon, Sun, Monitor, Globe, Download, Trash2, HardDrive } from 'lucide-react';
import { Button, Input, Separator, cn } from '@sanctuary/ui';
import { useStore } from '../stores/app';
import { AVAILABLE_TRANSLATIONS, LANGUAGES } from '@sanctuary/shared/constants';
import type { SupportedLanguage } from '@sanctuary/shared';

export function Settings() {
  const { theme, setTheme, language, setLanguage } = useStore();
  const [defaultTranslation, setDefaultTranslation] = useState('niv');

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">Customize your Sanctuary experience</p>

      {/* Appearance */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">Theme</label>
            <div className="flex gap-2">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={theme === option.value ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTheme(option.value as any)}
                >
                  <option.icon className="h-4 w-4 mr-2" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Language */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Language</h2>
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">Interface Language</label>
            <div className="flex gap-2">
              {(Object.keys(LANGUAGES) as SupportedLanguage[]).map((lang) => (
                <Button
                  key={lang}
                  variant={language === lang ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setLanguage(lang)}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {LANGUAGES[lang].nativeName}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium mb-3 block">Default Bible Translation</label>
            <select
              value={defaultTranslation}
              onChange={(e) => setDefaultTranslation(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              {AVAILABLE_TRANSLATIONS.filter((t) => t.language === language).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.abbreviation} - {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Bible Versions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Bible Versions</h2>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Manage downloaded Bible versions for offline use
          </p>
          
          <div className="space-y-3">
            {AVAILABLE_TRANSLATIONS.slice(0, 5).map((translation, i) => (
              <div
                key={translation.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      i < 2 ? 'bg-green-500' : 'bg-gray-300'
                    )}
                  />
                  <div>
                    <p className="font-medium">{translation.abbreviation}</p>
                    <p className="text-sm text-muted-foreground">{translation.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {i < 2 ? (
                    <>
                      <span className="text-xs text-muted-foreground">45 MB</span>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <HardDrive className="h-4 w-4" />
            <span>Using 90 MB of offline storage</span>
          </div>
        </div>
      </section>

      {/* Organization */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Organization</h2>
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Church Name</label>
            <Input defaultValue="Grace Community Church" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Timezone</label>
            <select className="w-full rounded-md border bg-background px-3 py-2">
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Keyboard Shortcuts</h2>
        <div className="bg-card border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { keys: '⌘ K', action: 'Open command palette' },
              { keys: '⌘ N', action: 'New presentation' },
              { keys: '⌘ B', action: 'Open Bible' },
              { keys: '⌘ ⇧ P', action: 'Start presentation' },
              { keys: '→ / Space', action: 'Next slide' },
              { keys: '←', action: 'Previous slide' },
              { keys: 'Esc', action: 'Exit presentation' },
              { keys: 'F', action: 'Toggle fullscreen' },
            ].map((shortcut) => (
              <div key={shortcut.keys} className="flex items-center justify-between">
                <span className="text-muted-foreground">{shortcut.action}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h2>
        <div className="bg-card border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Organization</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your organization and all its data
              </p>
            </div>
            <Button variant="destructive">Delete</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
