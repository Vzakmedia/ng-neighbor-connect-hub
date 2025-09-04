// Temporary component wrapper to bypass TypeScript issues
import React from 'react';

export const withSupabaseTypeWorkaround = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => {
    try {
      return <Component {...props} />;
    } catch (error) {
      console.error('Component error:', error);
      return <div>Error loading component</div>;
    }
  };
};

export const safelyAssertData = (data: any) => {
  if (data && typeof data === 'object' && !('error' in data) && data !== null) {
    return data;
  }
  return null;
};