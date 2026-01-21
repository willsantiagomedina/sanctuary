import { useCallback, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { isClerkConfigured } from './client';

export interface AuthState {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  getToken: (options?: { forceRefresh?: boolean }) => Promise<string | null>;
}

export type UseAuthReturn = AuthState & AuthActions;

function useNoopAuth(): UseAuthReturn {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    getToken: async () => null,
  };
}

function useClerkAuth(): UseAuthReturn {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const fetchToken = useCallback(async (_options?: { forceRefresh?: boolean }) => {
    return getToken({ template: 'convex' });
  }, [getToken]);

  return useMemo(() => ({
    user: user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      name: user.fullName ?? undefined,
      image: user.imageUrl ?? undefined,
    } : null,
    isAuthenticated: !!user,
    isLoading: !isLoaded,
    getToken: fetchToken,
  }), [user, isLoaded, fetchToken]);
}

/**
 * Main auth hook - uses Clerk when configured, otherwise returns null user.
 * The selection happens at module load time to keep hook ordering stable.
 */
export const useAppAuth = isClerkConfigured ? useClerkAuth : useNoopAuth;

// Re-export for backwards compatibility
export const useBetterAuth = useAppAuth;
