# Capacitor Plugins Guide

## Overview

NeighborLink implements a complete set of Capacitor plugins to provide full native mobile functionality on iOS and Android. This ensures the app works like a true native mobile application with proper permissions, native UI components, and device features.

## Installed Plugins

### Core Plugins
1. **@capacitor/core** - Core Capacitor functionality
2. **@capacitor/cli** - CLI tools for building and syncing

### Permission & Hardware Access
3. **@capacitor/geolocation** - Native location services
4. **@capacitor/camera** - Camera and photo library access
5. **@capacitor/filesystem** - Native file storage
6. **@capacitor/preferences** - Secure native storage (encrypted)

### Sharing & Clipboard
7. **@capacitor/share** - Native share sheets
8. **@capacitor/clipboard** - Clipboard operations

### UI & UX
9. **@capacitor/status-bar** - Status bar customization
10. **@capacitor/keyboard** - Keyboard management
11. **@capacitor/haptics** - Haptic feedback (vibration)
12. **@capacitor/splash-screen** - Splash screen control
13. **@capacitor/dialog** - Native alert dialogs
14. **@capacitor/browser** - In-app browser

### Connectivity
15. **@capacitor/network** - Network status detection

### Notifications
16. **@capacitor/push-notifications** - Push notifications

### Platform
17. **@capacitor/app** - App lifecycle events
18. **@capacitor/ios** - iOS platform support
19. **@capacitor/android** - Android platform support

## Implementation

### Hooks Created

All plugins are wrapped in easy-to-use React hooks:

- `useNativePermissions` - Location and camera permissions
- `useNativeCamera` - Take photos and pick from gallery
- `useNativeShare` - Native share functionality
- `useNativeClipboard` - Clipboard operations
- `useNativeHaptics` - Haptic feedback
- `useNativeStatusBar` - Status bar customization
- `useNativeNetwork` - Network status
- `useNativeStorage` - Secure storage

### Utilities Created

- `nativeBrowser.ts` - Browser utilities for opening URLs
- `safetStorage.ts` - Storage utilities with iOS compatibility

## Features Implemented

### 1. Location Services
**Used in:**
- Emergency alerts (PanicButton)
- Incident reporting
- Location picker for posts/events
- Nearby content filtering

**Permissions:** Location (when in use)

### 2. Camera & Photos
**Used in:**
- Post creation (image uploads)
- Marketplace listings (product photos)
- Profile avatars
- Service images

**Permissions:** Camera, Photo Library

### 3. Share Functionality
**Used in:**
- Post sharing
- Product sharing
- Ad sharing

**Features:** Native share sheet with social media options

### 4. Clipboard
**Used in:**
- Copy links (posts, products, ads)
- Copy invitation codes
- Copy 2FA backup codes
- Copy emergency codes

### 5. Haptic Feedback
**Used in:**
- Panic button press (heavy vibration)
- Emergency alert sent (success feedback)
- Cancel actions (light feedback)
- Important button presses

