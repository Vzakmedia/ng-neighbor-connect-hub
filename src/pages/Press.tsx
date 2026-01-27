import { ArrowLeft, Calendar, ExternalLink, FileText } from '@/lib/icons';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Press = () => {
  const [pressReleases, setPressReleases] = useState<any[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch press releases
      const { data: pressData, error: pressError } = await supabase
        .from('press_releases')
        .select('*')
        .eq('is_published', true)
        .order('date', { ascending: false });

      if (pressError) throw pressError;
      setPressReleases(pressData || []);

      // Fetch company info
      const { data: companyData, error: companyError } = await supabase
        .from('company_info')
        .select('*');

      if (companyError) throw companyError;
      
      // Convert array to object with section as key
      const infoObject: any = {};
      companyData?.forEach((item: any) => {
        infoObject[item.section] = item;
      });
      setCompanyInfo(infoObject);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const mediaKit = [
    {
      title: "Brand Guidelines",
      description: "Logo usage, colors, and brand standards",
      type: "PDF"
    },
    {
      title: "High-Resolution Logos",
      description: "Vector and raster formats available",
      type: "ZIP"
    },
    {
      title: "Product Screenshots",
      description: "High-quality app and platform images",
      type: "ZIP"
    },
    {
      title: "Company Fact Sheet",
      description: "Key statistics and company information",
      type: "PDF"
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
                src="/neighborlink-logo.png" 
                alt="NeighborLink Logo" 
                className="h-8 w-8 rounded-lg" 
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
            <h1 className="text-4xl font-bold">Press & Media</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Latest news, updates, and resources for media professionals
            </p>
          </div>

          <Separator />

          {/* Press Releases */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Recent Press Releases</h2>
            <div className="grid gap-6">
              {pressReleases.map((release) => (
                <Card key={release.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <Badge variant="secondary">{release.category}</Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-4 w-4" />
                        {release.date}
                      </div>
                    </div>
                    <CardTitle className="text-xl">{release.title}</CardTitle>
                    <CardDescription className="text-base">
                      {release.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Read Full Release
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Company Information */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">{companyInfo.about?.title || 'About NeighborLink'}</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {companyInfo.about?.content || 'NeighborLink is Nigeria\'s leading community safety and engagement platform, connecting neighbors through innovative technology to build stronger, safer communities.'}
                  </p>
                  {companyInfo.mission?.content && (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {companyInfo.mission.content}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Key Statistics */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Key Statistics</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary mb-2">100K+</div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary mb-2">500+</div>
                  <p className="text-sm text-muted-foreground">Communities</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary mb-2">40%</div>
                  <p className="text-sm text-muted-foreground">Faster Emergency Response</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                  <p className="text-sm text-muted-foreground">Community Support</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Media Kit */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Media Kit</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {mediaKit.map((item, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">{item.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <Badge variant="outline">{item.type}</Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Contact Information */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Media Contact</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Press Inquiries</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      Email: <span className="font-mono">press@neighborlink.ng</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Phone: +234 (0) 1 234 5678
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Partnership Inquiries</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      Email: <span className="font-mono">partnerships@neighborlink.ng</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Response time: Within 24 hours
                    </p>
                  </div>
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

export default Press;