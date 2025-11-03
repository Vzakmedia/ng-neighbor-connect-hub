import React from 'react';
import { LazyImage } from './LazyImage';

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
  if (!images || images.length === 0) return null;

  const gridClass = images.length === 1 
    ? "grid-cols-1" 
    : images.length === 2 
    ? "grid-cols-2" 
    : "grid-cols-2";

  const imageHeight = images.length === 1 
    ? "h-64 sm:h-80" 
    : images.length === 2 
    ? "h-48 sm:h-56"
    : "h-40 sm:h-48";

  return (
    <div className={`grid ${gridClass} gap-1.5 -mx-3 sm:-mx-4`}>
      {images.slice(0, 4).map((url, index) => (
        !imageError[index] && (
          <div key={index} className="relative group overflow-hidden">
            <LazyImage
              src={url}
              alt={`Post image ${index + 1}`}
              className={`w-full ${imageHeight} object-cover hover:opacity-90 transition-opacity cursor-pointer`}
              onError={() => onImageError(index)}
              onClick={(e) => {
                e.stopPropagation();
                onImageClick(index);
              }}
            />
            {images.length > 4 && index === 3 && (
              <div 
                className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(index);
                }}
              >
                <span className="text-white font-semibold text-base sm:text-lg">
                  +{images.length - 4} more
                </span>
              </div>
            )}
          </div>
        )
      ))}
    </div>
  );
};
