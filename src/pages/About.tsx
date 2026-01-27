import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Users, MessageCircle, MapPin, Heart, Star, ArrowRight, CheckCircle, ArrowLeft, AlertTriangle, Share2 as Linkedin, Facebook as Twitter, Mail } from '@/lib/icons';
import founderCEO from "@/assets/victor-akinfenwa-ceo.jpeg";
import founderCTO from "@/assets/team/founder-cto.jpg";
import headCommunity from "@/assets/team/head-community.jpg";
import headSafety from "@/assets/team/head-safety.jpg";
const About = () => {
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/neighborlink-logo.png" alt="NeighborLink Logo" className="h-8 w-8 rounded-lg" />
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
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
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
                      {[45, 60, 55, 70, 65, 80, 75, 85].map((height, i) => <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{
                      height: `${height}%`
                    }} />)}
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
            <div className="group animate-fade-in" style={{
            animationDelay: '0.1s'
          }}>
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
            <div className="group animate-fade-in" style={{
            animationDelay: '0.2s'
          }}>
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

      {/* Team Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The passionate individuals dedicated to building safer, more connected communities across Nigeria
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Founder & CEO */}
            <Card className="overflow-hidden hover-scale transition-all duration-300 border-2">
              <div className="aspect-square overflow-hidden bg-muted">
                <img src={founderCEO} alt="Victor Akinfenwa - Founder & CEO" className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-1">Victor 
