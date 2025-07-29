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
import { Megaphone, Target, Clock, DollarSign } from 'lucide-react';

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
        budget: parseFloat(formData.budget),
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
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
              <Label htmlFor="budget">Budget (₦)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="1000"
                min="500"
                step="100"
                required
              />
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
                  ₦{formData.budget || '0'}
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.budget}>
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePromotionDialog;