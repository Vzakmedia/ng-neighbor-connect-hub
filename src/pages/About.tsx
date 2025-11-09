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
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Story Text */}
            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl font-bold">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="text-lg leading-relaxed">
                  NeighborLink was born from a simple observation: in an increasingly connected world, 
                  many people don't know their neighbors. This disconnect weakens communities and 
                  makes neighborhoods less safe and resilient.
                </p>
                
                <p className="text-lg leading-relaxed">
                  Founded in Lagos in 2024, we started with a vision to rebuild the social fabric 
                  of Nigerian communities using technology. Our founders, having experienced both 
                  the challenges and the incredible potential of neighborhood communities, 
                  set out to create a platform that makes it easy for neighbors to connect and support each other.
                </p>
              </div>
            </div>

            {/* Right Column - Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-8 text-center border-2 hover-scale transition-all duration-300">
                <div className="text-5xl md:text-6xl font-bold mb-3">2024</div>
                <p className="text-muted-foreground">Founded in Lagos</p>
              </Card>

              <Card className="p-8 text-center border-2 hover-scale transition-all duration-300">
                <div className="text-5xl md:text-6xl font-bold mb-3">50K+</div>
                <p className="text-muted-foreground">Active users</p>
              </Card>

              <Card className="p-8 text-center border-2 hover-scale transition-all duration-300">
                <div className="text-5xl md:text-6xl font-bold mb-3">36</div>
                <p className="text-muted-foreground">Nigerian states</p>
              </Card>

              <Card className="p-8 text-center border-2 hover-scale transition-all duration-300">
                <div className="text-5xl md:text-6xl font-bold mb-3">1.2K+</div>
                <p className="text-muted-foreground">Communities served</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - App Download */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Phone Mockups */}
            <div className="relative h-[500px] hidden lg:block">
              {/* Phone 1 - Left */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-[520px] bg-gray-900 rounded-[3rem] border-[14px] border-gray-950 shadow-2xl transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2.2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-gray-900 px-6 py-2 flex items-center justify-between text-white text-xs">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-3 bg-white/30 rounded-sm" />
                      <div className="w-3 h-3 bg-white/30 rounded-sm" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-white">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="text-sm font-semibold">Safety Dashboard</span>
                    </div>
                    
                    <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                      <div className="text-xs text-gray-400">Active Alerts</div>
                      <div className="text-2xl font-bold text-white">3</div>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-1 bg-gray-700 rounded-full">
                          <div className="w-3/4 h-full bg-primary rounded-full" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Quick Actions</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-primary/20 rounded-lg p-2 text-center">
                          <Users className="h-4 w-4 text-primary mx-auto mb-1" />
                          <div className="text-xs text-white">Community</div>
                        </div>
                        <div className="bg-green-500/20 rounded-lg p-2 text-center">
                          <MapPin className="h-4 w-4 text-green-500 mx-auto mb-1" />
                          <div className="text-xs text-white">Location</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone 2 - Right */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-[520px] bg-gray-900 rounded-[3rem] border-[14px] border-gray-950 shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-white rounded-[2.2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-white px-6 py-2 flex items-center justify-between text-xs">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-3 bg-gray-300 rounded-sm" />
                      <div className="w-3 h-3 bg-gray-300 rounded-sm" />
                    </div>
                  </div>
                  
                  {/* Map View */}
                  <div className="h-full bg-gradient-to-br from-green-100 via-blue-50 to-purple-50 relative">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-20 left-10 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <div className="absolute top-32 right-16 w-3 h-3 bg-primary rounded-full animate-pulse" />
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <path d="M 20 80 Q 40 30 60 50 T 80 30" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
                      </svg>
                    </div>
                    
                    {/* Tracking Detail Card */}
                    <div className="absolute bottom-6 left-4 right-4 bg-gray-900 text-white rounded-2xl p-4 shadow-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="bg-primary/90 text-white text-xs px-3 py-1 rounded-full">Tracking Detail</div>
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-xs text-gray-400 mb-1">Tracking ID</div>
                      <div className="font-mono font-bold">#TKP01-EUFD24C</div>
                      <div className="text-xs text-gray-400 mt-2">Current Location: Victoria Island</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="space-y-8 text-white">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                  Download Our App Now
                </h2>
                <p className="text-lg text-gray-300 max-w-lg">
                  Download the NeighborLink app now to experience seamless community safety and engagement at your fingertips.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <a 
                  href="#" 
                  className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover-scale transition-all duration-300 border border-white/20"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-80">Download on the</div>
                    <div className="text-lg font-semibold">App Store</div>
                  </div>
                </a>

                <a 
                  href="#" 
                  className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover-scale transition-all duration-300 border border-white/20"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-80">GET IT ON</div>
                    <div className="text-lg font-semibold">Google Play</div>
                  </div>
                </a>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold">50K+</div>
                  <div className="text-sm text-gray-400">Downloads</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">4.8</div>
                  <div className="text-sm text-gray-400">Rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">1.2K+</div>
                  <div className="text-sm text-gray-400">Reviews</div>
                </div>
              </div>
            </div>
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