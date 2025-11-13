import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, X, Upload, AlertCircle } from '@/lib/icons';
import { usePromotionImageUpload } from '@/hooks/usePromotionImageUpload';

interface PromotionImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export const PromotionImageUpload: React.FC<PromotionImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  className = ""
}) => {
  const { uploadImages, deleteImage, uploads, isUploading } = usePromotionImageUpload();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    const uploadedUrls = await uploadImages(acceptedFiles);
    if (uploadedUrls.length > 0) {
      onImagesChange([...images, ...uploadedUrls]);
    }
  }, [images, maxImages, onImagesChange, uploadImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: maxImages - images.length,
    disabled: isUploading || images.length >= maxImages
  });

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];
    const success = await deleteImage(imageUrl);
    if (success) {
      onImagesChange(images.filter((_, i) => i !== index));
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Promotion Images</h3>
        <Badge variant="secondary">
          {images.length}/{maxImages} images
        </Badge>
      </div>

      {/* Upload Area */}
      {images.length < maxImages && (
        <Card>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-primary font-medium">Drop images here...</p>
              ) : (
                <div>
                  <p className="font-medium mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium truncate">
                    {upload.file.name}
                  </span>
                  {upload.error && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <Progress value={upload.progress} className="h-2" />
                {upload.error && (
                  <p className="text-xs text-destructive mt-1">{upload.error}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                  <img
                    src={image}
                    alt={`Promotion image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveImage(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Message */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
        <span>
          Images help make your promotions more engaging and increase click-through rates
        </span>
      </div>
    </div>
  );
};