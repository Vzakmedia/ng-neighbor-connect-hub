import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Home, MessageSquare, ShoppingBag, Shield, Plus, Bell, User } from '@/lib/icons';

interface MobileTutorialStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface MobileTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const mobileTutorialSteps: MobileTutorialStep[] = [
  {
    id: 'welcome',
    icon: <span className="text-6xl">👋</span>,
    title: 'Welcome to NeighborLink!',
    description: 'Let\'s take a quick tour of your mobile app. Swipe through to learn the basics.',
  },
  {
    id: 'navigation',
    icon: <Home className="w-16 h-16 text-primary" />,
    title: 'Bottom Navigation',
    description: 'Access Home, Community, Marketplace, and Safety from the navigation bar at the bottom of your screen.',
  },
  {
    id: 'create-post',
    icon: <Plus className="w-16 h-16 text-primary" />,
    title: 'Create Posts',
    description: 'Tap the floating + button in the bottom right corner to share updates, ask questions, or start discussions with your neighbors.',
  },
  {
    id: 'notifications',
    icon: <Bell className="w-16 h-16 text-primary" />,
    title: 'Stay Updated',
    description: 'Get notified about messages, safety alerts, and community updates. Check the bell icon in the top right corner.',
  },
  {
    id: 'messages',
    icon: <MessageSquare className="w-16 h-16 text-primary" />,
    title: 'Direct Messages',
    description: 'Connect privately with neighbors. Access your messages from the top navigation bar.',
  },
  {
    id: 'profile',
    icon: <User className="w-16 h-16 text-primary" />,
    title: 'Your Profile',
    description: 'Manage your account, settings, and preferences by tapping your profile icon in the top right corner.',
  },
  {
    id: 'complete',
    icon: <span className="text-6xl">🎉</span>,
    title: 'You\'re All Set!',
    description: 'You\'re ready to connect with your neighbors. Explore posts, join discussions, and stay connected with your community!',
  },
];

const MobileTutorial: React.FC<MobileTutorialProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const currentStepData = mobileTutorialSteps[currentStep];
  const isLastStep = currentStep === mobileTutorialSteps.length - 1;

  const nextStep = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="pb-safe max-h-[85vh]">
        <DrawerHeader className="text-center">
          <div className="flex justify-center mb-4 mt-2">
            {currentStepData.icon}
          </div>
          <DrawerTitle className="text-2xl">{currentStepData.title}</DrawerTitle>
          <DrawerDescription className="text-base mt-2">
            {currentStepData.description}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="px-6 pb-6">
          {/* Navigation Buttons */}
          <div className="flex gap-2 w-full mb-4">
            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="flex-1"
            >
              Skip
            </Button>
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={prevStep}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button 
              onClick={nextStep}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </Button>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2">
            {mobileTutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-8 bg-primary' 
                    : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileTutorial;
