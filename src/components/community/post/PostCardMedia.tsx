import React, { useState, useEffect } from 'react';
import { LazyImage } from './LazyImage';
import { VideoPlayer } from '@/components/VideoPlayer';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNativeHaptics } from '@/hooks/mobile/useNativeHaptics';

interface PostCardMediaProps {
  images?: string[];
  videoUrl?: string;
  videoThumbnail?: string;
  imageError?: Record<string, boolean>;
  onImageError?: (index: number) => void;
  onImageClick?: (index: number) => void;
  onDoubleTapLike?: () => void;
  onVideoClick?: () => void;
}

export const PostCardMedia = ({ 
  images = [], 
  videoUrl,
  videoThumbnail,
  imageError = {}, 
  onImageError = () => {}, 
  onImageClick = () => {},
  onDoubleTapLike,
  onVideoClick
}: PostCardMediaProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const isMobile = useIsMobile();
  const { impact } = useNativeHaptics();
  const [showHeart, setShowHeart] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
      // Add haptic feedback on slide change for native apps
      impact('light');
    });
  }, [api, impact]);

  // If we have a video, show it first
  if (videoUrl) {
    return (
      <div 
        className="relative group overflow-hidden cursor-pointer"
        onClick={onVideoClick}
      >
        <VideoPlayer
          src={videoUrl}
          poster={videoThumbnail}
          autoPlay={true}
          muted={true}
          loop={true}
          controls={true}
          className="w-full h-64 sm:h-80 object-cover"
        />
        
        {/* Click to expand overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-full p-3">
            <svg className="w-8 h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
        </div>
        
        {/* Heart Animation Overlay */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <svg
              className="w-24 h-24 text-white drop-shadow-lg animate-[scale-in_0.3s_ease-out,fade-out_0.5s_ease-out_0.3s]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        )}
      </div>
    );
  }

  if (!images || images.length === 0) return null;

  // Double-tap detection handler
  const handleImageTap = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms window for double-tap

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double-tap detected
      e.stopPropagation();
      e.preventDefault();
      
      // Trigger haptic feedback
      impact('medium');
      
      // Show heart animation
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
      
      // Trigger like action
      onDoubleTapLike?.();
      
      setLastTap(0); // Reset to prevent triple-tap
    } else {
      // First tap - set timestamp
      setLastTap(now);
      
      // Delay single-tap action to allow for double-tap detection
      setTimeout(() => {
        if (Date.now() - now >= DOUBLE_TAP_DELAY) {
          // Single tap confirmed - trigger image click
          onImageClick(index);
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  // Filter out error images
  const validImages = images.filter((_, index) => !imageError[index]);
  
  if (validImages.length === 0) return null;

  // Single image - no carousel needed
  if (validImages.length === 1) {
    return (
      <div className="relative group overflow-hidden">
        <LazyImage
          src={validImages[0]}
          alt="Post image"
          className="w-full h-64 sm:h-80 object-cover hover:opacity-95 transition-opacity cursor-pointer"
          onError={() => onImageError(0)}
          onClick={(e) => {
            e.stopPropagation();
            handleImageTap(e, 0);
          }}
        />
        
        {/* Heart Animation Overlay */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <svg
              className="w-24 h-24 text-white drop-shadow-lg animate-[scale-in_0.3s_ease-out,fade-out_0.5s_ease-out_0.3s]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        )}
      </div>
    );
  }

  // Multiple images - use carousel
  return (
    <div className="relative group touch-pan-y">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          align: 'start',
          loop: true,
          dragFree: false,
          skipSnaps: false,
          containScroll: 'trimSnaps',
          watchDrag: true,
          duration: 20,
        }}
      >
        <CarouselContent className="-ml-0">
          {validImages.map((url, index) => (
            <CarouselItem key={index} className="pl-0">
              <div className="relative overflow-hidden">
                <LazyImage
                  src={url}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-64 sm:h-80 object-cover hover:opacity-95 transition-opacity cursor-pointer"
                  onError={() => onImageError(index)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageTap(e, index);
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Heart Animation Overlay for Carousel */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <svg
              className="w-24 h-24 text-white drop-shadow-lg animate-[scale-in_0.3s_ease-out,fade-out_0.5s_ease-out_0.3s]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        )}

        {/* Navigation Arrows - Show on hover (desktop only) */}
        {!isMobile && (
          <>
            <CarouselPrevious 
              className="left-2 bg-background/80 hover:bg-background border-0 shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            />
            <CarouselNext 
              className="right-2 bg-background/80 hover:bg-background border-0 shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            />
          </>
        )}

        {/* Dot Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              className={`${isMobile ? 'h-2' : 'h-1.5'} rounded-full transition-all duration-300 ${
                index === current 
                  ? `${isMobile ? 'w-8' : 'w-6'} bg-white` 
                  : `${isMobile ? 'w-2' : 'w-1.5'} bg-white/50 hover:bg-white/75`
              }`}
              onClick={(e) => {
                e.stopPropagation();
                api?.scrollTo(index);
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Image Counter Badge */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          {current + 1} / {count}
        </div>
      </Carousel>
    </div>
  );
};
