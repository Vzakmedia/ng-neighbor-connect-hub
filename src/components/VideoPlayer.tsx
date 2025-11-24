import { useRef, useState } from 'react';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import { Button } from './ui/button';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
}

export const VideoPlayer = ({ 
  src, 
  poster, 
  className = '', 
  autoPlay = false,
  muted = true,
  controls = true,
  loop = false
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(!autoPlay);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVideoClick = () => {
    if (autoPlay && !showControls) {
      setShowControls(true);
      toggleMute();
    } else {
      togglePlay();
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        controls={controls && !autoPlay}
        className="w-full h-full object-cover rounded-lg"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={handleVideoClick}
      />
      
      {/* Custom Controls Overlay */}
      {controls && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <div className="flex gap-2 bg-black/50 rounded-full p-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-12 w-12 p-0 text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-12 w-12 p-0 text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-6 w-6" />
              ) : (
                <SpeakerWaveIcon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
