import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2 } from 'lucide-react';
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
    <div className={cn("flex gap-2 items-center bg-background/95 backdrop-blur-sm border rounded-lg p-2", className)}>
      <Button
        variant={audioEnabled ? "outline" : "destructive"}
        size="sm"
        onClick={handleToggleAudio}
      >
        {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </Button>
      
      {isVideoCall && (
        <Button
          variant={videoEnabled ? "outline" : "destructive"}
          size="sm"
          onClick={handleToggleVideo}
        >
          {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
      )}
      
      <Button
        variant="destructive"
        size="sm"
        onClick={onEndCall}
      >
        <PhoneOff className="h-4 w-4" />
      </Button>
    </div>
  );
};