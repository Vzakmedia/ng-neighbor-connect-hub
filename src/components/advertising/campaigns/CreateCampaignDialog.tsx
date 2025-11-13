import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdvertisingCampaigns } from '@/hooks/advertising/useAdvertisingCampaigns';
import { AdvertisingService } from '@/services/advertisingService';
import { CampaignType, PricingTier, CreateCampaignData } from '@/types/advertising';
import { Plus, Check, Loader2, MapPin, Calendar } from '@/lib/icons';
import { toast } from 'sonner';
import { RenderApiService } from '@/services/renderApiService';

interface CreateCampaignDialogProps {
  children?: React.ReactNode;
  onCampaignCreated?: () => void;
  // Pre-fill data for specific content types
  serviceId?: string;
  marketplaceItemId?: string;
  businessId?: string;
  eventId?: string;
  communityPostId?: string;
}

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

export const CreateCampaignDialog = ({
  children,
  onCampaignCreated,
  serviceId,
  marketplaceItemId,
  businessId,
  eventId,
  communityPostId,
}: CreateCampaignDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [formData, setFormData] = useState<Partial<CreateCampaignData>>({
    campaign_type: serviceId ? 'service_ad' : marketplaceItemId ? 'marketplace_ad' : businessId ? 'business_promotion' : eventId ? 'event_promotion' : 'community_boost',
    target_geographic_scope: 'city',
    ad_call_to_action: 'Learn More',
    service_id: serviceId,
    marketplace_item_id: marketplaceItemId,
    business_id: businessId,
    event_id: eventId,
    community_post_id: communityPostId,
  });
  const [durationDays, setDurationDays] = useState(7);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const { createCampaign } = useAdvertisingCampaigns();

  const loadPricingTiers = async () => {
    const tiers = await AdvertisingService.getPricingTiers();
    setPricingTiers(tiers);
    if (tiers.length > 0) {
      setSelectedTier(tiers[0]);
      setFormData(prev => ({ ...prev, pricing_tier_id: tiers[0].id }));
    }
  };

  const calculateCost = async () => {
    if (selectedTier && durationDays) {
      const cost = await AdvertisingService.calculateCampaignCost(selectedTier.id, durationDays);
      setEstimatedCost(cost);
      const dailyBudget = cost / durationDays;
      setFormData(prev => ({
        ...prev,
        total_budget: cost,
        daily_budget: dailyBudget,
      }));
    }
  };

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      await loadPricingTiers();
    }
  };

  const handleTierSelect = async (tierId: string) => {
    const tier = pricingTiers.find(t => t.id === tierId);
    if (tier) {
      setSelectedTier(tier);
      setFormData(prev => ({
        ...prev,
        pricing_tier_id: tier.id,
        target_geographic_scope: tier.geographic_scope,
      }));
      await calculateCost();
    }
  };

  const handleDurationChange = async (days: number) => {
    setDurationDays(days);
    await calculateCost();
  };

  const handleSubmit = async () => {
    if (!formData.campaign_name || !formData.ad_title || !formData.ad_description || !formData.pricing_tier_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const campaignData: CreateCampaignData = {
        ...formData as CreateCampaignData,
        duration_days: durationDays,
        total_budget: estimatedCost,
        daily_budget: estimatedCost / durationDays,
      };

      const campaign = await createCampaign(campaignData);
      if (campaign) {
        // Initiate payment
        const paymentResponse = await RenderApiService.createCampaignPayment({
          campaignId: campaign.id,
          totalAmount: estimatedCost,
          currency: 'ngn',
          campaignName: campaign.campaign_name,
          duration: durationDays,
        });

        if (paymentResponse?.url) {
          window.location.href = paymentResponse.url;
        }

        setOpen(false);
        onCampaignCreated?.();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Advertisement Campaign</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign_name">Campaign Name *</Label>
              <Input
                id="campaign_name"
                placeholder="My Summer Campaign"
                value={formData.campaign_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="ad_title">Ad Title *</Label>
              <Input
                id="ad_title"
                placeholder="Amazing Product or Service"
                value={formData.ad_title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ad_title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="ad_description">Ad Description *</Label>
              <Textarea
                id="ad_description"
                placeholder="Describe what makes your offering special..."
                value={formData.ad_description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ad_description: e.target.value }))}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="ad_url">Destination URL (Optional)</Label>
              <Input
                id="ad_url"
                placeholder="https://example.com or /services"
                value={formData.ad_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ad_url: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="ad_cta">Call to Action Button Text</Label>
              <Input
                id="ad_cta"
                placeholder="Learn More"
                value={formData.ad_call_to_action || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ad_call_to_action: e.target.value }))}
              />
            </div>
          </div>

          {/* Pricing Tiers */}
          <div>
            <Label className="mb-2 block">Select Pricing Tier *</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedTier?.id === tier.id
                      ? 'ring-2 ring-primary'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleTierSelect(tier.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{tier.name}</h4>
                    {selectedTier?.id === tier.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-2xl font-bold mb-2">
                    ₦{tier.base_price_per_day}/day
                  </p>
                  <Badge variant="secondary" className="mb-3">
                    {tier.geographic_scope}
                  </Badge>
                  <ul className="text-xs space-y-1">
                    <li className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {tier.impressions_included.toLocaleString()} impressions
                    </li>
                    <li className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Priority level {tier.priority_level}
                    </li>
                  </ul>
                </Card>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration">Campaign Duration (days)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Input
                id="duration"
                type="number"
                min="1"
                max={selectedTier?.max_duration_days || 30}
                value={durationDays}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="max-w-[120px]"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Max: {selectedTier?.max_duration_days || 30} days</span>
              </div>
            </div>
          </div>

          {/* Geographic Targeting */}
          {selectedTier?.geographic_scope === 'state' && (
            <div>
              <Label htmlFor="target_states">Target States</Label>
              <Select
                value={formData.target_states?.[0] || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, target_states: [value] }))}
              >
                <SelectTrigger id="target_states">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {nigerianStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Cost Summary */}
          <Card className="p-4 bg-muted">
            <h4 className="font-semibold mb-3">Cost Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">{durationDays} days</span>
              </div>
              <div className="flex justify-between">
                <span>Daily Budget:</span>
                <span className="font-medium">₦{(estimatedCost / durationDays).toFixed(2)}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Cost:</span>
                <span className="text-primary">₦{estimatedCost.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create & Pay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
