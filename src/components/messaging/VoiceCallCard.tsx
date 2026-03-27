import React, { useState, useEffect } from 'react';
import { Phone, UserPlus, MoreHorizontal } from '@/lib/icons';
import { Mic, MicOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LiveKitCallInterface } from './LiveKitCallInterface';
import { useRingbackTone } from '@/hooks/messaging/useRingbackTone';
import type { CallState } from '@/hooks/messaging/useWebRTCCall';

interface VoiceCallCardProps {
  open: boolean;
  callState: CallState;
  otherUserName: string;
  otherUserAvatar?: string;
  localUserName: string;
  liveKitToken?: string | null;
  serverUrl: string;
  onEndCall: () => void;
  onToggleAudio: () => void;
}

export const VoiceCallCard: React.FC<VoiceCallCardProps> = ({
  open,
  callState,
  otherUserName,
  otherUserAvatar,
  localUserName,
  liveKitToken,
  serverUrl,
  onEndCall,
  onToggleAudio,
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [otherParticipantJoined, setOtherParticipantJoined] = useState(false);

  const shouldPlayRingback = open &&
    (callState === 'initiating' || callState === 'calling' || callState === 'ringing') &&
    !otherParticipantJoined;

  useRingbackTone(shouldPlayRingback);

  useEffect(() => {
    if (!open) {
      setCallDuration(0);
      setOtherParticipantJoined(false);
    }
  }, [open]);

  // Duration timer — only ticks when connected
  useEffect(() => {
    if (!open || callState !== 'connected') {
      setCallDuration(0);
      return;
    }
    const timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [open, callState]);

  if (!open) return null;

  const isConnected = callState === 'connected';
  const isRinging = callState === 'calling' || callState === 'initiating' || callState === 'ringing';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleAudio = () => {
    setAudioEnabled(prev => !prev);
    onToggleAudio();
  };

  // Shared wrapper — centered, 50% width
  const cardClass = "fixed inset-0 z-[90] flex items-center justify-center";
  const innerClass = "bg-[#1a2e26] rounded-2xl shadow-2xl text-white overflow-hidden w-[50vw] min-w-[320px] max-w-lg";

  // LiveKit mode — render compact card with LiveKit interface inside
  if (liveKitToken) {
    return (
      <div className={cardClass}>
        <div className={innerClass}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Phone className="w-4 h-4" />
              <span>Inbound</span>
            </div>
            {isRinging && (
              <span className="bg-amber-400/20 text-amber-300 text-xs px-2 py-0.5 rounded-full">
                Ringing...
              </span>
            )}
            {isConnected && (
              <span className="text-white/80 text-sm font-mono">{formatDuration(callDuration)}</span>
            )}
          </div>

          {/* LiveKit audio interface — tall enough to show ControlBar */}
          <div className="h-64">
            <LiveKitCallInterface
              token={liveKitToken}
              serverUrl={serverUrl}
              onDisconnected={onEndCall}
              onParticipantConnected={() => setOtherParticipantJoined(true)}
              audioOnly={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // Native WebRTC mode — compact centered card
  return (
    <div className={cardClass}>
    <div className={innerClass}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <Phone className="w-4 h-4" />
          <span>Inbound</span>
        </div>
        {isRinging && (
          <span className="bg-amber-400/20 text-amber-300 text-xs px-2 py-0.5 rounded-full">
            Ringing...
          </span>
        )}
        {isConnected && (
          <span className="text-white/80 text-sm font-mono">{formatDuration(callDuration)}</span>
        )}
        {callState === 'connecting' && (
          <span className="bg-blue-400/20 text-blue-300 text-xs px-2 py-0.5 rounded-full">
            Connecting...
          </span>
        )}
      </div>

      {/* Participants */}
      <div className="px-4 py-2 space-y-2">
        {isConnected ? (
          <>
            {/* Local user */}
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 border border-white/20">
                <AvatarFallback className="text-xs bg-white/10 text-white">
                  {localUserName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-sm flex-1">{localUserName}</span>
              <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-white/70">You</span>
            </div>

            {/* Remote user */}
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 border border-white/20">
                <AvatarImage src={otherUserAvatar} />
                <AvatarFallback className="text-xs bg-white/10 text-white">
                  {otherUserName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-sm">{otherUserName}</span>
            </div>
          </>
        ) : (
          /* Ringing / connecting — show only the other participant */
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 border border-white/20">
              <AvatarImage src={otherUserAvatar} />
              <AvatarFallback className="text-xs bg-white/10 text-white">
                {otherUserName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-white text-sm">{otherUserName}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-4 pt-2">
        {!isConnected ? (
          /* Ringing — single centered End button */
          <div className="flex justify-center">
            <button
              onClick={onEndCall}
              className="bg-red-500 rounded-full px-10 py-3 text-sm font-semibold text-white active:bg-red-600 transition-colors"
            >
              End
            </button>
          </div>
        ) : (
          /* Connected — End + Mute + Add + More */
          <div className="flex items-center gap-3">
            <button
              onClick={onEndCall}
              className="bg-red-500 rounded-full px-6 py-2.5 text-sm font-semibold text-white active:bg-red-600 transition-colors"
            >
              End
            </button>

            <button
              onClick={handleToggleAudio}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
            >
              {audioEnabled
                ? <Mic className="w-4 h-4 text-white" />
                : <MicOff className="w-4 h-4 text-red-400" />
              }
            </button>

            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors">
              <UserPlus className="w-4 h-4 text-white" />
            </button>

            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors">
              <MoreHorizontal className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
