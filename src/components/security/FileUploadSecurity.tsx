import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateImageFile } from '@/utils/security';
import { AlertTriangle, Upload } from 'lucide-react';

interface FileUploadSecurityProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const FileUploadSecurity: React.FC<FileUploadSecurityProps> = ({
  onFileSelect,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  disabled = false,
  children
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      e.target.value = ''; // Clear the input
      return;
    }

    // Additional security checks
    if (file.name.includes('../') || file.name.includes('..\\')) {
      setError('Invalid file name detected');
      e.target.value = '';
      return;
    }

    // Check for suspicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs'];
    const fileName = file.name.toLowerCase();
    if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
      setError('File type not allowed for security reasons');
      e.target.value = '';
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-muted file:text-muted-foreground hover:file:bg-muted/80"
        />
        {children}
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="text-xs text-muted-foreground">
        Max file size: {Math.round(maxSize / (1024 * 1024))}MB. Allowed types: JPEG, PNG, WebP, GIF
      </div>
    </div>
  );
};