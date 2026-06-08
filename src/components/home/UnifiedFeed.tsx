import { useState, useCallback, useMemo, memo } from "react";
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
import { RecommendationsCarousel } from "@/components/home/RecommendationsCarousel";
import { TrendingPostsCarousel as TrendingPostsCarouselBase } from "@/components/home/TrendingPostsCarousel";
import { Loader2, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import InfiniteScroll from "react-infinite-scroll-component";
import { MiniProfile } from "@/components/profile/MiniProfile";
import { cn } from "@/lib/utils";
import type { PostCardData } from "@/types/community";

// Memoised so UnifiedFeed re-renders never reach the carousel internals
const TrendingPostsCarousel = memo(TrendingPostsCarouselBase);

type FeedTab = 'for-you' | 'trending';

const TABS: { id: FeedTab; label: string }[] = [
  { id: 'for-you', label: 'For You' },
  { id: 'trending', label: 'Trending' },
];

/**
 * UnifiedFeed — premium combined mobile feed.
 *
 * Scroll order:
 *   TrendingPostsCarousel (scrolls away)
 *   [sticky tab bar: For You | Trending]
 *   Posts interleaved with widgets + ad zones
 */
export const UnifiedFeed = () => {
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | undefined>();
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string | undefined>();

  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleLike, handleSave } = usePostEngagement();

  // For You = recent posts in the user's neighbourhood
  // Trending = popular posts (ranked by views + likes + comments) in the neighbourhood
  const { data, isLoading, fetchNextPage, hasNextPage, newPostsCount, refreshFeed } =
    useFeedQuery({
      sortBy: activeTab === 'trending' ? 'popular' : 'recent',
      locationScope: 'neighborhood',
    });

  const allPosts: PostCardData[] = useMemo(
    () =>
      data?.pages.flatMap(page =>
        page.items.map(post =>
          transformToCardData({ ...post, post_type: 'general', views_count: 0 } as any)
        )
      ) ?? [],
    [data?.pages]
  );

  const handlePostClick = useCallback((postId: string) => {
    navigate(`/community/post/${postId}`);
  }, [navigate]);

  const handleAvatarClick = useCallback((userId: string, userName?: string, userAvatar?: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSelectedUserAvatar(userAvatar);
  }, []);

  const handleShare = useCallback((postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/community/post/${postId}`);
    toast({ title: 'Link copied!', description: 'Post link copied to clipboard' });
  }, [toast]);

  const toggleComments = useCallback((postId: string) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  }, []);

  // Build the interleaved content list
  const mixedContent = useMemo(() => {
    const items: Array<{ type: 'widget' | 'post' | 'ad'; component: React.ReactNode; key: string }> = [];

    // First widget zone: events carousel
    items.push({ type: 'widget', component: <EventsNearYouCarousel />, key: 'events-near-you' });

    allPosts.forEach((post, index) => {
      items.push({
        type: 'post',
        component: (
          <PostCard
            post={post}
            onLike={() => handleLike(post.id, post.isLiked)}
            onSave={() => handleSave(post.id, post.isSaved)}
            onShare={() => handleShare(post.id)}
            onRSVP={() => {}}
            onAvatarClick={userId => handleAvatarClick(userId, post.author.full_name, post.author.avatar_url)}
            onImageClick={() => {}}
            onPostClick={() => handlePostClick(post.id)}
            showComments={showComments[post.id] || false}
            onToggleComments={() => toggleComments(post.id)}
          />
        ),
        key: `post-${post.id}`,
      });

      if (index === 1)  items.push({ type: 'widget', component: <SafetyAlertsWidget />,      key: 'safety-alerts' });
      if (index === 2)  items.push({ type: 'widget', component: <RecommendationsCarousel />,  key: 'recommendations' });
      if (index === 3)  items.push({ type: 'ad',     component: <AdDisplay placement="feed" maxAds={1} filterType="all" />, key: 'ad-1' });
      if (index === 4)  items.push({ type: 'widget', component: <CommunityHighlights />,      key: 'community-highlights' });
      if (index === 6)  items.push({ type: 'ad',     component: <AdDisplay placement="feed" maxAds={1} filterType="all" />, key: 'ad-2' });
      if (index === 8)  items.push({ type: 'widget', component: <DiscoverServices />,         key: 'discover-services' });
      if (index === 10) items.push({ type: 'ad',     component: <AdDisplay placement="feed" maxAds={1} filterType="all" />, key: 'ad-3' });
      if (index === 12) items.push({ type: 'widget', component: <MarketplaceHighlights />,    key: 'marketplace-highlights' });
      if (index === 14) items.push({ type: 'ad',     component: <AdDisplay placement="feed" maxAds={1} filterType="all" />, key: 'ad-4' });

      // Recurring ad every 8 posts after the initial zone
      if (index > 16 && (index - 16) % 8 === 0) {
        items.push({ type: 'ad', component: <AdDisplay placement="feed" maxAds={1} filterType="all" />, key: `ad-${index}` });
      }
    });

    return items;
  }, [allPosts, showComments, handleLike, handleSave, handleShare, handleAvatarClick, handlePostClick, toggleComments]);

  return (
    <div className="pb-20">
      {/* ── Trending carousel (scrolls away) ── */}
      <TrendingPostsCarousel />

      {/* ── Sticky tab bar ── */}
      <div className="sticky top-0 z-20 bg-background border-b border-border/50 backdrop-blur-md">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-colors border-b-2',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── New posts button ── */}
      {newPostsCount > 0 && (
        <div className="sticky top-[49px] z-10 flex justify-center pt-3 pointer-events-none">
          <Button
            onClick={refreshFeed}
            className="shadow-lg rounded-full px-6 py-2 pointer-events-auto flex items-center gap-2 animate-in fade-in slide-in-from-top-4"
            size="sm"
          >
            <ArrowUp className="h-4 w-4" />
            {newPostsCount} New Post{newPostsCount > 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {/* ── Interleaved feed ── */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <InfiniteScroll
          dataLength={mixedContent.length}
          next={fetchNextPage}
          hasMore={hasNextPage ?? false}
          loader={
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          }
          scrollThreshold={0.9}
          style={{ overflow: 'visible' }}
        >
          <div className="space-y-4 mt-4">
            {mixedContent.map(item => (
              <div key={item.key} className={item.type === 'post' ? 'px-4' : ''}>
                {item.component}
              </div>
            ))}
          </div>

          {!hasNextPage && mixedContent.length > 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">
              You're all caught up!
            </p>
          )}
        </InfiniteScroll>
      )}

      <MiniProfile
        userId={selectedUserId}
        userName={selectedUserName}
        userAvatar={selectedUserAvatar}
        isOpen={!!selectedUserId}
        onClose={() => {
          setSelectedUserId(null);
          setSelectedUserName(undefined);
          setSelectedUserAvatar(undefined);
        }}
      />
    </div>
  );
};
