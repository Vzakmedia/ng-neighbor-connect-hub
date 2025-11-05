import React, { useState, useEffect } from 'react';
import { LazyImage } from './LazyImage';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';

interface PostCardMediaProps {
  images: string[];
  imageError: Record<string, boolean>;
  onImageError: (index: number) => void;
  onImageClick: (index: number) => void;
}

export const PostCardMedia = ({ 
  images, 
  imageError, 
  onImageError, 
  onImageClick 
}: PostCardMediaProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (!images || images.length === 0) return null;

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
            onImageClick(0);
          }}
        />
      </div>
    );
  }

  // Multiple images - use carousel
  return (
    <div className="relative group">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          align: 'start',
          loop: true,
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
                    onImageClick(index);
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Arrows - Show on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
          <CarouselPrevious 
            className="left-2 bg-background/80 hover:bg-background border-0 shadow-lg pointer-events-auto z-10"
            onClick={(e) => e.stopPropagation()}
          />
          <CarouselNext 
            className="right-2 bg-background/80 hover:bg-background border-0 shadow-lg pointer-events-auto z-10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Dot Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === current 
                  ? 'w-6 bg-white' 
                  : 'w-1.5 bg-white/50 hover:bg-white/75'
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
