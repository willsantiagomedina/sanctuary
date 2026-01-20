import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './stores/app';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { PresentationEditor } from './pages/PresentationEditor';
import { BibleExplorer } from './pages/BibleExplorer';
import { SongLibrary } from './pages/SongLibrary';
import { LivePresenter } from './pages/LivePresenter';
import { Settings } from './pages/Settings';
import { CommandPaletteProvider } from './components/layout/CommandPalette';

export default function App() {
  const { theme } = useStore();

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <CommandPaletteProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="presentations/:id" element={<PresentationEditor />} />
            <Route path="bible" element={<BibleExplorer />} />
            <Route path="songs" element={<SongLibrary />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/live/:id" element={<LivePresenter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CommandPaletteProvider>
    </div>
  );
}
