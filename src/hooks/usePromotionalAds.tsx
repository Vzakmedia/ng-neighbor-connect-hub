import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';

interface PromotionalAd {
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
  promotion_type: string;
  contact_info?: string;
}

export const usePromotionalAds = (maxAds: number = 3) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [ads, setAds] = useState<PromotionalAd[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPromotionalAds = async () => {
    if (!user || !profile) return;

    try {
      // Fetch active promotions with user profiles and item data
      const { data: promotionsData, error } = await supabase
        .from('promotions')
        .select(`
          *,
          profiles!promotions_user_id_fkey (
            full_name,
            avatar_url,
            neighborhood,
            city,
            state
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(maxAds);

      if (error) throw error;

      // Enrich promotions with service/item data and format for ads
      const enrichedAds = await Promise.all(
        (promotionsData || []).map(async (promotion) => {
          let itemData: any = null;
          let itemPrice = '';
          let itemCategory = '';
          let itemImages: string[] = [];

          // Fetch related service or marketplace item data
          if (promotion.item_type === 'service') {
            const { data: serviceData } = await supabase
              .from('services')
              .select('title, description, price_min, price_max, category, images')
              .eq('id', promotion.item_id)
              .single();
            
            itemData = serviceData;
            if (serviceData) {
              itemCategory = serviceData.category;
              itemImages = serviceData.images || [];
              if (serviceData.price_min && serviceData.price_max) {
                itemPrice = `₦${serviceData.price_min.toLocaleString()} - ₦${serviceData.price_max.toLocaleString()}`;
              } else if (serviceData.price_min) {
                itemPrice = `From ₦${serviceData.price_min.toLocaleString()}`;
              }
            }
          } else {
            const { data: itemData } = await supabase
              .from('marketplace_items')
              .select('title, description, price, category, images')
              .eq('id', promotion.item_id)
              .single();
            
            if (itemData) {
              itemCategory = itemData.category;
              itemImages = itemData.images || [];
              itemPrice = itemData.price ? `₦${itemData.price.toLocaleString()}` : '';
            }
          }

          // Calculate time posted
          const createdDate = new Date(promotion.created_at);
          const now = new Date();
          const diffInHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
          
          let timePosted = '';
          if (diffInHours < 1) {
            timePosted = 'Just now';
          } else if (diffInHours < 24) {
            timePosted = `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
          } else {
            const diffInDays = Math.floor(diffInHours / 24);
            timePosted = `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
          }

          const ad: PromotionalAd = {
            id: promotion.id,
            title: promotion.title,
            description: promotion.description || itemData?.description || '',
            image: itemImages.length > 0 ? itemImages[0] : undefined,
            location: (promotion.profiles as any)?.neighborhood || (promotion.profiles as any)?.city || 'Location not specified',
            category: itemCategory,
            price: itemPrice,
            url: promotion.website_url || undefined,
            sponsored: true,
            timePosted,
            promotion_type: promotion.promotion_type,
            contact_info: promotion.contact_info
          };

          return ad;
        })
      );

      setAds(enrichedAds);
    } catch (error) {
      console.error('Error fetching promotional ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotionalAds();
  }, [user, profile, maxAds]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'promotions'
        }, () => {
          fetchPromotionalAds();
        }),
      {
        channelName: 'promotional_ads_changes',
        onError: fetchPromotionalAds,
        pollInterval: 120000, // Poll every 2 minutes for ads
        debugName: 'PromotionalAds'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, maxAds]);

  return { ads, loading, refetch: fetchPromotionalAds };
};