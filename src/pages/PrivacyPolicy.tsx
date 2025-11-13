import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Lock, Shield, Eye, Users } from '@/lib/icons';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/landing" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" 
              alt="NeighborLink Logo" 
              className="h-8 w-8"
            />
            <span className="font-bold text-xl">NeighborLink</span>
          </Link>
          
          <Link to="/landing">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Privacy Policy Content */}
      <main className="container px-4 py-12 mx-auto max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge className="w-fit mx-auto">
              <Lock className="w-3 h-3 mr-1" />
              Legal Documentation
            </Badge>
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground">
              How we collect, use, and protect your personal information
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Last updated:</strong> January 2024
            </p>
          </div>

          <Separator />

          {/* Content */}
          <div className="prose prose-gray max-w-none space-y-8">
            <Card className="p-8">
              <CardContent className="space-y-6 p-0">
                <div className="flex items-center space-x-3 mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Information We Collect</h2>
                </div>
                
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="text-lg font-semibold text-foreground">Personal Information You Provide</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• <strong>Account Information:</strong> Name, email address, phone number, profile picture</li>
                    <li>• <strong>Location Data:</strong> State, city, neighborhood (to connect you with local community)</li>
                    <li>• <strong>Profile Details:</strong> Bio, interests, emergency contact information</li>
                    <li>• <strong>Communication:</strong> Messages, posts, comments, and shared content</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground">Automatically Collected Information</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• <strong>Usage Data:</strong> How you interact with our platform and features</li>
                    <li>• <strong>Device Information:</strong> Device type, operating system, browser information</li>
                    <li>• <strong>Log Data:</strong> IP address, access times, pages viewed</li>
                    <li>• <strong>Location Services:</strong> Approximate location for safety and community features (with consent)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8">
              <CardContent className="space-y-6 p-0">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">How We Use Your Information</h2>
                </div>
                
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="text-lg font-semibold text-foreground">Platform Services</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Create and maintain your account and profile</li>
                    <li>• Connect you with neighbors and local community members</li>
                    <li>• Facilitate messaging, posts, and community interactions</li>
                    <li>• Provide marketplace and local services functionality</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground">Safety & Security</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Send emergency alerts and safety notifications</li>
                    <li>• Verify user identity and prevent fraudulent activities</li>
                    <li>• Monitor for suspicious or harmful behavior</li>
                    <li>• Ensure platform security and user safety</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground">Communication & Support</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Send important updates about our services</li>
                    <li>• Respond to your questions and provide customer support</li>
                    <li>• Notify you about new features and community events</li>
                    <li>• Process your requests and transactions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8">
              <CardContent className="space-y-6 p-0">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Data Protection & Security</h2>
                </div>
                
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="text-lg font-semibold text-foreground">Security Measures</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• End-to-end encryption for private messages</li>
                    <li>• Secure data storage with industry-standard protocols</li>
                    <li>• Regular security audits and vulnerability assessments</li>
                    <li>• Multi-factor authentication options</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground">Data Sharing</h3>
                  <p>We do not sell, rent, or share your personal information with third parties except:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• With your explicit consent</li>
                    <li>• To comply with legal obligations</li>
                    <li>• To protect the safety of our users</li>
                    <li>• With trusted service providers under strict agreements</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground">Your Rights</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Access your personal data</li>
                    <li>• Correct inaccurate information</li>
                    <li>• Delete your account and data</li>
                    <li>• Control privacy settings</li>
                    <li>• Opt-out of communications</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 bg-muted/50">
              <CardContent className="space-y-4 p-0">
                <h2 className="text-2xl font-bold">Contact Us About Privacy</h2>
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy or how we handle your data, 
                  please contact our Data Protection Officer:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> privacy@neighborlink.ng</p>
                  <p><strong>Phone:</strong> +234 (0) 800-NEIGHBOR</p>
                  <p><strong>Address:</strong> Data Protection Office, NeighborLink Nigeria</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container px-4 mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 NeighborLink. All rights reserved. | 
            <Link to="/terms" className="hover:text-primary ml-1">Terms of Service</Link> | 
            <Link to="/landing" className="hover:text-primary ml-1">Back to Home</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;