import React from 'react';
import { Phone, Video, Volume2, MoreHorizontal } from '@/lib/icons';
import { formatDistanceToNow } from 'date-fns';

interface CallLog {
  id: string;
  conversation_id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'voice' | 'video';
  call_status: 'missed' | 'answered' | 'declined' | 'failed' | 'ended';
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
}

interface CallLogMessageProps {
  callLog: CallLog;
  currentUserId: string;
  onCall: (isVideo: boolean) => void;
  className?: string;
}

const formatCallDuration = (seconds: number): string => {
  if (seconds === 0) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Static waveform bars seeded from call duration
function WaveformBars({ duration }: { duration: number }) {
  const bars = Array.from({ length: 24 }, (_, i) => {
    const seed = (i * 7 + duration) % 17;
    return Math.max(3, 4 + (seed % 16));
  });
  return (
    <div className="flex items-end gap-[2px] h-5 my-2">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-primary/60 flex-shrink-0"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

export const CallLogMessage: React.FC<CallLogMessageProps> = ({
  callLog,
  currentUserId,
  onCall,
  className = '',
}) => {
  const isOutgoing = callLog.caller_id === currentUserId;
  const duration = formatCallDuration(callLog.duration_seconds);
  const timeAgo = formatDistanceToNow(new Date(callLog.started_at), { addSuffix: true });
  const isEnded =
    callLog.call_status === 'ended' ||
    (callLog.call_status === 'answered' && callLog.duration_seconds > 0);

  // — Full call-ended card —
  if (isEnded) {
    return (
      <div className={`flex justify-center my-2 ${className}`}>
        <div className="w-full max-w-sm bg-muted/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Call ended</span>
              <span className="text-xs text-muted-foreground ml-2">
                {isOutgoing ? 'You called' : 'You answered'} · {duration}
              </span>
            </div>
          </div>

          <WaveformBars duration={callLog.duration_seconds} />

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono">{duration}</span>
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={() => onCall(callLog.call_type === 'video')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // — Inline badge —
  type BadgeStyle = {
    wrapper: string;
    icon: React.ReactNode;
    label: string;
    sub: string;
  };

  const badgeStyles: Record<string, BadgeStyle> = {
    missed: {
      wrapper: 'bg-red-100/80 dark:bg-red-950/40',
      icon: <Phone className="w-4 h-4 text-red-500 rotate-[135deg]" />,
      label: 'Missed call',
      sub: 'No one answered',
    },
    declined: {
      wrapper: 'bg-orange-100/80 dark:bg-orange-950/40',
      icon: <Phone className="w-4 h-4 text-orange-500 rotate-[135deg]" />,
      label: isOutgoing ? 'Call declined' : 'Declined call',
      sub: isOutgoing ? 'They declined' : 'You declined',
    },
    failed: {
      wrapper: 'bg-gray-100 dark:bg-gray-800/40',
      icon: <Phone className="w-4 h-4 text-gray-400" />,
      label: 'Call failed',
      sub: 'Something went wrong',
    },
    answered: {
      wrapper: 'bg-green-100/80 dark:bg-green-950/40',
      icon: <Phone className="w-4 h-4 text-green-500 animate-pulse" />,
      label: 'Call in progress...',
      sub: 'You answered',
    },
  };

  const style = badgeStyles[callLog.call_status] ?? badgeStyles.failed;
  const CallIcon = callLog.call_type === 'video' ? Video : Phone;

  return (
    <div className={`flex items-center justify-center my-2 ${className}`}>
      <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full ${style.wrapper}`}>
        <span className="flex-shrink-0">{style.icon}</span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium">{style.label}</span>
          <span className="text-xs text-muted-foreground">{style.sub}</span>
        </div>
        <span className="text-xs text-muted-foreground ml-1">{timeAgo}</span>
      </div>
    </div>
  );
};
