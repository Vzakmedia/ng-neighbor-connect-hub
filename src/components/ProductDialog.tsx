import { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  Calendar,
  User,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Send,
  MessageCircle,
  Link,
  Mail,
  MoreHorizontal,
  Clock,
  Facebook,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MarketplaceMessageDialog from './MarketplaceMessageDialog';
import { useNativeShare } from '@/hooks/mobile/useNativeShare';
import { useNativeClipboard } from '@/hooks/mobile/useNativeClipboard';
import { MarketplaceComments } from './marketplace/MarketplaceComments';
import { MarketplaceMap } from './marketplace/MarketplaceMap';
import { SellerOtherListings } from './marketplace/SellerOtherListings';
import useEmblaCarousel from 'embla-carousel-react';

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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(product?.likes_count || 0);
  const [isLiked, setIsLiked] = useState(product?.is_liked_by_user || false);
  const [messageText, setMessageText] = useState("Hi, is this still available?");
  const [showComments, setShowComments] = useState(false);

  // Update carousel index when embla changes
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentImageIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

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
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    if (diffInMinutes < 43200) return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to like items",
        variant: "destructive",
      });
      return;
    }

    // Save previous state for rollback
    const previousLikedState = isLiked;
    const previousLikeCount = likesCount;

    // Update UI IMMEDIATELY (optimistic)
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    // Then update backend asynchronously
    try {
      if (previousLikedState) {
        const { error } = await supabase
          .from('marketplace_item_likes')
          .delete()
          .eq('item_id', product.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
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
      // Rollback on error
      console.error('Error toggling like:', error);
      setIsLiked(previousLikedState);
      setLikesCount(previousLikeCount);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
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

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user) {
      if (!user) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to send messages",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      const productLink = `${window.location.origin}/marketplace?item=${product.id}`;
      
      const success = await sendMessageWithAttachments(
        messageText,
        product.user_id,
        [
          {
            id: `product_${product.id}`,
            type: 'file' as const,
            name: `${product.title}.json`,
            url: productLink,
            size: 0,
            mimeType: 'application/json',
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
        setMessageText("Hi, is this still available?");
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

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/marketplace?item=${product.id}`;
    await copyToClipboard(shareUrl, "Link copied to clipboard");
  };

  const handleEmailShare = () => {
    const shareUrl = `${window.location.origin}/marketplace?item=${product.id}`;
    const subject = encodeURIComponent(`Check out: ${product.title}`);
    const body = encodeURIComponent(`I found this item: ${product.title}\n\nPrice: ${formatPrice(product.price)}\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[95vh] p-0 overflow-y-auto rounded-t-3xl sm:max-w-6xl sm:mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0 h-full">
            {/* Left Column - Images Carousel */}
            <div className="md:sticky md:top-0 md:h-screen md:overflow-hidden">
              <div className="relative w-full h-[280px] md:h-full">
                {product.images && product.images.length > 0 ? (
                  <>
                    <div className="overflow-hidden h-full" ref={emblaRef}>
                      <div className="flex h-full">
                        {product.images.map((image, index) => (
                          <div key={index} className="flex-[0_0_100%] min-w-0">
                            <img
                              src={image}
                              alt={`${product.title} - Image ${index + 1}`}
                              className="w-full h-full object-cover md:rounded-tl-3xl"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {product.images.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/90 backdrop-blur-sm rounded-full h-8 w-8"
                          onClick={scrollPrev}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/90 backdrop-blur-sm rounded-full h-8 w-8"
                          onClick={scrollNext}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                          {currentImageIndex + 1} / {product.images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center md:rounded-tl-3xl">
                    <span className="text-muted-foreground text-sm">No image available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="md:overflow-y-auto md:h-screen">
              <div className="p-3 space-y-3 md:py-4 md:px-4">
                {/* Title and Price */}
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-1">{product.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.price === 0 ? (
                      <span className="text-2xl md:text-3xl font-bold text-primary">FREE</span>
                    ) : (
                      <span className="text-2xl md:text-3xl font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                    )}
                    {product.is_negotiable && (
                      <Badge variant="outline" className="text-xs">Negotiable</Badge>
                    )}
                  </div>
                </div>

                {/* Seller Info */}
                <div className="flex items-start gap-2 py-2 border-y">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={product.profiles?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm">{product.profiles?.full_name || 'Anonymous'}</p>
                      {product.profiles?.is_verified && (
                        <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{product.location}</span>
                    </div>
                  </div>
                </div>

                {/* Condition and Time */}
                <div className="flex items-center gap-3 text-xs">
                  <Badge variant="secondary">
                    {product.condition}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(product.created_at)}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-sm mb-1">Description</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>

                <Separator />

                {/* Send Message Section */}
                {!isOwner && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Send {product.profiles?.full_name?.split(' ')[0] || 'seller'} a message</h3>
                    <div className="flex gap-2">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Hi, is this still available?"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        size="icon" 
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="rounded-full"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Share Listing Section */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Share listing</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    <button 
                      onClick={handleContactSeller}
                      className="flex flex-col items-center gap-1 min-w-[52px] touch-manipulation"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] text-center">Chat</span>
                    </button>
                    
                    <button 
                      onClick={handleShare}
                      className="flex flex-col items-center gap-1 min-w-[52px] touch-manipulation"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Share2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] text-center">Share</span>
                    </button>

                    <button 
                      onClick={handleCopyLink}
                      className="flex flex-col items-center gap-1 min-w-[52px] touch-manipulation"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Link className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] text-center">Copy</span>
                    </button>

                    <button 
                      onClick={handleEmailShare}
                      className="flex flex-col items-center gap-1 min-w-[52px] touch-manipulation"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] text-center">Email</span>
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Seller's Other Listings */}
                <Separator />
                <SellerOtherListings 
                  sellerId={product.user_id}
                  currentItemId={product.id}
                  onItemClick={(item) => {
                    // This will trigger a re-render with the new product
                    // The parent component should handle this
                    const newUrl = `${window.location.origin}/marketplace?item=${item.id}`;
                    window.location.href = newUrl;
                  }}
                />

                <Separator />

                {/* Location Section */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Location</h3>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <MapPin className="h-3 w-3" />
                    <span>{product.location}</span>
                  </div>
                  <MarketplaceMap location={product.location} title={product.title} />
                </div>

                <Separator />

                {/* Comments Section */}
                <div id="marketplace-comments">
                  <MarketplaceComments itemId={product.id} />
                </div>

                {/* Bottom Action Buttons */}
                {!isOwner && (
                  <div className="flex gap-2 pt-2 pb-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={handleLike}
                    >
                      <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                      <span className="text-xs">{likesCount > 0 ? likesCount : 'Like'}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => {
                        const commentsSection = document.getElementById('marketplace-comments');
                        commentsSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span className="text-xs">Comment</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={handleShare}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span className="text-xs">Share</span>
                    </Button>
                  </div>
                )}

                {/* Owner Message */}
                {isOwner && (
                  <div className="text-center py-2 text-muted-foreground text-sm">
                    <p>This is your listing</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};