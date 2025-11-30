import React from 'react';
import { Phone, X as PhoneOff, Video, VolumeX as VideoOff, Phone as PhoneMissed, Phone as PhoneIncoming, Phone as PhoneOutgoing } from '@/lib/icons';
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

const getCallIcon = (callType: string, callStatus: string, isOutgoing: boolean) => {
  const iconClass = "h-4 w-4";
  
  if (callStatus === 'missed') {
    return <PhoneMissed className={`${iconClass} text-destructive`} />;
  }
  
  if (isOutgoing) {
    if (callType === 'video') {
      return <Video className={`${iconClass} text-primary`} />;
    }
    return <PhoneOutgoing className={`${iconClass} text-primary`} />;
  } else {
    if (callType === 'video') {
      return <Video className={`${iconClass} text-green-600`} />;
    }
    return <PhoneIncoming className={`${iconClass} text-green-600`} />;
  }
};

const getCallStatusText = (callStatus: string, isOutgoing: boolean, callType: string) => {
  if (callStatus === 'missed') {
    return isOutgoing ? 'Missed call' : 'Missed call';
  }
  if (callStatus === 'declined') {
    return isOutgoing ? 'Call declined' : 'Declined call';
  }
  if (callStatus === 'failed') {
    return 'Call failed';
  }
  if (callStatus === 'answered' || callStatus === 'ended') {
    const callTypeText = callType === 'video' ? 'Video call' : 'Voice call';
    return isOutgoing ? `Outgoing ${callTypeText.toLowerCase()}` : `Incoming ${callTypeText.toLowerCase()}`;
  }
  return 'Call';
};

export const CallLogMessage: React.FC<CallLogMessageProps> = ({
  callLog,
  currentUserId,
  onCall,
  className = ''
}) => {
  const isOutgoing = callLog.caller_id === currentUserId;
  const callIcon = getCallIcon(callLog.call_type, callLog.call_status, isOutgoing);
  const callStatusText = getCallStatusText(callLog.call_status, isOutgoing, callLog.call_type);
  const duration = formatCallDuration(callLog.duration_seconds);
  const timeAgo = formatDistanceToNow(new Date(callLog.started_at), { addSuffix: true });

  const handleCallBack = () => {
    onCall(callLog.call_type === 'video');
  };

  return (
    <div className={`flex items-center justify-center my-2 ${className}`}>
      <div className="bg-muted/30 rounded-lg p-3 max-w-xs mx-auto">
        <div className="flex items-center gap-2 mb-1">
          {callIcon}
          <span className="text-sm font-medium text-muted-foreground">
            {callStatusText}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            <div>{timeAgo}</div>
            {duration && (
              <div className="font-medium text-foreground">{duration}</div>
            )}
          </div>
          
          <button
            onClick={handleCallBack}
            className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            title={`Call back (${callLog.call_type})`}
          >
            {callLog.call_type === 'video' ? (
              <Video className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Phone className="h-3.5 w-3.5 text-primary" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};