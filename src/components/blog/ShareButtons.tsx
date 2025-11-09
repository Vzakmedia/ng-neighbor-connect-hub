import { Button } from '@/components/ui/button';
import { Share2, Twitter, Facebook, Linkedin, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export const ShareButtons = ({ title, url }: ShareButtonsProps) => {
  const fullUrl = `${window.location.origin}${url}`;

  const shareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
      '_blank',
      'width=550,height=420'
    );
  };

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      '_blank',
      'width=550,height=420'
    );
  };

  const shareOnLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
      '_blank',
      'width=550,height=420'
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        Share:
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={shareOnTwitter}
        className="hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2] transition-colors"
      >
        <Twitter className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={shareOnFacebook}
        className="hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-colors"
      >
        <Facebook className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={shareOnLinkedIn}
        className="hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-colors"
      >
        <Linkedin className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={copyLink}
      >
        <Link2 className="w-4 h-4" />
      </Button>
    </div>
  );
};
