import { ReactNode, useMemo } from 'react';
import { ConvexProviderWithAuth as ConvexAuthProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';
import { useBetterAuth } from './use-betterauth';

interface ConvexProviderWithAuthProps {
  client: ConvexReactClient;
  children: ReactNode;
}

/**
 * Wraps ConvexProvider with BetterAuth token integration.
 * Convex will validate tokens against BetterAuth's JWKS endpoint.
 */
export function ConvexProviderWithAuth({ client, children }: ConvexProviderWithAuthProps) {
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
