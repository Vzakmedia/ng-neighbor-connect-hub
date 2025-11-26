import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.1a2a500fc780403294cae7185a964f07',
  appName: 'Neighborlink',
  webDir: 'dist',
  bundledWebRuntime: false,
  
  server: {
    // Development server - enables hot reload from Lovable sandbox
    url: process.env.NODE_ENV === 'development' 
      ? 'https://1a2a500f-c780-4032-94ca-e7185a964f07.lovableproject.com?forceHideBadge=true'
      : undefined,
    cleartext: true,
    androidScheme: 'https',
    iosScheme: 'neighborlink'
  },

  android: {
    allowMixedContent: process.env.NODE_ENV === 'development',
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
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
    mediaTypesRequiringUserActionForPlayback: [],
    allowsBackForwardNavigationGestures: true,
    scrollEnabled: true,
    preferredContentMode: 'mobile'
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#667eea',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
      sound: 'notification.caf'
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
      enabled: true
    },

    Haptics: {
      // iOS-specific haptic configuration
    }
  }
};

export default config;
