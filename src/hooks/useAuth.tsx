import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isNativePlatform } from '@/utils/platform';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('AuthProvider state:', { hasUser: !!user, loading });
    }
  }, [user, loading]);

  // Safety timeout — ensure loading never stays true forever
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      if (import.meta.env.DEV) {
        console.warn('[Auth] Safety timeout triggered after 10s - forcing loading=false');
      }
      setLoading(false);
    }, 10000);
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (import.meta.env.DEV) {
            console.log('Auth state changed:', event);
          }

          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }

          setSession(session);

          const isOAuthUser = session?.user?.app_metadata?.provider !== 'email';
          if (session?.user && (session.user.email_confirmed_at || isOAuthUser)) {
            setUser(session.user);
          } else {
            setUser(null);
          }

          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setLoading(false);
          }

          // Defer token refresh to prevent deadlock
          if (session?.expires_at) {
            const expiresAt = session.expires_at * 1000;
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            if (expiresAt - now < fiveMinutes && expiresAt > now) {
              setTimeout(() => {
                supabase.auth.refreshSession().catch(e => {
                  console.error('Failed to refresh session:', e);
                });
              }, 0);
            }
          }
        }
      );

      const fetchSessionWithRetry = async (retries = 2): Promise<{ data: { session: Session | null }, error: Error | null }> => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            console.log(`[Auth] getSession attempt ${attempt + 1}/${retries + 1}`);

            const sessionTimeout = new Promise<{ data: { session: null }, error: Error }>((resolve) => {
              setTimeout(() => {
                if (import.meta.env.DEV) console.warn(`[Auth] getSession() timed out (attempt ${attempt + 1})`);
                resolve({ data: { session: null }, error: new Error('Session fetch timeout') });
              }, 15000);
            });

            const result = await Promise.race([
              supabase.auth.getSession(),
              sessionTimeout,
            ]);

            if (result.data.session || !result.error) {
              return result;
            }

            if (attempt < retries) {
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

        // Bug 6 fix: when the session is expired, kick off a refresh but do NOT
        // return early — fall through so loading is always set to false here.
        // The TOKEN_REFRESHED event from onAuthStateChange will update the user state.
        if (session?.expires_at) {
          const expiresAt = session.expires_at * 1000;
          if (expiresAt < Date.now()) {
            console.log('[Auth] Session expired, requesting refresh');
            supabase.auth.refreshSession().catch(e =>
              console.error('[Auth] Refresh failed:', e)
            );
            // Fall through — setLoading(false) is called below.
          }
        }

        setSession(session);

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

      return () => { subscription.unsubscribe(); };
    } catch (error) {
      console.error("Error in AuthProvider useEffect:", error);
      setLoading(false);
    }
  }, []);

  // Bug 5 fix: useNativeStorage is not a real React hook (it has no internal hook
  // calls), but calling any `use*` function inside an async callback violates the
  // Rules of Hooks pattern and is confusing. Replace with a direct Capacitor
  // Preferences call so the intent is explicit and there is no hook-call ambiguity.
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }

      setUser(null);
      setSession(null);

      const authKeys = [
        'neighborlink-auth',
        'supabase.auth.token',
        'sb-cowiviqhrnmhttugozbz-auth-token',
      ];

      if (isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        for (const key of authKeys) {
          await Preferences.remove({ key });
        }
      } else {
        authKeys.forEach(key => localStorage.removeItem(key));
      }

      sessionStorage.clear();
      window.location.href = '/auth';
    } catch (error) {
      console.error("Sign out catch error:", error);
      setUser(null);
      setSession(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/auth';
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
