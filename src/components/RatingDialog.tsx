import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from '@/lib/icons';

interface RatingDialogProps {
  itemId: string;
  itemType: 'service' | 'marketplace_item';
  itemTitle: string;
  children: React.ReactNode;
  onReviewSubmitted?: () => void;
}

const RatingDialog = ({ itemId, itemType, itemTitle, children, onReviewSubmitted }: RatingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide a rating",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let insertData;
      let error;

      if (itemType === 'service') {
        const result = await supabase
          .from('service_reviews')
          .insert({
            service_id: itemId,
            reviewer_id: user.id,
            rating,
            review_text: reviewText || null,
            is_verified: false
          });
        error = result.error;
      } else {
        const result = await supabase
          .from('marketplace_reviews')
          .insert({
            item_id: itemId,
            reviewer_id: user.id,
            rating,
            review_text: reviewText || null,
            is_verified: false
          });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      setOpen(false);
      setRating(0);
      setReviewText('');
      onReviewSubmitted?.();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Already Reviewed",
          description: "You have already reviewed this item",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit review",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const StarRating = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 hover:scale-110 transition-transform"
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hoveredStar || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate & Review</DialogTitle>
          <DialogDescription>
            Share your experience with "{itemTitle}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex items-center gap-2">
              <StarRating />
              <span className="text-sm text-muted-foreground">
                {rating > 0 && `${rating} star${rating > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Review (Optional)</Label>
            <Textarea
              placeholder="Share your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || rating === 0}>
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;