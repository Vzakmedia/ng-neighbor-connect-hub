import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, ImageIcon, Video as VideoIcon, Eye, Save, Loader2 } from '@/lib/icons';
import { type Attachment } from '@/hooks/useFileUpload';
import { VideoPlayer } from '@/components/VideoPlayer';
import ProductCard from './ProductCard';
import { useFileSave } from '@/hooks/mobile/useFileSave';
import { supabase } from '@/integrations/supabase/client';

interface AttachmentDisplayProps {
  attachments: Attachment[];
  onPreview?: (attachment: Attachment) => void;
  variant?: 'sent' | 'received';
}

const AttachmentDisplay: React.FC<AttachmentDisplayProps> = ({
  attachments,
  onPreview
}) => {
  const { saveFile, isSaving, isNative } = useFileSave();
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let isCancelled = false;

    const resolveAttachmentUrls = async () => {
      const storageAttachments = attachments.filter((attachment) => {
        const path = attachment.storagePath || attachment.id;

        return Boolean(path) &&
          path.includes('/') &&
          !attachment.url.startsWith('data:') &&
          !attachment.url.includes('res.cloudinary.com');
      });

      if (storageAttachments.length === 0) {
        setResolvedUrls({});
        return;
      }

      const results = await Promise.all(
        storageAttachments.map(async (attachment) => {
          const path = attachment.storagePath || attachment.id;
          const { data, error } = await supabase.storage
            .from('chat-attachments')
            .createSignedUrl(path, 60 * 60);

          return [attachment.id, error ? attachment.url : data.signedUrl] as const;
        })
      );

      if (!isCancelled) {
        setResolvedUrls(Object.fromEntries(results));
      }
    };

    resolveAttachmentUrls();

    return () => {
      isCancelled = true;
    };
  }, [attachments]);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSave = async (attachment: Attachment) => {
    const attachmentUrl = resolvedUrls[attachment.id] || attachment.url;
    await saveFile(attachmentUrl, attachment.name, attachment.mimeType);
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
        const attachmentUrl = resolvedUrls[attachment.id] || attachment.url;
        const resolvedAttachment = attachmentUrl === attachment.url
          ? attachment
          : { ...attachment, url: attachmentUrl };

        // Check if this is a product card attachment
        if (isProductCard(resolvedAttachment)) {
          const productData = parseProductData(resolvedAttachment);
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
                <div className="relative group">
                  <img
                    src={attachmentUrl}
                    alt={attachment.name}
                    className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer"
                    onClick={() => onPreview?.(resolvedAttachment)}
                  />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onPreview && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onPreview(resolvedAttachment)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSave(attachment)}
                      disabled={isSaving}
                      className="h-8 w-8 p-0"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isNative ? (
                        <Save className="h-3 w-3" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate flex-1">{attachment.name}</span>
                  <span>{formatFileSize(attachment.size)}</span>
                </div>
              </div>
            ) : attachment.type === 'video' ? (
              <div className="space-y-2">
                <VideoPlayer
                  src={attachmentUrl}
                  poster={attachment.thumbnailUrl}
                  className="max-w-full max-h-64 rounded-lg"
                  autoPlay={false}
                  muted={false}
                  controls={true}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="truncate flex-1">{attachment.name}</span>
                    <span>{formatFileSize(attachment.size)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSave(attachment)}
                    disabled={isSaving}
                    className="h-8 w-8 p-0"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isNative ? (
                      <Save className="h-3 w-3" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                  </Button>
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
                      onClick={() => onPreview(resolvedAttachment)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSave(attachment)}
                    disabled={isSaving}
                    className="h-8 w-8 p-0"
                    title={isNative ? "Save to Device" : "Download"}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isNative ? (
                      <Save className="h-3 w-3" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
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
