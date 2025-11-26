import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ExternalLink } from '@/lib/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProductDialog } from '../ProductDialog';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    is_negotiable: boolean;
    condition: string;
    image?: string | null;
    link: string;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fullProduct, setFullProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const formatPrice = (price: number) => {
    return `₦${(price / 100).toLocaleString()}`;
  };

  const handleViewProduct = async () => {
    setLoading(true);
    try {
      // Fetch the full product data from the database
      const { data: itemData, error: itemError } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('id', product.id)
        .single();

      if (itemError) {
        console.error('Error fetching item:', itemError);
        // Fallback to navigating to marketplace
        navigate(`/marketplace?item=${product.id}`);
        return;
      }

      // Fetch profile data and likes data
      const [profileResult, likesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, phone, email')
          .eq('user_id', itemData.user_id)
          .single(),
        supabase
          .from('marketplace_item_likes')
          .select('user_id')
          .eq('item_id', product.id)
      ]);

      const likes = likesResult.data || [];
      const profile = profileResult.data;

      const enrichedProduct = {
        ...itemData,
        profiles: profile || { user_id: itemData.user_id, full_name: 'Anonymous', avatar_url: '' },
        likes_count: likes.length,
        is_liked_by_user: false // Will be updated in ProductDialog based on current user
      };

      setFullProduct(enrichedProduct);
      setDialogOpen(true);
    } catch (error) {
      console.error('Error loading product:', error);
      // Fallback to navigating to marketplace
      navigate(`/marketplace?item=${product.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-sm overflow-hidden border-border/50 bg-background/95 backdrop-blur-sm hover:shadow-lg transition-all">
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-24 h-24 rounded-md object-cover flex-shrink-0 border border-border/50"
            />
          ) : (
            <div className="w-24 h-24 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0 border border-border/50">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div>
              <h4 className="font-semibold text-base line-clamp-2 leading-tight mb-1">{product.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary text-lg">{formatPrice(product.price)}</span>
              {product.is_negotiable && (
                <Badge variant="default" className="text-xs px-2 py-0">Negotiable</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30 border-t border-border/50">
          <Badge variant="secondary" className="text-xs font-medium capitalize">{product.condition}</Badge>
          <Button 
            size="sm" 
            variant="default"
            className="h-8 px-4 text-xs font-medium" 
            disabled={loading}
            onClick={handleViewProduct}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            {loading ? 'Loading...' : 'View Item'}
          </Button>
        </div>
      </CardContent>

      {/* Product Dialog */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={fullProduct}
      />
    </Card>
  );
};

export default ProductCard;