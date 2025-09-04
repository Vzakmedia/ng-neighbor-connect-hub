// Utility functions for type assertions with Supabase results
export function assertNonNull<T>(value: T | null): T {
  if (value === null) {
    throw new Error('Expected non-null value');
  }
  return value;
}

export function isValidData<T>(data: T | null | undefined): data is T {
  return data !== null && data !== undefined && typeof data === 'object' && !('error' in data);
}

export function safeAssertData<T>(data: any): T | null {
  if (isValidData(data)) {
    return data as T;
  }
  return null;
}