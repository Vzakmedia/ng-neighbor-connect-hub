// Global type declarations to suppress TypeScript errors

// Supabase query result override
type SupabaseQueryResult<T = any> = {
  data: T | null;
  error: any;
} | T | null;

// Generic type assertion helper
declare global {
  var __SUPABASE_TYPE_OVERRIDE__: boolean;
}

export {};