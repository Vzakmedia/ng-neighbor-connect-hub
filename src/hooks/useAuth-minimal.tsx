import { createContext, useContext, ReactNode } from 'react';

// Mock user object for minimal auth
const mockUser = {
  id: 'mock-user-id',
  email: 'user@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: []
};

interface AuthContextType {
  user: typeof mockUser | null;
  session: any;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function MinimalAuthProvider({ children }: { children: ReactNode }) {
  console.log("MinimalAuthProvider rendering");
  
  const value = {
    user: mockUser,
    session: { user: mockUser },
    loading: false,
    signOut: async () => {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useMinimalAuth() {
  console.log("useMinimalAuth called");
  const context = useContext(AuthContext);
  console.log("useMinimalAuth context:", context);
  if (context === undefined) {
    console.error('useMinimalAuth called outside of MinimalAuthProvider!');
    throw new Error('useMinimalAuth must be used within a MinimalAuthProvider');
  }
  return context;
}