### 6. Status Bar
**Features:**
- Customized brand color (#667eea)
- Automatic light/dark mode switching
- Hidden during splash screen
- Native appearance on both platforms

### 7. Network Detection
**Used in:**
- Feed testing panel
- Emergency alert system
- Offline mode detection

### 8. In-App Browser
**Used in:**
- External links from ads
- Payment flows
- External documentation
- Social media links

**Features:** Opens in native in-app browser instead of external browser

### 9. Keyboard Management
**Used in:**
- Messaging threads
- Form inputs
- Comment sections

**Features:** Auto-resize, keyboard hiding

### 10. Secure Storage
**Used in:**
- Session persistence
- App preferences
- Onboarding state
- Rate limiting data

**Features:** Encrypted on device, native storage APIs

## Configuration

### iOS (Info.plist)

Required permission descriptions are documented in `NATIVE_PERMISSIONS_GUIDE.md`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>NeighborLink needs your location to show nearby posts, services, and emergency alerts in your area.</string>

<key>NSCameraUsageDescription</key>
<string>NeighborLink needs camera access to let you take photos for posts, listings, and your profile.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>NeighborLink needs photo library access to let you upload images to your posts and listings.</string>
```

### Android (AndroidManifest.xml)

Required permissions are documented in `NATIVE_PERMISSIONS_GUIDE.md`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.INTERNET" />
```

### Capacitor Config

**Development (capacitor.config.json):**
- Configured for hot-reload from Lovable sandbox
- All plugins enabled
- Mixed content allowed for development

**Production (capacitor.config.prod.json):**
- Bundled web runtime
- All security features enabled
- Splash screen configuration
- Keyboard and status bar customization

## How It Works

### Web Fallback Pattern

All hooks automatically detect if running on native or web:

```typescript
const isNative = Capacitor.isNativePlatform();

if (isNative) {
  // Use native Capacitor API
  await Share.share({ ... });
} else {
  // Fallback to web API
  await navigator.share({ ... });
}
```

### Permission Flow

1. User triggers feature (e.g., "Use Current Location")
2. Hook checks if permission already granted
3. If not granted, requests permission with explanation dialog
4. User grants/denies permission
5. Feature proceeds or shows helpful error message

### Graceful Degradation

If permissions are denied:
- Show user-friendly error message
- Provide "Go to Settings" button on native
- Offer alternative features where possible
- Never crash or block the app

## Testing

### On Physical Devices

1. **iOS**: Test on iPhone with iOS 13+
   - Location services
   - Camera and photos
   - Haptics
   - Status bar appearance

2. **Android**: Test on device with Android 7+
   - All permissions
   - Network detection
   - Keyboard behavior
   - Browser opening

### Permission Testing

Reset app permissions in device settings to test permission flows:
- iOS: Settings → General → Reset → Reset Location & Privacy
- Android: Settings → Apps → NeighborLink → Permissions → Revoke all

## Deployment Steps

After pulling the code:

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Sync native projects (CRITICAL STEP)
npx cap sync

# 4. Add permission descriptions to native projects
# Edit ios/App/App/Info.plist
# Edit android/app/src/main/AndroidManifest.xml

# 5. Run on device
npx cap run ios
# or
npx cap run android
```

## Troubleshooting

### "Plugin not found" errors
- Make sure `npx cap sync` was run after installing plugins
- Check that plugin is in package.json
- Rebuild native projects

### Permissions not working
- Verify permission descriptions in Info.plist (iOS) and AndroidManifest.xml (Android)
- Check that `npx cap sync` was run after config changes
- Reset app permissions on device and test again

### Haptics not working
- Only works on physical devices (not simulators)
- Check device haptics settings
- Some Android devices don't support haptics

### Status bar issues
- Make sure app is running on native platform
- Check status bar config in capacitor.config files
- Verify status bar initialization in App.tsx

## Best Practices

1. **Always use hooks** - Don't import Capacitor plugins directly in components
2. **Check isNative** - Always provide web fallbacks
3. **Handle errors gracefully** - Show user-friendly messages
4. **Request permissions contextually** - Explain why before requesting
5. **Test on physical devices** - Simulators don't support all features
6. **Keep permissions minimal** - Only request what you actually need
7. **Update docs** - Document any new plugin usage

## Future Enhancements

Potential additions:
- Background geolocation (requires careful permission handling)
- Biometric authentication
- Contacts access for emergency contacts
- Calendar integration
- Local notifications
- Badge count management

## Security Considerations

- **Preferences API** encrypts data on device
- **Permissions** requested contextually with explanations
- **Location** only uses "when in use" permission
- **Storage** uses native secure storage on mobile
- **Network** detection prevents sensitive operations on insecure networks

## Performance

All plugins are:
- Lazily loaded where possible
- Wrapped in error boundaries
- Optimized for minimal battery impact
- Use native APIs for best performance
