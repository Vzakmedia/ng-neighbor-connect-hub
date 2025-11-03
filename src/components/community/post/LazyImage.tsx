import React, { useEffect, useRef, useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  onError?: () => void;
}

/**
 * Lazy-loaded image component using Intersection Observer
 * Only loads images when they're about to become visible
 */
export const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  onClick,
  onError 
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="relative">
      {/* Placeholder skeleton */}
      {!isLoaded && (
        <div 
          className={`animate-pulse bg-muted ${className}`}
          style={{ aspectRatio: '16/9' }}
        />
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => setIsLoaded(true)}
          onError={onError}
          onClick={onClick}
        />
      )}
    </div>
  );
};
