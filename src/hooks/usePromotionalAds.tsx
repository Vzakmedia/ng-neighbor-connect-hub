import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { PromotionalAd } from '@/types/promotional';

export const usePromotionalAds = (maxAds: number = 3) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [ads, setAds] = useState<PromotionalAd[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPromotionalAds = async () => {
    if (!user || !profile) return;

    try {
      const nowIso = new Date().toISOString();

      // Fetch two sources in parallel: promoted_posts (campaign-based) and simple promotions
      const [promotedPostsRes, simplePromotionsRes] = await Promise.all([
        supabase
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
          .lte('promotion_campaigns.start_date', nowIso)
          .gte('promotion_campaigns.end_date', nowIso)
          .order('created_at', { ascending: false })
          .limit(maxAds),
        supabase
          .from('promotions')
          .select('*')
          .eq('status', 'active')
          .lte('start_date', nowIso)
          .gte('end_date', nowIso)
          .order('created_at', { ascending: false })
          .limit(maxAds)
      ]);

      const promotedPostsData = promotedPostsRes.data as any[] | null;
      const simplePromotions = simplePromotionsRes.data as any[] | null;

      // Enrich promotions from promoted_posts with user profile data and format for ads
      const enrichedFromPromoted = await Promise.all(
        (promotedPostsData || []).map(async (promotedPost) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, neighborhood, city, state')
            .eq('user_id', promotedPost.promotion_campaigns.user_id)
            .maybeSingle();

          const createdDate = new Date(promotedPost.created_at);
          const now = new Date();
          const diffInHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
          let timePosted = diffInHours < 1
            ? 'Just now'
            : diffInHours < 24
              ? `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
              : `${Math.floor(diffInHours / 24)} day${Math.floor(diffInHours / 24) > 1 ? 's' : ''} ago`;

          const postContent = promotedPost.post_content as any;

          const ad: PromotionalAd = {
            id: promotedPost.id,
            title: postContent.title || 'Advertisement',
            description: postContent.description || '',
            image: postContent.images && postContent.images.length > 0 ? postContent.images[0] : undefined,
            images: postContent.images || [],
            location: profileData?.neighborhood || profileData?.city || 'Location not specified',
            category: postContent.business_category || promotedPost.post_type,
            price: postContent.price ? `₦${postContent.price}` : `₦${promotedPost.daily_budget || ''}/day`,
            url: postContent.website_url || undefined,
            sponsored: true,
            timePosted,
            promotion_type: promotedPost.post_type,
            contact_info: postContent.contact_info,
            business: {
              name: profileData?.full_name || 'Local Business',
              logo: profileData?.avatar_url || undefined,
              location: profileData?.neighborhood || profileData?.city || 'Local Area',
              verified: false
            },
            cta: 'Learn More',
            likes: Math.floor(Math.random() * 50) + 10,
            comments: Math.floor(Math.random() * 20) + 5,
            rating: 4.5,
            type: 'general'
          };

          return ad;
        })
      );

      // Map simple promotions table rows into the same ad shape
      const mappedSimplePromotions = await Promise.all(
        (simplePromotions || []).map(async (p) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('neighborhood, city')
            .eq('user_id', p.user_id)
            .maybeSingle();

          const createdDate = new Date(p.created_at);
          const now = new Date();
          const diffInHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
          const timePosted = diffInHours < 1
            ? 'Just now'
            : diffInHours < 24
              ? `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
              : `${Math.floor(diffInHours / 24)} day${Math.floor(diffInHours / 24) > 1 ? 's' : ''} ago`;

          const ad: PromotionalAd = {
            id: p.id,
            title: p.title || 'Advertisement',
            description: p.description || '',
            image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : undefined,
            images: p.images || [],
            location: profileData?.neighborhood || profileData?.city || 'Location not specified',
            category: p.promotion_type,
            price: p.budget ? `₦${Number(p.budget).toLocaleString()}` : undefined,
            url: p.website_url || undefined,
            sponsored: true,
            timePosted,
            promotion_type: p.promotion_type,
            contact_info: p.contact_info || undefined,
            business: {
              name: 'Local Business',
              logo: undefined,
              location: profileData?.neighborhood || profileData?.city || 'Local Area',
              verified: false
            },
            cta: 'Learn More',
            likes: Math.floor(Math.random() * 50) + 10,
            comments: Math.floor(Math.random() * 20) + 5,
            rating: 4.5,
            type: 'general'
          };
          return ad;
        })
      );

      // Combine, de-duplicate by id, and limit
      const combined = [...enrichedFromPromoted, ...mappedSimplePromotions]
        .reduce<PromotionalAd[]>((acc, curr) => {
          if (!acc.find(a => a.id === curr.id)) acc.push(curr);
          return acc;
        }, [])
        .slice(0, maxAds);

      setAds(combined);
    } catch (error) {
      console.error('Error fetching promotional ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when we have both user and profile
    if (user && profile) {
      fetchPromotionalAds();
    }
  }, [user?.id, profile?.city]); // Only depend on user ID and city changes

  // Set up real-time subscriptions with reduced frequency
  useEffect(() => {
    if (!user) return;

    const subscription = createSafeSubscription(
      (channel) => channel
         .on('postgres_changes', {
           event: '*',
           schema: 'public',
           table: 'promoted_posts'
         }, () => {
           // Debounce the fetch to avoid too frequent updates
           setTimeout(() => fetchPromotionalAds(), 1000);
         })
         .on('postgres_changes', {
           event: '*',
           schema: 'public',
           table: 'promotions'
         }, () => {
           setTimeout(() => fetchPromotionalAds(), 1000);
         }),
      {
        channelName: `promotional_ads_${user.id}`, // User-specific channel
        onError: fetchPromotionalAds,
        pollInterval: 300000, // Poll every 5 minutes for ads
        debugName: 'PromotionalAds'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user?.id]); // Only depend on user ID

  return { ads, loading, refetch: fetchPromotionalAds };
};