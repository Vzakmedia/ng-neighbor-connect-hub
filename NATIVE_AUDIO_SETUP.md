# Native Audio Setup Guide

## ✅ Completed Steps

All code implementation is complete! The following has been implemented:

1. ✅ Installed `@capgo/native-audio` and `@capacitor/local-notifications`
2. ✅ Downloaded proper audio files to `public/assets/sounds/`
3. ✅ Created `src/utils/nativeAudioManager.ts` for native audio handling
4. ✅ Updated `src/utils/audioUtils.ts` to use native audio on mobile
5. ✅ Updated `src/hooks/mobile/useNativePushRegistration.ts` for native sounds
6. ✅ Updated `src/components/AudioInitializer.tsx` to preload native audio
7. ✅ Configured `capacitor.config.json` for push notification sounds

## 🔧 Manual Steps Required

After pulling the latest code, you need to complete these native platform setup steps:

### Step 1: Sync Capacitor

```bash
npm install
npx cap sync
```

### Step 2: iOS Audio Setup (Mac with Xcode required)

1. **Add sound files to iOS project:**
   - Open `ios/App/App.xcworkspace` in Xcode
   - Create a new folder: `ios/App/App/sounds/`
   - Convert MP3 files to iOS-compatible formats:
     ```bash
     # Install ffmpeg if needed: brew install ffmpeg
     cd public/assets/sounds/
     ffmpeg -i notification.mp3 -acodec pcm_s16le -ac 1 -ar 44100 notification.caf
     ffmpeg -i message-chime.mp3 -acodec pcm_s16le -ac 1 -ar 44100 message-chime.caf
     ffmpeg -i emergency.mp3 -acodec pcm_s16le -ac 1 -ar 44100 emergency.caf
     ffmpeg -i ringtone.mp3 -acodec pcm_s16le -ac 1 -ar 44100 ringtone.caf
     ```
   - Drag the `.caf` files into `ios/App/App/sounds/` in Xcode
   - Ensure "Copy items if needed" is checked
   - Ensure "Add to targets: App" is checked

2. **Configure Audio Session in AppDelegate:**
   - Open `ios/App/App/AppDelegate.swift`
   - Add at the top:
     ```swift
     import AVFoundation
     ```
   - Add inside `application(_:didFinishLaunchingWithOptions:)`:
     ```swift
     // Configure audio session for background playback
     let audioSession = AVAudioSession.sharedInstance()
     do {
         try audioSession.setCategory(.playback, mode: .default, options: [.mixWithOthers])
         try audioSession.setActive(true)
     } catch {
         print("Failed to configure audio session: \(error)")
     }
     ```

3. **Enable Background Audio in Info.plist:**
   - Open `ios/App/App/Info.plist`
   - Add the following keys:
     ```xml
     <key>UIBackgroundModes</key>
     <array>
         <string>audio</string>
     </array>
     ```

### Step 3: Android Audio Setup (Android Studio required)

1. **Add sound files to Android project:**
   - Create folder: `android/app/src/main/res/raw/`
   - Copy all `.mp3` files from `public/assets/sounds/` to this folder
   - Rename files to lowercase with underscores (Android requirement):
     - `notification.mp3` → `notification.mp3`
     - `message-chime.mp3` → `message_chime.mp3`
     - `emergency.mp3` → `emergency.mp3`
     - `ringtone.mp3` → `ringtone.mp3`

2. **Update AndroidManifest.xml:**
   - Open `android/app/src/main/AndroidManifest.xml`
   - Add permissions (if not already present):
     ```xml
     <uses-permission android:name="android.permission.VIBRATE" />
     <uses-permission android:name="android.permission.WAKE_LOCK" />
     ```

### Step 4: Test the Implementation

1. **Build and run on device:**
   ```bash
   npm run build
   npx cap sync
   npx cap run ios  # or npx cap run android
   ```

2. **Test checklist:**
   - [ ] App startup: Native audio preloads without errors
   - [ ] Send a message: Hear message chime sound
   - [ ] Receive push notification (app in foreground): Hear notification sound
   - [ ] Receive push notification (app in background): Hear notification sound
   - [ ] Emergency alert: Hear emergency sound + vibration
   - [ ] Incoming call: Hear looping ringtone
   - [ ] Phone on silent: Notification sounds should still play
   - [ ] Check console logs for "NativeAudioManager: Played [sound]"

## 🐛 Troubleshooting

### iOS: No sound plays
- Check Xcode console for "Failed to preload" errors
- Verify `.caf` files are in the project and added to App target
- Check audio session configuration in AppDelegate
- Ensure phone is not on silent mode (notification sounds should override)

### Android: No sound plays
- Check Logcat for audio errors
- Verify `.mp3` files are in `res/raw/` folder
- Check file names are lowercase with underscores only
- Verify app has audio permissions

### Sound works on web but not on mobile
- Check console logs: Should see "NativeAudioManager: Played..." on mobile
- If seeing "Not on native platform, skipping", run `npx cap sync`
- Verify `@capgo/native-audio` is installed in package.json

### Sound plays but very quietly
- Check device volume settings
- Verify audio session category is `.playback` (iOS)
- Check volume parameter passed to `nativeAudioManager.play()` (0.0 - 1.0)

## 📚 Architecture Overview

### Sound Flow on Mobile
```
Notification Event
    ↓
nativeAudioManager.play('notification', 0.7)
    ↓
NativeAudio.play({ assetId: 'notification' })
    ↓
iOS: AVAudioPlayer plays .caf file
Android: MediaPlayer plays .mp3 file
```

### Sound Flow on Web
```
Notification Event
    ↓
playNotification()
    ↓
Web Audio API fallback
    ↓
Browser plays sound
```

### Key Files
- `src/utils/nativeAudioManager.ts`: Native audio abstraction layer
- `src/utils/audioUtils.ts`: Platform-agnostic audio utilities
- `src/components/AudioInitializer.tsx`: Preloads audio on app startup
- `src/hooks/mobile/useNativePushRegistration.ts`: Push notification sounds

## 🎯 Expected Performance Improvements

- ✅ **Instant playback**: No user interaction needed on mobile
- ✅ **Reliable notifications**: Works in background and foreground
- ✅ **Cross-platform**: Automatic fallback to Web Audio on web
- ✅ **Battery efficient**: Native audio players use hardware acceleration
- ✅ **No loading delays**: Sounds preloaded on app startup

## 📖 Additional Resources

- [Capacitor Native Audio Plugin](https://github.com/Cap-go/native-audio)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [iOS AVAudioSession Guide](https://developer.apple.com/documentation/avfoundation/avaudiosession)
- [Android MediaPlayer Guide](https://developer.android.com/guide/topics/media/mediaplayer)
