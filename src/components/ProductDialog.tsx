import { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import MarketplaceMessageDialog from './MarketplaceMessageDialog';

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
  user_id: string;
  profiles: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
    email?: string;
  };
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: MarketplaceItem | null;
}

export const ProductDialog = ({ open, onOpenChange, product }: ProductDialogProps) => {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

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
                  <div className="space-y-1">
                    <p className="font-medium">{product.profiles?.full_name || 'Anonymous'}</p>
                    {product.profiles?.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{product.profiles.phone}</span>
                      </div>
                    )}
                    {product.profiles?.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{product.profiles.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwner && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setMessageDialogOpen(true)}
                    className="flex-1"
                  >
                    Contact Seller
                  </Button>
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      {messageDialogOpen && (
        <MarketplaceMessageDialog
          item={{
            id: product.id,
            title: product.title,
            description: product.description,
            price: product.price,
            is_negotiable: product.is_negotiable,
            condition: product.condition,
            user_id: product.user_id,
            images: product.images,
          }}
        >
          <Button onClick={() => setMessageDialogOpen(false)}>Close</Button>
        </MarketplaceMessageDialog>
      )}
    </>
  );
};