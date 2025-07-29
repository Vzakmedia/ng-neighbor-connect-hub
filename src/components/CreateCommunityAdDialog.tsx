import { useState } from 'react';
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
import { Megaphone, Target, Clock, DollarSign, MapPin, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateCommunityAdDialogProps {
  children: React.ReactNode;
}

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 
  'Yobe', 'Zamfara'
];

const adTypes = [
  { value: 'community_post', label: 'Community Post Promotion', price: 500 },
  { value: 'service', label: 'Service Advertisement', price: 1000 },
  { value: 'marketplace_item', label: 'Marketplace Item', price: 750 },
  { value: 'event', label: 'Event Promotion', price: 800 },
  { value: 'business', label: 'Business Advertisement', price: 1500 }
];

const CreateCommunityAdDialog = ({ children }: CreateCommunityAdDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ad_type: '',
    duration_days: '7',
    budget: '',
    target_states: [] as string[],
    target_audience: 'local',
    website_url: '',
    contact_info: '',
    images: [] as string[],
    business_name: '',
    business_category: '',
    call_to_action: 'Learn More'
  });

  const calculateTotalCost = () => {
    const selectedAdType = adTypes.find(type => type.value === formData.ad_type);
    const baseCost = selectedAdType?.price || 0;
    const duration = parseInt(formData.duration_days);
    const stateMultiplier = formData.target_states.length || 1;
    
    return baseCost * duration * stateMultiplier;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const totalCost = calculateTotalCost();
      
      // Create promotion campaign
      const campaignData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        budget: totalCost,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + parseInt(formData.duration_days) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending_payment',
        target_audience: {
          type: formData.target_audience,
          states: formData.target_states,
          demographics: 'general'
        },
        target_locations: formData.target_states,
        spent_amount: 0
      };

      const { data: campaign, error: campaignError } = await supabase
        .from('promotion_campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create promoted post
      const postData = {
        campaign_id: campaign.id,
        post_type: formData.ad_type,
        post_content: {
          title: formData.title,
          description: formData.description,
          business_name: formData.business_name,
          business_category: formData.business_category,
          website_url: formData.website_url,
          contact_info: formData.contact_info,
          call_to_action: formData.call_to_action,
          images: formData.images
        },
        daily_budget: totalCost / parseInt(formData.duration_days),
        cost_per_click: 5.0,
        priority: 1,
        is_active: false
      };

      const { error: postError } = await supabase
        .from('promoted_posts')
        .insert([postData]);

      if (postError) throw postError;

      // Initiate payment process
      await initiatePayment(campaign.id, totalCost);

    } catch (error) {
      console.error('Error creating ad:', error);
      toast({
        title: "Error",
        description: "Failed to create advertisement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (campaignId: string, amount: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-ad-payment', {
        body: {
          campaign_id: campaignId,
          amount: amount,
          currency: 'NGN',
          description: `Advertisement: ${formData.title}`
        }
      });

      if (error) throw error;

      // Open payment page in new tab
      if (data?.url) {
        window.open(data.url, '_blank');
        
        toast({
          title: "Payment Required",
          description: "Please complete payment to activate your advertisement",
        });

        setOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      ad_type: '',
      duration_days: '7',
      budget: '',
      target_states: [],
      target_audience: 'local',
      website_url: '',
      contact_info: '',
      images: [],
      business_name: '',
      business_category: '',
      call_to_action: 'Learn More'
    });
    setStep(1);
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Create Community Advertisement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="ad_type">Advertisement Type</Label>
                <Select value={formData.ad_type} onValueChange={(value) => setFormData(prev => ({ ...prev, ad_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ad type" />
                  </SelectTrigger>
                  <SelectContent>
                    {adTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} - ₦{type.price}/day
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Advertisement Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter your ad title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your advertisement..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Your business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_category">Category</Label>
                  <Select value={formData.business_category} onValueChange={(value) => setFormData(prev => ({ ...prev, business_category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food & Dining</SelectItem>
                      <SelectItem value="retail">Retail & Shopping</SelectItem>
                      <SelectItem value="services">Professional Services</SelectItem>
                      <SelectItem value="health">Health & Wellness</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Targeting & Duration</h3>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Campaign Duration</Label>
                <Select value={formData.duration_days} onValueChange={(value) => setFormData(prev => ({ ...prev, duration_days: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target States</Label>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {nigerianStates.map((state) => (
                    <div key={state} className="flex items-center space-x-2">
                      <Checkbox
                        id={state}
                        checked={formData.target_states.includes(state)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({ ...prev, target_states: [...prev.target_states, state] }));
                          } else {
                            setFormData(prev => ({ ...prev, target_states: prev.target_states.filter(s => s !== state) }));
                          }
                        }}
                      />
                      <Label htmlFor={state} className="text-sm">{state}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected: {formData.target_states.length} state(s)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_audience">Target Audience</Label>
                <Select value={formData.target_audience} onValueChange={(value) => setFormData(prev => ({ ...prev, target_audience: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Community</SelectItem>
                    <SelectItem value="youth">Youth (18-30)</SelectItem>
                    <SelectItem value="professionals">Professionals (25-45)</SelectItem>
                    <SelectItem value="families">Families</SelectItem>
                    <SelectItem value="seniors">Seniors (45+)</SelectItem>
                    <SelectItem value="all">All Demographics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact & Call to Action</h3>
              
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
                <Label htmlFor="contact_info">Contact Information</Label>
                <Input
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_info: e.target.value }))}
                  placeholder="Phone number, email, or other contact details"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="call_to_action">Call to Action Button</Label>
                <Select value={formData.call_to_action} onValueChange={(value) => setFormData(prev => ({ ...prev, call_to_action: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Learn More">Learn More</SelectItem>
                    <SelectItem value="Contact Us">Contact Us</SelectItem>
                    <SelectItem value="Visit Website">Visit Website</SelectItem>
                    <SelectItem value="Call Now">Call Now</SelectItem>
                    <SelectItem value="Get Quote">Get Quote</SelectItem>
                    <SelectItem value="Book Now">Book Now</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cost Summary */}
              <Card className="border-dashed border-primary/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Cost Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base cost per day:</span>
                      <span>₦{adTypes.find(type => type.value === formData.ad_type)?.price || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{formData.duration_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target states:</span>
                      <span>{formData.target_states.length || 1} state(s)</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-semibold">
                      <span>Total Cost:</span>
                      <span>₦{calculateTotalCost().toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      <Target className="h-3 w-3 mr-1" />
                      Sponsored
                    </Badge>
                    <Badge variant="outline">
                      {formData.business_category || 'General'}
                    </Badge>
                  </div>
                  <h4 className="font-semibold">{formData.title || "Your Ad Title"}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formData.description || "Your ad description will appear here"}
                  </p>
                  {formData.business_name && (
                    <p className="text-sm font-medium">{formData.business_name}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formData.duration_days} days
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {formData.target_states.length || 1} state(s)
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formData.target_audience}
                    </div>
                  </div>
                  <Button size="sm" className="mt-3" disabled>
                    {formData.call_to_action}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <div className="flex justify-between w-full">
              <div>
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}
              </div>
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                {step < 3 ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    disabled={step === 1 && (!formData.title || !formData.ad_type || !formData.description)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={loading || !formData.contact_info || formData.target_states.length === 0}
                  >
                    {loading ? "Creating..." : `Pay ₦${calculateTotalCost().toLocaleString()} & Create Ad`}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCommunityAdDialog;