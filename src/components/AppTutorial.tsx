import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, ArrowRight, Navigation, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
  action?: string;
}

interface AppTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to NeighborLink! 👋',
    description: 'Let\'s take a quick tour to help you get started. You can skip this at any time.',
    targetSelector: 'body',
    placement: 'bottom',
  },
  {
    id: 'navigation',
    title: 'Navigation Sidebar',
    description: 'Access all main features from here: Community, Messages, Marketplace, Safety, Events, and Services.',
    targetSelector: '[data-tutorial="navigation"]',
    placement: 'right',
    highlight: true,
  },
  {
    id: 'create-post',
    title: 'Create Posts',
    description: 'Share updates, ask questions, or start discussions with your neighbors using this button.',
    targetSelector: '[data-tutorial="create-post"]',
    placement: 'bottom',
    highlight: true,
    action: 'Click to create a post',
  },
  {
    id: 'notifications',
    title: 'Stay Updated',
    description: 'Get notified about messages, safety alerts, and community updates. Check your notifications here.',
    targetSelector: '[data-tutorial="notifications"]',
    placement: 'bottom',
    highlight: true,
  },
  {
    id: 'messages',
    title: 'Direct Messages',
    description: 'Connect privately with neighbors. Your unread message count appears here.',
    targetSelector: '[data-tutorial="messages"]',
    placement: 'bottom',
    highlight: true,
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Manage your account, settings, and create community ads from your profile menu.',
    targetSelector: '[data-tutorial="profile"]',
    placement: 'bottom',
    highlight: true,
  },
  {
    id: 'community-feed',
    title: 'Community Feed',
    description: 'This is where you\'ll see posts from your neighbors. Engage with likes, comments, and shares.',
    targetSelector: '[data-tutorial="community-feed"]',
    placement: 'left',
    highlight: true,
  },
  {
    id: 'safety-alerts',
    title: 'Safety & Alerts',
    description: 'Stay informed about safety updates and emergency alerts in your area.',
    targetSelector: '[data-tutorial="safety-alerts"]',
    placement: 'left',
    highlight: true,
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'You\'re ready to connect with your neighbors. Remember, you can always find help in Settings > Help.',
    targetSelector: 'body',
    placement: 'bottom',
  },
];

const AppTutorial: React.FC<AppTutorialProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetPosition, setTargetPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepData = tutorialSteps[currentStep];

  useEffect(() => {
    if (isOpen && currentStepData) {
      updateTargetPosition();
      setIsVisible(true);
      
      // Add scroll listener to update position
      const handleScroll = () => updateTargetPosition();
      const handleResize = () => updateTargetPosition();
      
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, currentStep]);

  const updateTargetPosition = () => {
    if (!currentStepData?.targetSelector) return;
    
    const element = document.querySelector(currentStepData.targetSelector) as HTMLElement;
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  const getTooltipPosition = () => {
    const { placement } = currentStepData;
    const { top, left, width, height } = targetPosition;
    
    switch (placement) {
      case 'top':
        return { top: top - 10, left: left + width / 2, transform: 'translate(-50%, -100%)' };
      case 'bottom':
        return { top: top + height + 10, left: left + width / 2, transform: 'translate(-50%, 0)' };
      case 'left':
        return { top: top + height / 2, left: left - 10, transform: 'translate(-100%, -50%)' };
      case 'right':
        return { top: top + height / 2, left: left + width + 10, transform: 'translate(0, -50%)' };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    onClose();
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
    onClose();
  };

  if (!isOpen || !isVisible) return null;

  const tooltipPosition = getTooltipPosition();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]">
        {/* Overlay with spotlight effect */}
        <div 
          ref={overlayRef}
          className="absolute inset-0 bg-black/70 pointer-events-none"
          style={{
            background: currentStepData.highlight && currentStepData.targetSelector !== 'body'
              ? `radial-gradient(circle at ${targetPosition.left + targetPosition.width/2}px ${targetPosition.top + targetPosition.height/2}px, transparent ${Math.max(targetPosition.width, targetPosition.height)/2 + 20}px, rgba(0,0,0,0.7) ${Math.max(targetPosition.width, targetPosition.height)/2 + 40}px)`
              : 'rgba(0,0,0,0.7)'
          }}
        />

        {/* Highlight ring */}
        {currentStepData.highlight && currentStepData.targetSelector !== 'body' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute border-4 border-primary rounded-lg pointer-events-none"
            style={{
              top: targetPosition.top - 8,
              left: targetPosition.left - 8,
              width: targetPosition.width + 16,
              height: targetPosition.height + 16,
              zIndex: 10000,
            }}
          />
        )}

        {/* Tutorial Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <Card 
            className="absolute w-80 shadow-2xl border-2 z-[10001]"
            style={{
              ...tooltipPosition,
              maxWidth: '90vw',
            }}
          >
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Step {currentStep + 1} of {tutorialSteps.length}
                  </Badge>
                  <Navigation className="h-4 w-4 text-primary" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipTutorial}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">{currentStepData.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentStepData.description}
                </p>
                {currentStepData.action && (
                  <div className="mt-3 p-2 bg-primary/5 rounded border-l-4 border-primary">
                    <p className="text-xs text-primary font-medium">
                      💡 {currentStepData.action}
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipTutorial}
                    className="text-xs"
                  >
                    <SkipForward className="h-3 w-3 mr-1" />
                    Skip Tour
                  </Button>
                </div>

                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      className="text-xs"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Back
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="text-xs bg-gradient-primary hover:opacity-90"
                  >
                    {currentStep === tutorialSteps.length - 1 ? (
                      'Finish'
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-1 mt-4">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep ? 'bg-primary' : 
                      index < currentStep ? 'bg-primary/50' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AppTutorial;