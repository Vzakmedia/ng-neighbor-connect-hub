# iOS Setup Guide for WebRTC Calls

This guide covers the iOS-specific setup required for WebRTC audio and video calls in Neighborlink.

## Prerequisites

- Xcode installed on macOS
- Capacitor CLI installed (`npm install -g @capacitor/cli`)
- iOS development environment configured

## Setup Steps

### 1. Add iOS Platform

If you haven't already added the iOS platform to your project:

```bash
npx cap add ios
```

### 2. Sync Capacitor Project

Sync your web assets and Capacitor configuration:

```bash
npx cap sync ios
```

### 3. Configure iOS Permissions

Open the iOS project in Xcode:

```bash
npx cap open ios
```

Navigate to `ios/App/App/Info.plist` and add the following permission strings:

#### Microphone Permission (Required for Voice & Video Calls)

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Neighborlink needs microphone access for voice and video calls with your neighbors and community members.</string>
```

#### Camera Permission (Required for Video Calls)

```xml
<key>NSCameraUsageDescription</key>
<string>Neighborlink needs camera access for video calls with your neighbors and community members.</string>
```

### 4. Alternative: Edit Info.plist in Text Editor

You can also edit the `Info.plist` file directly in a text editor. The file is located at:

```
ios/App/App/Info.plist
```

Add the permission strings shown above before the closing `</dict>` tag.

### 5. Build and Run

After adding the permissions:

1. Build the project in Xcode (`⌘ + B`)
2. Run on a simulator or physical device (`⌘ + R`)

⚠️ **Important**: Simulators may not support camera/microphone access. Test on a physical iOS device for full functionality.

## Permission Request Flow

When a user initiates or receives a call, iOS will automatically prompt them to grant permissions:

1. **First Call**: User sees permission dialog
2. **Allow**: Call proceeds normally
3. **Deny**: User sees error message with instructions to enable in Settings

## Troubleshooting

### Permission Denied Error

If users deny permissions, they need to:

1. Open iOS Settings
2. Scroll to "Neighborlink"
3. Enable "Microphone" and "Camera"
4. Restart the app

### Audio Not Working

- Check that device is not in Silent Mode
- Verify volume is turned up
- Test on a different device
- Check Xcode console for errors

### Camera Not Working

- Ensure you're testing on a physical device (not simulator)
- Check that another app isn't using the camera
- Verify camera permissions are enabled
- Try restarting the device

## Testing Checklist

- [ ] Voice call works on physical device
- [ ] Video call works on physical device
- [ ] Switching between front/back camera works
- [ ] Muting microphone works
- [ ] Disabling video works
- [ ] Permission prompts appear on first use
- [ ] App handles denied permissions gracefully

## Additional Configuration

### Background Audio (Optional)

To enable audio to continue when app is in background, add to `Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
  <string>voip</string>
</array>
```

### TURN Server Configuration

For calls behind strict firewalls/NAT, configure TURN servers in the WebRTC manager. This is already handled by the `get-turn-credentials` edge function.

## Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Privacy Guidelines](https://developer.apple.com/documentation/avfoundation/cameras_and_media_capture/requesting_authorization_for_media_capture_on_ios)
- [WebRTC on iOS](https://webrtc.org/getting-started/ios)

## Support

For issues or questions:
- Check the Xcode console for detailed error messages
- Review the WebRTC logs in browser DevTools
- Contact the development team with device/iOS version details
