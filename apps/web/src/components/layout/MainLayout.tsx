import { Outlet } from 'react-router-dom';
import { useStore } from '../../stores/app';
import { Sidebar } from './Sidebar';
import { cn } from '@sanctuary/ui';

export function MainLayout() {
  const { sidebarOpen } = useStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main
        className={cn(
          'flex-1 overflow-auto transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
