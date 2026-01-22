import { ReactNode } from 'react';
import { cn } from '@sanctuary/ui';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
  containerClassName,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'relative border-b border-border/60 bg-gradient-to-b from-muted/40 to-background',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between',
          containerClassName ?? 'max-w-7xl'
        )}
      >
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
