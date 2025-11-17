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
  const [apiWithImages, setApiWithImages] = useState<CarouselApi>();
  const [apiWithoutImages, setApiWithoutImages] = useState<CarouselApi>();
  const [currentWithImages, setCurrentWithImages] = useState(0);
  const [currentWithoutImages, setCurrentWithoutImages] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleLike, handleSave } = usePostEngagement();

  // Fetch trending posts (sorted by popularity)
  const { data, isLoading } = useFeedQuery({
    sortBy: 'popular',
    locationScope: 'all',
  });

  const rawPosts = data?.pages[0]?.items.slice(0, 12) || [];
  const allPosts = rawPosts.map(post => transformToCardData({
    ...post,
    post_type: 'general',
    views_count: 0
  } as any));

  // Separate posts with and without images
  const postsWithImages = allPosts.filter(post => post.image_urls && post.image_urls.length > 0).slice(0, 6);
  const postsWithoutImages = allPosts.filter(post => !post.image_urls || post.image_urls.length === 0).slice(0, 6);

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
    if (!apiWithImages) return;
    setCurrentWithImages(apiWithImages.selectedScrollSnap());
    apiWithImages.on("select", () => {
      setCurrentWithImages(apiWithImages.selectedScrollSnap());
    });
  }, [apiWithImages]);

  useEffect(() => {
    if (!apiWithoutImages) return;
    setCurrentWithoutImages(apiWithoutImages.selectedScrollSnap());
    apiWithoutImages.on("select", () => {
      setCurrentWithoutImages(apiWithoutImages.selectedScrollSnap());
    });
  }, [apiWithoutImages]);

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

  if (postsWithImages.length === 0 && postsWithoutImages.length === 0) {
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
      <CardContent className="space-y-6">
        {/* Posts with images */}
        {postsWithImages.length > 0 && (
          <div>
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[
                Autoplay({
                  delay: 7000,
                  stopOnInteraction: false,
                })
              ]}
              className="w-full"
              setApi={setApiWithImages}
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {postsWithImages.map((post) => (
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
            </Carousel>
          </div>
        )}

        {/* Posts without images */}
        {postsWithoutImages.length > 0 && (
          <div>
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[
                Autoplay({
                  delay: 7000,
                  stopOnInteraction: false,
                })
              ]}
              className="w-full"
              setApi={setApiWithoutImages}
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {postsWithoutImages.map((post) => (
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
            </Carousel>
            <div className="flex justify-center gap-2 mt-4">
              {postsWithoutImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => apiWithoutImages?.scrollTo(index)}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    index === currentWithoutImages 
                      ? "bg-primary" 
                      : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
