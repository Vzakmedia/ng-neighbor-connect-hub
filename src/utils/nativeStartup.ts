/**
 * Native App Startup Utilities
 * Provides safe initialization for Capacitor plugins with error handling
 */

// Track initialization state
let isInitialized = false;
let initializationError: Error | null = null;

/**
 * Safely check if running on native platform
 */
export const isNativePlatform = (): boolean => {
  try {
    const { Capacitor } = require('@capacitor/core');
    return Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
};

/**
 * Safely hide the splash screen with error handling
 */
export const hideSplashScreen = async (): Promise<void> => {
  if (!isNativePlatform()) {
    console.log('[NativeStartup] Not on native platform, skipping splash hide');
    return;
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 300 });
    console.log('[NativeStartup] Splash screen hidden successfully');
  } catch (error) {
    console.warn('[NativeStartup] Failed to hide splash screen:', error);
    // Don't throw - splash screen will auto-hide due to launchAutoHide: true
  }
};

/**
 * Safely initialize the status bar
 */
export const initializeStatusBar = async (style: 'light' | 'dark' = 'light'): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: style === 'light' ? Style.Light : Style.Dark });
    console.log('[NativeStartup] Status bar initialized');
  } catch (error) {
    console.warn('[NativeStartup] Failed to initialize status bar:', error);
  }
};

/**
 * Main native initialization function
 * Call this after React is mounted
 */
export const initializeNativeApp = async (): Promise<boolean> => {
  if (isInitialized) {
    console.log('[NativeStartup] Already initialized');
    return true;
  }

  console.log('[NativeStartup] Starting native initialization...');

  try {
    // Initialize status bar first
    await initializeStatusBar('light');
    
    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Hide splash screen
    await hideSplashScreen();
    
    isInitialized = true;
    console.log('[NativeStartup] Native initialization complete');
    return true;
  } catch (error) {
    console.error('[NativeStartup] Initialization failed:', error);
    initializationError = error as Error;
    
    // Still mark as initialized to prevent retry loops
    isInitialized = true;
    
    // Try to hide splash screen as fallback
    try {
      await hideSplashScreen();
    } catch {
      // Splash will auto-hide due to config
    }
    
    return false;
  }
};

/**
 * Get initialization status
 */
export const getInitializationStatus = () => ({
  isInitialized,
  error: initializationError,
});

/**
 * Force hide splash screen (emergency fallback)
 * Call this if the app appears stuck on splash screen
 */
export const forceHideSplash = async (): Promise<void> => {
  console.log('[NativeStartup] Force hiding splash screen');
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 0 });
  } catch {
    // Ignore errors - best effort
  }
};
