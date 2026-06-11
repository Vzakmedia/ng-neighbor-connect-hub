import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import type { CallState } from '@/utils/call/types';
import { LiveKitCallInterface } from './LiveKitCallInterface';
import { useRingbackTone } from '@/hooks/messaging/useRingbackTone';

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEndCall: () => void;
  otherUserName: string;
  otherUserAvatar?: string;
  callState?: CallState;
  liveKitToken?: string | null;
  serverUrl: string;
  onRemoteParticipantJoined?: () => void;
  onRemoteParticipantLeft?: () => void;
  onConnectionLost?: () => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
}

export const VideoCallDialog: React.FC<VideoCallDialogProps> = ({
  open,
  onOpenChange,
  onEndCall,
  otherUserName,
  otherUserAvatar,
  callState = 'initiating',
  liveKitToken,
  serverUrl,
  onRemoteParticipantJoined,
  onRemoteParticipantLeft,
  onConnectionLost,
  onReconnecting,
  onReconnected,
}) => {
  const [otherParticipantJoined, setOtherParticipantJoined] = useState(false);

  useEffect(() => {
    if (!open) setOtherParticipantJoined(false);
  }, [open]);

  const shouldPlayRingback = open &&
    (callState === 'initiating' || callState === 'calling' || callState === 'ringing') &&
    !otherParticipantJoined;

  useRingbackTone(shouldPlayRingback);

  const handleEndCall = () => {
    onEndCall();
    onOpenChange(false);
  };

  const statusLabel =
    callState === 'connecting' ? 'Connecting...'
      : callState === 'connected' ? ''
        : 'Calling...';

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="w-[80vw] max-w-5xl h-[90vh] p-0 bg-black border-none text-white overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Video Call with {otherUserName}</DialogTitle>
          <DialogDescription>Video call with {otherUserName}</DialogDescription>
        </VisuallyHidden>

        {liveKitToken ? (
          <LiveKitCallInterface
            token={liveKitToken}
            serverUrl={serverUrl}
            onDisconnected={handleEndCall}
            onParticipantConnected={() => {
              setOtherParticipantJoined(true);
              onRemoteParticipantJoined?.();
            }}
            onParticipantDisconnected={onRemoteParticipantLeft}
            onConnectionLost={onConnectionLost}
            onReconnecting={onReconnecting}
            onReconnected={onReconnected}
            audioOnly={false}
          />
        ) : (
          /* Token still loading — show calling screen with avatar + End button */
          <div className="relative h-full w-full flex flex-col items-center justify-center gap-6 bg-[#1a2e26]">
            {otherUserAvatar && (
              <div
                className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-40"
                style={{ backgroundImage: `url(${otherUserAvatar})` }}
              />
            )}
            <Avatar className="w-28 h-28 border-2 border-white/20 shadow-2xl z-10">
              <AvatarImage src={otherUserAvatar} className="object-cover" />
              <AvatarFallback className="text-4xl bg-white/10 text-white">
                {otherUserName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center gap-2 z-10">
              <h2 className="text-2xl font-semibold">{otherUserName}</h2>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{statusLabel || 'Connecting...'}</span>
              </div>
            </div>
            <button
              onClick={handleEndCall}
              className="z-10 bg-red-500 rounded-full px-10 py-3 text-sm font-semibold text-white active:bg-red-600 transition-colors"
            >
              End
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
