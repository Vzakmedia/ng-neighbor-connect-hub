import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send } from 'lucide-react';

interface MarketplaceItem {
  id: string;
  title: string;
  price?: number;
  user_id: string;
}

interface MarketplaceMessageDialogProps {
  sellerId: string;
  item?: MarketplaceItem;
  children: React.ReactNode;
}

const MarketplaceMessageDialog = ({ sellerId, item, children }: MarketplaceMessageDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Set default message when dialog opens
  const getDefaultMessage = () => {
    if (item) {
      return `Hi! I'm interested in your "${item.title}" listed for ${
        item.price ? `₦${item.price.toLocaleString()}` : 'the listed price'
      }. Is it still available?`;
    }
    return '';
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && item) {
      setMessage(getDefaultMessage());
    }
    setOpen(newOpen);
  };

  const handleSendMessage = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to send messages.",
        variant: "destructive",
      });
      return;
    }

    if (user.id === sellerId) {
      toast({
        title: "Cannot message yourself",
        description: "You cannot send a message to yourself.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message before sending.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('direct_conversations')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${sellerId}),and(user1_id.eq.${sellerId},user2_id.eq.${user.id})`)
        .single();

      let conversationExists = !!existingConversation;

      if (!existingConversation) {
        // Create new conversation
        const { error: convError } = await supabase
          .from('direct_conversations')
          .insert({
            user1_id: user.id,
            user2_id: sellerId,
            last_message_at: new Date().toISOString(),
            user1_has_unread: false,
            user2_has_unread: true
          });

        if (convError) {
          console.error('Error creating conversation:', convError);
          toast({
            title: "Error",
            description: "Failed to create conversation. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Send the message
      const { error: messageError } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: sellerId,
          content: message.trim(),
          status: 'sent'
        });

      if (messageError) {
        console.error('Error sending message:', messageError);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Message sent!",
        description: conversationExists 
          ? "Your message has been sent."
          : "Conversation started and message sent successfully.",
      });

      setMessage('');
      setOpen(false);

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Message
          </DialogTitle>
        </DialogHeader>
        
        {item && (
          <div className="bg-muted p-3 rounded-lg mb-4">
            <h4 className="font-medium text-sm mb-1">About: {item.title}</h4>
            {item.price && (
              <p className="text-sm text-muted-foreground">
                Price: ₦{item.price.toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[100px]"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={loading || !message.trim()}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarketplaceMessageDialog;