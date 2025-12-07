const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

/**
 * Get the appropriate authentication redirect URL based on the platform.
 * 
 * For native mobile apps (Capacitor), uses a custom URL scheme (neighborlink://)
 * to handle deep links and avoid redirecting to Chrome.
 * 
 * For web browsers, uses the current window origin.
 */
export const getAuthRedirectUrl = (): string => {
  // Check if running in a native mobile app
  const isNativeApp = isNativePlatform();
  
  if (isNativeApp) {
    // Use custom URL scheme for deep linking in mobile apps
    return 'neighborlink://auth/callback';
  }
  
  // Use current origin for web browsers
  return `${window.location.origin}/`;
};
