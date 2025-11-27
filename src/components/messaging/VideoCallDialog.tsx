import React, { useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CallControls } from './CallControls';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-black">
        {/* Hidden audio element for remote stream - ensures audio plays for voice calls */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />
        
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Remote video/avatar */}
          <div className="w-full h-full flex items-center justify-center">
            {remoteStream && isVideoCall ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-white">
                <Avatar className="w-32 h-32 mb-4">
                  <AvatarImage src={otherUserAvatar} />
                  <AvatarFallback className="text-2xl">
                    {otherUserName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold">{otherUserName}</h3>
                <p className="text-gray-300 mt-2">
                  {remoteStream ? 'Voice call' : 'Connecting...'}
                </p>
                {!remoteStream && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150" />
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-300" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Local video (picture-in-picture) */}
          {localStream && isVideoCall && (
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Call controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <CallControls
              onStartVoiceCall={() => {}}
              onStartVideoCall={() => {}}
              onEndCall={handleEndCall}
              onToggleAudio={onToggleAudio}
              onToggleVideo={onToggleVideo}
              isInCall={true}
              isVideoCall={isVideoCall}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};