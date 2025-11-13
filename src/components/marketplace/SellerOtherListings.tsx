import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import useEmblaCarousel from 'embla-carousel-react';

interface MarketplaceItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
}

interface SellerOtherListingsProps {
  sellerId: string;
  currentItemId: string;
  onItemClick: (item: MarketplaceItem) => void;
}

export const SellerOtherListings = ({ 
  sellerId, 
  currentItemId,
  onItemClick 
}: SellerOtherListingsProps) => {
  const [listings, setListings] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    slidesToScroll: 1,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const fetchSellerListings = async () => {
      try {
        const { data, error } = await supabase
          .from('marketplace_items')
          .select('id, title, price, images, condition')
          .eq('user_id', sellerId)
          .neq('id', currentItemId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(9);

        if (error) throw error;
        setListings(data || []);
      } catch (error) {
        console.error('Error fetching seller listings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchSellerListings();
    }
  }, [sellerId, currentItemId]);

  if (loading || listings.length === 0) return null;

  const formatPrice = (price: number) => {
    return price === 0 ? 'FREE' : `₦${(price / 100).toLocaleString()}`;
  };

  return (
    <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">More from this seller</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={scrollNext}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-2">
          {listings.map((item) => (
            <div key={item.id} className="flex-[0_0_33.333%] min-w-0">
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                onClick={() => onItemClick(item)}
              >
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="font-medium text-xs line-clamp-1">{item.title}</p>
                  <p className="text-primary font-semibold text-xs">
                    {formatPrice(item.price)}
                  </p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
