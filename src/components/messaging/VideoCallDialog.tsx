import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CallControls } from './CallControls';
import { NetworkQualityIndicator } from '@/components/mobile/NetworkQualityIndicator';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { CallState } from '@/hooks/messaging/useWebRTCCall';
import { LiveKitCallInterface } from './LiveKitCallInterface';
import { useRingbackTone } from '@/hooks/messaging/useRingbackTone';

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
  callState = 'initiating',
  liveKitToken
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [otherParticipantJoined, setOtherParticipantJoined] = useState(false);

  useEffect(() => {
    if (!open) setOtherParticipantJoined(false);
  }, [open]);

  const shouldPlayRingback = open &&
    (callState === 'initiating' || callState === 'calling' || callState === 'ringing') &&
    !remoteStream &&
    !otherParticipantJoined;

  useRingbackTone(shouldPlayRingback);

  const handleEndCall = () => {
    onEndCall();
    onOpenChange(false);
  };

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
        const newState = !videoEnabled;
        setVideoEnabled(newState);
        onToggleVideo(newState);
      }
    },
  ], open);

  useEffect(() => {
    if (!open || callState !== 'connected') {
      setCallDuration(0);
      return;
    }
    const timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [open, callState]);

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
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(err => {
        console.error('[VideoCallDialog] Error playing remote video:', err);
      });
    }
  }, [remoteStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(err => {
        console.error('[VideoCallDialog] Error playing remote audio:', err);
      });
    }
  }, [remoteStream]);

  if (liveKitToken) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="w-[80vw] max-w-5xl h-[90vh] p-0 bg-black border-none text-white overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>Video Call with {otherUserName}</DialogTitle>
            <DialogDescription>LiveKit Video Call</DialogDescription>
          </VisuallyHidden>

          <LiveKitCallInterface
            token={liveKitToken}
            serverUrl={import.meta.env.VITE_LIVEKIT_URL || "wss://neighborlink-94uewje2.livekit.cloud"}
            onDisconnected={handleEndCall}
            onParticipantConnected={() => setOtherParticipantJoined(true)}
            audioOnly={false}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-full w-full h-screen p-0 border-0 overflow-hidden bg-black"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Video Call with {otherUserName}</DialogTitle>
          <DialogDescription>Video call with {otherUserName}</DialogDescription>
        </VisuallyHidden>

        {/* Hidden audio element */}
        <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

        {/* Blurred background when video not connected */}
        {otherUserAvatar && !remoteStream && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl"
            style={{ backgroundImage: `url(${otherUserAvatar})` }}
          />
        )}
        {otherUserAvatar && !remoteStream && (
          <div className="absolute inset-0 bg-black/50" />
        )}

        {/* Remote video — full screen */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Local video — picture-in-picture */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-24 right-4 w-40 h-52 rounded-xl object-cover border-2 border-white/30 shadow-2xl z-20"
        />

        {/* Top overlay — name, duration, network quality */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-2xl z-10">
          <h2 className="text-white text-xl font-semibold">{otherUserName}</h2>
          <div className="text-white/80 text-sm font-medium">
            {callState === 'connected' ? formatDuration(callDuration) : 'Connecting...'}
          </div>
          {callState === 'connected' && <NetworkQualityIndicator />}
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center pb-8">
          <CallControls
            onStartVoiceCall={() => {}}
            onStartVideoCall={() => {}}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
