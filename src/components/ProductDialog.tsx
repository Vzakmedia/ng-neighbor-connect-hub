import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MarketplaceMessageDialog from './MarketplaceMessageDialog';
import { useNativeShare } from '@/hooks/mobile/useNativeShare';
import { useNativeClipboard } from '@/hooks/mobile/useNativeClipboard';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  condition: string;
  is_negotiable: boolean;
  location: string;
  created_at: string;
  likes_count?: number;
  is_liked_by_user?: boolean;
  user_id: string;
  profiles: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    city?: string;
    state?: string;
    neighborhood?: string;
    is_verified?: boolean;
    bio?: string;
    // Note: phone, email, address excluded for security
  };
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: MarketplaceItem | null;
}

export const ProductDialog = ({ open, onOpenChange, product }: ProductDialogProps) => {
  const { user } = useAuth();
  const { sendMessageWithAttachments } = useDirectMessages(user?.id);
  const { toast } = useToast();
  const { share, canShare } = useNativeShare();
  const { copyToClipboard } = useNativeClipboard();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(product?.likes_count || 0);
  const [isLiked, setIsLiked] = useState(product?.is_liked_by_user || false);
  const [isLiking, setIsLiking] = useState(false);

  // Update local state when product changes
  useEffect(() => {
    if (product) {
      setLikesCount(product.likes_count || 0);
      setIsLiked(product.is_liked_by_user || false);
      setCurrentImageIndex(0);
    }
  }, [product]);

  // Real-time updates for likes
  useEffect(() => {
    if (!product?.id) return;

    const channel = supabase
      .channel(`marketplace_item_${product.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_item_likes',
          filter: `item_id=eq.${product.id}`
        },
        async () => {
          // Refetch likes count when likes change
          const { data: likes } = await supabase
            .from('marketplace_item_likes')
            .select('user_id')
            .eq('item_id', product.id);
          
          const newLikesCount = likes?.length || 0;
          const newIsLiked = user ? likes?.some(like => like.user_id === user.id) || false : false;
          
          setLikesCount(newLikesCount);
          setIsLiked(newIsLiked);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [product?.id, user?.id]);

  if (!product) return null;

  const formatPrice = (price: number) => {
    return `₦${(price / 100).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const nextImage = () => {
    if (product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const handleLike = async () => {
    if (!user || isLiking) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to like items",
        variant: "destructive",
      });
      return;
    }

    setIsLiking(true);
    try {
      if (isLiked) {
        // Unlike the item
        const { error } = await supabase
          .from('marketplace_item_likes')
          .delete()
          .eq('item_id', product.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like the item
        const { error } = await supabase
          .from('marketplace_item_likes')
          .insert([
            {
              item_id: product.id,
              user_id: user.id,
            }
          ]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/marketplace?item=${product.id}`;
    
    const shared = await share({
      title: product.title,
      text: `Check out this item: ${product.title}`,
      url: shareUrl,
    });
    
    if (!shared) {
      // Fallback to copying to clipboard
      await copyToClipboard(shareUrl, "Product link copied to clipboard");
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to contact sellers",
        variant: "destructive",
      });
      return;
    }

    if (user.id === product.user_id) {
      toast({
        title: "Cannot message yourself",
        description: "You cannot send a message to yourself",
        variant: "destructive",
      });
      return;
    }

    try {
      // Send a message with product details embedded in the attachments as JSON
      const productLink = `${window.location.origin}/marketplace?item=${product.id}`;
      
      const success = await sendMessageWithAttachments(
        `Hi! I'm interested in your item: ${product.title}`,
        product.user_id,
        [
          {
            id: `product_${product.id}`,
            type: 'file' as const,
            name: `${product.title}.json`,
            url: productLink,
            size: 0,
            mimeType: 'application/json',
            // Store product data in a custom property that AttachmentDisplay can read
            productData: {
              id: product.id,
              title: product.title,
              description: product.description,
              price: product.price,
              is_negotiable: product.is_negotiable,
              condition: product.condition,
              image: product.images?.[0],
              link: productLink,
            }
          } as any
        ]
      );

      if (success) {
        toast({
          title: "Message sent!",
          description: "Your message has been sent to the seller",
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isOwner = user?.id === product.user_id;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{product.title}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Images Section */}
            <div className="space-y-4">
              {product.images && product.images.length > 0 ? (
                <div className="relative">
                  <img
                    src={product.images[currentImageIndex]}
                    alt={product.title}
                    className="w-full h-80 object-cover rounded-lg"
                  />
                  {product.images.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {product.images.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-80 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                        index === currentImageIndex ? 'border-primary' : 'border-border'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Price and Condition */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                  {product.is_negotiable && (
                    <Badge variant="outline">Negotiable</Badge>
                  )}
                </div>
                <Badge variant="secondary" className="text-sm">
                  Condition: {product.condition}
                </Badge>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              <Separator />

              {/* Location and Date */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{product.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Listed on {formatDate(product.created_at)}</span>
                </div>
              </div>

              <Separator />

              {/* Seller Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Seller Information</h3>
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={product.profiles?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <p className="font-medium">{product.profiles?.full_name || 'Anonymous'}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{product.profiles?.city || 'Location not specified'}</span>
                    </div>
                    {product.profiles?.is_verified && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Verified Seller</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Contact details available after inquiry
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwner && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleContactSeller}
                    className="flex-1"
                  >
                    Contact Seller
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleLike}
                    disabled={isLiking}
                    className={isLiked ? "text-red-500 border-red-500" : ""}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Like count display */}
              {likesCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <Heart className="h-4 w-4" />
                  <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};