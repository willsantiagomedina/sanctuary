import { createContext, useContext, ReactNode } from 'react';
import { useUser, useClerk, SignedIn, SignedOut } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { isClerkConfigured } from '../lib/auth/client';

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
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

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

  return (
    <AuthContext.Provider
      value={{
        user: contextUser,
        isAuthenticated: !!user,
        isLoading: !isLoaded,
        currentOrganization: null, // TODO: Implement with Clerk organizations
        userOrganizations: [],
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Fallback provider when Clerk is not configured (demo mode)
function DemoAuthProvider({ children }: { children: ReactNode }) {
  // Demo mode - always authenticated with a fake user
  const demoUser: User = {
    _id: 'demo-user',
    email: 'demo@sanctuary.app',
    name: 'Demo User',
  };

  return (
    <AuthContext.Provider
      value={{
        user: demoUser,
        isAuthenticated: true,
        isLoading: false,
        currentOrganization: null,
        userOrganizations: [],
        logout: () => toast.success('Demo mode - refresh to reset'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (isClerkConfigured) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
  }
  return <DemoAuthProvider>{children}</DemoAuthProvider>;
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
