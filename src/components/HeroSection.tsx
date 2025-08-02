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
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96">
        <img 
          src={communityHero} 
          alt="Community Connection" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl text-white">
              <Badge className="mb-3 sm:mb-4 md:mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs sm:text-sm">
                <Users className="w-3 h-3 mr-1" />
                {getCommunityWelcome()}
              </Badge>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 md:mb-4 leading-tight">
                Connect with your neighbors, build stronger communities
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 md:mb-6 text-white/90 leading-relaxed">
                Join thousands of neighbors sharing resources, staying safe, and building lasting connections in your community.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto text-sm sm:text-base">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Join Your Neighborhood
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-white text-primary hover:bg-white/10 hover:text-white w-full sm:w-auto text-sm sm:text-base">
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