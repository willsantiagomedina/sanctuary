import { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useStore } from '../../stores/app';
import { Button, cn } from '@sanctuary/ui';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-3 top-3 z-20 md:hidden bg-card/90 shadow-sm"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}
      <main 
        className={cn(
          "min-h-screen transition-[margin] duration-300",
          sidebarOpen ? "md:ml-64" : "md:ml-16"
        )}
      >
        {children}
      </main>
    </div>
  );
}
