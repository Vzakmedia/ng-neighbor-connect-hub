import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  const formatPrice = (price: number) => {
    return `₦${(price / 100).toLocaleString()}`;
  };

  const handleViewProduct = () => {
    navigate(`/marketplace?item=${product.id}`);
  };

  return (
    <Card className="max-w-sm cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewProduct}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-2 mb-1">{product.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-primary text-sm">{formatPrice(product.price)}</span>
              {product.is_negotiable && (
                <Badge variant="outline" className="text-xs">Negotiable</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">{product.condition}</Badge>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;