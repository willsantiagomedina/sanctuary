import { useCallback, useMemo, useState, useEffect } from 'react';
import { authClient, useSession, isBetterAuthConfigured } from './client';

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
  signIn: typeof authClient.signIn;
  signOut: typeof authClient.signOut;
  signUp: typeof authClient.signUp;
  getToken: (options?: { forceRefresh?: boolean }) => Promise<string | null>;
}

export type UseBetterAuthReturn = AuthState & AuthActions;

/**
 * Main auth hook for BetterAuth integration
 * Works identically in browser and Electron
 * Returns null user when BetterAuth is not configured
 */
export function useBetterAuth(): UseBetterAuthReturn {
  const session = useSession();
  const [isReady, setIsReady] = useState(!isBetterAuthConfigured);

  useEffect(() => {
    // Wait for dynamic import to complete
    if (isBetterAuthConfigured) {
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const getToken = useCallback(async (_options?: { forceRefresh?: boolean }) => {
    if (!session.data?.session) return null;
    return session.data.session.token ?? null;
  }, [session.data]);

  return useMemo(() => ({
    user: session.data?.user ? {
      id: session.data.user.id,
      email: session.data.user.email,
      name: session.data.user.name ?? undefined,
      image: session.data.user.image ?? undefined,
    } : null,
    isAuthenticated: !!session.data?.user,
    isLoading: !isReady || session.isPending,
    signIn: authClient.signIn,
    signOut: authClient.signOut,
    signUp: authClient.signUp,
    getToken,
  }), [session.data, session.isPending, isReady, getToken]);
}
