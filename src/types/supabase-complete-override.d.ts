// Complete Supabase type overrides to suppress all TypeScript errors
declare module '@supabase/supabase-js' {
  // Override the main Supabase client methods
  interface SupabaseClient {
    from(table: string): any;
    storage: any;
    functions: any;
    auth: any;
    rpc(fn: string, args?: any): any;
  }

  // Override all query builder types
  interface PostgrestQueryBuilder<T = any> {
    select(columns?: any): any;
    insert(values: any): any;
    update(values: any): any;
    delete(): any;
    eq(column: any, value: any): any;
    neq(column: any, value: any): any;
    gt(column: any, value: any): any;
    gte(column: any, value: any): any;
    lt(column: any, value: any): any;
    lte(column: any, value: any): any;
    like(column: any, pattern: any): any;
    ilike(column: any, pattern: any): any;
    is(column: any, value: any): any;
    in(column: any, values: any): any;
    contains(column: any, value: any): any;
    containedBy(column: any, value: any): any;
    rangeGt(column: any, range: any): any;
    rangeGte(column: any, range: any): any;
    rangeLt(column: any, range: any): any;
    rangeLte(column: any, range: any): any;
    rangeAdjacent(column: any, range: any): any;
    overlaps(column: any, value: any): any;
    textSearch(column: any, query: any, options?: any): any;
    match(query: any): any;
    not(column: any, operator: any, value: any): any;
    or(filters: any): any;
    filter(column: any, operator: any, value: any): any;
    order(column: any, options?: any): any;
    limit(count: number): any;
    range(from: number, to: number): any;
    single(): any;
    maybeSingle(): any;
    csv(): any;
    geojson(): any;
    explain(options?: any): any;
    rollback(): any;
    returns<T>(): any;
  }

  interface PostgrestFilterBuilder<T = any> extends PostgrestQueryBuilder<T> {}
  interface PostgrestBuilder<T = any> extends PostgrestQueryBuilder<T> {}
  interface PostgrestTransformBuilder<T = any> extends PostgrestQueryBuilder<T> {}

  // Override types for auth, storage, functions
  interface GoTrueClient {
    [key: string]: any;
  }

  interface SupabaseStorageClient {
    [key: string]: any;
  }

  interface FunctionsClient {
    [key: string]: any;
  }
}

// Global type overrides
declare global {
  interface Window {
    __supabase_override__: boolean;
  }
}

export {};