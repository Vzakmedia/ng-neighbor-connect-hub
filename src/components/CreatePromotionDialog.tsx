import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MegaphoneIcon, FlagIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { PromotionImageUpload } from '@/components/PromotionImageUpload';

interface PricingTier {
  id?: string;
  name: string;
  ad_type: string;
  geographic_scope: string;
  base_price_per_day: number;
  impressions_included?: number;
  click_rate_multiplier?: number;
  priority_level?: number;
  max_duration_days?: number;
  is_active?: boolean;
}

interface CreatePromotionDialogProps {
  children: React.ReactNode;
  itemId: string;
  itemType: 'service' | 'item';
  itemTitle: string;
  onPromotionCreated?: () => void;
}

const CreatePromotionDialog = ({ 
  children, 
  itemId, 
  itemType, 
  itemTitle, 
  onPromotionCreated 
}: CreatePromotionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_days: '7',
    budget: '',
    target_audience: 'local',
    promotion_type: 'featured',
    website_url: '',
    contact_info: '',
    images: [] as string[]
  });

// Pricing tiers state and logic
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const durationOptionsBase = [3, 7, 14, 30];
  const scopeMap: Record<string, string> = { local: 'city', city: 'city', state: 'state', national: 'nationwide' };

  useEffect(() => {
    if (!open) return;
    const loadTiers = async () => {
      try {
        const scope = scopeMap[formData.target_audience] || 'city';
        const { data, error } = await supabase
          .from('ad_pricing_tiers')
          .select('*')
          .eq('is_active', true)
          .eq('ad_type', 'promotion')
          .eq('geographic_scope', scope)
          .order('priority_level', { ascending: false });
        if (error) throw error;
        const list = (data as PricingTier[]) || [];
        setTiers(list);
        if (list.length > 0 && (!selectedTierId || !list.some((t) => t.id === selectedTierId))) {
          setSelectedTierId(list[0].id!);
        }
      } catch (err) {
        console.error('Failed to load pricing tiers', err);
      }
    };
    loadTiers();
  }, [open, formData.target_audience]);

  const selectedTier = tiers.find((t) => t.id === selectedTierId) || null;
  const maxDays = selectedTier?.max_duration_days ?? 30;
  const allowedDurations = durationOptionsBase.filter((d) => d <= maxDays);

  useEffect(() => {
    if (!selectedTier) return;
    const current = parseInt(formData.duration_days || '0');
    if (!allowedDurations.includes(current)) {
      const fallback = allowedDurations[allowedDurations.length - 1] || 7;
      setFormData((prev) => ({ ...prev, duration_days: String(fallback) }));
    }
  }, [selectedTier]);

  const dailyPrice = selectedTier?.base_price_per_day ?? 0;
  const totalPrice = dailyPrice * (parseInt(formData.duration_days || '0') || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const promotionData = {
        user_id: user.id,
        item_id: itemId,
        item_type: itemType,
        title: formData.title || `Promote ${itemTitle}`,
        description: formData.description,
        duration_days: parseInt(formData.duration_days),
        budget: selectedTier ? totalPrice : parseFloat(formData.budget),
        target_audience: formData.target_audience,
        promotion_type: formData.promotion_type,
        website_url: formData.website_url,
        contact_info: formData.contact_info,
        images: formData.images,
        status: 'pending',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + parseInt(formData.duration_days) * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error } = await supabase
        .from('promotions')
        .insert([promotionData]);

      if (error) throw error;

      toast({
        title: "Promotion Created",
        description: "Your promotion campaign has been submitted for review",
      });

      setOpen(false);
      setFormData({
        title: '',
        description: '',
        duration_days: '7',
        budget: '',
        target_audience: 'local',
        promotion_type: 'featured',
        website_url: '',
        contact_info: '',
        images: []
      });
      
      onPromotionCreated?.();
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast({
        title: "Error",
        description: "Failed to create promotion campaign",
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Promote {itemTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={`Promote ${itemTitle}`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Campaign Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your promotion campaign..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricing_tier">Pricing Tier</Label>
            <Select value={selectedTierId ?? ''} onValueChange={(value) => setSelectedTierId(value)}>
              <SelectTrigger>
                <SelectValue placeholder={tiers.length ? 'Select tier' : 'No tiers available'} />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.id!} value={t.id!}>
                    {t.name} — ₦{Number(t.base_price_per_day).toLocaleString()}/day ({t.geographic_scope})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTier && (
              <p className="text-xs text-muted-foreground">
                Includes ~{selectedTier.impressions_included} impressions/day, priority {selectedTier.priority_level}. Max {selectedTier.max_duration_days} days.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={formData.duration_days} onValueChange={(value) => setFormData(prev => ({ ...prev, duration_days: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedDurations.map((d) => (
                    <SelectItem key={d} value={String(d)}>{d} Days</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">{selectedTier ? 'Total Cost (₦)' : 'Budget (₦)'}</Label>
              {selectedTier ? (
                <>
                  <Input
                    id="budget"
                    value={totalPrice ? `₦${Number(totalPrice).toLocaleString()}` : '₦0'}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    ₦{Number(dailyPrice).toLocaleString()} per day × {formData.duration_days} days
                  </p>
                </>
              ) : (
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                  placeholder="1000"
                  min="500"
                  step="100"
                  required
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promotion_type">Promotion Type</Label>
            <Select value={formData.promotion_type} onValueChange={(value) => setFormData(prev => ({ ...prev, promotion_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured Listing</SelectItem>
                <SelectItem value="boost">Boost Visibility</SelectItem>
                <SelectItem value="highlight">Highlight in Feed</SelectItem>
                <SelectItem value="banner">Banner Placement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">Target Audience</Label>
            <Select value={formData.target_audience} onValueChange={(value) => setFormData(prev => ({ ...prev, target_audience: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local Community</SelectItem>
                <SelectItem value="city">City Wide</SelectItem>
                <SelectItem value="state">State Wide</SelectItem>
                <SelectItem value="national">National</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL (Optional)</Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
              placeholder="https://your-website.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_info">Contact Information (Optional)</Label>
            <Input
              id="contact_info"
              value={formData.contact_info}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_info: e.target.value }))}
              placeholder="Phone number, email, or other contact details"
            />
          </div>

          {/* Image Upload Section */}
          <PromotionImageUpload
            images={formData.images}
            onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
            maxImages={3}
          />

          {/* Promotion Preview */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Target className="h-3 w-3 mr-1" />
                  Promoted
                </Badge>
                <Badge variant="outline">
                  {formData.promotion_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
              <h4 className="font-semibold">{formData.title || `Promote ${itemTitle}`}</h4>
              <p className="text-sm text-muted-foreground">
                {formData.description || "Your promotion will appear highlighted in the feed"}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formData.duration_days} days
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ₦{selectedTier ? Number(totalPrice).toLocaleString() : (formData.budget || '0')}
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || (selectedTier ? totalPrice <= 0 : !formData.budget)}>
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePromotionDialog;