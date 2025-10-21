import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Building, Shield, CheckCircle } from 'lucide-react';
import { BUSINESS_CATEGORIES, formatCategory as formatCategoryUtil } from '@/data/businessCategories';
import { NIGERIAN_STATES } from '@/data/nigeriaLocationData';

interface BusinessRegistrationDialogProps {
  children: React.ReactNode;
  onBusinessRegistered?: () => void;
}


const BusinessRegistrationDialog = ({ children, onBusinessRegistered }: BusinessRegistrationDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    category: '',
    phone: '',
    email: '',
    website_url: '',
    physical_address: '',
    city: '',
    state: '',
    tax_id_number: '',
    business_license: '',
    operating_hours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true }
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const validateStep1 = () => {
    return formData.business_name && formData.category && formData.description && 
           formData.phone && formData.email;
  };

  const validateStep2 = () => {
    return formData.physical_address && formData.city && formData.state;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to register your business",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          business_name: formData.business_name,
          description: formData.description,
          category: formData.category,
          phone: formData.phone,
          email: formData.email,
          website_url: formData.website_url || null,
          physical_address: formData.physical_address,
          city: formData.city,
          state: formData.state,
          tax_id_number: formData.tax_id_number || null,
          business_license: formData.business_license || null,
          operating_hours: formData.operating_hours,
          verification_status: 'pending'
        } as any);

      if (error) throw error;

      toast({
        title: "Business registered successfully!",
        description: "Your business registration has been submitted for review. You will receive a notification once it's approved.",
      });

      setOpen(false);
      setStep(1);
      setFormData({
        business_name: '',
        description: '',
        category: '',
        phone: '',
        email: '',
        website_url: '',
        physical_address: '',
        city: '',
        state: '',
        tax_id_number: '',
        business_license: '',
        operating_hours: {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '17:00', closed: false },
          sunday: { open: '09:00', close: '17:00', closed: true }
        }
      });
      onBusinessRegistered?.();
    } catch (error) {
      console.error('Error registering business:', error);
      toast({
        title: "Registration failed",
        description: "Failed to register your business. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="business_name">Business Name *</Label>
        <Input
          id="business_name"
          value={formData.business_name}
          onChange={(e) => handleInputChange('business_name', e.target.value)}
          placeholder="Enter your business name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select business category" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Business Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your business, services, or products"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+234 xxx xxx xxxx"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Business Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="business@example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_url">Website (Optional)</Label>
        <Input
          id="website_url"
          value={formData.website_url}
          onChange={(e) => handleInputChange('website_url', e.target.value)}
          placeholder="https://your-website.com"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="physical_address">Physical Address *</Label>
        <Textarea
          id="physical_address"
          value={formData.physical_address}
          onChange={(e) => handleInputChange('physical_address', e.target.value)}
          placeholder="Enter your business physical address"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Enter city"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {NIGERIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tax_id_number">Tax ID (TIN) (Optional)</Label>
          <Input
            id="tax_id_number"
            value={formData.tax_id_number}
            onChange={(e) => handleInputChange('tax_id_number', e.target.value)}
            placeholder="Enter TIN number"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_license">Business License (Optional)</Label>
          <Input
            id="business_license"
            value={formData.business_license}
            onChange={(e) => handleInputChange('business_license', e.target.value)}
            placeholder="License number"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Registration Summary</h3>
        <p className="text-muted-foreground mb-4">
          Please review your business information before submitting
        </p>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div>
            <span className="font-medium">Business Name:</span> {formData.business_name}
          </div>
          <div>
            <span className="font-medium">Category:</span> {formatCategoryUtil(formData.category)}
          </div>
          <div>
            <span className="font-medium">Location:</span> {formData.city}, {formData.state}
          </div>
          <div>
            <span className="font-medium">Contact:</span> {formData.phone} | {formData.email}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Verification Process
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 1</Badge>
            <span>Admin review (1-3 business days)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 2</Badge>
            <span>Document verification (if required)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 3</Badge>
            <span>Business approval & activation</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Register Your Business
          </DialogTitle>
          <DialogDescription>
            Join NeighborLink NG's verified business directory and reach more customers in your community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-0.5 ${
                    step > stepNum ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !validateStep1()) ||
                  (step === 2 && !validateStep2())
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Submitting..." : "Submit Registration"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessRegistrationDialog;