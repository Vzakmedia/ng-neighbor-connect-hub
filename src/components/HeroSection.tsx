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

const HeroSection = () => {
  const stats = [
    { icon: Users, label: 'Neighbors', value: '2,400+', color: 'text-community-blue' },
    { icon: Shield, label: 'Safety Alerts', value: '15', color: 'text-destructive' },
    { icon: ShoppingBag, label: 'Items Listed', value: '89', color: 'text-community-green' },
    { icon: Calendar, label: 'Upcoming Events', value: '7', color: 'text-community-yellow' },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Background */}
      <div className="relative h-64 md:h-80 lg:h-96">
        <img 
          src={communityHero} 
          alt="Community Connection" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="container">
            <div className="max-w-2xl text-white">
              <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Users className="w-3 h-3 mr-1" />
                Welcome to Victoria Island Community
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Connect with your neighbors, build stronger communities
              </h1>
              <p className="text-lg md:text-xl mb-6 text-white/90">
                Join thousands of neighbors sharing resources, staying safe, and building lasting connections in your community.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Join Your Neighborhood
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container -mt-8 relative z-10 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-gradient-card shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-4 text-center">
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;