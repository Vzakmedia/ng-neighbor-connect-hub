# Native App Permissions Guide

## Overview

NeighborLink now properly implements native app permissions for iOS and Android using Capacitor plugins. This ensures that all location, camera, and file access requests work correctly on mobile devices.

## What Was Implemented

### 1. **Capacitor Plugins Installed**
- `@capacitor/geolocation` - Native location services
- `@capacitor/camera` - Native camera and photo access
- `@capacitor/filesystem` - Native file storage
- `@capacitor/preferences` - Secure native storage

### 2. **Permission Manager Hook**
**Location**: `src/hooks/mobile/useNativePermissions.ts`

Provides centralized permission management:
- `requestLocationPermission()` - Request location access
- `requestCameraPermission()` - Request camera/photo access
- `requestMicrophonePermission()` - Request microphone access
- `getCurrentPosition()` - Get location with auto-permission request
- `openAppSettings()` - Direct users to device settings
- `isNative` - Check if running on native platform

### 3. **Native Camera Hook**
**Location**: `src/hooks/mobile/useNativeCamera.ts`

Handles native camera operations:
- `takePicture()` - Take photo with device camera
- `pickImages()` - Select photos from gallery
- Automatic permission requests
- Web fallback support

### 4. **Call Permissions Hook**
**Location**: `src/hooks/mobile/useCallPermissions.ts`

Handles permissions for voice and video calls:
- `requestMicrophoneForCall()` - Request microphone for voice calls
- `requestVideoCallPermissions()` - Request camera + microphone for video calls
- Automatic user feedback with toast notifications
- Platform-specific guidance when permissions are denied

### 5. **Permission UI Components**

**PermissionRequestDialog** (`src/components/mobile/PermissionRequestDialog.tsx`):
- User-friendly permission explanation
- Shows why permissions are needed
- Lists specific features that require the permission
- Privacy assurance message

**PermissionDeniedAlert** (`src/components/mobile/PermissionDeniedAlert.tsx`):
- Displayed when permission is denied
- Provides "Go to Settings" button on native
- Context-specific messages

### 6. **Updated Components**

All location and file upload components now use native APIs:

#### Location Services:
- ✅ `LocationPickerDialog.tsx` - Map location picker
- ✅ `PanicButton.tsx` - Emergency alert location
- ✅ `ReportIncidentDialog.tsx` - Incident reporting location
- ✅ `NeighborhoodEmergencyAlert.tsx` - Nearby alerts

#### File/Image Uploads:
- ✅ `CreatePostDialog.tsx` - Post image uploads
- ✅ `CreateMarketplaceItemDialog.tsx` - Product photos

#### Voice & Video Calls:
- ✅ `useWebRTCCall.tsx` - Voice and video call permissions
- ✅ `webrtc.ts` - Improved error handling for media access

### 7. **Configuration Updates**

**capacitor.config.json** - Development config with permission declarations
**capacitor.config.prod.json** - Production config with permission declarations

Both configs now include:
```json
"plugins": {
  "Geolocation": {
    "permissions": ["location"]
  },
  "Camera": {
    "permissions": ["camera", "photos"]
  }
}
```

## Required Native Configuration

### iOS (Info.plist)

You need to add permission descriptions to `ios/App/App/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>NeighborLink needs your location to show nearby posts, services, and emergency alerts in your area.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>NeighborLink needs your location for emergency alerts and community features.</string>

<key>NSCameraUsageDescription</key>
<string>NeighborLink needs camera access to let you take photos for posts, listings, and your profile.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>NeighborLink needs photo library access to let you upload images to your posts and listings.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>NeighborLink needs permission to save photos to your library.</string>

<key>NSMicrophoneUsageDescription</key>
<string>NeighborLink needs microphone access to make voice and video calls with your neighbors.</string>
```

### Android (AndroidManifest.xml)

Add permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

## How It Works

### Permission Flow

1. **User triggers feature** (e.g., clicks "Use Current Location")
2. **App checks if on native platform** (`isNative` flag)
3. **Check existing permission status**
   - If granted → proceed with feature
   - If denied → show PermissionDeniedAlert
   - If not determined → request permission
4. **Request permission** (first time only)
   - Show PermissionRequestDialog explaining why
   - OS shows native permission dialog
   - Handle user response
5. **Execute feature** if permission granted

### Web Fallback

All components gracefully fall back to web APIs when not on native platform:
- Location: Uses `navigator.geolocation`
- Camera/Photos: Uses `<input type="file">`

## Testing Permissions

### On Native Devices:

1. **First Launch Test**:
   - Trigger location feature → should show permission request
   - Trigger camera feature → should show permission request

2. **Permission Denied Test**:
   - Deny permission when prompted
   - Should see PermissionDeniedAlert
   - "Settings" button should open device settings

3. **Permission Granted Test**:
   - Grant permission when prompted
   - Feature should work immediately

### Reset Permissions (for testing):

**iOS**: Settings → General → Reset → Reset Location & Privacy

**Android**: Settings → Apps → NeighborLink → Permissions → Revoke

## Deployment Steps

After pulling the code:

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Sync native projects (copies web build + updates native configs)
npx cap sync

# 4. Update iOS Info.plist and Android AndroidManifest.xml 
#    with the permission descriptions above

# 5. Run on device/emulator
npx cap run ios
# or
npx cap run android
```

## Troubleshooting

### "Permission denied" errors:
- Check that native permission descriptions are added
- Verify user hasn't permanently denied permission
- Reset app permissions on device

### "undefined is not a function" errors:
- Make sure Capacitor plugins are installed
- Run `npx cap sync` after adding plugins
- Check that imports are correct

### Permission not requesting:
- Verify you're running on native platform (not web)
- Check capacitor.config files have plugin declarations
- Ensure `npx cap sync` was run after config changes

## Privacy & Security

- **Minimal Permission Principle**: Request only what's needed, when needed
- **Clear Explanations**: PermissionRequestDialog explains exactly why
- **User Control**: Users can deny and revoke anytime
- **Graceful Degradation**: App works (with reduced features) if permissions denied
- **No Background Location**: We only use "When In Use" location, not background

## Future Enhancements

Potential additions:
- Background location for emergency monitoring (requires user opt-in)
- File system access for document uploads
- Contacts access for emergency contact selection
- Notification permissions UI (already implemented separately)
