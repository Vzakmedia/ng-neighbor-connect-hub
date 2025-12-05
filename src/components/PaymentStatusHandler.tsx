import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock } from '@/lib/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PaymentStatusHandler = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const payment = searchParams.get('payment');
    const campaignId = searchParams.get('campaign_id');
    const sessionId = searchParams.get('session_id');

    if (payment === 'success' && (campaignId || sessionId)) {
      handlePaymentSuccess(campaignId, sessionId);
    } else if (payment === 'cancelled' && campaignId) {
      handlePaymentCancelled(campaignId);
    }
  }, [searchParams]);

  const handlePaymentSuccess = async (campaignId?: string, sessionId?: string) => {
    try {
      let campaign: any = null;

      if (campaignId) {
        const { data, error } = await supabase
          .from('advertisement_campaigns')
          .select('campaign_name, payment_status, status, approval_status')
          .eq('id', campaignId)
          .maybeSingle();
        if (error) throw error;
        campaign = data;
      } else if (sessionId) {
        const { data, error } = await supabase
          .from('advertisement_campaigns')
          .select('campaign_name, payment_status, status, approval_status')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();
        if (error) throw error;
        campaign = data;
      }

      toast({
        title: 'Payment Successful',
        description: campaign
          ? `"${campaign.campaign_name}" is paid and pending admin approval.`
          : 'Your payment was successful. Your ad is being processed.',
      });

      // Clear URL parameters using navigate for router compatibility
      navigate('/advertising/campaigns', { replace: true });
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast({
        title: 'Payment Received',
        description: 'Your payment was successful. Your ad is being processed.',
      });
    }
  };

  const handlePaymentCancelled = async (campaignId?: string) => {
    try {
      if (campaignId) {
        // Optionally clean up cancelled campaigns that never paid
        await supabase
          .from('advertisement_campaigns')
          .delete()
          .eq('id', campaignId)
          .eq('payment_status', 'pending');
      }

      toast({
        title: 'Payment Cancelled',
        description: 'Your advertisement was not created. You can try again anytime.',
        variant: 'destructive',
      });

      // Clear URL parameters using navigate for router compatibility
      navigate('/advertising/campaigns', { replace: true });
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