Akinfenwa</h3>
                <p className="text-sm text-primary font-semibold mb-3">Founder & CEO</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Former tech executive with 15+ years in community development and smart city solutions. Passionate about leveraging technology for social impact.
                </p>
                <div className="flex gap-3">
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Co-Founder & CTO */}
            <Card className="overflow-hidden hover-scale transition-all duration-300 border-2">
              <div className="aspect-square overflow-hidden bg-muted">
                <img src={founderCTO} alt="Dr. Amara Nwosu - Co-Founder & CTO" className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-1">Dr. Amara Nwosu</h3>
                <p className="text-sm text-primary font-semibold mb-3">Co-Founder & CTO</p>
                <p className="text-sm text-muted-foreground mb-4">
                  PhD in Computer Science specializing in distributed systems and real-time communications. Built scalable platforms serving millions of users.
                </p>
                <div className="flex gap-3">
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Head of Community Engagement */}
            <Card className="overflow-hidden hover-scale transition-all duration-300 border-2">
              <div className="aspect-square overflow-hidden bg-muted">
                <img src={headCommunity} alt="Oluwaseun Adeleke - Head of Community" className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-1">Oluwaseun Adeleke</h3>
                <p className="text-sm text-primary font-semibold mb-3">Head of Community</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Community organizer with a decade of grassroots experience. Dedicated to fostering meaningful connections and empowering local leaders.
                </p>
                <div className="flex gap-3">
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Head of Safety & Security */}
            <Card className="overflow-hidden hover-scale transition-all duration-300 border-2">
              <div className="aspect-square overflow-hidden bg-muted">
                <img src={headSafety} alt="Ngozi Okeke - Head of Safety" className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-1">Ngozi Okeke</h3>
                <p className="text-sm text-primary font-semibold mb-3">Head of Safety & Security</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Former law enforcement officer with expertise in community policing and crisis response. Committed to creating safer neighborhoods for all.
                </p>
                <div className="flex gap-3">
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">
              Get answers to common questions about NeighborLink
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">What is NeighborLink?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                NeighborLink is a comprehensive community safety and engagement platform that connects neighbors, enhances security through real-time alerts, and fosters stronger community bonds. Our platform combines safety features, communication tools, and community resources all in one place.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">How does the safety alert system work?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our safety alert system allows community members to instantly report suspicious activities, emergencies, or safety concerns. Alerts are sent in real-time to nearby neighbors and can include location tracking, photos, and detailed descriptions. The system also integrates with local authorities for immediate response when needed.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">Is NeighborLink available in my area?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                NeighborLink is currently available across all 36 Nigerian states and serves over 1,200 communities. Simply download the app and enter your location to see if your neighborhood is active. If not, you can be the first to bring NeighborLink to your community!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">How much does NeighborLink cost?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                NeighborLink offers a free basic plan that includes essential safety features, community messaging, and local alerts. Premium plans are available for enhanced features like advanced analytics, priority support, and extended alert history. We believe everyone deserves access to community safety tools.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">How is my privacy protected?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We take privacy seriously. All data is encrypted end-to-end, and you have complete control over what information you share. Location data is only shared when you choose to send an alert, and you can adjust your privacy settings at any time. We never sell your personal information to third parties.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">Can I use NeighborLink for my community organization?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely! NeighborLink is perfect for community organizations, neighborhood watch groups, and local associations. We offer special features for community leaders including group management tools, event coordination, and community-wide announcements. Contact us to learn more about our organization plans.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">What devices are supported?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                NeighborLink is available on iOS (iPhone and iPad) and Android devices. You can download our app from the App Store or Google Play Store. We also offer a web version accessible from any modern browser for added convenience.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section - App Download */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
            
            <div className="relative z-10 p-6 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Left Column - Phone Mockups */}
                <div className="relative h-[400px] order-2 lg:order-1">
                  {/* Phone 1 - Left */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-48 h-[400px] bg-gray-900 rounded-[2.5rem] border-[10px] border-gray-950 shadow-2xl transform -rotate-12 hover:-rotate-6 transition-transform duration-500">
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-[1.5rem] overflow-hidden">
                      {/* Status bar */}
                      <div className="bg-gray-900 px-3 py-2 flex items-center justify-between text-white text-[9px]">
                        <span>9:41</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-2 bg-white/30 rounded-sm" />
                        </div>
                      </div>
                      
                      {/* Safety Alert Content */}
                      <div className="p-3 space-y-2">
                        <div className="flex items-center gap-2 text-white mb-3">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold">Safety Alerts</span>
                        </div>
                        
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2.5 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3 w-3 text-red-400" />
                            <span className="text-[10px] text-red-400 font-semibold">Active Alert</span>
                          </div>
                          <div className="text-white text-xs font-medium">Suspicious Activity</div>
                          <div className="text-gray-300 text-[9px]">Reported 5 mins ago</div>
                          <div className="text-gray-400 text-[8px]">0.2 miles away</div>
                        </div>

                        <div className="bg-gray-700/50 rounded-lg p-2.5 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3 w-3 text-green-400" />
                            <span className="text-[10px] text-green-400 font-semibold">Community Watch</span>
                          </div>
                          <div className="text-white text-xs">Neighborhood Patrol</div>
                          <div className="text-gray-300 text-[9px]">Active now</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone 2 - Right */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-[400px] bg-gray-900 rounded-[2.5rem] border-[10px] border-gray-950 shadow-2xl transform rotate-6 hover:rotate-3 transition-transform duration-500">
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-white rounded-[1.5rem] overflow-hidden">
                      {/* Status bar */}
                      <div className="bg-white px-3 py-2 flex items-center justify-between text-[9px]">
                        <span>9:41</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-2 bg-gray-300 rounded-sm" />
                        </div>
                      </div>
                      
                      {/* Map View */}
                      <div className="h-full bg-gradient-to-br from-green-50 via-blue-50 to-gray-50 relative p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold">Live Tracking</span>
                        </div>
                        
                        {/* Map area */}
                        <div className="h-40 bg-white/50 rounded-lg relative overflow-hidden mb-2">
                          <div className="absolute top-3 left-3 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <div className="absolute bottom-6 right-5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100">
                            <path d="M 15 85 Q 30 40 50 55 T 85 25" fill="none" stroke="#10b981" strokeWidth="3" />
                          </svg>
                        </div>
                        
                        {/* Tracking Detail Card */}
                        <div className="bg-gray-900 text-white rounded-xl p-2.5 shadow-xl">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="bg-primary text-white text-[8px] px-2 py-0.5 rounded-full">Live</div>
                          </div>
                          <div className="text-[8px] text-gray-400">Tracking</div>
                          <div className="font-mono font-bold text-[10px]">#NK-2024</div>
                          <div className="text-[7px] text-gray-400 mt-0.5">Your neighborhood</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Content */}
                <div className="space-y-5 text-white order-1 lg:order-2">
                  <div className="space-y-3">
                    <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                      Download Our App Now
                    </h2>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Download the NeighborLink app now to experience seamless community safety and engagement at your fingertips.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a href="#" className="inline-flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg hover-scale transition-all duration-300 border border-white/20">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-[9px] opacity-80">Download on the</div>
                        <div className="text-sm font-semibold">App Store</div>
                      </div>
                    </a>

                    <a href="#" className="inline-flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg hover-scale transition-all duration-300 border border-white/20">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-[9px] opacity-80">GET IT ON</div>
                        <div className="text-sm font-semibold">Google Play</div>
                      </div>
                    </a>
                  </div>

                  {/* App Statistics */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">2M+</div>
                      <div className="text-xs text-gray-400 mt-0.5">Downloads</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                        4.8
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">12k</div>
                      <div className="text-xs text-gray-400 mt-0.5">Reviews</div>
                    </div>
                  </div>
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
    </div>;
};
export default About;