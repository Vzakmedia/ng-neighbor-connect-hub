import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Shield, 
  MessageSquare, 
  MapPin, 
  Calendar, 
  ShoppingBag,
  Heart,
  Zap,
  CheckCircle,
  Star,
  ArrowRight,
  Phone,
  Mail,
  Globe,
  Lock,
  Eye,
  UserCheck,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import communityHero from '@/assets/community-hero.jpg';

const ModernLandingPage = () => {
  const features = [
    {
      icon: Users,
      title: "Community Connection",
      description: "Connect with neighbors, share experiences, and build lasting relationships in your local community.",
      color: "text-blue-600"
    },
    {
      icon: Shield,
      title: "Safety & Security",
      description: "Share safety alerts, report incidents, and keep your neighborhood secure with emergency features.",
      color: "text-green-600"
    },
    {
      icon: MessageSquare,
      title: "Direct Messaging",
      description: "Secure, private messaging with neighbors including voice calls and video chat capabilities.",
      color: "text-purple-600"
    },
    {
      icon: ShoppingBag,
      title: "Local Marketplace",
      description: "Buy and sell items within your community. Find local goods and services easily.",
      color: "text-orange-600"
    },
    {
      icon: Calendar,
      title: "Community Events",
      description: "Discover, create, and attend local events. Stay connected with what's happening around you.",
      color: "text-red-600"
    },
    {
      icon: MapPin,
      title: "Location-Based Services",
      description: "Find local services, businesses, and resources specific to your neighborhood.",
      color: "text-teal-600"
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Users" },
    { number: "1000+", label: "Communities" },
    { number: "24/7", label: "Support" },
    { number: "99.9%", label: "Uptime" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "Victoria Island, Lagos",
      content: "NeighborLink has transformed how I connect with my community. The safety features give me peace of mind.",
      rating: 5
    },
    {
      name: "Ahmed Ibrahim",
      location: "Wuse II, Abuja",
      content: "Found amazing local services and made great friends through this platform. Highly recommended!",
      rating: 5
    },
    {
      name: "Grace Okafor",
      location: "GRA, Port Harcourt",
      content: "The marketplace feature is fantastic. I've bought and sold items easily within my neighborhood.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" 
              alt="NeighborLink Logo" 
              className="h-8 w-8"
            />
            <span className="font-bold text-xl">NeighborLink</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">About</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</a>
            <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</a>
            <a href="#legal" className="text-sm font-medium hover:text-primary transition-colors">Legal</a>
          </nav>
          
          <div className="flex items-center space-x-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="w-fit">
                  <Zap className="w-3 h-3 mr-1" />
                  Building Stronger Communities
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                  Connect with your{" "}
                  <span className="text-primary">neighbors</span> like never before
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Join thousands of Nigerians building safer, more connected communities. 
                  Share resources, stay safe, and create lasting bonds with your neighbors.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    Join Your Community
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Phone className="mr-2 h-4 w-4" />
                  Download App
                </Button>
              </div>
              
              <div className="flex items-center space-x-8 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-primary">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={communityHero} 
                alt="Community Connection" 
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge className="w-fit mx-auto">Features</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold">Everything you need for community living</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover powerful features designed to bring neighbors together and build stronger communities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${feature.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <Badge className="w-fit">About NeighborLink</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold">
                Bridging communities across Nigeria
              </h2>
              <p className="text-lg text-muted-foreground">
                NeighborLink was born from the vision of creating stronger, safer, and more connected 
                communities across Nigeria. We believe that when neighbors know each other, 
                everyone benefits.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Privacy First</h4>
                    <p className="text-sm text-muted-foreground">Your data is encrypted and never shared without permission.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Community Moderated</h4>
                    <p className="text-sm text-muted-foreground">Built-in moderation tools ensure safe, respectful interactions.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Local Focus</h4>
                    <p className="text-sm text-muted-foreground">Designed specifically for Nigerian communities and culture.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center space-y-2">
                <Users className="w-8 h-8 text-primary mx-auto" />
                <h4 className="font-semibold">50,000+</h4>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </Card>
              <Card className="p-6 text-center space-y-2">
                <MapPin className="w-8 h-8 text-primary mx-auto" />
                <h4 className="font-semibold">1,000+</h4>
                <p className="text-sm text-muted-foreground">Communities</p>
              </Card>
              <Card className="p-6 text-center space-y-2">
                <Shield className="w-8 h-8 text-primary mx-auto" />
                <h4 className="font-semibold">99.9%</h4>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </Card>
              <Card className="p-6 text-center space-y-2">
                <Heart className="w-8 h-8 text-primary mx-auto" />
                <h4 className="font-semibold">24/7</h4>
                <p className="text-sm text-muted-foreground">Support</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Device Compatibility */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 mx-auto text-center">
          <div className="space-y-4 mb-12">
            <Badge className="w-fit mx-auto">Multi-Platform</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold">Available everywhere you are</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Access NeighborLink on any device. Seamless experience across web, mobile, and tablet.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 text-center space-y-4">
              <Smartphone className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Mobile App</h3>
              <p className="text-muted-foreground">Native iOS and Android apps with full feature access</p>
            </Card>
            <Card className="p-8 text-center space-y-4">
              <Monitor className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Web Platform</h3>
              <p className="text-muted-foreground">Full-featured web application accessible from any browser</p>
            </Card>
            <Card className="p-8 text-center space-y-4">
              <Tablet className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Tablet Optimized</h3>
              <p className="text-muted-foreground">Responsive design optimized for tablet interactions</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge className="w-fit mx-auto">Testimonials</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold">Loved by communities nationwide</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our users say about building stronger communities with NeighborLink.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 space-y-4">
                <div className="flex space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold">Ready to connect with your community?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join thousands of Nigerians already building stronger, safer neighborhoods with NeighborLink.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary">
              <Phone className="mr-2 h-4 w-4" />
              Download App
            </Button>
          </div>
        </div>
      </section>

      {/* Legal & Documentation Sections */}
      <section id="legal" className="py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge className="w-fit mx-auto">Legal & Documentation</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold">Transparency & Trust</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We believe in transparency. Read our policies and understand how we protect your privacy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
              <Lock className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-semibold">Privacy Policy</h3>
              <p className="text-sm text-muted-foreground">How we collect, use, and protect your personal information.</p>
              <Button variant="outline" size="sm" className="w-full">Read Policy</Button>
            </Card>
            
            <Card className="p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
              <UserCheck className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-semibold">Terms of Service</h3>
              <p className="text-sm text-muted-foreground">Terms and conditions for using NeighborLink platform.</p>
              <Button variant="outline" size="sm" className="w-full">Read Terms</Button>
            </Card>
            
            <Card className="p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
              <Eye className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-semibold">Community Guidelines</h3>
              <p className="text-sm text-muted-foreground">Rules and guidelines for respectful community interaction.</p>
              <Button variant="outline" size="sm" className="w-full">View Guidelines</Button>
            </Card>
            
            <Card className="p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
              <Shield className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-semibold">Security Measures</h3>
              <p className="text-sm text-muted-foreground">Technical and organizational measures we take to secure data.</p>
              <Button variant="outline" size="sm" className="w-full">Learn More</Button>
            </Card>
          </div>

          {/* Detailed Legal Content */}
          <div className="mt-16 space-y-12">
            {/* Privacy Policy */}
            <div className="bg-background rounded-lg p-8 space-y-6">
              <h3 className="text-2xl font-bold flex items-center">
                <Lock className="w-6 h-6 mr-2 text-primary" />
                Privacy Policy
              </h3>
              <div className="prose prose-gray max-w-none text-muted-foreground space-y-4">
                <p><strong>Last updated:</strong> January 2024</p>
                <h4 className="text-lg font-semibold text-foreground">Information We Collect</h4>
                <ul className="space-y-2">
                  <li>• Personal information you provide (name, email, phone number, location)</li>
                  <li>• Usage data and interaction patterns within the app</li>
                  <li>• Device information and technical data for security purposes</li>
                  <li>• Community posts, messages, and shared content (with your consent)</li>
                </ul>
                
                <h4 className="text-lg font-semibold text-foreground">How We Use Your Information</h4>
                <ul className="space-y-2">
                  <li>• To provide and improve our community platform services</li>
                  <li>• To connect you with neighbors and local community members</li>
                  <li>• To send safety alerts and important community notifications</li>
                  <li>• To prevent fraud and ensure platform security</li>
                </ul>
                
                <h4 className="text-lg font-semibold text-foreground">Data Protection</h4>
                <p>
                  We implement industry-standard encryption and security measures to protect your data. 
                  Your personal information is never sold to third parties, and location data is only 
                  used to connect you with your immediate neighborhood community.
                </p>
              </div>
            </div>

            {/* Terms of Service */}
            <div className="bg-background rounded-lg p-8 space-y-6">
              <h3 className="text-2xl font-bold flex items-center">
                <UserCheck className="w-6 h-6 mr-2 text-primary" />
                Terms of Service
              </h3>
              <div className="prose prose-gray max-w-none text-muted-foreground space-y-4">
                <p><strong>Effective date:</strong> January 2024</p>
                <h4 className="text-lg font-semibold text-foreground">Acceptable Use</h4>
                <ul className="space-y-2">
                  <li>• Use NeighborLink for legitimate community building purposes</li>
                  <li>• Respect other community members and maintain civil discourse</li>
                  <li>• Do not share false information or engage in harmful activities</li>
                  <li>• Comply with local laws and regulations in your interactions</li>
                </ul>
                
                <h4 className="text-lg font-semibold text-foreground">User Responsibilities</h4>
                <ul className="space-y-2">
                  <li>• Maintain accurate profile information and verify your identity</li>
                  <li>• Report suspicious activities or safety concerns promptly</li>
                  <li>• Respect privacy boundaries of other community members</li>
                  <li>• Use marketplace and services features responsibly</li>
                </ul>
                
                <h4 className="text-lg font-semibold text-foreground">Platform Rules</h4>
                <p>
                  NeighborLink reserves the right to moderate content, suspend accounts that violate 
                  community guidelines, and take necessary actions to maintain a safe environment 
                  for all users. We encourage self-moderation and community-driven safety measures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge className="w-fit mx-auto">Contact Us</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold">Get in touch</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions? We're here to help you build stronger communities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="p-6 text-center space-y-4">
              <Mail className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-semibold">Email Support</h3>
              <p className="text-muted-foreground">support@neighborlink.ng</p>
              <p className="text-sm text-muted-foreground">Response within 24 hours</p>
            </Card>
            
            <Card className="p-6 text-center space-y-4">
              <Phone className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-semibold">Phone Support</h3>
              <p className="text-muted-foreground">+234 (0) 800-NEIGHBOR</p>
              <p className="text-sm text-muted-foreground">Mon-Fri, 9AM-6PM WAT</p>
            </Card>
            
            <Card className="p-6 text-center space-y-4">
              <Globe className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-semibold">Online Help</h3>
              <p className="text-muted-foreground">help.neighborlink.ng</p>
              <p className="text-sm text-muted-foreground">24/7 self-service support</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" 
                  alt="NeighborLink Logo" 
                  className="h-6 w-6"
                />
                <span className="font-bold">NeighborLink</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Building stronger, safer communities across Nigeria.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-sm">
                <Link to="/auth" className="block text-muted-foreground hover:text-primary">Web App</Link>
                <a href="#" className="block text-muted-foreground hover:text-primary">Mobile App</a>
                <a href="#" className="block text-muted-foreground hover:text-primary">API Documentation</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <a href="#about" className="block text-muted-foreground hover:text-primary">About Us</a>
                <a href="#contact" className="block text-muted-foreground hover:text-primary">Contact</a>
                <a href="#" className="block text-muted-foreground hover:text-primary">Careers</a>
                <a href="#" className="block text-muted-foreground hover:text-primary">Press</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-sm">
                <a href="#legal" className="block text-muted-foreground hover:text-primary">Privacy Policy</a>
                <a href="#legal" className="block text-muted-foreground hover:text-primary">Terms of Service</a>
                <a href="#legal" className="block text-muted-foreground hover:text-primary">Community Guidelines</a>
                <a href="#legal" className="block text-muted-foreground hover:text-primary">Security</a>
              </div>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2024 NeighborLink. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M19 0H5a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5V5a5 5 0 00-5-5zM8 19H5V8h3v11zM6.5 6.732c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM20 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ModernLandingPage;