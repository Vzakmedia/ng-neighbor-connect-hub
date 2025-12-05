import React, { useEffect, useRef, useState, useCallback } from 'react';
import { isNativePlatform } from '@/utils/nativeStartup';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  onError?: () => void;
}

/**
 * Lazy-loaded image component using Intersection Observer
 * Optimized for native Android GPU buffer management
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
  const [shouldRender, setShouldRender] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const isNative = isNativePlatform();

  // Cleanup function to properly release GPU resources
  const cleanupImage = useCallback(() => {
    if (imageElementRef.current) {
      // Clear src to release GPU texture before unmount
      imageElementRef.current.src = '';
      imageElementRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Small delay before rendering on native to prevent GPU buffer issues
            if (isNative) {
              requestAnimationFrame(() => {
                setShouldRender(true);
              });
            } else {
              setShouldRender(true);
            }
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: isNative ? '100px' : '50px', // Larger margin on native for preloading
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
      // Cleanup GPU resources on unmount
      if (isNative) {
        requestAnimationFrame(() => {
          cleanupImage();
        });
      }
    };
  }, [isNative, cleanupImage]);

  // Handle image ref for cleanup
  const handleImageRef = useCallback((el: HTMLImageElement | null) => {
    imageElementRef.current = el;
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // GPU optimization styles for native
  const gpuOptimizedStyles: React.CSSProperties = isNative ? {
    willChange: 'transform',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    contain: 'layout paint',
  } : {};

  return (
    <div 
      ref={imgRef} 
      className="relative gpu-optimized"
      style={gpuOptimizedStyles}
    >
      {/* Placeholder skeleton */}
      {!isLoaded && (
        <div 
          className={`animate-pulse bg-muted ${className}`}
          style={{ aspectRatio: '16/9', contain: 'strict' }}
        />
      )}
      
      {/* Actual image - only render when in view and ready */}
      {isInView && shouldRender && (
        <img
          ref={handleImageRef}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          style={gpuOptimizedStyles}
          onLoad={handleLoad}
          onError={onError}
          onClick={onClick}
        />
      )}
    </div>
  );
};
