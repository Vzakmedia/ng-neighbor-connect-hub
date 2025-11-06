import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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
          .limit(4);

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
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">More from this seller</h3>
      <div className="grid grid-cols-2 gap-2">
        {listings.map((item) => (
          <Card
            key={item.id}
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
              <p className="font-medium text-sm line-clamp-1">{item.title}</p>
              <p className="text-primary font-semibold text-sm">
                {formatPrice(item.price)}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
