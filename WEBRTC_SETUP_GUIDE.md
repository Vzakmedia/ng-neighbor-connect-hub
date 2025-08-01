# WebRTC Call Setup Guide

## Current Implementation (Free)
Your current setup uses basic WebRTC with STUN servers. This works for many cases but has limitations:

### Pros:
- ✅ No additional costs
- ✅ Direct peer-to-peer connection
- ✅ Works on same network or simple NAT

### Cons:
- ❌ May fail behind strict firewalls/NAT
- ❌ No TURN servers for relay connections
- ❌ Limited reliability in production

## Option 1: Add TURN Servers (Recommended)
For better reliability, add TURN servers to your WebRTC configuration:

### Free TURN Servers (Limited):
```javascript
// Add to src/utils/webrtc.ts setupPeerConnection()
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Free TURN (limited bandwidth)
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
]
```

### Paid TURN Services:
- **Twilio STUN/TURN**: $0.0015/GB
- **Agora**: Various pricing
- **Daily.co**: Free tier available

## Option 2: Use External API (Most Reliable)

### 1. Daily.co (Easiest)
```bash
npm install @daily-co/daily-js
```

### 2. Agora WebRTC
```bash
npm install agora-rtc-sdk-ng
```

### 3. Twilio Video
```bash
npm install twilio-video
```

## Testing Your Current Setup

1. Try calls on the same network first
2. Test with different networks (mobile vs WiFi)
3. Check browser console for WebRTC errors

## Current Issues to Fix

1. **Missing offer/answer flow** - Fixed in latest code
2. **ICE candidate timing** - Improved error handling
3. **Network traversal** - Needs TURN servers

## Recommendation

Start with adding a free TURN server to see if it improves reliability, then consider a paid service if you need production-quality calls.