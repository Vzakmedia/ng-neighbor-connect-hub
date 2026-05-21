import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Users, Shield, MessageSquare } from '@/lib/icons';
import onboardingImage1 from '@/assets/onboarding/onboarding-young-woman.png';
import onboardingImage2 from '@/assets/onboarding/onboarding-mature-woman.png';
import onboardingImage3 from '@/assets/onboarding/onboarding-young-man.png';

interface OnboardingScreenProps {
  onGetStarted: () => void;
}

const OnboardingScreen = ({ onGetStarted }: OnboardingScreenProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Connect with Your Neighbors",
      description: "Build meaningful relationships with people in your community. Share experiences, help each other, and create lasting bonds.",
      image: onboardingImage1,
      icon: Users,
      color: "from-blue-500 to-purple-600"
    },
    {
      id: 2,
      title: "Stay Safe Together",
      description: "Share safety alerts, report incidents, and keep your neighborhood secure. Emergency features help you stay connected when it matters most.",
      image: onboardingImage2,
      icon: Shield,
      color: "from-green-500 to-teal-600"
    },
    {
      id: 3,
      title: "Share & Discover",
      description: "Find local services, join community events, and discover what's happening around you. Your neighborhood, connected.",
      image: onboardingImage3,
      icon: MessageSquare,
      color: "from-orange-500 to-red-600"
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="h-screen relative overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-0 flex flex-col"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Full-screen image background */}
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark gradient overlay from top and bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

          {/* Floating header — dots + back/skip over the image */}
          <div className="relative z-10 flex justify-between items-center px-6 pt-12 pb-4">
            <div className="w-16">
              {currentSlide > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevSlide}
                  className="p-2 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 bg-white ${
                    index === currentSlide ? 'w-6 opacity-100' : 'w-2 opacity-40'
                  }`}
                />
              ))}
            </div>

            <div className="w-16 flex justify-end">
              {currentSlide < slides.length - 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onGetStarted}
                  className="text-white/80 text-sm hover:bg-white/20"
                >
                  Skip
                </Button>
              ) : null}
            </div>
          </div>

          {/* Content at the bottom of the screen */}
          <div className="relative z-10 mt-auto">
            <div className="p-8 text-white">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <Badge className="mb-4 bg-white/20 text-white border-white/30">
                  {(() => {
                    const IconComponent = slides[currentSlide].icon;
                    return <IconComponent className="w-4 h-4 mr-2" />;
                  })()}
                  Step {currentSlide + 1} of {slides.length}
                </Badge>

                <h1 className="text-3xl font-bold mb-4 leading-tight">
                  {slides[currentSlide].title}
                </h1>

                <p className="text-lg text-white/90 mb-6 leading-relaxed">
                  {slides[currentSlide].description}
                </p>
              </motion.div>
            </div>

            {/* Bottom actions */}
            <div className="px-6 pb-10">
              {currentSlide === slides.length - 1 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={onGetStarted}
                    size="lg"
                    className="w-full text-base font-medium bg-white text-black hover:bg-white/90"
                  >
                    Get Started
                  </Button>
                  <Button
                    onClick={onGetStarted}
                    variant="outline"
                    size="lg"
                    className="w-full text-base border-white text-white hover:bg-white/20"
                  >
                    I Have an Account
                  </Button>
                </motion.div>
              ) : (
                <Button
                  onClick={nextSlide}
                  size="lg"
                  className="w-full text-base font-medium bg-white text-black hover:bg-white/90"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingScreen;