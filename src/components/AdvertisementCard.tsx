import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, ExternalLink, MoreHorizontal, Share2, Link as LinkIcon, Flag, EyeOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface Advertisement {
  id: string;
  title: string;
  description: string;
  image?: string;
  location: string;
  category: string;
  price?: string;
  url?: string;
  sponsored: boolean;
  timePosted: string;
}

interface AdvertisementCardProps {
  ad: Advertisement;
}

const AdvertisementCard = ({ ad }: AdvertisementCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    let logged = false;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !logged) {
        logged = true;
        void (async () => {
          try {
            await supabase.rpc('log_promotion_impression', {
              _promoted_post_id: ad.id,
              _user_id: user?.id || null,
              _user_location: null,
              _impression_type: 'view',
            });
          } catch {}
        })();
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [ad.id, user?.id]);

  const handleAdClick = async () => {
    if (ad.url) {
      try {
        await supabase.rpc('log_promotion_impression', {
          _promoted_post_id: ad.id,
          _user_id: user?.id || null,
          _user_location: null,
          _impression_type: 'click',
        });
      } catch {}
      window.open(ad.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = async () => {
    if (!ad.url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: ad.title, text: ad.description, url: ad.url });
      } else {
        await navigator.clipboard.writeText(ad.url);
        toast({ title: 'Link copied to clipboard' });
      }
    } catch {}
  };

  const handleHide = () => {
    toast({ title: 'Ad hidden', description: "We'll show fewer ads like this." });
  };

  const handleReport = () => {
    toast({ title: 'Thanks for the report', description: 'We will review this ad.' });
  };

  return (
    <Card ref={cardRef} role="article" aria-label={`Promoted post: ${ad.title}`} className="shadow-card hover:shadow-elevated transition-all cursor-pointer border-l-4 border-l-community-yellow overflow-hidden">
      <CardContent className="p-3 sm:p-4" onClick={handleAdClick}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-community-yellow/20 text-community-yellow">
              Sponsored
            </Badge>
            <Badge variant="outline" className="text-xs">
              {ad.category}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Ad options" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
              {ad.url && (
                <DropdownMenuItem onClick={handleAdClick}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Visit website
                </DropdownMenuItem>
              )}
              {ad.url && (
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </DropdownMenuItem>
              )}
              {ad.url && (
                <DropdownMenuItem onClick={async () => { if (!ad.url) return; await navigator.clipboard.writeText(ad.url); toast({ title: 'Link copied to clipboard' }); }}>
                  <LinkIcon className="h-4 w-4 mr-2" /> Copy link
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleHide}>
                <EyeOff className="h-4 w-4 mr-2" /> Hide ad
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport}>
                <Flag className="h-4 w-4 mr-2" /> Report ad
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {ad.image && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img
              src={ad.image}
              alt={ad.title}
              loading="lazy"
              className="w-full h-28 sm:h-40 object-cover"
            />
          </div>
        )}

        <h4 className="font-semibold mb-2 text-foreground hover:text-primary transition-colors text-base sm:text-lg">
          {ad.title}
        </h4>
        
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
          {ad.description}
        </p>

        {ad.price && (
          <p className="text-base sm:text-lg font-bold text-primary mb-2">{ad.price}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {ad.location}
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {ad.timePosted}
          </div>
        </div>

        {ad.url && (
          <Button variant="outline" className="w-full mt-3 h-10 sm:h-11 text-sm" aria-label={`Learn more about ${ad.title}`} onClick={(e) => { e.stopPropagation(); handleAdClick(); }}>
            Learn More
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvertisementCard;