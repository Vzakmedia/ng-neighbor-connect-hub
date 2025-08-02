import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, UserCheck, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfServicePage = () => {
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

      {/* Terms Content */}
      <main className="container px-4 py-12 mx-auto max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge className="w-fit mx-auto">
              <UserCheck className="w-3 h-3 mr-1" />
              Legal Documentation
            </Badge>
            <h1 className="text-4xl font-bold">Terms of Service</h1>
            <p className="text-xl text-muted-foreground">
              Terms and conditions for using the NeighborLink platform
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Effective date:</strong> January 2024
            </p>
          </div>

          <Separator />

          {/* Content */}
          <div className="prose prose-gray max-w-none space-y-8">
            <Card className="p-8">
              <CardContent className="space-y-6 p-0">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold">Acceptable Use</h2>
                </div>
                
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="text-lg font-semibold text-foreground">Community Engagement</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Use NeighborLink for legitimate community building and networking</li>
                    <li>• Engage respectfully with neighbors and community members</li>
                    <li>• Share helpful information and resources with your community</li>
                    <li>• Participate in discussions constructively and positively</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground">Safety & Security</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Report genuine safety concerns and emergencies appropriately</li>
                    <li>• Use emergency features responsibly and only when necessary</li>
                    <li>• Respect the privacy and boundaries of other community members</li>
                    <li>• Comply with local laws and regulations in all interactions</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground">Content Guidelines</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Share accurate information and avoid spreading misinformation</li>
                    <li>• Respect intellectual property rights and copyright laws</li>
                    <li>• Keep content appropriate for all community members</li>
                    <li>• Use marketplace features for legitimate buying and selling</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8">
              <CardContent className="space-y-6 p-0">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">User Responsibilities</h2>
                </div>
                
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="text-lg font-semibold text-foreground">Account Management</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Maintain accurate and up-to-date profile information</li>
                    <li>• Keep your account credentials secure and confidential</li>
                    <li>• Verify your identity when required for safety purposes</li>
                    <li>• Notify us immediately of any unauthorized account access</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground">Community Standards</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Treat all community members with respect and dignity</li>
                    <li>• Report inappropriate behavior or content promptly</li>
                    <li>• Participate in community moderation efforts when appropriate</li>
                    <li>• Follow neighborhood-specific rules and guidelines</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground">Legal Compliance</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Comply with all applicable Nigerian laws and regulations</li>
                    <li>• Respect local ordinances and community regulations</li>
                    <li>• Use services and marketplace features legally and ethically</li>
                    <li>• Report criminal activities to appropriate authorities</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 border-destructive/20 bg-destructive/5">
              <CardContent className="space-y-6 p-0">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                  <h2 className="text-2xl font-bold">Prohibited Activities</h2>
                </div>
                
                <div className="space-y-4 text-muted-foreground">
                  <p className="text-foreground font-medium">
                    The following activities are strictly prohibited on NeighborLink:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Harmful Behavior</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Harassment, bullying, or threatening behavior</li>
                        <li>• Discrimination based on race, religion, gender, etc.</li>
                        <li>• Sharing false emergency alerts or safety information</li>
                        <li>• Doxxing or sharing private information without consent</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Illegal Activities</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Selling illegal goods or services</li>
                        <li>• Fraudulent transactions or scams</li>
                        <li>• Copyright infringement or piracy</li>
                        <li>• Spam, phishing, or malicious content</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8">
              <CardContent className="space-y-6 p-0">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Platform Rules & Enforcement</h2>
                </div>
                
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="text-lg font-semibold text-foreground">Content Moderation</h3>
                  <p>
                    NeighborLink reserves the right to moderate content, remove inappropriate posts, 
                    and take necessary actions to maintain a safe environment for all users. We employ 
                    both automated systems and human moderators to ensure community standards are upheld.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-foreground">Account Actions</h3>
                  <p>
                    Violations of these terms may result in warnings, temporary suspensions, or permanent 
                    account termination, depending on the severity and frequency of violations. We encourage 
                    self-moderation and community-driven safety measures.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-foreground">Appeals Process</h3>
                  <p>
                    If you believe your account was unfairly penalized, you may appeal the decision by 
                    contacting our support team. All appeals are reviewed fairly and promptly by our 
                    moderation team.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 bg-muted/50">
              <CardContent className="space-y-4 p-0">
                <h2 className="text-2xl font-bold">Contact Us About Terms</h2>
                <p className="text-muted-foreground">
                  If you have questions about these Terms of Service or need clarification 
                  about any policies, please contact us:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> legal@neighborlink.ng</p>
                  <p><strong>Phone:</strong> +234 (0) 800-NEIGHBOR</p>
                  <p><strong>Address:</strong> Legal Department, NeighborLink Nigeria</p>
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
            <Link to="/privacy" className="hover:text-primary ml-1">Privacy Policy</Link> | 
            <Link to="/landing" className="hover:text-primary ml-1">Back to Home</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfServicePage;