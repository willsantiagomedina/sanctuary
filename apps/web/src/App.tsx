import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { CommandPaletteProvider } from './components/layout/CommandPalette';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useStore } from './stores/app';
import { GlobalSearchDialog, KeyboardShortcutsDialog, StylePresetsDialog, SlideVariantsDialog } from './components/editor';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Pages
import Dashboard from './pages/Dashboard';
import PresentationEditor from './pages/PresentationEditor';
import LivePresenter from './pages/LivePresenter';
import BibleExplorer from './pages/BibleExplorer';
import SongLibrary from './pages/SongLibrary';
import Settings from './pages/Settings';
import Auth from './pages/Auth';

// Theme effect
function ThemeEffect() {
  const { resolvedTheme } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  return null;
}

// Global keyboard shortcuts
function GlobalKeyboardShortcuts() {
  useKeyboardShortcuts();
  return null;
}

// Global dialogs that can be opened from anywhere
function GlobalDialogs() {
  return (
    <>
      <GlobalSearchDialog />
      <KeyboardShortcutsDialog />
      <StylePresetsDialog />
    </>
  );
}

// Protected route wrapper
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

// Public route wrapper (redirects if already logged in)
function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

// App routes
function AppRoutes() {
  return (
    <CommandPaletteProvider>
      <ThemeEffect />
      <GlobalKeyboardShortcuts />
      <GlobalDialogs />
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/signup" element={<Auth />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/presentations/:id" element={<PresentationEditor />} />
          <Route path="/editor/:id" element={<PresentationEditor />} />
          <Route path="/bible" element={<BibleExplorer />} />
          <Route path="/songs" element={<SongLibrary />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Presentation mode (full screen, no layout) */}
        <Route path="/present/:id" element={<LivePresenter />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CommandPaletteProvider>
  );
}

// Main App
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
