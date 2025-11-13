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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ChatBubbleLeftIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface MarketplaceInquiryDialogProps {
  item: {
    id: string;
    title: string;
    description: string;
    price: number;
    is_negotiable: boolean;
    user_id: string;
  };
  children: React.ReactNode;
  onInquiryCreated?: () => void;
}

const MarketplaceInquiryDialog = ({ item, children, onInquiryCreated }: MarketplaceInquiryDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inquiryType, setInquiryType] = useState<'purchase' | 'question' | 'offer'>('purchase');
  const [message, setMessage] = useState('');
  const [offerAmount, setOfferAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a message",
        variant: "destructive",
      });
      return;
    }

    if (inquiryType === 'offer' && (!offerAmount || parseFloat(offerAmount) <= 0)) {
      toast({
        title: "Invalid Offer",
        description: "Please provide a valid offer amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('marketplace_inquiries')
        .insert({
          item_id: item.id,
          buyer_id: user.id,
          seller_id: item.user_id,
          inquiry_type: inquiryType,
          message: message.trim(),
          offer_amount: inquiryType === 'offer' ? parseFloat(offerAmount) : null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Inquiry Sent",
        description: "Your inquiry has been sent to the seller",
      });

      setOpen(false);
      setMessage('');
      setOfferAmount('');
      setInquiryType('purchase');
      onInquiryCreated?.();
    } catch (error) {
      console.error('Error creating inquiry:', error);
      toast({
        title: "Error",
        description: "Failed to send inquiry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInquiryTitle = () => {
    switch (inquiryType) {
      case 'purchase':
        return 'Purchase Inquiry';
      case 'question':
        return 'Ask a Question';
      case 'offer':
        return 'Make an Offer';
      default:
        return 'Contact Seller';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getInquiryTitle()}</DialogTitle>
          <DialogDescription>
            Contact the seller about "{item.title}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Info */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="font-medium">{item.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              <p className="text-sm font-medium mt-2">
                Price: ₦{item.price.toLocaleString()}
                {item.is_negotiable && (
                  <span className="text-xs text-muted-foreground ml-2">(Negotiable)</span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Inquiry Type */}
          <div className="space-y-2">
            <Label>Type of Inquiry *</Label>
            <Select value={inquiryType} onValueChange={(value: any) => setInquiryType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select inquiry type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase">
                  <div className="flex items-center gap-2">
                    <ChatBubbleLeftIcon className="h-4 w-4" />
                    Purchase Inquiry
                  </div>
                </SelectItem>
                <SelectItem value="question">
                  <div className="flex items-center gap-2">
                    <ChatBubbleLeftIcon className="h-4 w-4" />
                    Ask a Question
                  </div>
                </SelectItem>
                {item.is_negotiable && (
                  <SelectItem value="offer">
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      Make an Offer
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Offer Amount (only for offers) */}
          {inquiryType === 'offer' && (
            <div className="space-y-2">
              <Label>Your Offer Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₦</span>
                <Input
                  type="number"
                  placeholder="Enter your offer"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="pl-8"
                  min="1"
                  step="1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Original price: ₦{item.price.toLocaleString()}
              </p>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea
              placeholder={
                inquiryType === 'purchase'
                  ? "I'm interested in purchasing this item..."
                  : inquiryType === 'question'
                  ? "I have a question about..."
                  : "I'd like to make an offer for..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
            <Button type="submit" disabled={loading || !message.trim()}>
              {loading ? "Sending..." : "Send Inquiry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MarketplaceInquiryDialog;