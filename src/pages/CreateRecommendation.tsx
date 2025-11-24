import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCreateRecommendation } from '@/hooks/useRecommendations.tsx';
import { useToastNotifications } from '@/hooks/common/useToastNotifications';
import { fullRecommendationSchema, FullRecommendationFormData } from '@/lib/schemas/recommendationSchema';
import { BasicInfoStep } from '@/components/recommendations/FormSteps/BasicInfoStep';
import { LocationStep } from '@/components/recommendations/FormSteps/LocationStep';
import { AdditionalInfoStep } from '@/components/recommendations/FormSteps/AdditionalInfoStep';
import { MediaTagsStep } from '@/components/recommendations/FormSteps/MediaTagsStep';

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Type, title, and category' },
  { id: 2, title: 'Location', description: 'Where is it located?' },
  { id: 3, title: 'Additional Info', description: 'Price, contact, hours' },
  { id: 4, title: 'Media & Tags', description: 'Photos and tags' },
];

export default function CreateRecommendation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const { mutate: createRecommendation, isPending } = useCreateRecommendation();
  const { showSuccess, showError } = useToastNotifications();

  const form = useForm<FullRecommendationFormData>({
    resolver: zodResolver(fullRecommendationSchema),
    defaultValues: {
      recommendation_type: 'restaurant' as const,
      title: '',
      description: '',
      category: '',
      sub_category: '',
      location_type: 'physical' as const,
      address: '',
      city: '',
      state: '',
      neighborhood: '',
      contact_info: {},
      operating_hours: {},
      image_urls: [],
      tags: [],
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: FullRecommendationFormData) => {
    const input: any = {
      ...data,
      price_range: data.price_range || undefined,
      contact_info: Object.keys(data.contact_info || {}).length > 0 ? data.contact_info : undefined,
      operating_hours: Object.keys(data.operating_hours || {}).length > 0 ? data.operating_hours : undefined,
    };
    
    createRecommendation(input, {
      onSuccess: () => {
        showSuccess('Success!', 'Your recommendation has been submitted for review');
        navigate('/recommendations');
      },
      onError: (error) => {
        console.error('Error creating recommendation:', error);
        showError('Error', 'Failed to create recommendation. Please try again.');
      },
    });
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
        return ['recommendation_type', 'title', 'description', 'category'];
      case 2:
        return ['location_type', 'city', 'state'];
      case 3:
        return [];
      case 4:
        return ['image_urls', 'tags'];
      default:
        return [];
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep form={form} />;
      case 2:
        return <LocationStep form={form} />;
      case 3:
        return <AdditionalInfoStep form={form} />;
      case 4:
        return <MediaTagsStep form={form} />;
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
              onClick={() => navigate('/recommendations')}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Add Recommendation</h1>
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
              disabled={isPending}
              className="flex-1"
            >
              Previous
            </Button>
          )}
          <Button
            type="button"
            onClick={nextStep}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? (
              'Submitting...'
            ) : currentStep === STEPS.length ? (
              'Submit Recommendation'
            ) : (
              'Next Step'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
