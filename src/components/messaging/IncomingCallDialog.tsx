import React, { useEffect, useRef } from 'react';
import { Phone, X as PhoneOff, Video as VideoIcon, Mic, MicOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createRingtonePlayer, initializeAudioOnInteraction } from '@/utils/audioUtils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface IncomingCallDialogProps {
  open: boolean;
  callerName: string;
  callerAvatar?: string;
  isVideoCall: boolean;
  onAccept: (acceptVideo: boolean) => void;
  onDecline: () => void;
}

export const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({
  open,
  callerName,
  callerAvatar,
  isVideoCall,
  onAccept,
  onDecline
}) => {
  const ringtoneRef = useRef<ReturnType<typeof createRingtonePlayer> | null>(null);

  useEffect(() => {
    // Prevent scrolling when call screen is open
    if (open) {
      document.body.style.overflow = 'hidden';
      ringtoneRef.current = createRingtonePlayer();

      const startRingtone = async () => {
        try {
          await initializeAudioOnInteraction();
          await ringtoneRef.current?.start();
          console.log("[IncomingCallDialog] Ringtone started");
        } catch (e) {
          console.error('Failed to start ringtone:', e);
        }
      };
      startRingtone();

    } else {
      document.body.style.overflow = 'unset';
      ringtoneRef.current?.stop();
      ringtoneRef.current = null;
    }

    return () => {
      document.body.style.overflow = 'unset';
      ringtoneRef.current?.stop();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-zinc-950 text-white pb-12 pt-16 px-6 touch-none">
      {/* Background gradients for visual depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-zinc-950 -z-10" />

      {/* Top Info */}
      <div className="flex flex-col items-center space-y-4 pt-8 animate-in fade-in slide-in-from-top-10 duration-500">
        <div className="flex items-center space-x-2 text-zinc-400 text-sm font-medium uppercase tracking-wider">
          {isVideoCall ? <VideoIcon className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          <span>Incoming {isVideoCall ? 'Video' : 'Voice'} Call</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-center px-4 leading-tight">
          {callerName}
        </h1>
        <p className="text-zinc-500 text-sm">Neighborlink Audio/Video...</p>
      </div>

      {/* Center Avatar with Ripple Animation */}
      <div className="relative flex items-center justify-center flex-1 w-full my-8">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Animated Ripples */}
          <div className="absolute w-48 h-48 rounded-full border border-zinc-700/50 animate-[ping_3s_ease-in-out_infinite] opacity-20" />
          <div className="absolute w-64 h-64 rounded-full border border-zinc-700/30 animate-[ping_4s_ease-in-out_infinite_1s] opacity-10" />
        </div>

        <Avatar className="w-40 h-40 border-4 border-zinc-800 shadow-2xl relative z-10 brightness-110">
          <AvatarImage src={callerAvatar} className="object-cover bg-zinc-800" />
          <AvatarFallback className="text-5xl bg-zinc-800 text-zinc-400">
            {callerName?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Bottom Actions */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-8 items-end px-4 mb-8">
        {/* Decline Button */}
        <div className="flex flex-col items-center space-y-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onDecline}
            className="w-16 h-16 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-lg backdrop-blur-sm border border-red-400/20 active:bg-red-600 transition-colors"
          >
            <PhoneOff className="w-8 h-8" />
          </motion.button>
          <span className="text-zinc-400 text-sm font-medium">Decline</span>
        </div>

        {/* Accept Button */}
        <div className="flex flex-col items-center space-y-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onAccept(isVideoCall)}
            className="w-16 h-16 rounded-full bg-green-500/90 text-white flex items-center justify-center shadow-lg backdrop-blur-sm border border-green-400/20 active:bg-green-600 transition-colors"
          >
            {isVideoCall ? <VideoIcon className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
          </motion.button>
          <span className="text-zinc-400 text-sm font-medium">Accept</span>
        </div>
      </div>

      {/* Footer / Encryption Text */}
      <div className="absolute bottom-6 text-xs text-zinc-600 flex items-center space-x-1">
        <span>🔒</span>
        <span>End-to-end encrypted</span>
      </div>
    </div>
  );
};