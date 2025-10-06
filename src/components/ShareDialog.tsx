import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  Check,
  Mail,
  MessageCircle
} from 'lucide-react';
import { 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaWhatsapp 
} from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { useNativeShare } from '@/hooks/mobile/useNativeShare';
import { useNativeClipboard } from '@/hooks/mobile/useNativeClipboard';
import { openUrl } from '@/utils/nativeBrowser';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle?: string;
  postContent: string;
  postAuthor: string;
}

const ShareDialog = ({ open, onOpenChange, postId, postTitle, postContent, postAuthor }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { share, canShare } = useNativeShare();
  const { copyToClipboard } = useNativeClipboard();

  // Generate share URL (in a real app, this would be the actual post URL)
  const shareUrl = `${window.location.origin}/community/post/${postId}`;
  const shareText = postTitle ? `${postTitle} - by ${postAuthor}` : `Post by ${postAuthor}`;
  const fullShareText = `${shareText}\n\n${(postContent || '').substring(0, 100)}${(postContent || '').length > 100 ? '...' : ''}`;

  const copyLink = async () => {
    await copyToClipboard(shareUrl, "The post link has been copied to your clipboard.");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToSocial = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const encodedFullText = encodeURIComponent(fullShareText);
    
    let shareLink = '';
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedText}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodedFullText}%20${encodedUrl}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${encodedText}&body=${encodedFullText}%0A%0A${encodedUrl}`;
        break;
      default:
        return;
    }
    
    openUrl(shareLink, '_blank', 'width=600,height=400');
  };

  const shareNative = async () => {
    const shared = await share({
      title: shareText,
      text: postContent,
      url: shareUrl,
    });
    
    if (!shared) {
      // Fallback to copy to clipboard
      copyLink();
    }
  };

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: FaFacebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: () => shareToSocial('facebook')
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      color: 'text-sky-500',
      bgColor: 'bg-sky-50 hover:bg-sky-100',
      action: () => shareToSocial('twitter')
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: () => shareToSocial('linkedin')
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      action: () => shareToSocial('whatsapp')
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      action: () => shareToSocial('email')
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Social Media Sharing */}
          <div>
            <h4 className="text-sm font-medium mb-3">Share to social media</h4>
            <div className="grid grid-cols-5 gap-2">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <Button
                    key={platform.name}
                    variant="ghost"
                    size="icon"
                    onClick={platform.action}
                    className={`h-12 w-12 ${platform.bgColor} ${platform.color} rounded-xl`}
                    title={`Share to ${platform.name}`}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Copy Link */}
          <div className="space-y-3">
            <Label htmlFor="share-link">Share link</Label>
            <div className="flex space-x-2">
              <Input
                id="share-link"
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={copyLink}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Native Share (if supported) */}
          {canShare() && (
            <>
              <Separator />
              <Button
                onClick={shareNative}
                variant="outline"
                className="w-full"
              >
                More sharing options
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;