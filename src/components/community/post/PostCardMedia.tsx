import React from 'react';

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {images.slice(0, 4).map((url, index) => (
        !imageError[index] && (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Post image ${index + 1}`}
              loading="lazy"
              className="w-full h-40 sm:h-48 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
              onError={() => onImageError(index)}
              onClick={(e) => {
                e.stopPropagation();
                onImageClick(index);
              }}
            />
            {images.length > 4 && index === 3 && (
              <div 
                className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(index);
                }}
              >
                <span className="text-white font-medium text-sm sm:text-base">
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
