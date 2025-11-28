import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CallControls } from './CallControls';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown } from '@/lib/icons';

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  onToggleAudio: (enabled: boolean) => void;
  onToggleVideo: (enabled: boolean) => void;
  isVideoCall: boolean;
  otherUserName: string;
  otherUserAvatar?: string;
}

export const VideoCallDialog: React.FC<VideoCallDialogProps> = ({
  open,
  onOpenChange,
  localStream,
  remoteStream,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  isVideoCall,
  otherUserName,
  otherUserAvatar
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Call duration timer
  useEffect(() => {
    if (!open) {
      setCallDuration(0);
      return;
    }

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

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

  const handleEndCall = () => {
    onEndCall();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full h-screen p-0 bg-gradient-to-b from-primary via-primary/95 to-secondary border-0">
        {/* Hidden audio element for remote stream - ensures audio plays for voice calls */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />
        
        <div className="relative w-full h-full flex flex-col items-center justify-between py-12">
          {/* Top spacer */}
          <div className="flex-1" />

          {/* Main content - Avatar and info */}
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

            {/* Call duration */}
            <div className="text-white/80 text-xl font-medium">
              {formatDuration(callDuration)}
            </div>

            {/* Connection status */}
            {!remoteStream && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150" />
                <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-300" />
                <span className="text-white/60 text-sm ml-2">Connecting...</span>
              </div>
            )}
          </div>

          {/* Bottom spacer */}
          <div className="flex-1" />

          {/* Call controls at bottom */}
          <div className="w-full flex flex-col items-center">
            <CallControls
              onStartVoiceCall={() => {}}
              onStartVideoCall={() => {}}
              onEndCall={handleEndCall}
              onToggleAudio={onToggleAudio}
              onToggleVideo={onToggleVideo}
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

          {/* Hidden video elements for video calls */}
          {isVideoCall && (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="hidden"
              />
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="hidden"
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};