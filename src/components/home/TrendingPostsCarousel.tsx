import { useState, useEffect } from "react";
import { TrendingUp } from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { PostCard } from "@/components/community/post/PostCard";
import { useFeedQuery } from "@/hooks/useFeedQuery";
import { usePostEngagement } from "@/hooks/community/usePostEngagement";
import { transformToCardData } from "@/lib/community/postTransformers";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Autoplay from "embla-carousel-autoplay";

/**
 * TrendingPostsCarousel - Auto-sliding carousel of trending posts
 * Shows one post at a time, auto-advances every 7 seconds
 */
export const TrendingPostsCarousel = () => {
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleLike, handleSave } = usePostEngagement();

  // Fetch trending posts (sorted by popularity)
  const { data, isLoading } = useFeedQuery({
    sortBy: 'popular',
    locationScope: 'all',
  });

  const rawPosts = data?.pages[0]?.items.slice(0, 6) || [];
  const trendingPosts = rawPosts.map(post => transformToCardData({
    ...post,
    post_type: 'general', // Default type for trending posts
    views_count: 0
  } as any));

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

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

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

  if (trendingPosts.length === 0) {
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
          opts={{ align: "start", loop: true }}
          plugins={[
            Autoplay({
              delay: 7000,
              stopOnInteraction: false,
            })
          ]}
          className="w-full"
          setApi={setApi}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {trendingPosts.map((post) => (
              <CarouselItem key={post.id} className="pl-2 md:pl-4 h-auto">
                <div className="h-full">
                  <PostCard
                    post={post}
                    onLike={() => handleLike(post.id, post.is_liked)}
                    onSave={() => handleSave(post.id, post.is_saved)}
                    onShare={() => handleShare(post.id)}
                    onPostClick={() => handlePostClick(post.id)}
                    onToggleComments={() => toggleComments(post.id)}
                    showComments={showComments[post.id] || false}
                    onRSVP={() => {}}
                    onAvatarClick={() => {}}
                    onImageClick={() => {}}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-2 mt-4">
            {trendingPosts.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`rounded-full transition-all ${
                  index === current 
                    ? "h-2 w-2 bg-primary" 
                    : "h-2 w-2 bg-muted-foreground/30"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </Carousel>
      </CardContent>
    </Card>
  );
};
