import { ArrowLeft, Shield, Users, AlertTriangle, Heart } from '@/lib/icons';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CommunityGuidelines = () => {
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
      <main className="container px-4 py-12 max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Community Guidelines & Security</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Building a safe, respectful, and thriving community for all neighbors
            </p>
          </div>

          <Separator />

          {/* Community Guidelines */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Community Guidelines
                </CardTitle>
                <CardDescription>
                  Our guidelines help create a positive environment for everyone
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Be Respectful and Kind</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Treat all community members with respect and dignity</li>
                    <li>Use inclusive language and avoid discriminatory content</li>
                    <li>Respect privacy and personal boundaries</li>
                    <li>Be patient with neighbors who may need help or have different perspectives</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Keep Content Appropriate</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Share content that's relevant to your neighborhood community</li>
                    <li>Avoid spam, promotional content, or irrelevant advertisements</li>
                    <li>No hate speech, harassment, or threatening behavior</li>
                    <li>Keep discussions constructive and solution-oriented</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Protect Privacy</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Don't share personal information about others without consent</li>
                    <li>Respect private property and personal spaces</li>
                    <li>Use discretion when sharing photos or videos that include others</li>
                    <li>Report privacy violations to moderators immediately</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Emergency Protocol</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Use our panic button feature for immediate emergencies</li>
                    <li>Call local emergency services (199, 112) for life-threatening situations</li>
                    <li>Share safety alerts responsibly and verify information when possible</li>
                    <li>Support neighbors during emergencies and crises</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Security Measures */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security & Safety Measures
                </CardTitle>
                <CardDescription>
                  How we protect our community and your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Data Protection</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>End-to-end encryption for all private messages</li>
                    <li>Secure data storage with regular backups</li>
                    <li>Limited data collection - only what's necessary for platform functionality</li>
                    <li>Regular security audits and vulnerability assessments</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Account Security</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Strong password requirements and two-factor authentication</li>
                    <li>Account verification for enhanced security</li>
                    <li>Regular monitoring for suspicious activity</li>
                    <li>Immediate alerts for unauthorized access attempts</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Community Moderation</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>AI-powered content screening for harmful material</li>
                    <li>Human moderators available 24/7</li>
                    <li>Community reporting system for violations</li>
                    <li>Transparent moderation policies and appeals process</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Emergency Response</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Instant panic button with GPS location sharing</li>
                    <li>Direct integration with local emergency services</li>
                    <li>Community-wide alert system for urgent situations</li>
                    <li>Crisis support and resource coordination</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Enforcement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Enforcement & Consequences
                </CardTitle>
                <CardDescription>
                  What happens when guidelines are violated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Violation Response</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Warning:</strong> First-time minor violations receive a warning</li>
                    <li><strong>Temporary Suspension:</strong> Repeated or moderate violations result in 1-7 day suspensions</li>
                    <li><strong>Permanent Ban:</strong> Severe violations or repeated offenses lead to permanent account removal</li>
                    <li><strong>Legal Action:</strong> Criminal activity is reported to appropriate authorities</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Appeals Process</h3>
                  <p className="text-muted-foreground mb-2">
                    If you believe a moderation action was taken in error, you can appeal within 14 days by contacting our support team with:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Your account information</li>
                    <li>Details of the incident</li>
                    <li>Why you believe the action was incorrect</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Contact Us
                </CardTitle>
                <CardDescription>
                  Get help or report issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Report Violations</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the in-app reporting feature or email: <br />
                      <span className="font-mono">safety@neighborlink.ng</span>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">General Support</h4>
                    <p className="text-sm text-muted-foreground">
                      For questions about guidelines: <br />
                      <span className="font-mono">support@neighborlink.ng</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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

export default CommunityGuidelines;