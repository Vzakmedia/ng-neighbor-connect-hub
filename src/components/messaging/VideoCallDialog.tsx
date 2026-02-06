import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CallControls } from './CallControls';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Phone } from '@/lib/icons';
import { NetworkQualityIndicator } from '@/components/mobile/NetworkQualityIndicator';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { CallState } from '@/hooks/messaging/useWebRTCCall';
import { LiveKitCallInterface } from './LiveKitCallInterface';

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  onToggleAudio: (enabled: boolean) => void;
  onToggleVideo: (enabled: boolean) => void;
  onToggleSpeaker: (enabled: boolean) => void;
  onSwitchCamera?: () => void;
  isVideoCall: boolean;
  otherUserName: string;
  otherUserAvatar?: string;
  callState?: CallState;
  liveKitToken?: string | null;
}

export const VideoCallDialog: React.FC<VideoCallDialogProps> = ({
  open,
  onOpenChange,
  localStream,
  remoteStream,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onToggleSpeaker,
  onSwitchCamera,
  isVideoCall,
  otherUserName,
  otherUserAvatar,
  callState = 'initiating', // Default to initiating to keep UI stable
  liveKitToken
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const handleEndCall = () => {
    onEndCall();
    onOpenChange(false);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'm',
      callback: () => {
        const newState = !audioEnabled;
        setAudioEnabled(newState);
        onToggleAudio(newState);
      }
    },
    {
      key: 'v',
      callback: () => {
        if (isVideoCall) {
          const newState = !videoEnabled;
          setVideoEnabled(newState);
          onToggleVideo(newState);
        }
      }
    },
    {
      key: 'Escape',
      callback: handleEndCall
    }
  ], open);

  // Call duration timer
  useEffect(() => {
    if (!open || callState !== 'connected') {
      setCallDuration(0);
      return;
    }

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [open, callState]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && isVideoCall) {
      const videoTracks = remoteStream.getVideoTracks();
      console.log('[VideoCallDialog] Setting remote video stream:', {
        hasVideoTracks: videoTracks.length > 0,
        videoTracks: videoTracks.map(t => ({
          enabled: t.enabled,
          readyState: t.readyState,
          label: t.label
        }))
      });

      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(err => {
        console.error('[VideoCallDialog] Error playing remote video:', err);
      });
    }
  }, [remoteStream, isVideoCall]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      console.log('[VideoCallDialog] Setting remote audio stream:', {
        hasAudioTracks: remoteStream.getAudioTracks().length > 0,
        audioTracks: remoteStream.getAudioTracks().map(t => ({
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
          label: t.label
        }))
      });
      remoteAudioRef.current.srcObject = remoteStream;

      // Explicitly try to play
      remoteAudioRef.current.play().catch(err => {
        console.error('[VideoCallDialog] Error playing remote audio:', err);
      });
    }
  }, [remoteStream]);

  if (liveKitToken) {
    return (
      <Dialog open={open} onOpenChange={handleEndCall}>
        <DialogContent className="sm:max-w-4xl h-[80vh] p-0 bg-black border-none text-white overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Video Call with {otherUserName}</DialogTitle>
            <DialogDescription>LiveKit Video Call</DialogDescription>
          </VisuallyHidden>

          <LiveKitCallInterface
            token={liveKitToken}
            serverUrl={import.meta.env.VITE_LIVEKIT_URL || "wss://neighborlink-94uewje2.livekit.cloud"}
            onDisconnected={handleEndCall}
            audioOnly={!isVideoCall}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleEndCall()}>
      <DialogContent className={`max-w-full w-full h-screen p-0 border-0 overflow-hidden ${!otherUserAvatar ? 'bg-gradient-to-b from-primary via-primary/95 to-secondary' : ''}`} aria-describedby="call-dialog-description">
        <VisuallyHidden>
          <DialogTitle>{isVideoCall ? 'Video Call' : 'Voice Call'}</DialogTitle>
          <DialogDescription id="call-dialog-description">
            {isVideoCall ? 'Video' : 'Voice'} call with {otherUserName}
          </DialogDescription>
        </VisuallyHidden>

        {/* Blurred background image */}
        {otherUserAvatar && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl"
            style={{ backgroundImage: `url(${otherUserAvatar})` }}
          />
        )}

        {/* Dark overlay for readability */}
        {otherUserAvatar && (
          <div className="absolute inset-0 bg-black/40" />
        )}

        {/* Hidden audio element for remote stream - ensures audio plays for voice calls */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />

        {/* Video elements - full screen remote, PIP local */}
        {isVideoCall && (
          <>
            {/* Remote video - full screen background */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Local video - picture-in-picture overlay */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-24 right-4 w-40 h-52 rounded-xl object-cover border-2 border-white/30 shadow-2xl z-20"
            />
          </>
        )}

        <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-12">
          {/* Top spacer */}
          <div className="flex-1" />

          {/* Main content - Avatar and info (shown for voice calls or when video not connected) */}
          {(!isVideoCall || !remoteStream) && (
            <div className="flex flex-col items-center justify-center gap-6">
              {/* Large Avatar with green ring */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse scale-110" />
                <Avatar className="w-32 h-32 relative border-4 border-white/20">
                  <AvatarImage src={otherUserAvatar} />
                  <AvatarFallback className="text-3xl bg-white/10 text-white">
                    {otherUserName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-primary" />
              </div>

              {/* User name */}
              <h2 className="text-white text-3xl font-bold text-center">
                {otherUserName}
              </h2>

              {/* Call duration or Status */}
              <div className="text-white/80 text-xl font-medium">
                {callState === 'connected' ? formatDuration(callDuration) : ''}
              </div>

              {/* Connection status */}
              {(callState === 'initiating' || callState === 'calling') && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150" />
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-300" />
                  <span className="text-white/60 text-sm ml-2">Calling...</span>
                </div>
              )}
              {callState === 'ringing' && (
                <div className="flex items-center gap-2 mt-2">
                  <Phone className="h-4 w-4 text-white animate-bounce" />
                  <span className="text-white/80 text-base ml-2">Ringing...</span>
                </div>
              )}
              {callState === 'connecting' && !remoteStream && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150" />
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-300" />
                  <span className="text-white/60 text-sm ml-2">Connecting...</span>
                </div>
              )}
            </div>
          )}

          {/* Video call overlay - name, duration, and network quality at top */}
          {isVideoCall && remoteStream && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-2xl">
              <h2 className="text-white text-xl font-semibold">
                {otherUserName}
              </h2>
              <div className="text-white/80 text-sm font-medium">
                {formatDuration(callDuration)}
              </div>
              <NetworkQualityIndicator />
            </div>
          )}

          {/* Bottom spacer */}
          <div className="flex-1" />

          {/* Call controls at bottom */}
          <div className="w-full flex flex-col items-center">
            <CallControls
              onStartVoiceCall={() => { }}
              onStartVideoCall={() => { }}
              onEndCall={handleEndCall}
              onToggleAudio={(enabled) => {
                setAudioEnabled(enabled);
                onToggleAudio(enabled);
              }}
              onToggleVideo={(enabled) => {
                setVideoEnabled(enabled);
                onToggleVideo(enabled);
              }}
              onToggleSpeaker={onToggleSpeaker}
              onSwitchCamera={onSwitchCamera}
              isInCall={true}
              isVideoCall={isVideoCall}
            />

            {/* Collapse handle */}
            <button
              onClick={() => onOpenChange(false)}
              className="mt-6 flex flex-col items-center gap-1 text-white/60 hover:text-white/80 transition-colors"
            >
              <div className="w-12 h-1 bg-white/40 rounded-full" />
              <span className="text-xs font-medium">Collapse</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};