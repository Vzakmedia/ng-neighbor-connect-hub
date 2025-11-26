import { useState, useEffect } from "react";
import { TrendingUp } from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { TrendingPostSlideCard } from "@/components/home/TrendingPostSlideCard";
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
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleSave } = usePostEngagement();

  // Fetch trending posts (sorted by popularity)
  const { data, isLoading } = useFeedQuery({
    sortBy: 'popular',
    locationScope: 'all',
  });

  const rawPosts = data?.pages[0]?.items.slice(0, 8) || [];
  
  console.log('TrendingPostsCarousel - Raw posts:', rawPosts.map(p => ({
    id: p.id,
    image_urls: p.image_urls,
    video_url: p.video_url,
    video_thumbnail_url: p.video_thumbnail_url,
  })));
  
  const allPosts = rawPosts.map(post => transformToCardData({
    ...post,
    post_type: 'general',
    views_count: 0
  } as any));
  
  console.log('TrendingPostsCarousel - Transformed posts:', allPosts.map(p => ({
    id: p.id,
    image_urls: p.image_urls,
    video_url: p.video_url,
    video_thumbnail_url: p.video_thumbnail_url,
  })));

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
          opts={{ align: "start", loop: true }}
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: false,
            })
          ]}
          className="w-full"
          setApi={setApi}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {allPosts.map((post) => (
              <CarouselItem key={post.id} className="pl-2 md:pl-4 basis-auto">
                <TrendingPostSlideCard
                  post={post}
                  onPostClick={() => handlePostClick(post.id)}
                  onSave={() => handleSave(post.id, post.is_saved)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {allPosts.map((_, index) => (
            <div
              key={index}
              role="button"
              tabIndex={0}
              onClick={() => api?.scrollTo(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  api?.scrollTo(index);
                }
              }}
              className={`h-2 w-2 rounded-full flex-shrink-0 inline-block cursor-pointer transition-colors ${
                index === current 
                  ? "bg-primary" 
                  : "bg-muted-foreground/30"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
