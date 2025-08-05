import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("AuthProvider component rendering");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider useEffect starting");
    try {
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log("Auth state changed:", event, session?.user?.email_confirmed_at);
          setSession(session);
          
          // Only set user if email is confirmed (ALL users need email confirmation)
          if (session?.user && session.user.email_confirmed_at) {
            setUser(session.user);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );
      console.log("Auth listener set up successfully");

      // THEN check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("Got existing session:", session?.user?.email_confirmed_at);
        setSession(session);
        
        // Apply same email confirmation logic for initial session
        if (session?.user && session.user.email_confirmed_at) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }).catch((error) => {
        console.error("Error getting session:", error);
        setLoading(false);
      });

      return () => {
        console.log("Cleaning up auth subscription");
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error in AuthProvider useEffect:", error);
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log("Attempting to sign out...");
      
      // Sign out from Supabase first (this clears the session from storage)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
      } else {
        console.log("Sign out successful");
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      
      // Clear any remaining auth data from localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-cowiviqhrnmhttugozbz-auth-token');
      
      // Redirect to landing page after sign out
      window.location.href = '/';
      
    } catch (error) {
      console.error("Sign out catch error:", error);
      // Clear local state and storage anyway
      setUser(null);
      setSession(null);
      localStorage.clear(); // Clear all localStorage as fallback
      window.location.href = '/';
    }
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signOut,
  }), [user, session, loading, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}