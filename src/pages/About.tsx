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
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Building Safer, Stronger Communities
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                NeighborLink is Nigeria's leading community safety and engagement platform, 
                connecting neighbors through innovative technology.
              </p>
              <div className="flex flex-wrap gap-4">
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
              <div className="flex items-center gap-3 pt-4">
                <div className="text-3xl font-bold">4.8</div>
                <div className="flex flex-col">
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">Trusted by communities</div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 shadow-2xl border border-primary/10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-6 w-6 text-primary" />
                      <span className="font-semibold">NeighborLink Dashboard</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Active Users</div>
                      <div className="text-2xl font-bold">50,000+</div>
                      <div className="text-xs text-green-500 flex items-center gap-1 mt-1">
                        <span>↑ 8.4%</span>
                        <span className="text-muted-foreground">vs last month</span>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Communities</div>
                      <div className="text-2xl font-bold">1,200+</div>
                      <div className="text-xs text-green-500 flex items-center gap-1 mt-1">
                        <span>↑ 12%</span>
                        <span className="text-muted-foreground">vs last month</span>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-2">Safety Alerts Response Time</div>
                    <div className="text-3xl font-bold mb-4">2.3 min</div>
                    <div className="h-32 flex items-end justify-between gap-2">
                      {[45, 60, 55, 70, 65, 80, 75, 85].map((height, i) => (
                        <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
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
      <section className="py-20 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary/5 blur-[100px] rounded-full" />
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Our Core Values</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Building safer, stronger communities through innovation, trust, and commitment to our neighbors across Nigeria
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Community First Card */}
            <div className="group animate-fade-in">
              <Card className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl overflow-hidden hover-scale shadow-2xl border-0">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl mb-6 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                  <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 rotate-[-5deg] group-hover:rotate-0 transition-transform duration-300">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-sm">Community Hub</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-primary/10 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground">Members</div>
                          <div className="text-lg font-bold text-primary">1,200+</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground">Active</div>
                          <div className="text-lg font-bold text-green-600">850+</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Heart className="h-3 w-3 text-red-500 fill-current" />
                        <span className="text-muted-foreground">Community engagement</span>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">Community First</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Every decision we make is guided by what's best for our communities. We prioritize user needs and community safety above all else.
                </p>
              </Card>
            </div>

            {/* Privacy & Security Card */}
            <div className="group animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Card className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl overflow-hidden hover-scale shadow-2xl border-0">
                <div className="aspect-[4/3] bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-2xl mb-6 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent" />
                  <div className="relative z-10 bg-gray-900 text-white rounded-2xl shadow-xl p-6 rotate-[5deg] group-hover:rotate-0 transition-transform duration-300">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Shield className="h-6 w-6 text-green-400" />
                        <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Secured</div>
                      </div>
                      <div className="text-sm font-semibold">Privacy Settings</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Data Encryption</span>
                          <div className="w-12 h-2 bg-green-500 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">2FA Enabled</span>
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Location Privacy</span>
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">Privacy & Security</h3>
                <p className="text-sm text-muted-foreground text-center">
                  We protect your data with bank-level security and give you complete control over your privacy settings and information sharing.
                </p>
              </Card>
            </div>

            {/* Innovation Card */}
            <div className="group animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Card className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl overflow-hidden hover-scale shadow-2xl border-0">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-2xl mb-6 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent" />
                  <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 rotate-[-3deg] group-hover:rotate-0 transition-transform duration-300">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-sm">Live Tracking</span>
                      </div>
                      <div className="bg-gray-100 rounded-lg h-24 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-blue-200 opacity-30" />
                        <div className="absolute top-4 left-4 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <div className="absolute bottom-4 right-4">
                          <div className="bg-primary text-white text-xs px-2 py-1 rounded-full">Tracking ID: #TKP01</div>
                        </div>
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                          <path d="M 20 80 Q 30 40 50 50 T 80 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500" />
                        </svg>
                      </div>
                      <div className="text-xs text-muted-foreground">Real-time updates</div>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">Innovation</h3>
                <p className="text-sm text-muted-foreground text-center">
                  We continuously innovate to solve real community challenges and make neighborhood connections more meaningful and effective.
                </p>
              </Card>
            </div>
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