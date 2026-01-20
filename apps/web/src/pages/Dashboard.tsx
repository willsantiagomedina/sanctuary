import { Link } from 'react-router-dom';
import { Plus, Clock, Star, FolderOpen } from 'lucide-react';
import { Button, cn } from '@sanctuary/ui';

// Mock data - will be replaced with Convex queries
const recentPresentations = [
  { id: '1', title: 'Sunday Service - Jan 19', updatedAt: '2 hours ago', slides: 12 },
  { id: '2', title: 'Youth Night', updatedAt: '1 day ago', slides: 8 },
  { id: '3', title: 'Christmas Eve Service', updatedAt: '3 days ago', slides: 24 },
];

export function Dashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Create and manage your worship presentations</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Presentation
        </Button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickActionCard
          icon={<Plus className="h-6 w-6" />}
          title="Create Presentation"
          description="Start from scratch or use a template"
          href="/presentations/new"
        />
        <QuickActionCard
          icon={<Star className="h-6 w-6" />}
          title="Browse Templates"
          description="Pre-designed layouts for services"
          href="/templates"
        />
        <QuickActionCard
          icon={<FolderOpen className="h-6 w-6" />}
          title="Import Presentation"
          description="Import from FreeShow or PowerPoint"
          href="/import"
        />
      </div>

      {/* Recent presentations */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Recent Presentations</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recentPresentations.map((presentation) => (
            <PresentationCard key={presentation.id} {...presentation} />
          ))}
        </div>
      </section>

      {/* Upcoming services */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Services</h2>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-muted-foreground text-center py-8">
            No upcoming services scheduled. 
            <Link to="/schedule" className="text-primary hover:underline ml-1">
              Schedule a service
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

function QuickActionCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="flex items-start gap-4 p-4 bg-card border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="p-2 bg-primary/10 text-primary rounded-lg">{icon}</div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

function PresentationCard({
  id,
  title,
  updatedAt,
  slides,
}: {
  id: string;
  title: string;
  updatedAt: string;
  slides: number;
}) {
  return (
    <Link
      to={`/presentations/${id}`}
      className="group bg-card border rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <span className="text-white/50 text-sm">{slides} slides</span>
      </div>
      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium truncate group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{updatedAt}</p>
      </div>
    </Link>
  );
}
