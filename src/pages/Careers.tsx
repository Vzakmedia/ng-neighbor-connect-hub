import { ArrowLeft, MapPin, Clock, Users, Heart, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const Careers = () => {
  const openPositions = [
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
    }
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health insurance, mental health support, and wellness programs"
    },
    {
      icon: Users,
      title: "Team Culture",
      description: "Collaborative environment with diverse, passionate colleagues working toward meaningful impact"
    },
    {
      icon: Briefcase,
      title: "Professional Growth",
      description: "Learning budget, conference attendance, and clear career progression paths"
    },
    {
      icon: Clock,
      title: "Work-Life Balance",
      description: "Flexible working hours, remote work options, and generous time off policies"
    }
  ];

  const values = [
    {
      title: "Community First",
      description: "We put the needs of Nigerian communities at the center of everything we do."
    },
    {
      title: "Safety & Trust",
      description: "Building secure, reliable platforms that people can depend on in critical moments."
    },
    {
      title: "Innovation with Purpose",
      description: "Leveraging technology to solve real-world problems and improve lives."
    },
    {
      title: "Inclusive Excellence",
      description: "Creating diverse teams where everyone can thrive and contribute their best work."
    }
  ];

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

      {/* Main Content */}
      <main className="container px-4 py-12 max-w-6xl mx-auto">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Join Our Mission</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help us build stronger, safer communities across Nigeria. Make a meaningful impact while growing your career.
            </p>
          </div>

          <Separator />

          {/* Company Values */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Open Positions */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Open Positions</h2>
            <div className="grid gap-6">
              {openPositions.map((position) => (
                <Card key={position.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{position.title}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{position.department}</Badge>
                          <Badge variant="outline">{position.type}</Badge>
                          {position.remote && <Badge variant="outline">Remote OK</Badge>}
                        </div>
                      </div>
                      <Button>Apply Now</Button>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-1 h-4 w-4" />
                      {position.location}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{position.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Don't See Your Role?</h3>
                <p className="text-muted-foreground mb-4">
                  We're always looking for talented individuals who are passionate about community impact.
                </p>
                <Button variant="outline">
                  Send Us Your Resume
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Benefits */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Why Work With Us</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <benefit.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Application Process */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Application Process</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: "1",
                  title: "Apply Online",
                  description: "Submit your application through our careers portal"
                },
                {
                  step: "2",
                  title: "Initial Review",
                  description: "Our team reviews your application and experience"
                },
                {
                  step: "3",
                  title: "Interview Process",
                  description: "Technical and cultural fit interviews with our team"
                },
                {
                  step: "4",
                  title: "Welcome Aboard",
                  description: "Join our mission to build stronger communities"
                }
              ].map((item, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto">
                    {item.step}
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Questions About Careers?</h2>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Have questions about our roles, culture, or application process? We'd love to hear from you.
                </p>
                <div className="space-y-2">
                  <p className="text-sm">
                    Email us at: <span className="font-mono">careers@neighborlink.ng</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    We typically respond within 2 business days
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

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