import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, X as PhoneOff, Video, VolumeX as VideoOff, Mic, VolumeX as MicOff, Volume2, MessageCircle, Plus } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface CallControlsProps {
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
  onEndCall: () => void;
  onToggleAudio: (enabled: boolean) => void;
  onToggleVideo: (enabled: boolean) => void;
  isInCall: boolean;
  isVideoCall: boolean;
  className?: string;
}

export const CallControls: React.FC<CallControlsProps> = ({
  onStartVoiceCall,
  onStartVideoCall,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  isInCall,
  isVideoCall,
  className
}) => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const handleToggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    onToggleAudio(newState);
  };

  const handleToggleVideo = () => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    onToggleVideo(newState);
  };

  if (!isInCall) {
    return (
      <div className={cn("flex gap-2", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={onStartVoiceCall}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onStartVideoCall}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Video className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-6 pb-4", className)}>
      {/* First row: Mute, Chat, Speaker */}
      <div className="flex items-center justify-center gap-8">
        <button 
          onClick={handleToggleAudio}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            {audioEnabled ? <Volume2 className="h-6 w-6 text-white" /> : <MicOff className="h-6 w-6 text-white" />}
          </div>
          <span className="text-white text-xs font-medium">Mute</span>
        </button>

        <button 
          onClick={() => console.log('Chat clicked')}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">Chat</span>
        </button>

        <button 
          onClick={() => console.log('Speaker clicked')}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <Volume2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">Speaker</span>
        </button>
      </div>

      {/* Second row: Add, Record, End */}
      <div className="flex items-center justify-center gap-8">
        <button 
          onClick={() => console.log('Add participant clicked')}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">Add</span>
        </button>

        <button 
          onClick={() => console.log('Record clicked')}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <Mic className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">Record</span>
        </button>

        <button 
          onClick={onEndCall}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center hover:bg-destructive/90 transition-colors">
            <PhoneOff className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">End</span>
        </button>
      </div>
    </div>
  );
};