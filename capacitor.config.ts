import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neighborlink.app',
  appName: 'Neighborlink',
  webDir: 'dist',
  bundledWebRuntime: false,

  server: {
    // Only use development server URL when explicitly set
    // For production builds, this should be undefined to use webDir
    url: undefined,
    cleartext: true,
    androidScheme: 'https',
    iosScheme: 'neighborlink'
  },

  android: {
    allowMixedContent: false,
    backgroundColor: '#0c9f7a',
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  },

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    scheme: 'neighborlink',
    limitsNavigationsToAppBoundDomains: false,
    allowsInlineMediaPlayback: true,
    webContentsDebuggingEnabled: false,
    mediaTypesRequiringUserActionForPlayback: [],
    allowsBackForwardNavigationGestures: true,
    scrollEnabled: true,
    preferredContentMode: 'mobile'
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      launchFadeOutDuration: 500,
      backgroundColor: '#0c9f7a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },

    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    Geolocation: {
      permissions: ['location', 'locationAlways', 'locationWhenInUse']
    },

    Camera: {
      permissions: ['camera', 'photos']
    },

    StatusBar: {
      style: 'dark',
      backgroundColor: '#0b8d66',
      overlaysWebView: false
    },

    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },

    CapacitorHttp: {
      enabled: false
    },

    // Bug 8 fix: capacitor.config.ts runs in Node.js (not in the browser/Vite bundle),
    // so VITE_-prefixed variables are undefined here. Use the plain env var name.
    // Add GOOGLE_MAPS_API_KEY (without VITE_ prefix) to your CI/build environment.
    GoogleMaps: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      iOSApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    },

    Haptics: {
      // iOS-specific haptic configuration
    },

    BackgroundRunner: {
      label: 'com.neighborlink.background',
      src: 'background.js',
      event: 'syncOfflineQueue',
      repeat: true,
      interval: 15,  // minutes — iOS minimum is 15
      autoSchedule: true,
    },

    CapacitorUpdater: {
      autoUpdate: true,
      appReadyTimeout: 1000,
      responseTimeout: 10,
      autoDeleteFailed: false,
      autoDeletePrevious: false,
      resetWhenUpdate: false,
      updateUrl: 'https://capgo.app/api',
      statsUrl: 'https://capgo.app/api/stats',
      appId: '11822768-a742-46f3-810d-bb57a1453063',
      channel: 'production'
    }
  }
};

export default config;
