import { ReactNode, useMemo, useCallback } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';
import { isClerkConfigured, clerkPublishableKey } from './client';

interface ConvexProviderWithAuthProps {
  client: ConvexReactClient;
  children: ReactNode;
}

/**
 * Wraps ConvexProvider with Clerk authentication.
 * Falls back to regular ConvexProvider if Clerk is not configured.
 */
export function ConvexProviderWithAuth({ client, children }: ConvexProviderWithAuthProps) {
  if (!isClerkConfigured) {
    // No auth configured - use regular ConvexProvider
    return <ConvexProvider client={client}>{children}</ConvexProvider>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk client={client} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
