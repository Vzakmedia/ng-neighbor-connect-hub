import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { 
  ArrowLeft, 
  FileText, 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Ban, 
  Scale, 
  CreditCard, 
  Globe, 
  Gavel, 
  RefreshCw, 
  Mail,
  ChevronDown,
  Smartphone,
  MessageSquare,
  ShoppingBag,
  Clock,
  Printer,
  UserCheck,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const TermsOfServicePage = () => {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms', icon: CheckCircle },
    { id: 'eligibility', title: '2. Eligibility', icon: UserCheck },
    { id: 'account', title: '3. Account Registration', icon: Users },
    { id: 'services', title: '4. Description of Services', icon: Smartphone },
    { id: 'user-content', title: '5. User Content', icon: MessageSquare },
    { id: 'acceptable-use', title: '6. Acceptable Use Policy', icon: Shield },
    { id: 'prohibited', title: '7. Prohibited Activities', icon: Ban },
    { id: 'marketplace', title: '8. Marketplace Terms', icon: ShoppingBag },
    { id: 'intellectual-property', title: '9. Intellectual Property', icon: Lock },
    { id: 'third-party', title: '10. Third-Party Services', icon: Globe },
    { id: 'disclaimers', title: '11. Disclaimers', icon: AlertTriangle },
    { id: 'limitation', title: '12. Limitation of Liability', icon: Scale },
    { id: 'indemnification', title: '13. Indemnification', icon: Shield },
    { id: 'termination', title: '14. Termination', icon: RefreshCw },
    { id: 'disputes', title: '15. Dispute Resolution', icon: Gavel },
    { id: 'governing-law', title: '16. Governing Law', icon: Scale },
    { id: 'changes', title: '17. Changes to Terms', icon: FileText },
    { id: 'contact', title: '18. Contact Information', icon: Mail },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      if (!openSections.includes(sectionId)) {
        toggleSection(sectionId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/landing" className="flex items-center space-x-2">
            <img 
              src="/neighborlink-logo.png" 
              alt="NeighborLink Logo" 
              className="h-8 w-8 rounded-lg"
            />
            <span className="font-bold text-xl">NeighborLink</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.print()}
              className="hidden sm:flex"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Link to="/landing">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="container px-4 mx-auto max-w-4xl text-center space-y-4">
          <Badge className="w-fit mx-auto" variant="secondary">
            <FileText className="w-3 h-3 mr-1" />
            Legal Documentation
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using NeighborLink. By using our services, you agree to be bound by these terms.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span><strong>Effective Date:</strong> January 27, 2026</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span><strong>Version:</strong> 2.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="container px-4 mx-auto max-w-4xl py-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Key Points Summary
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p>✓ You must be 13+ to use NeighborLink</p>
                <p>✓ You're responsible for your account security</p>
                <p>✓ You retain ownership of content you create</p>
              </div>
              <div className="space-y-2">
                <p>✓ We may moderate content for community safety</p>
                <p>✓ Nigerian law governs these terms</p>
                <p>✓ You can terminate your account anytime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Table of Contents */}
      <section className="container px-4 mx-auto max-w-4xl pb-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors text-left p-2 rounded-md hover:bg-muted/50"
                >
                  <section.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{section.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Main Content */}
      <main className="container px-4 py-12 mx-auto max-w-4xl">
        <div className="space-y-6">
          
          {/* Section 1: Acceptance of Terms */}
          <Collapsible 
            id="acceptance"
            open={openSections.includes('acceptance')}
            onOpenChange={() => toggleSection('acceptance')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">1. Acceptance of Terms</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('acceptance') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <p className="text-muted-foreground">
                    By accessing or using NeighborLink ("the App," "Service," or "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
                  </p>
                  <p className="text-muted-foreground">
                    These Terms constitute a legally binding agreement between you and NeighborLink Nigeria ("Company," "we," "us," or "our") regarding your use of the Service.
                  </p>
                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        By creating an account, downloading the app, or using any part of our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms.
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 2: Eligibility */}
          <Collapsible 
            id="eligibility"
            open={openSections.includes('eligibility')}
            onOpenChange={() => toggleSection('eligibility')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">2. Eligibility</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('eligibility') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <p className="text-muted-foreground">
                    To use NeighborLink, you must meet the following requirements:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Age Requirement:</strong> You must be at least 13 years old. Users under 18 should review these Terms with a parent or guardian.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Legal Capacity:</strong> You must have the legal capacity to enter into a binding agreement.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Location:</strong> You must be a resident of Nigeria or have a legitimate connection to a Nigerian neighborhood.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Not Previously Banned:</strong> You must not have been previously banned from using our Service.</span>
                    </li>
                  </ul>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 3: Account Registration */}
          <Collapsible 
            id="account"
            open={openSections.includes('account')}
            onOpenChange={() => toggleSection('account')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">3. Account Registration</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('account') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Account Creation</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• You must provide accurate, current, and complete registration information</li>
                      <li>• You may only create one account per person</li>
                      <li>• You must verify your email address and/or phone number</li>
                      <li>• You must provide accurate neighborhood/location information</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Account Security</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• You are responsible for maintaining the confidentiality of your password</li>
                      <li>• You must notify us immediately of any unauthorized access</li>
                      <li>• You are responsible for all activities that occur under your account</li>
                      <li>• We recommend enabling two-factor authentication for added security</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Account Information</h3>
                    <p className="text-muted-foreground">
                      You agree to keep your account information updated. We may verify your identity or neighborhood affiliation at any time to maintain community safety and integrity.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 4: Description of Services */}
          <Collapsible 
            id="services"
            open={openSections.includes('services')}
            onOpenChange={() => toggleSection('services')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">4. Description of Services</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('services') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <p className="text-muted-foreground">
                    NeighborLink is a neighborhood networking platform that provides the following services:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Community Features</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Community posts and discussions</li>
                        <li>• Direct messaging between neighbors</li>
                        <li>• Discussion boards and groups</li>
                        <li>• Local events and gatherings</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Safety Features</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Panic Button emergency alerts</li>
                        <li>• Safety notifications</li>
                        <li>• Emergency contact management</li>
                        <li>• Neighborhood safety updates</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Marketplace</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Buy and sell locally</li>
                        <li>• Service provider listings</li>
                        <li>• Business directory</li>
                        <li>• Reviews and ratings</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Communication</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Voice and video calls</li>
                        <li>• Push notifications</li>
                        <li>• Real-time messaging</li>
                        <li>• Media sharing</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We reserve the right to modify, suspend, or discontinue any part of our Service at any time with reasonable notice.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 5: User Content */}
          <Collapsible 
            id="user-content"
            open={openSections.includes('user-content')}
            onOpenChange={() => toggleSection('user-content')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">5. User Content</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('user-content') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Your Content</h3>
                    <p className="text-muted-foreground">
                      "User Content" includes all content you submit, post, or transmit through the Service, including text, photos, videos, messages, and any other materials.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Ownership</h3>
                    <p className="text-muted-foreground">
                      You retain ownership of all User Content you create. However, by posting content on NeighborLink, you grant us a non-exclusive, royalty-free, worldwide license to use, display, reproduce, and distribute your content in connection with operating and promoting the Service.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Content Responsibility</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• You are solely responsible for your User Content</li>
                      <li>• You represent that you have all necessary rights to post your content</li>
                      <li>• You agree your content does not violate any third party's rights</li>
                      <li>• You understand that content may be visible to other community members</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Content Removal</h3>
                    <p className="text-muted-foreground">
                      We reserve the right to remove any User Content that violates these Terms or our Community Guidelines, without prior notice. You may delete your own content at any time through the app.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 6: Acceptable Use Policy */}
          <Collapsible 
            id="acceptable-use"
            open={openSections.includes('acceptable-use')}
            onOpenChange={() => toggleSection('acceptable-use')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">6. Acceptable Use Policy</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('acceptable-use') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Community Engagement</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Use NeighborLink for legitimate community building and networking</li>
                      <li>• Engage respectfully with neighbors and community members</li>
                      <li>• Share helpful information and resources with your community</li>
                      <li>• Participate in discussions constructively and positively</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Safety & Security</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Report genuine safety concerns and emergencies appropriately</li>
                      <li>• Use emergency features (Panic Button) responsibly and only when necessary</li>
                      <li>• Respect the privacy and boundaries of other community members</li>
                      <li>• Comply with local laws and regulations in all interactions</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Content Guidelines</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Share accurate information and avoid spreading misinformation</li>
                      <li>• Respect intellectual property rights and copyright laws</li>
                      <li>• Keep content appropriate for all community members</li>
                      <li>• Use marketplace features for legitimate buying and selling</li>
                    </ul>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 7: Prohibited Activities */}
          <Collapsible 
            id="prohibited"
            open={openSections.includes('prohibited')}
            onOpenChange={() => toggleSection('prohibited')}
          >
            <Card className="border-destructive/30">
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Ban className="w-6 h-6 text-destructive" />
                    <h2 className="text-xl font-bold text-left">7. Prohibited Activities</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('prohibited') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <Card className="bg-destructive/10 border-destructive/20">
                    <CardContent className="p-4">
                      <p className="font-semibold text-destructive">
                        The following activities are strictly prohibited and may result in immediate account termination:
                      </p>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Harmful Behavior</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Harassment, bullying, or threatening behavior</li>
                        <li>• Hate speech or discrimination</li>
                        <li>• Stalking or intimidation</li>
                        <li>• Doxxing or sharing private information</li>
                        <li>• Impersonating others</li>
                        <li>• Trolling or inflammatory behavior</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Illegal Activities</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Selling illegal goods or services</li>
                        <li>• Fraudulent transactions or scams</li>
                        <li>• Money laundering</li>
                        <li>• Copyright infringement or piracy</li>
                        <li>• Human trafficking</li>
                        <li>• Any violation of Nigerian law</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Misuse of Platform</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• False emergency alerts or panic button abuse</li>
                        <li>• Spam or unsolicited advertisements</li>
                        <li>• Creating multiple fake accounts</li>
                        <li>• Automated bots or scripts</li>
                        <li>• Data scraping or harvesting</li>
                        <li>• Circumventing security measures</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Inappropriate Content</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Sexually explicit material</li>
                        <li>• Graphic violence</li>
                        <li>• Content promoting self-harm</li>
                        <li>• Misinformation that endangers safety</li>
                        <li>• Malware or phishing links</li>
                        <li>• Extremist or terrorist content</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 8: Marketplace Terms */}
          <Collapsible 
            id="marketplace"
            open={openSections.includes('marketplace')}
            onOpenChange={() => toggleSection('marketplace')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">8. Marketplace Terms</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('marketplace') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Marketplace Platform</h3>
                    <p className="text-muted-foreground">
                      NeighborLink provides a platform for users to buy, sell, and offer services within their local community. We are not a party to any transactions between users and do not guarantee any transactions.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Seller Responsibilities</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Provide accurate descriptions of items or services</li>
                      <li>• Honor agreed-upon prices and terms</li>
                      <li>• Comply with all applicable laws and regulations</li>
                      <li>• Respond promptly to buyer inquiries</li>
                      <li>• Only sell legal items and services</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Buyer Responsibilities</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Verify items before completing purchases</li>
                      <li>• Meet sellers in safe, public locations</li>
                      <li>• Report suspicious listings or sellers</li>
                      <li>• Complete transactions honestly and fairly</li>
                    </ul>
                  </div>

                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-4">
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        <strong>Disclaimer:</strong> NeighborLink is not responsible for the quality, safety, legality, or availability of items or services listed on the marketplace. All transactions are between users, and buyers should exercise appropriate caution.
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 9: Intellectual Property */}
          <Collapsible 
            id="intellectual-property"
            open={openSections.includes('intellectual-property')}
            onOpenChange={() => toggleSection('intellectual-property')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">9. Intellectual Property</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('intellectual-property') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">NeighborLink Property</h3>
                    <p className="text-muted-foreground">
                      The Service, including its original content, features, functionality, software, design, logos, and trademarks, is owned by NeighborLink Nigeria and is protected by Nigerian and international intellectual property laws.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Limited License</h3>
                    <p className="text-muted-foreground">
                      We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal, non-commercial purposes in accordance with these Terms.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Restrictions</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• You may not copy, modify, or create derivative works of the Service</li>
                      <li>• You may not reverse engineer or decompile any part of the Service</li>
                      <li>• You may not use our trademarks without prior written consent</li>
                      <li>• You may not remove any copyright or proprietary notices</li>
                    </ul>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 10: Third-Party Services */}
          <Collapsible 
            id="third-party"
            open={openSections.includes('third-party')}
            onOpenChange={() => toggleSection('third-party')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">10. Third-Party Services</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('third-party') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <p className="text-muted-foreground">
                    Our Service may contain links to or integrate with third-party websites, applications, or services that are not owned or controlled by NeighborLink. These include:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• <strong>Authentication providers:</strong> Google Sign-In, phone verification services</li>
                    <li>• <strong>Maps and location:</strong> Google Maps for location-based features</li>
                    <li>• <strong>Push notifications:</strong> Apple APNs, Google FCM</li>
                    <li>• <strong>Payment processors:</strong> For marketplace transactions (where applicable)</li>
                  </ul>
                  <p className="text-muted-foreground">
                    We are not responsible for the content, privacy policies, or practices of any third-party services. You access third-party services at your own risk and should review their terms and policies.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 11: Disclaimers */}
          <Collapsible 
            id="disclaimers"
            open={openSections.includes('disclaimers')}
            onOpenChange={() => toggleSection('disclaimers')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">11. Disclaimers</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('disclaimers') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground mb-2">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE"</p>
                      <p>
                        NeighborLink disclaims all warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <p className="text-muted-foreground">We do not warrant that:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• The Service will be uninterrupted, secure, or error-free</li>
                    <li>• The results obtained from using the Service will be accurate or reliable</li>
                    <li>• Any errors in the Service will be corrected</li>
                    <li>• The Service is free of viruses or other harmful components</li>
                  </ul>
                  
                  <p className="text-muted-foreground">
                    <strong>Emergency Services Disclaimer:</strong> While we provide safety features like the Panic Button, NeighborLink is not a substitute for professional emergency services. In case of emergency, always contact local emergency services (police, fire, medical) directly.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 12: Limitation of Liability */}
          <Collapsible 
            id="limitation"
            open={openSections.includes('limitation')}
            onOpenChange={() => toggleSection('limitation')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Scale className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">12. Limitation of Liability</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('limitation') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <p className="text-muted-foreground">
                    To the maximum extent permitted by applicable law:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• NeighborLink shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
                    <li>• Our total liability shall not exceed the amount you paid us (if any) in the 12 months preceding the claim</li>
                    <li>• We are not liable for any loss or damage arising from your use of or inability to use the Service</li>
                    <li>• We are not liable for the conduct of other users, including any harm caused by other users' content or actions</li>
                  </ul>
                  <p className="text-muted-foreground">
                    Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so some of these limitations may not apply to you.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 13: Indemnification */}
          <Collapsible 
            id="indemnification"
            open={openSections.includes('indemnification')}
            onOpenChange={() => toggleSection('indemnification')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">13. Indemnification</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('indemnification') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <p className="text-muted-foreground">
                    You agree to indemnify, defend, and hold harmless NeighborLink Nigeria, its affiliates, officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Your use of or access to the Service</li>
                    <li>• Your violation of these Terms</li>
                    <li>• Your User Content</li>
                    <li>• Your violation of any third party's rights</li>
                    <li>• Your violation of any applicable law or regulation</li>
                  </ul>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 14: Termination */}
          <Collapsible 
            id="termination"
            open={openSections.includes('termination')}
            onOpenChange={() => toggleSection('termination')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">14. Termination</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('termination') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Termination by You</h3>
                    <p className="text-muted-foreground">
                      You may terminate your account at any time by deleting your account through the app settings or by contacting us. Upon termination, your right to use the Service will immediately cease.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Termination by Us</h3>
                    <p className="text-muted-foreground">
                      We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including if you breach these Terms. Reasons for termination may include:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mt-2">
                      <li>• Violation of these Terms or Community Guidelines</li>
                      <li>• Fraudulent or illegal activity</li>
                      <li>• Harmful behavior towards other users</li>
                      <li>• Extended inactivity</li>
                      <li>• Request by law enforcement or government agencies</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Effects of Termination</h3>
                    <p className="text-muted-foreground">
                      Upon termination, your access to the Service will be disabled, and we will delete your personal data in accordance with our Privacy Policy. Certain provisions of these Terms will survive termination.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 15: Dispute Resolution */}
          <Collapsible 
            id="disputes"
            open={openSections.includes('disputes')}
            onOpenChange={() => toggleSection('disputes')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gavel className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">15. Dispute Resolution</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('disputes') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Informal Resolution</h3>
                    <p className="text-muted-foreground">
                      Before filing any legal claim, you agree to try to resolve any dispute informally by contacting us at legal@neighborlink.ng. We will attempt to resolve the dispute within 30 days.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Arbitration</h3>
                    <p className="text-muted-foreground">
                      If informal resolution fails, any dispute arising out of or relating to these Terms or the Service shall be resolved by binding arbitration in Lagos, Nigeria, in accordance with the Arbitration and Conciliation Act of Nigeria.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Class Action Waiver</h3>
                    <p className="text-muted-foreground">
                      You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 16: Governing Law */}
          <Collapsible 
            id="governing-law"
            open={openSections.includes('governing-law')}
            onOpenChange={() => toggleSection('governing-law')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Scale className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">16. Governing Law</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('governing-law') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <p className="text-muted-foreground">
                    These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions.
                  </p>
                  <p className="text-muted-foreground">
                    Any legal action or proceeding arising out of or related to these Terms shall be brought exclusively in the courts of Lagos State, Nigeria, and you consent to the jurisdiction of such courts.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 17: Changes to Terms */}
          <Collapsible 
            id="changes"
            open={openSections.includes('changes')}
            onOpenChange={() => toggleSection('changes')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">17. Changes to Terms</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('changes') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <p className="text-muted-foreground">
                    We reserve the right to modify or replace these Terms at any time. When we make changes:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• We will update the "Effective Date" at the top of this page</li>
                    <li>• For material changes, we will notify you via email or in-app notification at least 30 days before the changes take effect</li>
                    <li>• We may require you to accept the new Terms before continuing to use the Service</li>
                  </ul>
                  <p className="text-muted-foreground">
                    Your continued use of the Service after the effective date of any changes constitutes your acceptance of the new Terms. If you do not agree to the modified Terms, you should stop using the Service and delete your account.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 18: Contact Information */}
          <Card id="contact" className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">18. Contact Information</h2>
              </div>
              
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-background rounded-lg border">
                  <h4 className="font-semibold mb-2">Legal Department</h4>
                  <p className="text-primary">legal@neighborlink.ng</p>
                </div>
                <div className="p-4 bg-background rounded-lg border">
                  <h4 className="font-semibold mb-2">General Support</h4>
                  <p className="text-primary">support@neighborlink.ng</p>
                </div>
              </div>

              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">Mailing Address</h4>
                <p className="text-muted-foreground">
                  Legal Department<br />
                  NeighborLink Nigeria<br />
                  Lagos, Nigeria
                </p>
              </div>

              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">Phone</h4>
                <p className="text-muted-foreground">+234 (0) 800-NEIGHBOR</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container px-4 mx-auto text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            © 2026 NeighborLink. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to="/community-guidelines" className="text-muted-foreground hover:text-primary transition-colors">
              Community Guidelines
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to="/landing" className="text-muted-foreground hover:text-primary transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfServicePage;
