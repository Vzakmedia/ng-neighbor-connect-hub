import { UseFormReturn } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Calendar } from '@/lib/icons';
import { AdvertisingService } from '@/services/advertisingService';
import { PricingTier } from '@/types/advertising';
import { Skeleton } from '@/components/ui/skeleton';

interface CampaignPricingStepProps {
  form: UseFormReturn<any>;
}

export const CampaignPricingStep = ({ form }: CampaignPricingStepProps) => {
  const { watch, setValue } = form;
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [estimatedCost, setEstimatedCost] = useState(0);
  
  const selectedTierId = watch('pricing_tier_id');
  const durationDays = watch('duration_days') || 7;
  const selectedTier = pricingTiers.find(t => t.id === selectedTierId);

  useEffect(() => {
    loadPricingTiers();
  }, []);

  useEffect(() => {
    if (selectedTier && durationDays) {
      calculateCost();
    }
  }, [selectedTier, durationDays]);

  const loadPricingTiers = async () => {
    try {
      const tiers = await AdvertisingService.getPricingTiers();
      setPricingTiers(tiers);
      if (tiers.length > 0 && !selectedTierId) {
        setValue('pricing_tier_id', tiers[0].id);
        setValue('target_geographic_scope', tiers[0].geographic_scope);
      }
    } catch (error) {
      console.error('Error loading pricing tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = async () => {
    if (!selectedTier || !durationDays) return;
    
    try {
      const cost = await AdvertisingService.calculateCampaignCost(selectedTier.id, durationDays);
      setEstimatedCost(cost);
      const dailyBudget = cost / durationDays;
      setValue('total_budget', cost);
      setValue('daily_budget', dailyBudget);
    } catch (error) {
      console.error('Error calculating cost:', error);
    }
  };

  const handleTierSelect = (tierId: string) => {
    const tier = pricingTiers.find(t => t.id === tierId);
    if (tier) {
      setValue('pricing_tier_id', tier.id);
      setValue('target_geographic_scope', tier.geographic_scope);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-3 block">Select Pricing Tier *</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedTierId === tier.id
                  ? 'ring-2 ring-primary'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleTierSelect(tier.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{tier.name}</h4>
                {selectedTierId === tier.id && (
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

      <div>
        <Label htmlFor="duration">Campaign Duration (days) *</Label>
        <div className="flex items-center gap-4 mt-2">
          <Input
            id="duration"
            type="number"
            min="1"
            max={selectedTier?.max_duration_days || 30}
            value={durationDays}
            onChange={(e) => setValue('duration_days', Number(e.target.value))}
            className="max-w-[120px]"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Max: {selectedTier?.max_duration_days || 30} days</span>
          </div>
        </div>
      </div>

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
  );
};