// Quick fix for Supabase TypeScript issues
export const supabaseAny = (value: any) => value as any;
export const spreadSafe = (obj: any) => (obj && typeof obj === 'object' ? obj : {});
export const safeAccess = (obj: any, prop: string) => obj?.[prop];

// Global type assertion for Supabase queries
declare global {
  interface Window {
    __supabase_type_override__: boolean;
  }
}

if (typeof window !== 'undefined') {
  window.__supabase_type_override__ = true;
}