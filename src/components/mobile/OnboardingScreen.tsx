import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Users, Shield, MessageSquare } from 'lucide-react';

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
      image: "photo-1544027993-37dbfe43562a", // Community gathering
      icon: Users,
      color: "from-blue-500 to-purple-600"
    },
    {
      id: 2,
      title: "Stay Safe Together",
      description: "Share safety alerts, report incidents, and keep your neighborhood secure. Emergency features help you stay connected when it matters most.",
      image: "photo-1573497620053-ea5300f94f21", // Safety/security
      icon: Shield,
      color: "from-green-500 to-teal-600"
    },
    {
      id: 3,
      title: "Share & Discover",
      description: "Find local services, join community events, and discover what's happening around you. Your neighborhood, connected.",
      image: "photo-1517486808906-6ca8b3f04846", // People sharing/connecting
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="min-h-screen flex flex-col"
        >
          {/* Header with skip */}
          <div className="flex justify-between items-center p-6 z-10">
            <div className="w-16">
              {currentSlide > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={prevSlide}
                  className="p-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-primary w-6' 
                      : 'bg-muted-foreground/30'
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
                  className="text-muted-foreground text-sm"
                >
                  Skip
                </Button>
              ) : null}
            </div>
          </div>

          {/* Image Section */}
          <div className="flex-1 relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].color} opacity-90`} />
            <img 
              src={`https://images.unsplash.com/${slides[currentSlide].image}?auto=format&fit=crop&w=800&q=80`}
              alt={slides[currentSlide].title}
              className="w-full h-full object-cover"
            />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent">
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
                  
                  <p className="text-lg text-white/90 mb-8 leading-relaxed">
                    {slides[currentSlide].description}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-6 bg-background">
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
                  className="w-full text-base font-medium"
                >
                  Get Started
                </Button>
                <Button 
                  onClick={onGetStarted} 
                  variant="outline" 
                  size="lg" 
                  className="w-full text-base"
                >
                  I Have an Account
                </Button>
              </motion.div>
            ) : (
              <Button 
                onClick={nextSlide} 
                size="lg" 
                className="w-full text-base font-medium"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingScreen;