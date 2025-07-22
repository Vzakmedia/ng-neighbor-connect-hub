import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: null;
  session: null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function MinimalAuthProvider({ children }: { children: ReactNode }) {
  console.log("MinimalAuthProvider rendering");
  
  const value = {
    user: null,
    session: null,
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