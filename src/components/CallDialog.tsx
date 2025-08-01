import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import type { CallStatus, CallType } from '@/hooks/useWebRTCCall';

interface CallDialogProps {
  isOpen: boolean;
  callStatus: CallStatus;
  callType: CallType;
  remoteUserName?: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onAnswer: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}

const CallDialog: React.FC<CallDialogProps> = ({
  isOpen,
  callStatus,
  callType,
  remoteUserName,
  isAudioEnabled,
  isVideoEnabled,
  localVideoRef,
  remoteVideoRef,
  onAnswer,
  onReject,
  onEnd,
  onToggleAudio,
  onToggleVideo
}) => {
  const isIncoming = callStatus === 'incoming';
  const isConnected = callStatus === 'connected';
  const isCalling = callStatus === 'calling';

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isIncoming && `Incoming ${callType} call from ${remoteUserName}`}
            {isCalling && `Calling ${remoteUserName}...`}
            {isConnected && `${callType} call with ${remoteUserName}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Video containers for video calls */}
          {callType === 'video' && (
            <div className="space-y-2">
              <div className="relative bg-muted rounded-lg overflow-hidden h-48">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                  {remoteUserName}
                </div>
              </div>
              
              <div className="relative bg-muted rounded-lg overflow-hidden h-24 w-32">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 left-1 text-xs text-white bg-black/50 px-1 py-0.5 rounded">
                  You
                </div>
              </div>
            </div>
          )}

          {/* Call controls */}
          <div className="flex justify-center gap-4">
            {/* Answer/Reject buttons for incoming calls */}
            {isIncoming && (
              <>
                <Button
                  onClick={onAnswer}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full w-16 h-16"
                >
                  <Phone className="h-6 w-6" />
                </Button>
                <Button
                  onClick={onReject}
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-16 h-16"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Call controls for active calls */}
            {(isConnected || isCalling) && (
              <>
                <Button
                  onClick={onToggleAudio}
                  size="lg"
                  variant={isAudioEnabled ? "secondary" : "destructive"}
                  className="rounded-full w-12 h-12"
                >
                  {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                {callType === 'video' && (
                  <Button
                    onClick={onToggleVideo}
                    size="lg"
                    variant={isVideoEnabled ? "secondary" : "destructive"}
                    className="rounded-full w-12 h-12"
                  >
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                )}

                <Button
                  onClick={onEnd}
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-12 h-12"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Call status text */}
          <div className="text-center text-sm text-muted-foreground">
            {isIncoming && "Incoming call..."}
            {isCalling && "Connecting..."}
            {isConnected && "Connected"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallDialog;