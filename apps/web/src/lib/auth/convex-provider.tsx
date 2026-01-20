import { ReactNode, useMemo } from 'react';
import { ConvexProviderWithAuth as ConvexAuthProvider, ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';
import { useBetterAuth } from './use-betterauth';
import { isBetterAuthConfigured } from './client';

interface ConvexProviderWithAuthProps {
  client: ConvexReactClient;
  children: ReactNode;
}

/**
 * Wraps ConvexProvider with BetterAuth token integration.
 * Falls back to regular ConvexProvider if BetterAuth is not configured.
 */
export function ConvexProviderWithAuth({ client, children }: ConvexProviderWithAuthProps) {
  if (!isBetterAuthConfigured) {
    // No auth configured - use regular ConvexProvider
    return <ConvexProvider client={client}>{children}</ConvexProvider>;
  }

  return (
    <ConvexAuthProvider client={client} useAuth={useConvexAuth}>
      {children}
    </ConvexAuthProvider>
  );
}

/**
 * Auth adapter for Convex that uses BetterAuth tokens
 */
function useConvexAuth() {
  const { isAuthenticated, isLoading, getToken } = useBetterAuth();

  return useMemo(() => ({
    isLoading,
    isAuthenticated,
    fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!isAuthenticated) return null;
      return getToken({ forceRefresh: forceRefreshToken });
    },
  }), [isAuthenticated, isLoading, getToken]);
}
