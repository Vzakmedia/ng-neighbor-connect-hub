import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Shield, 
  ShoppingBag, 
  Calendar,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import communityHero from '@/assets/community-hero.jpg';
import { useProfile } from '@/hooks/useProfile';

const HeroSection = () => {
  const { profile, getLocation } = useProfile();
  
  const getCommunityWelcome = () => {
    if (profile?.neighborhood) {
      return `Welcome to ${profile.neighborhood} Community`;
    }
    if (profile?.city) {
      return `Welcome to ${profile.city} Community`;
    }
    return 'Welcome to Your Community';
  };


  return (
    <div className="relative overflow-hidden hidden sm:block">
      {/* Hero Background */}
      <div className="relative h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96">
        <img 
          src={communityHero} 
          alt="Community Connection" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="container px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
            <div className="max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl text-white">
              <Badge className="mb-3 sm:mb-4 md:mb-5 lg:mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs sm:text-sm md:text-base inline-flex items-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="font-medium">{getCommunityWelcome()}</span>
              </Badge>
              
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 md:mb-5 lg:mb-6 leading-tight sm:leading-tight md:leading-tight">
                Connect with your neighbors, build stronger communities
              </h1>
              
              <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-5 md:mb-6 lg:mb-8 text-white/90 leading-relaxed max-w-lg sm:max-w-xl md:max-w-2xl">
                Join thousands of neighbors sharing resources, staying safe, and building lasting connections in your community.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <MessageSquare className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Join Your Neighborhood
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white/10 hover:text-white hover:border-white/90 w-full sm:w-auto text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 font-semibold backdrop-blur-sm transition-all duration-200"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HeroSection;