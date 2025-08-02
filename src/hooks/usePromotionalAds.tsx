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
      // Fetch active promoted posts with campaign and user profile data
      const { data: promotedPostsData, error } = await supabase
        .from('promoted_posts')
        .select(`
          *,
          promotion_campaigns!inner (
            user_id,
            status,
            start_date,
            end_date
          )
        `)
        .eq('is_active', true)
        .eq('promotion_campaigns.status', 'active')
        .order('created_at', { ascending: false })
        .limit(maxAds);

      if (error) throw error;

      // Enrich promotions with user profile data and format for ads
      const enrichedAds = await Promise.all(
        (promotedPostsData || []).map(async (promotedPost) => {
          // Get user profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, neighborhood, city, state')
            .eq('user_id', promotedPost.promotion_campaigns.user_id)
            .single();

          // Calculate time posted
          const createdDate = new Date(promotedPost.created_at);
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

          // Extract data from post_content JSON
          const postContent = promotedPost.post_content as any;
          
          const ad: PromotionalAd = {
            id: promotedPost.id,
            title: postContent.title || 'Advertisement',
            description: postContent.description || '',
            image: postContent.images && postContent.images.length > 0 ? postContent.images[0] : undefined,
            location: profileData?.neighborhood || profileData?.city || 'Location not specified',
            category: postContent.business_category || promotedPost.post_type,
            price: `₦${promotedPost.daily_budget}/day`,
            url: postContent.website_url || undefined,
            sponsored: true,
            timePosted,
            promotion_type: promotedPost.post_type,
            contact_info: postContent.contact_info
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
           table: 'promoted_posts'
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