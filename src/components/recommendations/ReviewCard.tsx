import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp } from "@/lib/icons";
import { formatDistanceToNow } from "date-fns";
import type { RecommendationReview } from "@/types/recommendations";
import { useToggleReviewHelpful } from "@/hooks/useRecommendationReviews";
import { useState } from "react";

interface Props {
  review: RecommendationReview;
}

export function ReviewCard({ review }: Props) {
  const toggleHelpful = useToggleReviewHelpful();
  const [showFullText, setShowFullText] = useState(false);

  const isLongReview = review.review_text.length > 300;
  const displayText = showFullText || !isLongReview 
    ? review.review_text 
    : review.review_text.substring(0, 300) + '...';

  const handleHelpful = () => {
    toggleHelpful.mutate({ 
      reviewId: review.id, 
      isHelpful: review.user_reaction === 'helpful' 
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarImage src={review.reviewer?.avatar_url || undefined} />
          <AvatarFallback>
            {review.reviewer?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-medium text-foreground">{review.reviewer?.full_name || 'Anonymous'}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {review.review_title && (
            <h4 className="font-semibold mb-2">{review.review_title}</h4>
          )}

          <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">
            {displayText}
          </p>

          {isLongReview && (
            <Button
              variant="link"
              className="p-0 h-auto text-sm mb-3"
              onClick={() => setShowFullText(!showFullText)}
            >
              {showFullText ? 'Show less' : 'Read more'}
            </Button>
          )}

          {review.image_urls.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto">
              {review.image_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Review photo ${index + 1}`}
                  className="h-24 w-24 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {(review.pros.length > 0 || review.cons.length > 0) && (
            <div className="space-y-2 mb-3">
              {review.pros.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {review.pros.map((pro, index) => (
                    <Badge key={index} variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400">
                      👍 {pro}
                    </Badge>
                  ))}
                </div>
              )}
              {review.cons.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {review.cons.map((con, index) => (
                    <Badge key={index} variant="default" className="bg-red-500/10 text-red-700 dark:text-red-400">
                      👎 {con}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHelpful}
              className={review.user_reaction === 'helpful' ? 'text-primary' : ''}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Helpful ({review.helpful_count})
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
