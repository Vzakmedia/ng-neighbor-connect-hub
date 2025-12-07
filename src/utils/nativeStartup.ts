/**
 * Native App Startup Utilities
 * Provides safe initialization for Capacitor plugins with error handling
 */

// Track initialization state
let isInitialized = false;
let initializationError: Error | null = null;

// Cache platform detection result to prevent repeated Capacitor checks
let cachedIsNative: boolean | null = null;

/**
 * Get timestamp for logging
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Safely check if running on native platform (cached for performance)
 */
export const isNativePlatform = (): boolean => {
  // Return cached result if available
  if (cachedIsNative !== null) {
    return cachedIsNative;
  }
  
  const timestamp = getTimestamp();
  try {
    const { Capacitor } = require('@capacitor/core');
    const isNative = Capacitor?.isNativePlatform?.() === true;
    console.log(`[NativeStartup ${timestamp}] Platform check: ${isNative ? 'NATIVE' : 'WEB'}`);
    if (isNative && Capacitor?.getPlatform) {
      console.log(`[NativeStartup ${timestamp}] Platform: ${Capacitor.getPlatform()}`);
    }
    cachedIsNative = isNative;
    return isNative;
  } catch (error) {
    console.log(`[NativeStartup ${timestamp}] Capacitor not available, defaulting to WEB`);
    cachedIsNative = false;
    return false;
  }
};

/**
 * Safely hide the splash screen with error handling
 */
export const hideSplashScreen = async (): Promise<void> => {
  const timestamp = getTimestamp();
  console.log(`[NativeStartup ${timestamp}] hideSplashScreen() called`);
  
  if (!isNativePlatform()) {
    console.log(`[NativeStartup ${timestamp}] Not on native platform, skipping splash hide`);
    return;
  }

  try {
    console.log(`[NativeStartup ${timestamp}] Importing SplashScreen plugin...`);
    const { SplashScreen } = await import('@capacitor/splash-screen');
    console.log(`[NativeStartup ${timestamp}] SplashScreen plugin loaded, hiding with fadeOut...`);
    await SplashScreen.hide({ fadeOutDuration: 300 });
    console.log(`[NativeStartup ${timestamp}] Splash screen hidden successfully`);
  } catch (error) {
    console.warn(`[NativeStartup ${timestamp}] Failed to hide splash screen:`, error);
    // Don't throw - splash screen will auto-hide due to launchAutoHide: true
  }
};

/**
 * Safely initialize the status bar
 */
export const initializeStatusBar = async (style: 'light' | 'dark' = 'light'): Promise<void> => {
  const timestamp = getTimestamp();
  console.log(`[NativeStartup ${timestamp}] initializeStatusBar() called with style: ${style}`);
  
  if (!isNativePlatform()) {
    console.log(`[NativeStartup ${timestamp}] Not on native platform, skipping status bar init`);
    return;
  }

  try {
    console.log(`[NativeStartup ${timestamp}] Importing StatusBar plugin...`);
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    console.log(`[NativeStartup ${timestamp}] StatusBar plugin loaded, setting style...`);
    await StatusBar.setStyle({ style: style === 'light' ? Style.Light : Style.Dark });
    console.log(`[NativeStartup ${timestamp}] Status bar initialized successfully`);
  } catch (error) {
    console.warn(`[NativeStartup ${timestamp}] Failed to initialize status bar:`, error);
  }
};

/**
 * Main native initialization function
 * Call this after React is mounted
 */
export const initializeNativeApp = async (): Promise<boolean> => {
  const timestamp = getTimestamp();
  console.log(`[NativeStartup ${timestamp}] ========== NATIVE INITIALIZATION START ==========`);
  console.log(`[NativeStartup ${timestamp}] isInitialized: ${isInitialized}`);
  
  if (isInitialized) {
    console.log(`[NativeStartup ${timestamp}] Already initialized, skipping`);
    return true;
  }

  console.log(`[NativeStartup ${timestamp}] Starting native initialization sequence...`);

  try {
    // Step 1: Initialize status bar
    console.log(`[NativeStartup ${timestamp}] Step 1: Initializing status bar...`);
    await initializeStatusBar('light');
    console.log(`[NativeStartup ${timestamp}] Step 1: Complete`);
    
    // Step 2: Small delay for smooth transition
    console.log(`[NativeStartup ${timestamp}] Step 2: Waiting 200ms for smooth transition...`);
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`[NativeStartup ${timestamp}] Step 2: Complete`);
    
    // Step 3: Hide splash screen
    console.log(`[NativeStartup ${timestamp}] Step 3: Hiding splash screen...`);
    await hideSplashScreen();
    console.log(`[NativeStartup ${timestamp}] Step 3: Complete`);
    
    isInitialized = true;
    console.log(`[NativeStartup ${timestamp}] ========== NATIVE INITIALIZATION COMPLETE ==========`);
    return true;
  } catch (error) {
    const errorTimestamp = getTimestamp();
    console.error(`[NativeStartup ${errorTimestamp}] ========== INITIALIZATION FAILED ==========`);
    console.error(`[NativeStartup ${errorTimestamp}] Error:`, error);
    initializationError = error as Error;
    
    // Still mark as initialized to prevent retry loops
    isInitialized = true;
    
    // Try to hide splash screen as fallback
    console.log(`[NativeStartup ${errorTimestamp}] Attempting fallback splash hide...`);
    try {
      await hideSplashScreen();
      console.log(`[NativeStartup ${errorTimestamp}] Fallback splash hide succeeded`);
    } catch (fallbackError) {
      console.warn(`[NativeStartup ${errorTimestamp}] Fallback splash hide failed:`, fallbackError);
      // Splash will auto-hide due to config
    }
    
    return false;
  }
};

/**
 * Get initialization status
 */
export const getInitializationStatus = () => {
  const status = {
    isInitialized,
    error: initializationError,
  };
  console.log(`[NativeStartup ${getTimestamp()}] getInitializationStatus():`, status);
  return status;
};

/**
 * Force hide splash screen (emergency fallback)
 * Call this if the app appears stuck on splash screen
 */
export const forceHideSplash = async (): Promise<void> => {
  const timestamp = getTimestamp();
  console.log(`[NativeStartup ${timestamp}] ========== FORCE HIDE SPLASH ==========`);
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 0 });
    console.log(`[NativeStartup ${timestamp}] Force hide successful`);
  } catch (error) {
    console.warn(`[NativeStartup ${timestamp}] Force hide failed (ignoring):`, error);
    // Ignore errors - best effort
  }
};
