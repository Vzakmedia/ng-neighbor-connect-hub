import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  MessageCircle, 
  MapPin, 
  Heart, 
  Star,
  ArrowRight,
  CheckCircle,
  ArrowLeft
} from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" 
                alt="NeighborLink Logo" 
                className="h-8 w-8" 
              />
              <span className="font-bold text-xl">NeighborLink</span>
            </div>
            <Link to="/landing">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            About NeighborLink
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Building Safer, Stronger Communities
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            NeighborLink is Nigeria's leading community safety and engagement platform, 
            connecting neighbors through innovative technology to build stronger, safer communities.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="shadow-lg">
                Join Our Community
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/safety">
              <Button variant="outline" size="lg">
                Explore Safety Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                We believe that strong communities are built on trust, communication, and mutual support. 
                NeighborLink empowers neighborhoods across Nigeria to connect, share resources, and keep each other safe.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Through our comprehensive platform, we're making it easier than ever for neighbors to 
                look out for one another, share local resources, and build lasting relationships.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">50,000+</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">1,200+</div>
                  <div className="text-sm text-muted-foreground">Communities</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Safety First</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced safety features including emergency alerts and panic buttons
                </p>
              </Card>
              <Card className="p-6 text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with neighbors and build lasting relationships
                </p>
              </Card>
              <Card className="p-6 text-center">
                <MessageCircle className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Communication</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time messaging and community discussions
                </p>
              </Card>
              <Card className="p-6 text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Local Focus</h3>
                <p className="text-sm text-muted-foreground">
                  Hyper-local features tailored to Nigerian communities
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at NeighborLink
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center">
              <Heart className="h-12 w-12 text-primary mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">Community First</h3>
              <p className="text-muted-foreground">
                Every decision we make is guided by what's best for our communities. 
                We prioritize user needs and community safety above all else.
              </p>
            </Card>
            
            <Card className="p-8 text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">Privacy & Security</h3>
              <p className="text-muted-foreground">
                We protect your data with bank-level security and give you complete 
                control over your privacy settings and information sharing.
              </p>
            </Card>
            
            <Card className="p-8 text-center">
              <Star className="h-12 w-12 text-primary mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">Innovation</h3>
              <p className="text-muted-foreground">
                We continuously innovate to solve real community challenges and 
                make neighborhood connections more meaningful and effective.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Story</h2>
              <p className="text-lg text-muted-foreground">
                How NeighborLink came to be and where we're going
              </p>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <Card className="p-8">
                <CardContent className="p-0">
                  <p className="text-lg mb-6">
                    NeighborLink was born from a simple observation: in an increasingly connected world, 
                    many people don't know their neighbors. This disconnect weakens communities and 
                    makes neighborhoods less safe and resilient.
                  </p>
                  
                  <p className="text-lg mb-6">
                    Founded in Lagos in 2024, we started with a vision to rebuild the social fabric 
                    of Nigerian communities using technology. Our founders, having experienced both 
                    the challenges and the incredible potential of neighborhood communities, 
                    set out to create a platform that would make it easy for neighbors to connect, 
                    communicate, and support each other.
                  </p>
                  
                  <p className="text-lg mb-8">
                    Today, NeighborLink serves communities across Nigeria, from bustling urban 
                    neighborhoods in Lagos and Abuja to tight-knit communities in smaller cities. 
                    We're proud to be building stronger, safer communities one neighborhood at a time.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-2">Community-Driven Development</h4>
                        <p className="text-muted-foreground">
                          We build features based on real community needs and feedback
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-2">Local Partnerships</h4>
                        <p className="text-muted-foreground">
                          We work with local organizations and authorities to enhance community safety
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-2">Nigerian-First Design</h4>
                        <p className="text-muted-foreground">
                          Built specifically for Nigerian communities and cultural contexts
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-2">Continuous Innovation</h4>
                        <p className="text-muted-foreground">
                          Always improving and adding new features to serve our communities better
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join Your Community?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Become part of a growing network of neighbors who look out for each other. 
            Start building stronger connections in your community today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="shadow-lg">
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/community">
              <Button variant="outline" size="lg">
                Explore Communities
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 NeighborLink. All rights reserved. | 
            <Link to="/privacy" className="ml-1 hover:text-primary transition-colors">Privacy Policy</Link> | 
            <Link to="/terms" className="ml-1 hover:text-primary transition-colors">Terms of Service</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;