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
  Briefcase,
  Clock,
  TrendingUp,
  Lightbulb,
  Globe,
  Star as Coffee,
  GraduationCap
} from '@/lib/icons';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import teamCollaboration from "@/assets/careers/team-collaboration.jpg";
import officeSpace from "@/assets/careers/office-space.jpg";

const Careers = () => {
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobPostings();
  }, []);

  const fetchJobPostings = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpenPositions(data || []);
    } catch (error) {
      console.error('Error fetching job postings:', error);
    } finally {
      setLoading(false);
    }
  };

  const staticPositions = [
    {
      id: 1,
      title: "Senior React Developer",
      department: "Engineering",
      location: "Lagos, Nigeria",
      type: "Full-time",
      remote: true,
      description: "Join our engineering team to build scalable community safety features using React, TypeScript, and modern web technologies."
    },
    {
      id: 2,
      title: "Community Safety Specialist",
      department: "Operations",
      location: "Abuja, Nigeria",
      type: "Full-time",
      remote: false,
      description: "Work with local communities and emergency services to enhance our safety response protocols and community engagement."
    },
    {
      id: 3,
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
      remote: true,
      description: "Design intuitive user experiences for our community platform, focusing on accessibility and user-centered design principles."
    },
    {
      id: 4,
      title: "Community Manager",
      department: "Community",
      location: "Lagos, Nigeria",
      type: "Full-time",
      remote: true,
      description: "Build and nurture relationships with neighborhood communities, organize events, and drive user engagement across our platform."
    },
    {
      id: 5,
      title: "Backend Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      remote: true,
      description: "Build robust, scalable APIs and microservices to power our community safety platform using Node.js and PostgreSQL."
    },
    {
      id: 6,
      title: "Data Analyst",
      department: "Analytics",
      location: "Lagos, Nigeria",
      type: "Full-time",
      remote: true,
      description: "Analyze community data to drive insights and improve safety outcomes across Nigerian neighborhoods."
    }
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health insurance, mental health support, and wellness programs for you and your family"
    },
    {
      icon: TrendingUp,
      title: "Competitive Salary",
      description: "Industry-leading compensation packages with performance bonuses and equity options"
    },
    {
      icon: GraduationCap,
      title: "Learning & Development",
      description: "Annual learning budget, conference tickets, and access to premium courses and certifications"
    },
    {
      icon: Clock,
      title: "Flexible Schedule",
      description: "Work-life balance with flexible hours, remote options, and generous paid time off"
    },
    {
      icon: Coffee,
      title: "Great Perks",
      description: "Free meals, gym membership, team outings, and modern office spaces in prime locations"
    },
    {
      icon: Globe,
      title: "Remote-First",
      description: "Work from anywhere in Nigeria with home office setup stipend and co-working credits"
    }
  ];

  const values = [
    {
      icon: Shield,
      title: "Community First",
      description: "We put the needs of Nigerian communities at the center of everything we do."
    },
    {
      icon: Users,
      title: "Safety & Trust",
      description: "Building secure, reliable platforms that people can depend on in critical moments."
    },
    {
      icon: Lightbulb,
      title: "Innovation with Purpose",
      description: "Leveraging technology to solve real-world problems and improve lives."
    },
    {
      icon: CheckCircle,
      title: "Inclusive Excellence",
      description: "Creating diverse teams where everyone can thrive and contribute their best work."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/landing" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <img 
                src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" 
                alt="NeighborLink Logo" 
                className="h-8 w-8" 
              />
              <span className="font-bold text-xl">NeighborLink</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/about" className="text-sm hover:text-primary transition-colors">About</Link>
              <Link to="/careers" className="text-sm font-semibold text-primary">Careers</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="w-fit">Join Our Team</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Build the Future of Community Safety
              </h1>
              <p className="text-lg text-muted-foreground">
                Join a passionate team dedicated to creating safer, more connected neighborhoods across Nigeria. Make a real impact while growing your career.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gap-2">
                  View Open Positions
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  Learn About Our Culture
                </Button>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6">
                <div>
                  <div className="text-3xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Team Members</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">5</div>
                  <div className="text-sm text-muted-foreground">Office Locations</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">4.9</div>
                  <div className="text-sm text-muted-foreground">Glassdoor Rating</div>
                </div>
              </div>
            </div>
            
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={teamCollaboration} 
                alt="NeighborLink Team Collaboration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The principles that guide everything we do at NeighborLink
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover-scale transition-all duration-300 border-2">
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Work With Us</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We invest in our team with competitive benefits and a culture of growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover-scale transition-all duration-300">
                <CardContent className="pt-6">
                  <benefit.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Office Image */}
          <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
            <img 
              src={officeSpace} 
              alt="NeighborLink Office Space"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">Modern Workspaces</h3>
                <p className="text-white/90">State-of-the-art offices in Lagos, Abuja, and Port Harcourt</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Open Positions</h2>
            <p className="text-muted-foreground text-lg">
              Find your next role and join our mission
            </p>
          </div>

          <div className="grid gap-6">
            {(openPositions.length > 0 ? openPositions : staticPositions).map((position) => (
              <Card key={position.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{position.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="gap-1">
                            <Briefcase className="h-3 w-3" />
                            {position.department}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {position.location}
                          </Badge>
                          <Badge variant="outline">{position.type}</Badge>
                          {position.remote && <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">Remote OK</Badge>}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{position.description}</p>
                    </div>
                    <Button className="lg:self-start gap-2">
                      Apply Now
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Don't See Your Role */}
          <Card className="mt-8 border-2 border-primary/20">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Don't See Your Role?</h3>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                We're always looking for talented individuals who are passionate about community impact. Send us your resume and let's talk about how you can contribute.
              </p>
              <Button variant="outline" size="lg">
                Send Us Your Resume
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Hiring Process</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A transparent, efficient process designed to find the best mutual fit
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Apply Online",
                description: "Submit your application and resume through our careers portal",
                icon: Users
              },
              {
                step: "02",
                title: "Initial Review",
                description: "Our team reviews your application and experience within 3-5 days",
                icon: CheckCircle
              },
              {
                step: "03",
                title: "Interviews",
                description: "Meet the team through technical and cultural fit interviews",
                icon: MessageCircle
              },
              {
                step: "04",
                title: "Welcome Aboard",
                description: "Receive your offer and join our mission to build safer communities",
                icon: Heart
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                      <item.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{item.step}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                
                {/* Connector Line */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-2">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Questions About Careers?</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Have questions about our roles, culture, or application process? Our team is here to help.
              </p>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-lg">
                  <span className="text-muted-foreground">Email us at:</span>
                  <span className="font-mono font-semibold text-primary">careers@neighborlink.ng</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  We typically respond within 1-2 business days
                </p>
              </div>
            </CardContent>
          </Card>
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

export default Careers;