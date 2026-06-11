import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from '@/lib/icons';

interface PostImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

const MAX_OUTPUT_DIMENSION = 1920;

function centerInitialCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      mediaWidth / mediaHeight,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export const PostImageCropper = ({ isOpen, onClose, imageSrc, onCropComplete }: PostImageCropperProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerInitialCrop(width, height));
  }, []);

  const getCroppedImg = useCallback(async (): Promise<Blob> => {
    const image = imgRef.current;
    const crop = completedCrop;
    if (!image || !crop || !crop.width || !crop.height) {
      throw new Error('No image or crop data available');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    // Scale output down if it exceeds the max dimension, preserving aspect ratio
    const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(cropWidth, cropHeight));

    canvas.width = Math.round(cropWidth * scale);
    canvas.height = Math.round(cropHeight * scale);

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.9
      );
    });
  }, [completedCrop]);

  const handleCropComplete = async () => {
    if (!completedCrop) return;

    try {
      setIsProcessing(true);
      const croppedImageBlob = await getCroppedImg();
      onCropComplete(croppedImageBlob);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Photo</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center p-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            className="max-w-full max-h-[60vh]"
          >
            <img
              ref={imgRef}
              alt="Crop preview"
              src={imageSrc}
              crossOrigin="anonymous"
              className="max-w-full max-h-[60vh] object-contain"
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleCropComplete}
            disabled={!completedCrop || isProcessing}
            className="min-w-24"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Apply'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
