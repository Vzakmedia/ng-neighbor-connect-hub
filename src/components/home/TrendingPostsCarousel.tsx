import { useState, useRef, useMemo } from "react";
import { TrendingUp } from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { TrendingPostSlideCard } from "@/components/home/TrendingPostSlideCard";
import { useFeedQuery } from "@/hooks/useFeedQuery";
import { usePostEngagement } from "@/hooks/community/usePostEngagement";
import { useLocationPreferences } from "@/hooks/useLocationPreferences";
import { transformToCardData } from "@/lib/community/postTransformers";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Autoplay from "embla-carousel-autoplay";

/**
 * TrendingPostsCarousel - Auto-sliding carousel of trending posts
 * Shows one post at a time, auto-advances every 7 seconds
 */
export const TrendingPostsCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleSave } = usePostEngagement();

  const { preferences } = useLocationPreferences();

  // Stable plugin ref — never recreated, so Embla doesn't reinitialise on re-renders
  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  // Fetch trending posts (sorted by popularity)
  const { data, isLoading } = useFeedQuery({
    sortBy: 'popular',
    locationScope: preferences?.default_location_filter || 'all',
  });

  // Memoised so Embla doesn't re-measure the slide list on every render
  const allPosts = useMemo(() => {
    const rawPosts = data?.pages[0]?.items.slice(0, 8) || [];
    return rawPosts.map(post => transformToCardData({
      ...post,
      post_type: 'general',
      views_count: 0,
    } as any));
  }, [data?.pages]);

  const handlePostClick = (postId: string) => {
    navigate(`/community/post/${postId}`);
  };

  const handleShare = (postId: string) => {
    const postUrl = `${window.location.origin}/community/post/${postId}`;
    navigator.clipboard.writeText(postUrl);
    toast({
      title: "Link copied!",
      description: "Post link copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Loading trending posts...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (allPosts.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card my-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trending Posts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel
          opts={{ align: "start", loop: true, dragFree: false }}
          plugins={[autoplayPlugin.current as any]}
          className="w-full"
          setApi={setApi}
        >
          <CarouselContent className="-ml-3">
            {allPosts.map((post) => (
              <CarouselItem key={post.id} className="pl-3 basis-[170px] shrink-0">
                <TrendingPostSlideCard
                  post={post}
                  onPostClick={() => handlePostClick(post.id)}
                  onSave={() => handleSave(post.id, post.is_saved)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </CardContent>
    </Card>
  );
};
