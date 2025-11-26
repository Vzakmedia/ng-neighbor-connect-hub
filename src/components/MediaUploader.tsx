import { useCallback, useEffect, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudinaryAttachment } from '@/hooks/useCloudinaryUpload';
import { validateMedia, formatFileSize } from '@/utils/mediaValidation';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { VideoPlayer } from './VideoPlayer';
import { CameraIcon, XMarkIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

// Stable empty array to prevent re-renders
const EMPTY_FILES: File[] = [];
const EMPTY_UPLOADED: CloudinaryAttachment[] = [];

interface MediaUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: 'images' | 'videos' | 'both';
  maxFiles?: number;
  maxSizeMB?: number;
  uploadedFiles?: CloudinaryAttachment[];
  pendingFiles?: File[];
  onRemove?: (index: number) => void;
  uploading?: boolean;
  progress?: number;
  disabled?: boolean;
}

export const MediaUploader = ({
  onFilesSelected,
  accept = 'both',
  maxFiles = 8,
  uploadedFiles = EMPTY_UPLOADED,
  pendingFiles = EMPTY_FILES,
  onRemove,
  uploading = false,
  progress = 0,
  disabled = false
}: MediaUploaderProps) => {
  const { toast } = useToast();
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const prevFileNamesRef = useRef<string>('');

  // Create preview URLs for pending files - only when files actually change
  useEffect(() => {
    const currentFileNames = pendingFiles.map(f => f.name).join(',');
    
    // Only update if files actually changed
    if (currentFileNames === prevFileNamesRef.current) {
      return;
    }
    
    prevFileNamesRef.current = currentFileNames;
    
    // Revoke old URLs first
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    const urls = pendingFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Cleanup function to revoke object URLs
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [pendingFiles]);

  const getAcceptedTypes = () => {
    if (accept === 'images') return { 'image/*': [] };
    if (accept === 'videos') return { 'video/*': [] };
    return { 'image/*': [], 'video/*': [] };
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate each file
    const validFiles: File[] = [];
    
    for (const file of acceptedFiles) {
      const validation = validateMedia(file);
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive",
        });
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedTypes(),
    maxFiles,
    disabled: disabled || uploading,
    multiple: maxFiles > 1
  });

  const totalFiles = uploadedFiles.length + pendingFiles.length;
  const canAddMore = totalFiles < maxFiles;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {accept === 'videos' ? (
              <VideoCameraIcon className="h-12 w-12 text-muted-foreground" />
            ) : accept === 'images' ? (
              <PhotoIcon className="h-12 w-12 text-muted-foreground" />
            ) : (
              <CameraIcon className="h-12 w-12 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? 'Drop files here' : 'Drag & drop or click to select'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {accept === 'images' && 'Images up to 50MB'}
                {accept === 'videos' && 'Videos up to 200MB'}
                {accept === 'both' && 'Images (50MB) or Videos (200MB)'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">
            Uploading... {progress}%
          </p>
        </div>
      )}

      {/* Preview Grid */}
      {totalFiles > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Pending Files */}
          {pendingFiles.map((file, index) => {
            const isVideo = file.type.startsWith('video/');
            return (
              <Card key={`pending-${index}`} className="relative group">
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    {isVideo ? (
                      <video
                        src={previewUrls[index]}
                        className="w-full h-full object-cover rounded"
                        muted
                      />
                    ) : (
                      <img
                        src={previewUrls[index]}
                        alt={file.name}
                        className="w-full h-full object-cover rounded"
                      />
                    )}
                    
                    {onRemove && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onRemove(index)}
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Badge className="absolute top-1 left-1 text-xs">Pending</Badge>
                    
                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Uploaded Files */}
          {uploadedFiles.map((file, index) => (
            <Card key={`uploaded-${index}`} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  {file.type === 'video' ? (
                    <VideoPlayer
                      src={file.url}
                      poster={file.thumbnailUrl}
                      autoPlay={false}
                      muted={true}
                      controls={true}
                      className="w-full h-full"
                    />
                  ) : (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                  
                  {onRemove && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemove(pendingFiles.length + index)}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {totalFiles} / {maxFiles} files {pendingFiles.length > 0 ? 'selected' : 'uploaded'}
      </p>
    </div>
  );
};
