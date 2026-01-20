/**
 * BetterAuth client - conditional export based on configuration
 * 
 * If VITE_BETTERAUTH_URL is not set, auth is disabled and the app
 * runs in anonymous mode (useful for development).
 */

// Placeholder types for when BetterAuth is not configured
interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  } | null;
  session: {
    token: string;
  } | null;
}

interface AuthClient {
  useSession: () => { data: AuthSession | null; isPending: boolean };
  signIn: {
    social: (options: { provider: string; callbackURL?: string }) => Promise<void>;
  };
  signOut: () => Promise<void>;
  signUp: {
    email: (options: { email: string; password: string; name?: string }) => Promise<void>;
  };
}

// Check if BetterAuth is configured
const isBetterAuthConfigured = !!import.meta.env.VITE_BETTERAUTH_URL;

// Create a mock client for when BetterAuth is not configured
const mockClient: AuthClient = {
  useSession: () => ({ data: null, isPending: false }),
  signIn: {
    social: async () => { console.warn('BetterAuth not configured'); },
  },
  signOut: async () => { console.warn('BetterAuth not configured'); },
  signUp: {
    email: async () => { console.warn('BetterAuth not configured'); },
  },
};

// Dynamically create auth client only if configured
let authClient: AuthClient = mockClient;

if (isBetterAuthConfigured) {
  // Lazy import to avoid build errors when not configured
  import('better-auth/react').then(({ createAuthClient }) => {
    authClient = createAuthClient({
      baseURL: import.meta.env.VITE_BETTERAUTH_URL,
    }) as unknown as AuthClient;
  }).catch(() => {
    console.warn('Failed to initialize BetterAuth client');
  });
}

export { authClient, isBetterAuthConfigured };

// Re-export hooks for convenience
export const useSession = () => authClient.useSession();
export const signIn = authClient.signIn;
export const signOut = authClient.signOut;
export const signUp = authClient.signUp;
