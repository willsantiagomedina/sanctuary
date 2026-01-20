import { useCallback, useMemo } from 'react';
import { authClient, useSession } from './client';

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
 */
export function useBetterAuth(): UseBetterAuthReturn {
  const session = useSession();

  const getToken = useCallback(async (options?: { forceRefresh?: boolean }) => {
    if (!session.data) return null;
    
    if (options?.forceRefresh) {
      // Force refresh the session to get a new token
      await authClient.session.refresh();
    }
    
    return session.data.session?.token ?? null;
  }, [session.data]);

  return useMemo(() => ({
    user: session.data?.user ? {
      id: session.data.user.id,
      email: session.data.user.email,
      name: session.data.user.name ?? undefined,
      image: session.data.user.image ?? undefined,
    } : null,
    isAuthenticated: !!session.data?.user,
    isLoading: session.isPending,
    signIn: authClient.signIn,
    signOut: authClient.signOut,
    signUp: authClient.signUp,
    getToken,
  }), [session.data, session.isPending, getToken]);
}
