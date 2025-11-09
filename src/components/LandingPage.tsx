import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Shield, 
  ShoppingBag, 
  Calendar,
  ArrowRight,
  MessageSquare,
  Star,
  Heart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import communityHero from '@/assets/community-hero.jpg';

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: MessageSquare,
      title: "Groups",
      description: "Connect with neighbors through organized groups for your area."
    },
    {
      icon: Calendar,
      title: "Local Events",
      description: "Discover and organize neighborhood events, meetups, and community gatherings."
    },
    {
      icon: ShoppingBag,
      title: "Marketplace",
      description: "Buy, sell, and trade items safely within your local community."
    },
    {
      icon: Shield,
      title: "Safety Network",
      description: "Stay informed with real-time safety alerts and community watch updates."
    }
  ];

  const slides = [
    {
      title: "Connect with Your Community",
      description: "Join thousands of neighbors building stronger, safer communities across Nigeria.",
      image: communityHero
    },
    {
      title: "Stay Safe Together",
      description: "Real-time safety alerts and community watch programs keep everyone informed.",
      image: communityHero
    },
    {
      title: "Local Marketplace",
      description: "Buy and sell within your neighborhood with trusted community members.",
      image: communityHero
    }
  ];

  const testimonials = [
    {
      name: "Adaora Okafor",
      location: "Victoria Island",
      rating: 5,
      text: "This app has transformed how we connect in our neighborhood. I've made amazing friends and feel so much safer!"
    },
    {
      name: "Kemi Adebayo", 
      location: "Ikoyi",
      rating: 5,
      text: "Love the marketplace feature! Sold my old furniture and found great deals from neighbors."
    },
    {
      name: "Chukwuma Obi",
      location: "Lekki",
      rating: 5,
      text: "The safety alerts have been incredibly helpful. Our community feels more connected than ever."
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Carousel Section */}
      <div className="relative overflow-hidden">
        <div className="relative h-[70vh] md:h-[80vh]">
          <img 
            src={slides[currentSlide].image} 
            alt="Community" 
            className="w-full h-full object-cover transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>
          
          {/* Carousel Controls */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          {/* Hero Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="container">
              <div className="max-w-3xl text-white">
                <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <Users className="w-4 h-4 mr-2" />
                  Welcome to Nigeria's Premier Neighborhood Network
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  {slides[currentSlide].title}
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
                  {slides[currentSlide].description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-4">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Join Your Neighborhood
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need for Community Living</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover powerful features designed to bring your neighborhood together and make community life better.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-card shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Community Says</h2>
            <p className="text-lg text-muted-foreground">Real stories from real neighbors across Nigeria</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold mr-3">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-primary">
        <div className="container text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Connect with Your Community?</h2>
            <p className="text-xl mb-8 text-white/90">
              Join thousands of neighbors already building stronger, safer communities across Nigeria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-4">
                Create Your Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-card border-t">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" 
                  alt="NeighborLink Logo" 
                  className="h-8 w-8 object-contain"
                />
                <span className="font-semibold text-lg text-community-primary">NeighborLink</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Building stronger, safer communities across Nigeria through meaningful neighborhood connections.
              </p>
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Made with love for Nigerian communities</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/about" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="/blog" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="/community-guidelines" className="hover:text-primary transition-colors">Community Guidelines</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 NeighborLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;