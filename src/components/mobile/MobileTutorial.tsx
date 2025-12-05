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
import { Home, Newspaper, LayoutGrid, MessageSquare, User, Bell } from 'lucide-react';

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
    icon: (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-2xl">
        <Home className="w-8 h-8 text-primary" />
        <Newspaper className="w-8 h-8 text-muted-foreground" />
        <LayoutGrid className="w-10 h-10 text-primary" />
        <MessageSquare className="w-8 h-8 text-muted-foreground" />
        <User className="w-8 h-8 text-muted-foreground" />
      </div>
    ),
    title: 'Your Navigation Bar',
    description: 'Your main navigation is at the bottom. Access Overview, Feed, More features, Messages, and your Profile — all with one tap.',
  },
  {
    id: 'feed',
    icon: <Newspaper className="w-16 h-16 text-primary" />,
    title: 'Your Community Feed',
    description: 'Scroll through posts, safety alerts, local recommendations, and community updates — all seamlessly mixed in one continuous feed.',
  },
  {
    id: 'more-button',
    icon: (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
        <LayoutGrid className="w-8 h-8 text-primary-foreground" />
      </div>
    ),
    title: 'Discover More',
    description: 'Tap the center button to access Groups, Events, Marketplace, Services, Safety Center, Recommendations, and Settings.',
  },
  {
    id: 'messages-notifications',
    icon: (
      <div className="flex items-center gap-4">
        <MessageSquare className="w-12 h-12 text-primary" />
        <Bell className="w-12 h-12 text-primary" />
      </div>
    ),
    title: 'Stay Connected',
    description: 'Tap Messages in the bottom bar to chat with neighbors. Use the bell icon at the top for notifications and safety alerts.',
  },
  {
    id: 'profile',
    icon: (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
        <User className="w-8 h-8 text-primary-foreground" />
      </div>
    ),
    title: 'Your Profile',
    description: 'Tap your profile picture in the bottom bar to access your account, manage settings, and personalize your experience.',
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
