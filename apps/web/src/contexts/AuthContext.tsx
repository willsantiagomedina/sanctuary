import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useUser, useClerk, SignedIn, SignedOut } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { isClerkConfigured } from '../lib/auth/client';
import { api } from '../../convex/_generated/api.js';
import { convexClient } from '../lib/convex/client';

// Types
interface User {
  _id: string;
  email: string;
  name?: string;
  image?: string;
}

interface Organization {
  _id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentOrganization: Organization | null;
  userOrganizations: Organization[];
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Clerk-based auth provider
function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Timeout fallback - if Clerk doesn't load in 10 seconds, stop waiting
  useEffect(() => {
    if (isLoaded) return;
    
    const timeout = setTimeout(() => {
      console.warn('Clerk auth loading timed out after 10s');
      setHasTimedOut(true);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isLoaded]);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      console.error('Clerk user is missing a primary email address.');
      return;
    }
    const name = user.fullName || user.firstName || email;
    void convexClient.mutation(api.users.createOrGet, {
      email,
      name,
      authId: user.id,
      preferredLanguage: 'en',
    }).catch((error) => {
      console.error('Failed to sync user record:', error);
    });
  }, [isSignedIn, user]);

  const logout = () => {
    signOut();
    toast.success('Signed out');
  };

  const contextUser: User | null = user ? {
    _id: user.id,
    email: user.primaryEmailAddress?.emailAddress || '',
    name: user.fullName || user.firstName || undefined,
    image: user.imageUrl || undefined,
  } : null;

  // Consider loaded if Clerk reports loaded OR if we've timed out
  const effectivelyLoaded = isLoaded || hasTimedOut;

  return (
    <AuthContext.Provider
      value={{
        user: contextUser,
        isAuthenticated: !!isSignedIn,
        isLoading: !effectivelyLoaded,
        currentOrganization: null,
        userOrganizations: [],
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function MissingClerkConfig() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-2xl font-semibold">Authentication is not configured</h1>
        <p className="text-sm text-muted-foreground">
          Set `VITE_CLERK_PUBLISHABLE_KEY` in the web environment and
          `CLERK_JWT_ISSUER_DOMAIN` in Convex to enable secure sign in.
        </p>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (isClerkConfigured) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
  }
  return <MissingClerkConfig />;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export Clerk components for convenience
export { SignedIn, SignedOut };
