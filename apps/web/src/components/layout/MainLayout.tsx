import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useStore } from '../../stores/app';
import { cn } from '@sanctuary/ui';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen } = useStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main 
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        {children}
      </main>
    </div>
  );
}
