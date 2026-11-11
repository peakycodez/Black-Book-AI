import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isSupabaseConfigured, supabase } from '@/db/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type UserType = 'guest' | 'authenticated';

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  avatar?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  loginAsGuest: () => void;
  signUp: (email: string, password: string) => Promise<{ needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'blackbook_guest_mode';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const restoreGuestSession = () => {
      const guestMode = localStorage.getItem(GUEST_STORAGE_KEY);
      if (guestMode === 'true') {
        setUser({
          id: 'guest',
          name: 'Guest User',
          email: '',
          type: 'guest',
        });
      }
      setLoading(false);
    };

    if (!isSupabaseConfigured) {
      restoreGuestSession();
      return;
    }

    // Check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setUser(mapSupabaseUser(session.user));
          setLoading(false);
        } else {
          restoreGuestSession();
        }
      })
      .catch(() => {
        restoreGuestSession();
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        localStorage.removeItem(GUEST_STORAGE_KEY);
      } else {
        const guestMode = localStorage.getItem(GUEST_STORAGE_KEY);
        if (guestMode === 'true') {
          setUser({
            id: 'guest',
            name: 'Guest User',
            email: '',
            type: 'guest',
          });
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
      type: 'authenticated',
      avatar: supabaseUser.user_metadata?.avatar_url,
      emailVerified: supabaseUser.email_confirmed_at !== null,
    };
  };

  const loginAsGuest = () => {
    const guestUser: User = {
      id: 'guest',
      name: 'Guest User',
      email: '',
      type: 'guest',
    };
    setUser(guestUser);
    localStorage.setItem(GUEST_STORAGE_KEY, 'true');
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Cloud authentication requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Use Guest Mode for offline notes.'
      );
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/workspace`,
      },
    });

    if (error) throw error;

    // Check if email confirmation is required
    const needsVerification = !data.session;

    return { needsVerification };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Cloud authentication requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Use Guest Mode for offline notes.'
      );
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      setUser(mapSupabaseUser(data.user));
    }
  };

  const resendVerification = async (email: string) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Cloud authentication requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      );
    }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) throw error;
  };

  const logout = async () => {
    if (user?.type === 'authenticated') {
      await supabase.auth.signOut();
    } else {
      // Guest logout
      localStorage.removeItem(GUEST_STORAGE_KEY);
      localStorage.removeItem('blackbook_data');
    }
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isGuest: user?.type === 'guest',
    isAuthenticated: user?.type === 'authenticated',
    loading,
    loginAsGuest,
    signUp,
    signIn,
    resendVerification,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
