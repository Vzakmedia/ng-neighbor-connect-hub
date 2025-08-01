import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Paperclip, Image, Video, FileText, Camera } from 'lucide-react';

interface AttachmentButtonProps {
  onFileSelect: (files: File[]) => void;
  uploading?: boolean;
}

const AttachmentButton: React.FC<AttachmentButtonProps> = ({
  onFileSelect,
  uploading = false
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = () => {
    imageInputRef.current?.click();
  };

  const handleVideoSelect = () => {
    videoInputRef.current?.click();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFileSelect(files);
    }
    // Reset the input
    event.target.value = '';
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            disabled={uploading}
            className="shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="z-50 bg-background border shadow-lg" side="top">
          <DropdownMenuItem 
            onClick={handleImageSelect}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Image className="h-4 w-4 text-green-600" />
            Photos
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleVideoSelect}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Video className="h-4 w-4 text-blue-600" />
            Videos
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleFileSelect}
            className="flex items-center gap-2 cursor-pointer"
          >
            <FileText className="h-4 w-4 text-purple-600" />
            Documents
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};

export default AttachmentButton;