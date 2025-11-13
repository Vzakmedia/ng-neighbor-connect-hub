import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MegaphoneIcon, StarIcon, ArrowTrendingUpIcon, BoltIcon, CheckCircleIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { PromotionImageUpload } from '@/components/PromotionImageUpload';

interface BusinessPromotionDialogProps {
  business: any;
  children: React.ReactNode;
  onPromotionCreated?: () => void;
}

const BusinessPromotionDialog = ({ business, children, onPromotionCreated }: BusinessPromotionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promotionType, setPromotionType] = useState('basic');
  const [duration, setDuration] = useState('7');
  const [targetLocation, setTargetLocation] = useState('all');
  const [images, setImages] = useState<string[]>([]);

  const promotionPlans = {
    basic: {
      name: 'Basic Promotion',
      icon: <MegaphoneIcon className="h-5 w-5" />,
      prices: { 7: '₦5,000', 14: '₦8,000', 30: '₦14,000' },
      features: [
        'Featured in search results',
        'Basic analytics',
        'Email support'
      ],
      color: 'border-blue-200 bg-blue-50'
    },
    premium: {
      name: 'Premium Promotion',
      icon: <StarIcon className="h-5 w-5" />,
      prices: { 7: '₦10,000', 14: '₦18,000', 30: '₦32,000' },
      features: [
        'Top of search results',
        'Homepage banner placement',
        'Advanced analytics',
        'Priority support',
        'Social media boost'
      ],
      color: 'border-purple-200 bg-purple-50'
    },
    featured: {
      name: 'Featured Promotion',
      icon: <BoltIcon className="h-5 w-5" />,
      prices: { 7: '₦20,000', 14: '₦35,000', 30: '₦60,000' },
      features: [
        'Premium banner placement',
        'Newsletter inclusion',
        'Social media campaign',
        'Dedicated account manager',
        'Custom landing page',
        'Advanced targeting'
      ],
      color: 'border-gold-200 bg-yellow-50'
    }
  };

  const nigerianStates = [
    'Lagos', 'Abuja', 'Kano', 'Kaduna', 'Port Harcourt', 'Ibadan', 'Benin City',
    'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu', 'Abeokuta'
  ];

  const handleCreatePromotion = async () => {
    if (!user || !business.id) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate price based on selected plan and duration
      const selectedPlan = promotionPlans[promotionType];
      const priceString = selectedPlan.prices[duration];
      const amount = parseFloat(priceString.replace('₦', '').replace(',', ''));

      const { RenderApiService } = await import('@/services/renderApiService');
      const data = await RenderApiService.createCampaignPayment({
        campaignId: business.id, // Using business ID temporarily
        totalAmount: amount,
        campaignName: `${selectedPlan.name} - ${duration} days`,
        duration: parseInt(duration)
      });

      if (data.url) {
        // Open Stripe checkout in native browser
        const { openUrl } = await import('@/utils/nativeBrowser');
        await openUrl(data.url, '_blank');
        setOpen(false);
        toast({
          title: "Redirecting to payment",
          description: "Please complete your payment to activate the promotion",
        });
        onPromotionCreated?.();
      }
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast({
        title: "Payment Error",
        description: "Failed to create promotion payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = promotionPlans[promotionType];
  const selectedPrice = selectedPlan.prices[duration];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5" />
            Promote Your Business
          </DialogTitle>
          <DialogDescription>
            Boost your business visibility and reach more customers in your community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Business Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  {business.business_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">{business.business_name}</h3>
                  <p className="text-sm text-muted-foreground">{business.city}, {business.state}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promotion Plans */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Choose Promotion Plan</Label>
            <RadioGroup value={promotionType} onValueChange={setPromotionType}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(promotionPlans).map(([key, plan]) => (
                  <div key={key} className="relative">
                    <RadioGroupItem value={key} id={key} className="sr-only" />
                    <Card 
                      className={`cursor-pointer transition-all ${
                        promotionType === key ? `ring-2 ring-primary ${plan.color}` : 'hover:shadow-md'
                      }`}
                      onClick={() => setPromotionType(key)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {plan.icon}
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                          </div>
                          {promotionType === key && (
                            <CheckCircleIcon className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          {Object.entries(plan.prices).map(([days, price]) => (
                            <div key={days} className="flex justify-between text-sm">
                              <span>{days} days</span>
                              <span className="font-semibold">{price}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircleIcon className="h-3 w-3 text-green-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Duration Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Promotion Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days - {selectedPlan.prices['7']}</SelectItem>
                <SelectItem value="14">14 Days - {selectedPlan.prices['14']}</SelectItem>
                <SelectItem value="30">30 Days - {selectedPlan.prices['30']}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Location */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Target Location</Label>
            <Select value={targetLocation} onValueChange={setTargetLocation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {nigerianStates.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Promotion Images</Label>
            <PromotionImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={5}
            />
          </div>

          {/* Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Promotion Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-semibold">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-semibold">{duration} days</span>
              </div>
              <div className="flex justify-between">
                <span>Target:</span>
                <span className="font-semibold">{targetLocation === 'all' ? 'All Locations' : targetLocation}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">{selectedPrice}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCreatePromotion}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="lg"
            >
              {loading ? 'Processing...' : `Pay ${selectedPrice} & Start Promotion`}
            </Button>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground">
            By proceeding, you agree to our promotion terms and conditions. 
            Payments are processed securely through Stripe. Promotions begin immediately after successful payment.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessPromotionDialog;