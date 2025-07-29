import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PaymentStatusHandler = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const payment = searchParams.get('payment');
    const campaignId = searchParams.get('campaign_id');

    if (payment === 'success' && campaignId) {
      handlePaymentSuccess(campaignId);
    } else if (payment === 'cancelled' && campaignId) {
      handlePaymentCancelled(campaignId);
    }
  }, [searchParams]);

  const handlePaymentSuccess = async (campaignId: string) => {
    try {
      // Check campaign status
      const { data: campaign, error } = await supabase
        .from('promotion_campaigns')
        .select('title, payment_status')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      toast({
        title: "Payment Successful! 🎉",
        description: `Your advertisement "${campaign.title}" has been submitted for admin approval. You'll be notified once it's approved and goes live.`,
      });

      // Clear URL parameters
      window.history.replaceState({}, '', '/community');
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast({
        title: "Payment Received",
        description: "Your payment was successful. Your ad is being processed.",
      });
    }
  };

  const handlePaymentCancelled = async (campaignId: string) => {
    try {
      // Optionally clean up cancelled campaigns
      const { error } = await supabase
        .from('promotion_campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('payment_status', 'pending');

      if (error) {
        console.error('Error cleaning up cancelled campaign:', error);
      }

      toast({
        title: "Payment Cancelled",
        description: "Your advertisement was not created. You can try again anytime.",
        variant: "destructive",
      });

      // Clear URL parameters
      window.history.replaceState({}, '', '/community');
    } catch (error) {
      console.error('Error handling cancelled payment:', error);
    }
  };

  const payment = searchParams.get('payment');
  
  if (!payment) return null;

  return (
    <div className="mb-4">
      {payment === 'success' && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Payment successful! Your advertisement has been submitted for approval.
          </AlertDescription>
        </Alert>
      )}
      
      {payment === 'cancelled' && (
        <Alert className="border-red-200 bg-red-50 text-red-800">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Payment was cancelled. Your advertisement was not created.
          </AlertDescription>
        </Alert>
      )}
      
      {payment === 'processing' && (
        <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Payment is being processed. Please wait...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PaymentStatusHandler;