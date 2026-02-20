import { useState, useCallback } from "react";
import { PostCard } from "@/components/community/post/PostCard";
import { useFeedQuery } from "@/hooks/useFeedQuery";
import { usePostEngagement } from "@/hooks/community/usePostEngagement";
import { transformToCardData } from "@/lib/community/postTransformers";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AdDisplay } from "@/components/advertising/display/AdDisplay";
import { SafetyAlertsWidget } from "@/components/home/SafetyAlertsWidget";
import { EventsNearYouCarousel } from "@/components/home/EventsNearYouCarousel";
import { CommunityHighlights } from "@/components/home/CommunityHighlights";
import { DiscoverServices } from "@/components/home/DiscoverServices";
import { MarketplaceHighlights } from "@/components/home/MarketplaceHighlights";
import { BusinessCardCTA } from "@/components/home/BusinessCardCTA";
import { RecommendationsCarousel } from "@/components/home/RecommendationsCarousel";
import { Loader2, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import InfiniteScroll from "react-infinite-scroll-component";
import { MiniProfile } from "@/components/profile/MiniProfile";

/**
 * UnifiedFeed - Facebook-style vertical feed with mixed content
 * Seamlessly integrates posts, ads, and widgets in a single scrollable feed
 */
export const UnifiedFeed = () => {
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleLike, handleSave } = usePostEngagement();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch posts with infinite scroll support
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    newPostsCount,
    refreshFeed
  } = useFeedQuery({
    sortBy: 'recent',
    locationScope: 'neighborhood',
  });

  const allPosts = data?.pages.flatMap(page =>
    page.items.map(post => transformToCardData({
      ...post,
      post_type: 'general',
      views_count: 0
    } as any))
  ) || [];

  // ... (existing callbacks)

  const handlePostClick = useCallback((postId: string) => {
    navigate(`/community/post/${postId}`);
  }, [navigate]);

  const handleAvatarClick = useCallback((userId: string) => {
    setSelectedUserId(userId);
  }, []);

  const handleShare = useCallback((postId: string) => {
    const postUrl = `${window.location.origin}/community/post/${postId}`;
    navigator.clipboard.writeText(postUrl);
    toast({
      title: "Link copied!",
      description: "Post link copied to clipboard",
    });
  }, [toast]);

  const toggleComments = useCallback((postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }, []);

  // Create a mixed content array with strategic widget placement
  const mixedContent: Array<{ type: 'widget' | 'post' | 'ad'; component: React.ReactNode; key: string }> = [];

  // Always start with Events Near You
  mixedContent.push({
    type: 'widget',
    component: <EventsNearYouCarousel />,
    key: 'events-near-you'
  });

  // Insert posts with strategic widget/ad placement
  allPosts.forEach((post, index) => {
    // Add post
    mixedContent.push({
      type: 'post',
      component: (
        <PostCard
          post={post}
          onLike={() => handleLike(post.id, post.isLiked)}
          onSave={() => handleSave(post.id, post.isSaved)}
          onShare={() => handleShare(post.id)}
          onRSVP={() => { }}
          onAvatarClick={handleAvatarClick}
          onImageClick={() => { }}
          onPostClick={() => handlePostClick(post.id)}
          showComments={showComments[post.id] || false}
          onToggleComments={() => toggleComments(post.id)}
        />
      ),
      key: `post-${post.id}`
    });

    // Safety Alerts after 2nd post
    if (index === 1) {
      mixedContent.push({
        type: 'widget',
        component: <SafetyAlertsWidget />,
        key: 'safety-alerts'
      });
    }

    // Recommendations Carousel after 3rd post
    if (index === 2) {
      mixedContent.push({
        type: 'widget',
        component: <RecommendationsCarousel />,
        key: 'recommendations-carousel'
      });
    }

    // First ad after 4th post
    if (index === 3) {
      mixedContent.push({
        type: 'ad',
        component: <AdDisplay placement="feed" maxAds={1} filterType="all" />,
        key: 'ad-1'
      });
    }

    // Community Highlights after 5th post
    if (index === 4) {
      mixedContent.push({
        type: 'widget',
        component: <CommunityHighlights />,
        key: 'community-highlights'
      });
    }

    // Second ad after 7th post
    if (index === 6) {
      mixedContent.push({
        type: 'ad',
        component: <AdDisplay placement="feed" maxAds={1} filterType="all" />,
        key: 'ad-2'
      });
    }

    // Discover Services after 9th post
    if (index === 8) {
      mixedContent.push({
        type: 'widget',
        component: <DiscoverServices />,
        key: 'discover-services'
      });
    }

    // Third ad after 11th post
    if (index === 10) {
      mixedContent.push({
        type: 'ad',
        component: <AdDisplay placement="feed" maxAds={1} filterType="all" />,
        key: 'ad-3'
      });
    }

    // Marketplace Highlights after 13th post
    if (index === 12) {
      mixedContent.push({
        type: 'widget',
        component: <MarketplaceHighlights />,
        key: 'marketplace-highlights'
      });
    }

    // Fourth ad after 15th post
    if (index === 14) {
      mixedContent.push({
        type: 'ad',
        component: <AdDisplay placement="feed" maxAds={1} filterType="all" />,
        key: 'ad-4'
      });
    }

    // Business Card CTA removed as per user request
    /*
    if (index === 16) {
      mixedContent.push({
        type: 'widget',
        component: <BusinessCardCTA />,
        key: 'business-card-cta'
      });
    }
    */

    // Continue adding ads every 8 posts after initial placements
    if (index > 16 && (index - 16) % 8 === 0) {
      mixedContent.push({
        type: 'ad',
        component: <AdDisplay placement="feed" maxAds={1} filterType="all" />,
        key: `ad-${index}`
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-20">
      <InfiniteScroll
        dataLength={mixedContent.length}
        next={fetchNextPage}
        hasMore={hasNextPage || false}
        loader={
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        }
        scrollThreshold={0.9}
        style={{ overflow: 'visible' }}
      >
        <div className="space-y-4 relative">
          {newPostsCount > 0 && (
            <div className="sticky top-4 z-50 flex justify-center w-full pointer-events-none">
              <Button
                onClick={refreshFeed}
                className="shadow-lg rounded-full px-6 py-2 bg-primary text-primary-foreground hover:scale-105 transition-transform pointer-events-auto flex items-center gap-2 animate-in fade-in slide-in-from-top-4"
                size="sm"
              >
                <ArrowUp className="h-4 w-4" />
                {newPostsCount} New Post{newPostsCount > 1 ? 's' : ''}
              </Button>
            </div>
          )}

          {mixedContent.map((item) => (
            <div key={item.key} className={item.type === 'widget' ? '' : 'px-4'}>
              {item.component}
            </div>
          ))}
        </div>
      </InfiniteScroll>

      {!hasNextPage && mixedContent.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          You're all caught up!
        </div>
      )}

      <MiniProfile
        userId={selectedUserId}
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
};
