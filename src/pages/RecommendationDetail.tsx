import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Clock,
  Share2,
  Flag,
  Bookmark,
  Heart
} from "@/lib/icons";
import { useRecommendationDetails, useRecommendationReviews, useRecommendationTips, useSimilarRecommendations } from "@/hooks/useRecommendationDetails.tsx";
import { useToggleSave, useToggleLike } from "@/hooks/useRecommendations.tsx";
import { ReviewCard } from "@/components/recommendations/ReviewCard";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Card } from "@/components/ui/card";

export default function RecommendationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reviewSort, setReviewSort] = useState<'recent' | 'helpful' | 'rating_high' | 'rating_low'>('helpful');

  const { data: recommendation, isLoading } = useRecommendationDetails(id);
  const { data: reviews = [] } = useRecommendationReviews(id, reviewSort);
  const { data: tips = [] } = useRecommendationTips(id);
  const { data: similar = [] } = useSimilarRecommendations(recommendation);

  const toggleSave = useToggleSave();
  const toggleLike = useToggleLike();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Recommendation not found</p>
        <Button onClick={() => navigate('/recommendations')}>
          Back to Recommendations
        </Button>
      </div>
    );
  }

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0,
  }));

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Hero Section */}
      <div className="relative h-96">
        <div className="absolute inset-0">
          {recommendation.image_urls.length > 0 ? (
            <img 
              src={recommendation.image_urls[0]}
              alt={recommendation.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <MapPin className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 h-full flex flex-col justify-between py-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/recommendations')}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {recommendation.is_verified && (
                  <Badge className="bg-primary">Verified</Badge>
                )}
                <Badge variant="secondary">{recommendation.category}</Badge>
                {recommendation.price_range && (
                  <Badge variant="outline">{recommendation.price_range}</Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-2">{recommendation.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{recommendation.city}, {recommendation.state}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => toggleSave.mutate({ 
                  recommendationId: recommendation.id, 
                  isSaved: recommendation.is_saved || false 
                })}
              >
                <Bookmark className={cn("h-5 w-5", recommendation.is_saved && "fill-current")} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => toggleLike.mutate({ 
                  recommendationId: recommendation.id, 
                  isLiked: recommendation.is_liked || false 
                })}
              >
                <Heart className={cn("h-5 w-5", recommendation.is_liked && "fill-current text-red-500")} />
              </Button>
              <Button variant="secondary" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon">
                <Flag className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <Card className="p-6">
              <div className="flex items-center gap-6 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    <span className="text-3xl font-bold">{recommendation.average_rating.toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {recommendation.total_reviews} reviews
                  </p>
                </div>

                <div className="h-12 w-px bg-border" />

                <div>
                  <p className="text-2xl font-bold">{recommendation.total_saves}</p>
                  <p className="text-sm text-muted-foreground">Saves</p>
                </div>

                <div className="h-12 w-px bg-border" />

                <div>
                  <p className="text-2xl font-bold">{recommendation.total_likes}</p>
                  <p className="text-sm text-muted-foreground">Likes</p>
                </div>
              </div>

              <p className="text-foreground whitespace-pre-wrap">{recommendation.description}</p>

              {recommendation.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {recommendation.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Reviews ({reviews.length})</h2>
                <select
                  className="px-3 py-2 rounded-md border bg-background"
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value as any)}
                >
                  <option value="helpful">Most Helpful</option>
                  <option value="recent">Most Recent</option>
                  <option value="rating_high">Highest Rated</option>
                  <option value="rating_low">Lowest Rated</option>
                </select>
              </div>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>

            {/* Similar Recommendations */}
            {similar.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Similar Places</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {similar.map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} variant="list" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            {recommendation.contact_info && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {recommendation.contact_info.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{recommendation.contact_info.phone}</span>
                    </div>
                  )}
                  {recommendation.contact_info.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={recommendation.contact_info.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Rating Distribution */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Rating Distribution</h3>
              <div className="space-y-2">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-8">{rating}★</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tips */}
            {tips.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Tips from Locals</h3>
                <div className="space-y-3">
                  {tips.map((tip) => (
                    <div key={tip.id} className="text-sm">
                      <p className="text-foreground mb-1">💡 {tip.tip_text}</p>
                      <p className="text-xs text-muted-foreground">
                        by {tip.author?.full_name || 'Anonymous'}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
