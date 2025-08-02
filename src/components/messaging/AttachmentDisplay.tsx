import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Image as ImageIcon, Video as VideoIcon, Eye } from 'lucide-react';
import { type Attachment } from '@/hooks/useFileUpload';
import ProductCard from './ProductCard';

interface AttachmentDisplayProps {
  attachments: Attachment[];
  onPreview?: (attachment: Attachment) => void;
}

const AttachmentDisplay: React.FC<AttachmentDisplayProps> = ({
  attachments,
  onPreview
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isProductCard = (attachment: Attachment): boolean => {
    return (attachment.mimeType === 'application/json' && 
            attachment.name.endsWith('.json') &&
            (attachment as any).productData) ||
           (attachment.mimeType === 'application/json' && 
            attachment.name.includes('_details.json') &&
            attachment.url.startsWith('data:application/json;base64,'));
  };

  const parseProductData = (attachment: Attachment) => {
    // First check if productData is directly available
    if ((attachment as any).productData) {
      return (attachment as any).productData;
    }

    // Otherwise try to parse from base64 data
    try {
      const base64Data = attachment.url.replace('data:application/json;base64,', '');
      const jsonData = atob(base64Data);
      const productData = JSON.parse(jsonData);
      return productData.type === 'product_card' ? productData : null;
    } catch (error) {
      console.error('Error parsing product data:', error);
      return null;
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <VideoIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-2 mt-2">
      {attachments.map((attachment) => {
        // Check if this is a product card attachment
        if (isProductCard(attachment)) {
          const productData = parseProductData(attachment);
          if (productData) {
            return (
              <div key={attachment.id} className="my-2">
                <ProductCard product={productData} />
              </div>
            );
          }
        }

        return (
          <div key={attachment.id} className="border rounded-lg p-3 bg-background/50">
            {attachment.type === 'image' ? (
              <div className="space-y-2">
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer"
                  onClick={() => onPreview?.(attachment)}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate flex-1">{attachment.name}</span>
                  <span>{formatFileSize(attachment.size)}</span>
                </div>
              </div>
            ) : attachment.type === 'video' ? (
              <div className="space-y-2">
                <video
                  src={attachment.url}
                  controls
                  className="max-w-full max-h-64 rounded-lg"
                  preload="metadata"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate flex-1">{attachment.name}</span>
                  <span>{formatFileSize(attachment.size)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(attachment.type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {onPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreview(attachment)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AttachmentDisplay;