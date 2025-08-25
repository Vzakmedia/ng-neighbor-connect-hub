import React, { useState, useEffect } from 'react';
import { detectIOSDevice, safeFeatureDetection } from '@/utils/iosCompatibility';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  MessageSquare, 
  Shield, 
  MapPin, 
  Calendar,
  Store,
  Heart,
  ArrowRight,
  Smartphone,
  Wifi
} from 'lucide-react';

interface IOSSafeLandingProps {
  onGetStarted: () => void;
}

const IOSSafeLanding: React.FC<IOSSafeLandingProps> = ({ onGetStarted }) => {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [supportsMotion, setSupportsMotion] = useState(false);

  useEffect(() => {
    const info = detectIOSDevice();
    setDeviceInfo(info);
    setSupportsMotion(safeFeatureDetection.supportsFramerMotion());
    
    console.log('iOS Safe Landing - Device Info:', info);
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Community Connect',
      description: 'Connect with neighbors in your area and build meaningful relationships'
    },
    {
      icon: MessageSquare,
      title: 'Secure Messaging',
      description: 'Private messaging with voice and video calling capabilities'
    },
    {
      icon: Shield,
      title: 'Safety First',
      description: 'Emergency alerts and safety features to keep your community protected'
    },
    {
      icon: MapPin,
      title: 'Local Discovery',
      description: 'Find local events, services, and businesses in your neighborhood'
    },
    {
      icon: Calendar,
      title: 'Events & Activities',
      description: 'Join community events and organize your own gatherings'
    },
    {
      icon: Store,
      title: 'Marketplace',
      description: 'Buy and sell items with trusted neighbors in your community'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - CSS Only Animation */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        
        <div className="relative container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            {/* iOS Status Badge */}
            {deviceInfo?.isIOS && (
              <div className="flex justify-center mb-6">
                <Badge variant="outline" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  iOS Optimized
                  {!deviceInfo.supportsLocalStorage && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-xs">Private Mode</span>
                    </>
                  )}
                </Badge>
              </div>
            )}

            <div className={`space-y-6 ${supportsMotion ? 'animate-fade-in' : ''}`}>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  NeighborLink
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Connect, communicate, and build stronger communities with your neighbors
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button 
                  size="lg" 
                  onClick={onGetStarted}
                  className="text-lg px-8 py-6 group"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need for community connection
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for modern neighborhoods with safety, privacy, and ease of use in mind
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`h-full transition-all duration-200 hover:shadow-elevated ${
                supportsMotion ? 'hover-scale' : ''
              }`}
            >
              <CardHeader>
                <feature.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold">
              Ready to connect with your community?
            </h3>
            <p className="text-lg text-muted-foreground">
              Join thousands of neighbors already using NeighborLink to build stronger, safer communities
            </p>
            
            {/* iOS Specific Message */}
            {deviceInfo?.isIOS && !deviceInfo.supportsLocalStorage && (
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Wifi className="h-4 w-4" />
                  <span>Private browsing detected - some features may be limited</span>
                </div>
              </div>
            )}

            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="text-lg px-8 py-6"
            >
              Join Your Community
              <Heart className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 NeighborLink. Building communities, one connection at a time.</p>
          {deviceInfo?.isIOS && (
            <p className="mt-2 text-xs">
              Optimized for iOS {deviceInfo.version || 'Safari'} • 
              {deviceInfo.supportsLocalStorage ? ' Full functionality available' : ' Limited by private browsing'}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default IOSSafeLanding;