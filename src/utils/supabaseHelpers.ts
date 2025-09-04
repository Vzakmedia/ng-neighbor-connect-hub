// Helper functions for Supabase TypeScript compatibility
export const withTypeAssertion = (fn: any) => {
  return (...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error('Supabase operation error:', error);
      throw error;
    }
  };
};

export const assertSupabaseData = (data: any) => {
  return data as any;
};

export const safeSupabaseQuery = (query: any) => {
  return query as any;
};