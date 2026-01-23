import React, { useEffect, useMemo } from 'react';
import { cn } from '@sanctuary/ui';
import { useEditorStore, UserPresence } from '../../stores/editor';
import { useAuth } from '../../contexts/AuthContext';

// User avatar colors (consistent per user)
const PRESENCE_COLORS = [
  '#F87171', // red
  '#FB923C', // orange
  '#FBBF24', // amber
  '#A3E635', // lime
  '#34D399', // emerald
  '#22D3EE', // cyan
  '#60A5FA', // blue
  '#A78BFA', // violet
  '#F472B6', // pink
];

// Get consistent color for user
function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length];
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Cursor component
interface PresenceCursorProps {
  user: UserPresence;
  containerRef: React.RefObject<HTMLElement>;
  zoom: number;
}

export function PresenceCursor({ user, containerRef: _containerRef, zoom }: PresenceCursorProps) {
  const scale = zoom / 100;
  
  if (user.cursorX === undefined || user.cursorY === undefined) return null;
  
  // Check if user is inactive (> 5 seconds)
  const isInactive = Date.now() - user.lastActive > 5000;
  
  return (
    <div
      className={cn(
        'absolute pointer-events-none transition-all duration-75',
        isInactive && 'opacity-50'
      )}
      style={{
        left: user.cursorX * scale,
        top: user.cursorY * scale,
        zIndex: 1000,
      }}
    >
      {/* Cursor arrow */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="drop-shadow-md"
      >
        <path
          d="M0 0L16 6L9 9L6 16L0 0Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* Name label */}
      <div
        className={cn(
          'absolute left-4 top-3 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap',
          'transition-opacity duration-300',
          isInactive ? 'opacity-0' : 'opacity-100'
        )}
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </div>
    </div>
  );
}

// Avatar list for collaborators
interface PresenceAvatarsProps {
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PresenceAvatars({ maxVisible = 5, size = 'md' }: PresenceAvatarsProps) {
  const { collaborators, localUser } = useEditorStore();
  
  // Filter out inactive users (> 30 seconds)
  const activeUsers = useMemo(() => {
    return collaborators.filter(u => Date.now() - u.lastActive < 30000);
  }, [collaborators]);
  
  const visibleUsers = activeUsers.slice(0, maxVisible);
  const overflowCount = activeUsers.length - maxVisible;
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };
  
  if (activeUsers.length === 0) return null;
  
  return (
    <div className="flex items-center -space-x-2">
      {visibleUsers.map((user) => (
        <div
          key={user.id}
          className={cn(
            'relative rounded-full border-2 border-background flex items-center justify-center font-medium text-white',
            sizeClasses[size]
          )}
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {getInitials(user.name)}
          
          {/* Activity indicator */}
          {Date.now() - user.lastActive < 5000 && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>
      ))}
      
      {overflowCount > 0 && (
        <div
          className={cn(
            'relative rounded-full border-2 border-background flex items-center justify-center font-medium bg-muted text-muted-foreground',
            sizeClasses[size]
          )}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
}

// Element selection indicator
interface ElementSelectionIndicatorProps {
  elementId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export function ElementSelectionIndicator({
  elementId,
  x,
  y,
  width,
  height,
  zoom,
}: ElementSelectionIndicatorProps) {
  const { collaborators } = useEditorStore();
  
  // Find collaborator selecting this element
  const selector = collaborators.find(u => u.selectedElementId === elementId);
  
  if (!selector) return null;
  
  const scale = zoom / 100;
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x * scale,
        top: y * scale,
        width: width * scale,
        height: height * scale,
        border: `2px solid ${selector.color}`,
        borderRadius: 4,
      }}
    >
      {/* User name badge */}
      <div
        className="absolute -top-6 left-0 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: selector.color }}
      >
        {selector.name}
      </div>
    </div>
  );
}

// Slide presence indicator (who's viewing which slide)
interface SlidePresenceIndicatorProps {
  slideIndex: number;
}

export function SlidePresenceIndicator({ slideIndex }: SlidePresenceIndicatorProps) {
  const { collaborators } = useEditorStore();
  
  // Find collaborators viewing this slide
  const viewers = collaborators.filter(u => u.currentSlideIndex === slideIndex);
  
  if (viewers.length === 0) return null;
  
  return (
    <div className="absolute -right-1 -top-1 flex -space-x-1">
      {viewers.slice(0, 3).map((user) => (
        <div
          key={user.id}
          className="w-4 h-4 rounded-full border border-background flex items-center justify-center text-[8px] font-medium text-white"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {getInitials(user.name).charAt(0)}
        </div>
      ))}
    </div>
  );
}

// Hook for presence synchronization (would connect to Convex)
export function usePresenceSync() {
  const { setLocalUser, setCollaborators, updateLocalCursor, localUser } = useEditorStore();
  const { user, isAuthenticated } = useAuth();
  
  // Initialize local user
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLocalUser(null);
      return;
    }
    const name = user.name || user.email;
    setLocalUser({
      id: user._id,
      name: name || 'User',
      color: getUserColor(user._id),
      lastActive: Date.now(),
    });
  }, [isAuthenticated, setLocalUser, user]);
  
  // Track cursor position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle updates
      if (Math.random() > 0.1) return; // Only 10% of events
      updateLocalCursor(e.clientX, e.clientY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [updateLocalCursor]);
  
  useEffect(() => {
    setCollaborators([]);
  }, [setCollaborators]);
  
  return { localUser };
}
