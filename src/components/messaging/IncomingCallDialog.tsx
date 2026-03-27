import React, { useEffect, useRef } from 'react';
import { Phone, Video as VideoIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createRingtonePlayer, initializeAudioOnInteraction } from '@/utils/audioUtils';
import { motion } from 'framer-motion';

interface IncomingCallDialogProps {
  open: boolean;
  callerName: string;
  callerAvatar?: string;
  callerSubtitle?: string;
  isVideoCall: boolean;
  onAccept: (acceptVideo: boolean) => void;
  onDecline: () => void;
}

export const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({
  open,
  callerName,
  callerAvatar,
  callerSubtitle,
  isVideoCall,
  onAccept,
  onDecline
}) => {
  const ringtoneRef = useRef<ReturnType<typeof createRingtonePlayer> | null>(null);

  useEffect(() => {
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
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#1a2e26] text-white touch-none"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-white/70 text-sm">
          {isVideoCall ? <VideoIcon className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          <span>Inbound</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white text-xs">Incoming</span>
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Avatar className="w-28 h-28 border-2 border-white/20 shadow-2xl">
          <AvatarImage src={callerAvatar} className="object-cover" />
          <AvatarFallback className="text-4xl bg-white/10 text-white">
            {callerName?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-semibold text-white text-center px-4">
            {callerName}
          </h1>
          {callerSubtitle && (
            <p className="text-white/60 text-sm">{callerSubtitle}</p>
          )}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pb-10 flex gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onDecline}
          className="flex-1 h-14 bg-red-500 rounded-full text-white font-semibold text-base active:bg-red-600 transition-colors"
        >
          Decline
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onAccept(isVideoCall)}
          className="flex-1 h-14 bg-green-500 rounded-full text-white font-semibold text-base active:bg-green-600 transition-colors"
        >
          Accept
        </motion.button>
      </div>
    </div>
  );
};
