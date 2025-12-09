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

  // Debug: Log state changes
  useEffect(() => {
    console.log('AuthProvider state:', {
      hasUser: !!user,
      hasSession: !!session,
      loading,
      userId: user?.id,
      email: user?.email,
    });
  }, [user, session, loading]);

  // Safety timeout - ensure loading never stays true forever (prevents infinite spinner)
  useEffect(() => {
    if (!loading) return;
    
    const timeout = setTimeout(() => {
      console.warn('[Auth] Safety timeout triggered after 10s - forcing loading=false');
      setLoading(false);
    }, 10000); // 10 seconds max
    
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    console.log("AuthProvider useEffect starting");
    try {
      // Set up auth state listener FIRST
      // CRITICAL: Only synchronous state updates in this callback to prevent deadlocks
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log("Auth state changed:", event, session?.user?.email_confirmed_at);
          
          // Handle sign out immediately
          if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
          
          // ONLY synchronous state updates - NO Supabase calls in callback
          setSession(session);
          
          // Allow OAuth users through immediately, only require email confirmation for email/password signups
          const isOAuthUser = session?.user?.app_metadata?.provider !== 'email';
          
          if (session?.user && (session.user.email_confirmed_at || isOAuthUser)) {
            setUser(session.user);
          } else {
            setUser(null);
          }
          
          // Set loading false for relevant events
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setLoading(false);
          }
          
          // DEFER token refresh check using setTimeout(0) to prevent deadlock
          if (session?.expires_at) {
            const expiresAt = session.expires_at * 1000;
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            
            if (expiresAt - now < fiveMinutes && expiresAt > now) {
              console.log('Token expiring soon, will refresh...');
              // CRITICAL: Use setTimeout(0) to defer Supabase call
              setTimeout(() => {
                supabase.auth.refreshSession().catch(e => {
                  console.error('Failed to refresh session:', e);
                });
              }, 0);
            }
          }
        }
      );
      console.log("Auth listener set up successfully");

      // THEN check for existing session with validation + 15s timeout (increased for native)
      const fetchSessionWithRetry = async (retries = 2): Promise<{ data: { session: Session | null }, error: Error | null }> => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            console.log(`[Auth] getSession attempt ${attempt + 1}/${retries + 1}`);
            
            const sessionTimeout = new Promise<{ data: { session: null }, error: Error }>((resolve) => {
              setTimeout(() => {
                console.warn(`[Auth] getSession() timed out (attempt ${attempt + 1})`);
                resolve({ data: { session: null }, error: new Error('Session fetch timeout') });
              }, 15000); // Increased to 15s for native storage
            });
            
            const result = await Promise.race([
              supabase.auth.getSession(),
              sessionTimeout
            ]);
            
            // If we got a session or no error, return
            if (result.data.session || !result.error) {
              return result;
            }
            
            // If error and more retries, wait and retry
            if (attempt < retries) {
              console.log(`[Auth] Retrying session fetch in 1s...`);
              await new Promise(r => setTimeout(r, 1000));
            }
          } catch (e) {
            console.error(`[Auth] getSession error (attempt ${attempt + 1}):`, e);
            if (attempt === retries) {
              return { data: { session: null }, error: e as Error };
            }
          }
        }
        return { data: { session: null }, error: new Error('All session fetch attempts failed') };
      };
      
      fetchSessionWithRetry().then(({ data: { session }, error }) => {
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }
        
        console.log("Got existing session:", session?.user?.email_confirmed_at);
        
        // Validate session token if present
        if (session?.expires_at) {
          const expiresAt = session.expires_at * 1000;
          const now = Date.now();
          
          if (expiresAt < now) {
            console.warn('Stored session expired, refreshing...');
            supabase.auth.refreshSession();
            return;
          }
        }
        
        setSession(session);
        
        // Apply same email confirmation logic for initial session
        const isOAuthUser = session?.user?.app_metadata?.provider !== 'email';
        
        if (session?.user && (session.user.email_confirmed_at || isOAuthUser)) {
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
      
      // Clear all possible auth storage keys using native storage
      const { useNativeStorage } = await import('@/hooks/mobile/useNativeStorage');
      const { removeItem } = useNativeStorage();
      await removeItem('neighborlink-auth');
      await removeItem('supabase.auth.token');
      await removeItem('sb-cowiviqhrnmhttugozbz-auth-token');
      
      // Clear session storage (used for splash screen tracking)
      sessionStorage.clear();
      
      // Redirect to landing page after sign out
      window.location.href = '/';
      
    } catch (error) {
      console.error("Sign out catch error:", error);
      // Clear local state and storage anyway
      setUser(null);
      setSession(null);
      localStorage.clear(); // Clear all localStorage as fallback
      sessionStorage.clear();
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