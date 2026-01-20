import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import toast from 'react-hot-toast';

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
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  createOrganization: (name: string) => Promise<boolean>;
  switchOrganization: (orgId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Simple storage helper
const AUTH_KEY = 'sanctuary-auth';
const ORG_KEY = 'sanctuary-org';
const ORGS_KEY = 'sanctuary-orgs';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_KEY);
    const storedOrg = localStorage.getItem(ORG_KEY);
    const storedOrgs = localStorage.getItem(ORGS_KEY);
    
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    
    if (storedOrg) {
      try {
        setCurrentOrganization(JSON.parse(storedOrg));
      } catch (e) {
        localStorage.removeItem(ORG_KEY);
      }
    }
    
    if (storedOrgs) {
      try {
        setUserOrganizations(JSON.parse(storedOrgs));
      } catch (e) {
        localStorage.removeItem(ORGS_KEY);
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // For demo, we'll use localStorage-based auth
      // In production, this would call BetterAuth
      const userData: User = {
        _id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
      };
      
      setUser(userData);
      localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      
      // Load user's organizations
      const storedOrgs = localStorage.getItem(`${ORGS_KEY}-${email}`);
      if (storedOrgs) {
        const orgs = JSON.parse(storedOrgs);
        setUserOrganizations(orgs);
        if (orgs.length > 0) {
          setCurrentOrganization(orgs[0]);
          localStorage.setItem(ORG_KEY, JSON.stringify(orgs[0]));
        }
        localStorage.setItem(ORGS_KEY, storedOrgs);
      }
      
      toast.success('Welcome back!');
      return true;
    } catch (error) {
      toast.error('Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const userData: User = {
        _id: `user-${Date.now()}`,
        email,
        name: name || email.split('@')[0],
      };
      
      setUser(userData);
      localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      toast.success('Account created!');
      return true;
    } catch (error) {
      toast.error('Signup failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentOrganization(null);
    setUserOrganizations([]);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ORG_KEY);
    localStorage.removeItem(ORGS_KEY);
    toast.success('Signed out');
  };

  const createOrganization = async (name: string): Promise<boolean> => {
    try {
      const newOrg: Organization = {
        _id: `org-${Date.now()}`,
        name,
        role: 'owner',
      };
      
      const updatedOrgs = [...userOrganizations, newOrg];
      setUserOrganizations(updatedOrgs);
      setCurrentOrganization(newOrg);
      
      localStorage.setItem(ORG_KEY, JSON.stringify(newOrg));
      localStorage.setItem(ORGS_KEY, JSON.stringify(updatedOrgs));
      if (user?.email) {
        localStorage.setItem(`${ORGS_KEY}-${user.email}`, JSON.stringify(updatedOrgs));
      }
      
      toast.success('Organization created!');
      return true;
    } catch (error) {
      toast.error('Failed to create organization');
      return false;
    }
  };

  const switchOrganization = (orgId: string) => {
    const org = userOrganizations.find((o) => o._id === orgId);
    if (org) {
      setCurrentOrganization(org);
      localStorage.setItem(ORG_KEY, JSON.stringify(org));
      toast.success(`Switched to ${org.name}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        currentOrganization,
        userOrganizations,
        login,
        signup,
        logout,
        createOrganization,
        switchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
