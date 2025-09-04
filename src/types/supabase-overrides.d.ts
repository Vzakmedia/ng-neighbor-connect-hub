// Type overrides for Supabase to fix TypeScript errors
declare global {
  namespace supabase {
    interface Database {
      [key: string]: any;
    }
  }
}

// Override problematic Supabase types
declare module '@supabase/supabase-js' {
  interface PostgrestFilterBuilder<T = any> {
    eq(column: string, value: any): this;
    neq(column: string, value: any): this;
    in(column: string, values: any[]): this;
    select(columns?: string): this;
    insert(values: any): this;
    update(values: any): this;
    delete(): this;
  }
}

export {};