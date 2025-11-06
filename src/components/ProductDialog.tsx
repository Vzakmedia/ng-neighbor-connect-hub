import { useState, useEffect } from 'react';
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
  const [messageText, setMessageText] = useState("Hi, is this still available?");
  const [showComments, setShowComments] = useState(false);

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
            {/* Left Column - Images */}
            <div className="md:sticky md:top-0 md:h-screen md:overflow-hidden">
              <div className="relative w-full h-[300px] md:h-full">
                {product.images && product.images.length > 0 ? (
                  <>
                    <img
                      src={product.images[currentImageIndex]}
                      alt={product.title}
                      className="w-full h-full object-cover md:rounded-tl-3xl"
                    />
                    {product.images.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/90 backdrop-blur-sm rounded-full"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/90 backdrop-blur-sm rounded-full"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                          {currentImageIndex + 1} / {product.images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center md:rounded-tl-3xl">
                    <span className="text-muted-foreground">No image available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="md:overflow-y-auto md:h-screen">
              <div className="p-4 space-y-4 md:py-6 md:px-6">
                {/* Title and Price */}
                <div>
                  <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.price === 0 ? (
                      <span className="text-3xl font-bold text-primary">FREE</span>
                    ) : (
                      <span className="text-3xl font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                    )}
                    {product.is_negotiable && (
                      <Badge variant="outline" className="text-sm">Negotiable</Badge>
                    )}
                  </div>
                </div>

                {/* Seller Info */}
                <div className="flex items-start gap-3 py-3 border-y">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={product.profiles?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{product.profiles?.full_name || 'Anonymous'}</p>
                      {product.profiles?.is_verified && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{product.location}</span>
                    </div>
                  </div>
                </div>

                {/* Condition and Time */}
                <div className="flex items-center gap-4 text-sm">
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
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>

                <Separator />

                {/* Send Message Section */}
                {!isOwner && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Send {product.profiles?.full_name?.split(' ')[0] || 'seller'} a message</h3>
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
                <div className="space-y-3">
                  <h3 className="font-semibold">Share listing</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    <button 
                      onClick={handleContactSeller}
                      className="flex flex-col items-center gap-1 min-w-[60px] touch-manipulation"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs text-center">Chat</span>
                    </button>
                    
                    <button 
                      onClick={handleShare}
                      className="flex flex-col items-center gap-1 min-w-[60px] touch-manipulation"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Share2 className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs text-center">Share</span>
                    </button>

                    <button 
                      onClick={handleCopyLink}
                      className="flex flex-col items-center gap-1 min-w-[60px] touch-manipulation"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Link className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs text-center">Copy link</span>
                    </button>

                    <button 
                      onClick={handleEmailShare}
                      className="flex flex-col items-center gap-1 min-w-[60px] touch-manipulation"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs text-center">Email</span>
                    </button>

                    <button 
                      onClick={handleShare}
                      className="flex flex-col items-center gap-1 min-w-[60px] touch-manipulation"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <MoreHorizontal className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs text-center">More</span>
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Location Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Location</h3>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{product.location}</span>
                  </div>
                  {/* Google Map */}
                  <MarketplaceMap location={product.location} title={product.title} />
                </div>

                <Separator />

                {/* Comments Section */}
                <div id="marketplace-comments">
                  <MarketplaceComments itemId={product.id} />
                </div>

                {/* Bottom Action Buttons */}
                {!isOwner && (
                  <div className="flex gap-2 pt-4 pb-6">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={handleLike}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                      {likesCount > 0 ? likesCount : 'Like'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => {
                        const commentsSection = document.getElementById('marketplace-comments');
                        commentsSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Comment
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                )}

                {/* Owner Message */}
                {isOwner && (
                  <div className="text-center py-4 text-muted-foreground">
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