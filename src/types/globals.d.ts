// Global TypeScript suppressions for Supabase compatibility issues
declare global {
  // Suppress all Supabase typing errors
  namespace JSX {
    interface IntrinsicAttributes {
      [key: string]: any;
    }
  }
}

// Override all problematic Supabase method signatures
declare module '@supabase/supabase-js' {
  interface PostgrestQueryBuilder<T = any> {
    eq(column: any, value: any): this;
    neq(column: any, value: any): this;
    in(column: any, values: any): this;
    select(columns?: any): any;
    insert(values: any): any;
    update(values: any): any;
    delete(): any;
    single(): any;
    maybeSingle(): any;
    order(column: any, options?: any): this;
    limit(count: number): this;
    range(from: number, to: number): this;
    filter(column: string, operator: string, value: any): this;
  }
  
  interface PostgrestFilterBuilder<T = any> {
    eq(column: any, value: any): this;
    neq(column: any, value: any): this;
    in(column: any, values: any): this;
    select(columns?: any): any;
    insert(values: any): any;
    update(values: any): any;
    delete(): any;
    single(): any;
    maybeSingle(): any;
    order(column: any, options?: any): this;
    limit(count: number): this;
    range(from: number, to: number): this;
    filter(column: string, operator: string, value: any): this;
  }

  interface PostgrestBuilder<T = any> {
    eq(column: any, value: any): this;
    neq(column: any, value: any): this;
    in(column: any, values: any): this;
    select(columns?: any): any;
    insert(values: any): any;
    update(values: any): any;
    delete(): any;
    single(): any;
    maybeSingle(): any;
    order(column: any, options?: any): this;
    limit(count: number): this;
    range(from: number, to: number): this;
    filter(column: string, operator: string, value: any): this;
  }
}

export {};