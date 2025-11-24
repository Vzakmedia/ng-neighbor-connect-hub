import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAdvertisingCampaigns } from '@/hooks/advertising/useAdvertisingCampaigns';
import { toast } from 'sonner';
import { z } from 'zod';
import { CreateCampaignData } from '@/types/advertising';
import { RenderApiService } from '@/services/renderApiService';

// Form steps
import { CampaignBasicInfoStep } from '@/components/advertising/campaigns/FormSteps/CampaignBasicInfoStep';
import { CampaignPricingStep } from '@/components/advertising/campaigns/FormSteps/CampaignPricingStep';
import { CampaignTargetingStep } from '@/components/advertising/campaigns/FormSteps/CampaignTargetingStep';

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Campaign details' },
  { id: 2, title: 'Pricing & Duration', description: 'Select your plan' },
  { id: 3, title: 'Targeting', description: 'Geographic targeting' },
];

const campaignFormSchema = z.object({
  campaign_name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  ad_title: z.string().min(3, 'Ad title must be at least 3 characters'),
  ad_description: z.string().min(10, 'Ad description must be at least 10 characters'),
  ad_url: z.string().optional(),
  ad_call_to_action: z.string().default('Learn More'),
  ad_images: z.array(z.any()).optional(),
  campaign_type: z.string().default('service_ad'),
  pricing_tier_id: z.string(),
  target_geographic_scope: z.string(),
  duration_days: z.number().min(1).max(30),
  total_budget: z.number(),
  daily_budget: z.number(),
  target_states: z.array(z.string()).optional(),
  target_cities: z.array(z.string()).optional(),
});

type CampaignFormData = z.infer<typeof campaignFormSchema>;

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const { createCampaign } = useAdvertisingCampaigns();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      campaign_type: 'service_ad',
      ad_call_to_action: 'Learn More',
      target_geographic_scope: 'city',
      duration_days: 7,
      total_budget: 0,
      daily_budget: 0,
      ad_images: [],
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: CampaignFormData) => {
    setIsSubmitting(true);
    try {
      const campaignData: CreateCampaignData = {
        ...data as CreateCampaignData,
      };

      const campaign = await createCampaign(campaignData);
      if (campaign) {
        // Initiate payment
        const paymentResponse = await RenderApiService.createCampaignPayment({
          campaignId: campaign.id,
          totalAmount: data.total_budget,
          currency: 'ngn',
          campaignName: data.campaign_name,
          duration: data.duration_days,
        });

        if (paymentResponse?.url) {
          window.location.href = paymentResponse.url;
        } else {
          toast.success('Campaign created successfully!');
          navigate('/advertising');
        }
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    
    if (isValid) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        form.handleSubmit(onSubmit)();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 1:
        return ['campaign_name', 'ad_title', 'ad_description'];
      case 2:
        return ['pricing_tier_id', 'duration_days', 'total_budget', 'daily_budget'];
      case 3:
        return ['target_geographic_scope'];
      default:
        return [];
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CampaignBasicInfoStep form={form} />;
      case 2:
        return <CampaignPricingStep form={form} />;
      case 3:
        return <CampaignTargetingStep form={form} />;
      default:
        return null;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/advertising')}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Create Campaign</h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step indicators */}
        <div className="mb-8 hidden sm:block">
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 ${step.id !== STEPS.length ? 'relative' : ''}`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      currentStep >= step.id
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckIcon className="w-5 h-5" />
                    ) : (
                      <span className="font-semibold">{step.id}</span>
                    )}
                  </div>
                  {step.id !== STEPS.length && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-colors ${
                        currentStep > step.id ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {renderStep()}
          </form>
        </Card>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={isSubmitting}
              className="flex-1"
            >
              Previous
            </Button>
          )}
          <Button
            type="button"
            onClick={nextStep}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              'Processing...'
            ) : currentStep === STEPS.length ? (
              'Create & Pay'
            ) : (
              'Next Step'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}