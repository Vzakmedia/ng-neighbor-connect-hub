# Mobile Build Guide for NeighborLink

This guide covers building and deploying the NeighborLink app for iOS and Android native platforms.

## Prerequisites

- Node.js and npm installed
- For iOS: macOS with Xcode installed
- For Android: Android Studio installed
- Git and GitHub account

## Initial Setup

### 1. Export and Clone Project

1. Click "Export to GitHub" in Lovable
2. Clone your repository locally:

```bash
git clone <your-repo-url>
cd <your-repo>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Add Native Platforms

```bash
# Add iOS platform (macOS only)
npx cap add ios

# Add Android platform
npx cap add android
```

### 4. Update Native Dependencies

```bash
# For iOS
npx cap update ios

# For Android
npx cap update android
```

## Platform-Specific Configuration

### iOS Configuration

After running `npx cap add ios`, you need to configure permissions in `ios/App/App/Info.plist`:

Add the following entries inside the `<dict>` tag:

```xml
<!-- Location Permissions -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>NeighborLink needs your location to show nearby community posts, events, and safety alerts.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>NeighborLink needs your location to send you relevant safety alerts and community updates even when the app is in the background.</string>

<!-- Camera & Photos Permissions -->
<key>NSCameraUsageDescription</key>
<string>NeighborLink needs camera access to let you take photos for posts, profile pictures, and marketplace items.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>NeighborLink needs photo library access to let you upload images for posts, profile, and marketplace listings.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>NeighborLink needs permission to save photos to your library.</string>

<!-- Push Notification Permissions -->
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>

<!-- Network Security -->
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
</dict>
```

### Android Configuration

After running `npx cap add android`, configure permissions in `android/app/src/main/AndroidManifest.xml`:

#### 1. Add Permissions (before the `<application>` tag)

```xml
<!-- Location Permissions -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />

<!-- Camera & Storage Permissions -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-feature android:name="android.hardware.camera" android:required="false" />

<!-- Network Permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Push Notification Permissions -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />

<!-- Vibration for notifications -->
<uses-permission android:name="android.permission.VIBRATE" />
```

#### 2. Add Google Maps API Key (inside the `<application>` tag)

Add the following meta-data entry inside your `<application>` tag:

```xml
<!-- Google Maps API Key -->
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
```

**Important:** This must be added after running `npx cap add android`. The key persists across `npx cap sync` but must be re-added if you delete and regenerate the `android` folder.

### Development Build (Testing)

1. Build the web assets:

```bash
npm run build
```

1. Sync with native platforms:

```bash
npx cap sync
```

1. Run on device/emulator:

```bash
# For iOS (requires macOS and Xcode)
npx cap run ios

# For Android
npx cap run android
```

### Opening in Native IDEs

Sometimes you need to open the native projects directly:

```bash
# Open iOS project in Xcode
npx cap open ios

# Open Android project in Android Studio
npx cap open android
```

## Testing Checklist

Before releasing, test these features on a physical device:

### Core Features

- [ ] App launches and shows splash screen
- [ ] Status bar appears correctly (not overlapping content)
- [ ] Onboarding screens appear on first launch
- [ ] Login/signup works
- [ ] Profile completion works

### Permissions

- [ ] Location permission request appears when needed
- [ ] Camera permission request appears when taking photos
- [ ] Photo library permission request appears when uploading
- [ ] Push notification permission request appears
- [ ] All permissions can be granted/denied gracefully

### Native Features

- [ ] Camera opens and can take photos
- [ ] Photo picker opens and can select images
- [ ] Push notifications arrive and display
- [ ] Location services provide accurate coordinates
- [ ] Haptic feedback works (on supported devices)
- [ ] Share functionality works
- [ ] Deep links work (if configured)

### UI/UX

- [ ] Safe area insets respected (notch/island/home indicator)
- [ ] Keyboard behavior is correct
- [ ] Orientation changes work (if enabled)
- [ ] Pull-to-refresh works
- [ ] Scrolling is smooth
- [ ] All interactive elements are reachable

## Production Build

### iOS Production

1. In Xcode, select "Any iOS Device" as target
2. Product → Archive
3. Follow Xcode's distribution wizard
4. Upload to App Store Connect

### Android Production

1. Generate a signing key (first time only):

```bash
cd android
./gradlew assembleRelease
```

1. Configure signing in `android/app/build.gradle`
2. Build release APK/AAB:

```bash
cd android
./gradlew bundleRelease
```

1. Upload to Google Play Console

## Troubleshooting

### Status Bar Issues

- Make sure `contentInset: "always"` is set in `capacitor.config.json`
- Check that viewport meta tag includes `viewport-fit=cover`
- Verify status bar initialization in `App.tsx`

### Splash Screen Not Showing

- Check `SplashScreen` plugin config in `capacitor.config.json`
- Verify `launchAutoHide: false` is set
- Ensure hide delay is sufficient (1500ms+)

### Onboarding Skipped

- Clear app data/reinstall app
- Check Capacitor Preferences storage
- Verify onboarding completion flag logic

### Permissions Not Working

- Double-check Info.plist (iOS) or AndroidManifest.xml (Android)
- Ensure permission descriptions are user-friendly
- Test on physical device (simulator limitations apply)
- Check app settings on device to verify permissions

### Build Errors

- Run `npx cap sync` after pulling latest code
- Clean build: `npx cap sync --clean`
- Delete `node_modules` and reinstall
- For iOS: Clean build folder in Xcode
- For Android: Clean gradle cache

## Updating After Code Changes

Every time you pull new code from GitHub:

1. Install any new dependencies:

```bash
npm install
```

1. Build the web assets:

```bash
npm run build
```

1. Sync to native platforms:

```bash
npx cap sync
```

1. Rebuild and run:

```bash
# iOS
npx cap run ios

# Android
npx cap run android
```

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)
- [Lovable Mobile Capabilities Blog](https://lovable.dev/blogs/TODO)

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review Capacitor documentation
3. Check iOS/Android platform-specific docs
4. Consult Lovable community forums
