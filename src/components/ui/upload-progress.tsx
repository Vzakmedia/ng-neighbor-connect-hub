import { Card } from './card';
import { Progress } from './progress';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { formatFileSize } from '@/utils/mediaValidation';

interface UploadProgressIndicatorProps {
  fileName: string;
  fileSize: number;
  progress: number;
  uploadedBytes: number;
  uploadSpeed: number; // bytes per second
  isComplete?: boolean;
  currentFile?: number;
  totalFiles?: number;
}

export const UploadProgressIndicator = ({
  fileName,
  fileSize,
  progress,
  uploadedBytes,
  uploadSpeed,
  isComplete = false,
  currentFile,
  totalFiles,
}: UploadProgressIndicatorProps) => {
  // Calculate time remaining
  const remainingBytes = fileSize - uploadedBytes;
  const timeRemaining = uploadSpeed > 0 ? Math.ceil(remainingBytes / uploadSpeed) : 0;

  const formatTime = (seconds: number) => {
    if (seconds < 1) return '< 1s';
    if (seconds < 60) return `~${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${minutes}m ${secs}s`;
  };

  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  return (
    <Card className={`border-2 transition-all duration-300 ${
      isComplete ? 'border-primary bg-primary/5' : 'border-border animate-pulse'
    }`}>
      <div className="p-4 space-y-3">
        {/* Header with file info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {totalFiles && currentFile && (
              <p className="text-xs text-muted-foreground mb-1">
                Uploading file {currentFile} of {totalFiles}
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? '📷' : '🎥'}
              </span>
              <p className="text-sm font-medium truncate">{fileName}</p>
            </div>
          </div>
          {isComplete && (
            <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0" />
          )}
        </div>

        {/* Progress Bar with gradient */}
        <div className="space-y-1">
          <Progress 
            value={progress} 
            className="h-2 bg-secondary/50"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
            {!isComplete && (
              <span>
                {formatFileSize(uploadedBytes)} / {formatFileSize(fileSize)}
              </span>
            )}
          </div>
        </div>

        {/* Speed and Time Remaining */}
        {!isComplete && uploadSpeed > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatSpeed(uploadSpeed)}</span>
            <span>{formatTime(timeRemaining)} left</span>
          </div>
        )}

        {isComplete && (
          <p className="text-xs text-primary font-medium">Upload complete!</p>
        )}
      </div>
    </Card>
  );
};
