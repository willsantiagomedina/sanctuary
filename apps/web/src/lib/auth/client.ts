import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTERAUTH_URL,
});

export { authClient };

// Re-export hooks for convenience
export const {
  useSession,
  signIn,
  signOut,
  signUp,
} = authClient;
