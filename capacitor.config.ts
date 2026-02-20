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
    backgroundColor: '#ffffff',
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
      launchShowDuration: 2000,
      launchAutoHide: true, // Safety: auto-hide splash after duration
      launchFadeOutDuration: 300,
      backgroundColor: '#667eea',
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
      backgroundColor: '#667eea',
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

    GoogleMaps: {
      apiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
    },

    Haptics: {
      // iOS-specific haptic configuration
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
