import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Target, DollarSign, Image as ImageIcon, Globe, MapPin, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

interface CreateAdCampaignDialogProps {
  children: React.ReactNode;
  onCampaignCreated?: () => void;
  preSelectedContent?: {
    id: string;
    type: 'service' | 'marketplace_item' | 'business' | 'community_post' | 'event';
    title: string;
    description?: string;
  };
}

interface PricingTier {
  id: string;
  name: string;
  geographic_scope: string;
  ad_type: string;
  base_price_per_day: number;
  impressions_included: number;
  priority_level: number;
  max_duration_days?: number;
  features: any;
}

interface PromotableContent {
  id: string;
  title: string;
  description?: string;
  price?: number;
  type: 'service' | 'marketplace_item' | 'business' | 'community_post' | 'event';
}

export const CreateAdCampaignDialog = ({ children, onCampaignCreated, preSelectedContent }: CreateAdCampaignDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [promotableContent, setPromotableContent] = useState<PromotableContent[]>([]);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    campaignName: '',
    campaignType: 'direct_ad' as 'service' | 'marketplace_item' | 'business' | 'community_post' | 'event' | 'direct_ad',
    contentId: '',
    geographicScope: 'city' as 'city' | 'state' | 'nationwide',
    targetCities: [] as string[],
    targetStates: [] as string[],
    startDate: new Date(),
    duration: 7,
    dailyBudget: 10,
    pricingTierId: '',
    
    // Direct ad fields
    adTitle: '',
    adDescription: '',
    adUrl: '',
    adCallToAction: 'Learn More',
    adImages: [] as string[]
  });

  useEffect(() => {
    if (open) {
      // Pre-populate form if content is pre-selected
      if (preSelectedContent && !formData.contentId) {
        setFormData(prev => ({
          ...prev,
          campaignType: preSelectedContent.type,
          contentId: preSelectedContent.id,
          campaignName: `Promote: ${preSelectedContent.title}`,
          adTitle: preSelectedContent.title,
          adDescription: preSelectedContent.description || ''
        }));
      }
      fetchPricingTiers();
      fetchPromotableContent();
    }
  }, [open, formData.campaignType, formData.geographicScope, preSelectedContent]);

  const fetchPricingTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_pricing_tiers')
        .select('*')
        .eq('ad_type', 'advertisement')
        .eq('geographic_scope', formData.geographicScope)
        .eq('is_active', true)
        .order('priority_level', { ascending: false });

      if (error) throw error;
      setPricingTiers(data || []);
      
      // Auto-select first tier if available
      if (data && data.length > 0 && !formData.pricingTierId) {
        const first = data[0] as any;
        setFormData(prev => ({ 
          ...prev, 
          pricingTierId: first.id,
          dailyBudget: first.base_price_per_day,
          duration: Math.min(prev.duration, first.max_duration_days ?? prev.duration)
        }));
      }
    } catch (error) {
      console.error('Error fetching pricing tiers:', error);
    }
  };

  const fetchPromotableContent = async () => {
    if (formData.campaignType === 'direct_ad') return;
    
    try {
      let query;
      switch (formData.campaignType) {
        case 'service':
          query = supabase.from('services').select('id, title, description, price').eq('user_id', user?.id);
          break;
        case 'marketplace_item':
          query = supabase.from('marketplace_items').select('id, title, description, price').eq('user_id', user?.id);
          break;
        case 'business':
          query = supabase.from('businesses').select('id, business_name as title, description').eq('user_id', user?.id);
          break;
        case 'community_post':
          query = supabase.from('community_posts').select('id, title, content as description').eq('user_id', user?.id);
          break;
        case 'event':
          query = supabase.from('community_posts').select('id, title, content as description').eq('user_id', user?.id).eq('post_type', 'event');
          break;
        default:
          return;
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const content = data?.map(item => ({
        ...item,
        type: formData.campaignType
      })) || [];
      
      setPromotableContent(content);
    } catch (error) {
      console.error('Error fetching promotable content:', error);
    }
  };

  const calculateTotalCost = () => {
    return formData.dailyBudget * formData.duration;
  };

  const getSelectedTier = () => {
    return pricingTiers.find(tier => tier.id === formData.pricingTierId);
  };

  const handleSubmit = async () => {
    if (!user) return;

  setLoading(true);
  try {
    const endDate = new Date(formData.startDate);
    endDate.setDate(endDate.getDate() + formData.duration);

    const tier = getSelectedTier();
    if (!tier) {
      toast({
        title: "Select a pricing plan",
        description: "Please choose a pricing tier before continuing",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    const maxDays = tier.max_duration_days ?? 90;
    if (formData.duration > maxDays) {
      toast({
        title: "Duration too long",
        description: `Max duration for ${tier.name} is ${maxDays} days.`,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    const minBudget = tier.base_price_per_day;
    if (formData.dailyBudget < minBudget) {
      toast({
        title: "Daily budget too low",
        description: `Minimum is $${minBudget}/day for this tier.`,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const campaignData = {
        user_id: user.id,
        campaign_name: formData.campaignName,
        campaign_type: 'advertisement',
        pricing_tier_id: formData.pricingTierId,
        target_geographic_scope: formData.geographicScope,
        target_cities: formData.targetCities,
        target_states: formData.targetStates,
        daily_budget: formData.dailyBudget,
        total_budget: calculateTotalCost(),
        start_date: formData.startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'draft',
        
        // Content references
        ...(formData.campaignType === 'service' && { service_id: formData.contentId }),
        ...(formData.campaignType === 'marketplace_item' && { marketplace_item_id: formData.contentId }),
        ...(formData.campaignType === 'business' && { business_id: formData.contentId }),
        ...(formData.campaignType === 'community_post' && { community_post_id: formData.contentId }),
        ...(formData.campaignType === 'event' && { event_id: formData.contentId }),
        
        // Direct ad content
        ...(formData.campaignType === 'direct_ad' && {
          ad_title: formData.adTitle,
          ad_description: formData.adDescription,
          ad_url: formData.adUrl,
          ad_call_to_action: formData.adCallToAction,
          ad_images: formData.adImages
        })
      };

      const { data: campaign, error } = await supabase
        .from('advertisement_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;

      // Create payment session
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-ad-campaign-payment',
        {
          body: {
            campaignId: campaign.id,
            totalAmount: calculateTotalCost(),
            campaignName: formData.campaignName,
            duration: formData.duration
          }
        }
      );

      if (paymentError) throw paymentError;

      // Redirect to Stripe Checkout
      window.open(paymentData.url, '_blank');

      toast({
        title: "Campaign Created",
        description: "Redirecting to payment...",
      });

      setOpen(false);
      onCampaignCreated?.();
      
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderGeographicIcons = () => {
    switch (formData.geographicScope) {
      case 'city':
        return <MapPin className="h-4 w-4" />;
      case 'state':
        return <Building2 className="h-4 w-4" />;
      case 'nationwide':
        return <Globe className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create Advertisement Campaign
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  placeholder="Enter campaign name"
                />
              </div>

              <div>
                <Label htmlFor="campaignType">What do you want to promote?</Label>
                <Select value={formData.campaignType} onValueChange={(value: any) => setFormData({ ...formData, campaignType: value, contentId: '' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">My Service</SelectItem>
                    <SelectItem value="marketplace_item">My Marketplace Item</SelectItem>
                    <SelectItem value="business">My Business</SelectItem>
                    <SelectItem value="community_post">My Community Post</SelectItem>
                    <SelectItem value="event">My Event</SelectItem>
                    <SelectItem value="direct_ad">Create Custom Ad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.campaignType !== 'direct_ad' && (
                <div>
                  <Label htmlFor="contentId">Select Content to Promote</Label>
                  <Select value={formData.contentId} onValueChange={(value) => setFormData({ ...formData, contentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content" />
                    </SelectTrigger>
                    <SelectContent>
                      {promotableContent.map((content) => (
                        <SelectItem key={content.id} value={content.id}>
                          {content.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.campaignType === 'direct_ad' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold">Custom Advertisement</h3>
                  <div>
                    <Label htmlFor="adTitle">Ad Title</Label>
                    <Input
                      id="adTitle"
                      value={formData.adTitle}
                      onChange={(e) => setFormData({ ...formData, adTitle: e.target.value })}
                      placeholder="Enter compelling ad title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adDescription">Ad Description</Label>
                    <Textarea
                      id="adDescription"
                      value={formData.adDescription}
                      onChange={(e) => setFormData({ ...formData, adDescription: e.target.value })}
                      placeholder="Describe your offer..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="adUrl">Landing Page URL</Label>
                    <Input
                      id="adUrl"
                      type="url"
                      value={formData.adUrl}
                      onChange={(e) => setFormData({ ...formData, adUrl: e.target.value })}
                      placeholder="https://your-website.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adCallToAction">Call to Action</Label>
                    <Select value={formData.adCallToAction} onValueChange={(value) => setFormData({ ...formData, adCallToAction: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Learn More">Learn More</SelectItem>
                        <SelectItem value="Shop Now">Shop Now</SelectItem>
                        <SelectItem value="Get Started">Get Started</SelectItem>
                        <SelectItem value="Contact Us">Contact Us</SelectItem>
                        <SelectItem value="Sign Up">Sign Up</SelectItem>
                        <SelectItem value="Download">Download</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="targeting" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Geographic Targeting</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {['city', 'state', 'nationwide'].map((scope) => (
                    <Card 
                      key={scope}
                      className={cn(
                        "cursor-pointer transition-all",
                        formData.geographicScope === scope && "ring-2 ring-primary"
                      )}
                      onClick={() => setFormData({ ...formData, geographicScope: scope as any, pricingTierId: '' })}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="flex justify-center mb-2">
                          {scope === 'city' && <MapPin className="h-6 w-6" />}
                          {scope === 'state' && <Building2 className="h-6 w-6" />}
                          {scope === 'nationwide' && <Globe className="h-6 w-6" />}
                        </div>
                        <h3 className="font-semibold capitalize">{scope}</h3>
                        <p className="text-sm text-muted-foreground">
                          {scope === 'city' && 'Target specific cities'}
                          {scope === 'state' && 'Target entire states'}
                          {scope === 'nationwide' && 'Reach entire country'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {formData.geographicScope === 'city' && (
                <div>
                  <Label htmlFor="targetCities">Target Cities</Label>
                  <Input
                    id="targetCities"
                    value={formData.targetCities.join(', ')}
                    onChange={(e) => setFormData({ ...formData, targetCities: e.target.value.split(',').map(s => s.trim()) })}
                    placeholder="Enter cities separated by commas"
                  />
                </div>
              )}

              {formData.geographicScope === 'state' && (
                <div>
                  <Label htmlFor="targetStates">Target States</Label>
                  <Input
                    id="targetStates"
                    value={formData.targetStates.join(', ')}
                    onChange={(e) => setFormData({ ...formData, targetStates: e.target.value.split(',').map(s => s.trim()) })}
                    placeholder="Enter states separated by commas"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.startDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    max={getSelectedTier()?.max_duration_days ?? 90}
                    value={formData.duration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const max = getSelectedTier()?.max_duration_days ?? 90;
                      setFormData({ ...formData, duration: Math.min(Math.max(val, 1), max) });
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Max for selected tier: {getSelectedTier()?.max_duration_days ?? 90} days
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Choose Your Pricing Plan
                </h3>
                <div className="grid gap-4">
                  {pricingTiers.map((tier) => (
                    <Card 
                      key={tier.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        formData.pricingTierId === tier.id && "ring-2 ring-primary"
                      )}
                      onClick={() => {
                        const max = (tier as any).max_duration_days ?? formData.duration;
                        setFormData({ 
                          ...formData, 
                          pricingTierId: tier.id,
                          dailyBudget: tier.base_price_per_day,
                          duration: Math.min(formData.duration, max)
                        })
                      }}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{tier.name}</CardTitle>
                            <CardDescription>
                              ${tier.base_price_per_day}/day • {tier.impressions_included.toLocaleString()} impressions
                            </CardDescription>
                          </div>
                          <Badge variant={tier.priority_level > 1 ? "default" : "secondary"}>
                            Priority {tier.priority_level}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(tier.features) && tier.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="dailyBudget">Daily Budget ($)</Label>
                <Input
                  id="dailyBudget"
                  type="number"
                  min={getSelectedTier()?.base_price_per_day ?? 1}
                  step="0.01"
                  value={formData.dailyBudget}
                  onChange={(e) => {
                    const min = getSelectedTier()?.base_price_per_day ?? 1;
                    const val = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, dailyBudget: Math.max(val, min) });
                  }}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Minimum: ${getSelectedTier()?.base_price_per_day || 0}/day
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Campaign Name:</span>
                      <p>{formData.campaignName}</p>
                    </div>
                    <div>
                      <span className="font-medium">Campaign Type:</span>
                      <p className="capitalize">{formData.campaignType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Geographic Scope:</span>
                      <p className="flex items-center gap-1 capitalize">
                        {renderGeographicIcons()}
                        {formData.geographicScope}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <p>{formData.duration} days</p>
                    </div>
                    <div>
                      <span className="font-medium">Daily Budget:</span>
                      <p>${formData.dailyBudget}</p>
                    </div>
                    <div>
                      <span className="font-medium">Total Cost:</span>
                      <p className="font-bold text-lg">${calculateTotalCost()}</p>
                    </div>
                  </div>
                  
                  {getSelectedTier() && (
                    <div className="pt-4 border-t">
                      <span className="font-medium">Selected Plan:</span>
                      <p>{getSelectedTier()!.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getSelectedTier()!.impressions_included.toLocaleString()} impressions included per day
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button onClick={() => setOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || !formData.campaignName || !formData.pricingTierId}
                  className="flex-1"
                >
                  {loading ? "Creating..." : `Create Campaign & Pay $${calculateTotalCost()}`}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};