import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ShoppingBag } from 'lucide-react';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  is_negotiable: boolean;
  condition: string;
  user_id: string;
  images: string[];
}

interface MarketplaceMessageDialogProps {
  item: MarketplaceItem;
  children: React.ReactNode;
}

const MarketplaceMessageDialog = ({ item, children }: MarketplaceMessageDialogProps) => {
  const { user } = useAuth();
  const { sendMessage } = useDirectMessages(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const formatPrice = (price: number) => {
    return `₦${(price / 100).toLocaleString()}`;
  };

  const productLink = `${window.location.origin}/marketplace?item=${item.id}`;
  const defaultMessage = `Hi! I'm interested in your item "${item.title}" listed for ${formatPrice(item.price)}${item.is_negotiable ? ' (negotiable)' : ''}. Is it still available?\n\nProduct Link: ${productLink}`;

  const handleSendMessage = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to send messages.",
        variant: "destructive",
      });
      return;
    }

    if (user.id === item.user_id) {
      toast({
        title: "Cannot message yourself",
        description: "You cannot send a message to yourself.",
        variant: "destructive",
      });
      return;
    }

    const messageToSend = customMessage.trim() || defaultMessage;

    setLoading(true);
    try {
      const success = await sendMessage(messageToSend, item.user_id);
      
      if (success) {
        toast({
          title: "Message sent!",
          description: "Your message has been sent to the seller.",
        });
        setOpen(false);
        setCustomMessage('');
        
        // Navigate to messages page with a URL parameter to indicate the item
        navigate(`/messages?item=${item.id}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Seller
          </DialogTitle>
          <DialogDescription>
            Send a message to inquire about this item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm line-clamp-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                    {item.is_negotiable && (
                      <Badge variant="outline" className="text-xs">Negotiable</Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">{item.condition}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Default Message Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Default message:</label>
            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              {defaultMessage}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add a custom message (optional):</label>
            <Textarea
              placeholder="Type your custom message here..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to send the default message above
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSendMessage} disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarketplaceMessageDialog;