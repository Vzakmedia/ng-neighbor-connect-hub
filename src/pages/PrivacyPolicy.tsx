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
  Lock, 
  Shield, 
  Eye, 
  Users, 
  Database, 
  Bell, 
  MapPin, 
  Camera, 
  Mic, 
  UserCheck, 
  Trash2, 
  Globe, 
  Cookie, 
  FileText, 
  Mail,
  ChevronDown,
  Smartphone,
  AlertTriangle,
  Clock,
  Scale,
  Printer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const PrivacyPolicyPage = () => {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const sections = [
    { id: 'data-collection', title: '1. Information We Collect', icon: Database },
    { id: 'permissions', title: '2. App Permissions', icon: Smartphone },
    { id: 'data-usage', title: '3. How We Use Your Information', icon: Users },
    { id: 'data-sharing', title: '4. Information Sharing', icon: Globe },
    { id: 'user-rights', title: '5. Your Rights & Controls', icon: UserCheck },
    { id: 'data-security', title: '6. Data Security', icon: Shield },
    { id: 'data-retention', title: '7. Data Retention', icon: Clock },
    { id: 'children-privacy', title: '8. Children\'s Privacy', icon: AlertTriangle },
    { id: 'international', title: '9. International Data Transfers', icon: Globe },
    { id: 'cookies', title: '10. Cookies & Tracking', icon: Cookie },
    { id: 'policy-changes', title: '11. Changes to This Policy', icon: FileText },
    { id: 'contact', title: '12. Contact Us', icon: Mail },
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
            <Lock className="w-3 h-3 mr-1" />
            Legal Documentation
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how NeighborLink collects, uses, and protects your personal information.
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
              <Eye className="w-5 h-5 text-primary" />
              Quick Summary
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p>✓ We collect only data necessary to provide our neighborhood networking services</p>
                <p>✓ Your location data is used exclusively for local community features</p>
                <p>✓ We never sell your personal information to third parties</p>
              </div>
              <div className="space-y-2">
                <p>✓ You can access, export, or delete your data at any time</p>
                <p>✓ We use industry-standard encryption to protect your data</p>
                <p>✓ We comply with Nigerian NDPR and international privacy standards</p>
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
            <div className="grid md:grid-cols-2 gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors text-left p-2 rounded-md hover:bg-muted/50"
                >
                  <section.icon className="w-4 h-4 flex-shrink-0" />
                  {section.title}
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
          
          {/* Section 1: Data Collection */}
          <Collapsible 
            id="data-collection"
            open={openSections.includes('data-collection')}
            onOpenChange={() => toggleSection('data-collection')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">1. Information We Collect</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('data-collection') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Personal Information You Provide</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong>Account Information:</strong> Full name, email address, phone number, password, and profile picture</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong>Profile Information:</strong> Bio, interests, preferences, and emergency contact details</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong>Location Information:</strong> State, city, neighborhood, and physical address (to connect you with your local community)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong>Communication Data:</strong> Messages, posts, comments, and other content you share on the platform</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong>Marketplace Data:</strong> Listings, transaction history, and reviews</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Automatically Collected Information</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong>Device Information:</strong> Device type, operating system, unique device identifiers, and mobile network information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong>Usage Data:</strong> Features used, interaction patterns, timestamps, and session duration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong>Log Data:</strong> IP address, access times, pages viewed, app crashes, and system activity</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong>Location Services:</strong> GPS coordinates and network-based location (only with your explicit consent)</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 2: App Permissions */}
          <Collapsible 
            id="permissions"
            open={openSections.includes('permissions')}
            onOpenChange={() => toggleSection('permissions')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">2. App Permissions</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('permissions') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0">
                  <p className="text-muted-foreground mb-4">
                    NeighborLink requests certain device permissions to provide our services. Here's why we need each permission:
                  </p>
                  <div className="grid gap-4">
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <Camera className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold">Camera</h4>
                        <p className="text-sm text-muted-foreground">Required for: Uploading photos to community posts, setting your profile picture, taking photos for marketplace listings, and sharing visual content with neighbors</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <Mic className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold">Microphone</h4>
                        <p className="text-sm text-muted-foreground">Required for: Voice calls, video calls, and recording audio messages to communicate with neighbors</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold">Location</h4>
                        <p className="text-sm text-muted-foreground">Required for: Connecting you with your neighborhood, showing nearby posts and services, Panic Button emergency features, and providing location-based safety alerts</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold">Contacts (Optional)</h4>
                        <p className="text-sm text-muted-foreground">Optional for: Finding friends who use NeighborLink and setting up emergency contacts. This permission is never required for basic app functionality</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <Bell className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold">Push Notifications</h4>
                        <p className="text-sm text-muted-foreground">Required for: Emergency safety alerts, panic button notifications, direct messages, community updates, and important account notifications</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold">Photos/Media/Files</h4>
                        <p className="text-sm text-muted-foreground">Required for: Uploading images from your gallery to posts, marketplace listings, and profile; downloading and saving shared files</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 3: Data Usage */}
          <Collapsible 
            id="data-usage"
            open={openSections.includes('data-usage')}
            onOpenChange={() => toggleSection('data-usage')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">3. How We Use Your Information</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('data-usage') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Platform Services</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Create and maintain your account and profile</li>
                      <li>• Connect you with neighbors and local community members</li>
                      <li>• Facilitate messaging, posts, and community interactions</li>
                      <li>• Provide marketplace and local services functionality</li>
                      <li>• Enable event creation and RSVP features</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Safety & Security</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Power the Panic Button emergency alert system</li>
                      <li>• Send safety alerts and neighborhood notifications</li>
                      <li>• Verify user identity and prevent fraudulent activities</li>
                      <li>• Monitor for suspicious or harmful behavior</li>
                      <li>• Share location with emergency contacts when triggered</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Communication & Support</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Send important updates about our services</li>
                      <li>• Respond to your questions and provide customer support</li>
                      <li>• Notify you about new features and community events</li>
                      <li>• Process your requests and transactions</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Service Improvement</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Analyze usage patterns to improve features</li>
                      <li>• Develop new services based on user feedback</li>
                      <li>• Conduct research and analytics (using anonymized data)</li>
                      <li>• Fix bugs and optimize performance</li>
                    </ul>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 4: Data Sharing */}
          <Collapsible 
            id="data-sharing"
            open={openSections.includes('data-sharing')}
            onOpenChange={() => toggleSection('data-sharing')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">4. Information Sharing</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('data-sharing') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <Card className="bg-destructive/10 border-destructive/20">
                    <CardContent className="p-4">
                      <p className="font-semibold text-destructive">
                        We do NOT sell your personal information to third parties for advertising or marketing purposes.
                      </p>
                    </CardContent>
                  </Card>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">With Other NeighborLink Users</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Profile information is visible based on your privacy settings</li>
                      <li>• Posts and comments are visible to your community</li>
                      <li>• Marketplace listings are visible to potential buyers</li>
                      <li>• Location may be shared with emergency contacts when you activate Panic Button</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Third-Party Service Providers</h3>
                    <p className="text-muted-foreground mb-3">We work with trusted service providers who help us operate NeighborLink:</p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• <strong>Supabase:</strong> Database storage and user authentication</li>
                      <li>• <strong>Google Maps:</strong> Location services and mapping features</li>
                      <li>• <strong>Apple Push Notification Service (APNs):</strong> iOS push notifications</li>
                      <li>• <strong>Firebase Cloud Messaging (FCM):</strong> Android push notifications</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3">
                      These providers are contractually obligated to protect your data and use it only for the services we've requested.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Legal Requirements</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• When required by law, court order, or legal process</li>
                      <li>• To protect the rights, safety, or property of NeighborLink, our users, or others</li>
                      <li>• In emergency situations involving potential threats to personal safety</li>
                      <li>• To investigate and prevent fraud or security threats</li>
                    </ul>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 5: User Rights */}
          <Collapsible 
            id="user-rights"
            open={openSections.includes('user-rights')}
            onOpenChange={() => toggleSection('user-rights')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">5. Your Rights & Controls</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('user-rights') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <p className="text-muted-foreground">
                    You have the following rights regarding your personal information:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        Right to Access
                      </h4>
                      <p className="text-sm text-muted-foreground">View and download all personal data we hold about you</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Right to Rectification
                      </h4>
                      <p className="text-sm text-muted-foreground">Correct inaccurate or incomplete information</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-primary" />
                        Right to Deletion
                      </h4>
                      <p className="text-sm text-muted-foreground">Delete your account and all associated personal data</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        Right to Portability
                      </h4>
                      <p className="text-sm text-muted-foreground">Export your data in a machine-readable format</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Privacy Controls Available In-App</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• <strong>Profile Visibility:</strong> Control who can see your profile (public, neighbors only, private)</li>
                      <li>• <strong>Location Sharing:</strong> Enable or disable location-based features</li>
                      <li>• <strong>Messaging Preferences:</strong> Control who can send you direct messages</li>
                      <li>• <strong>Notification Settings:</strong> Customize which notifications you receive</li>
                      <li>• <strong>Online Status:</strong> Choose whether to show your online status</li>
                      <li>• <strong>Data Export:</strong> Download a copy of all your data</li>
                      <li>• <strong>Account Deletion:</strong> Permanently delete your account</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">How to Exercise Your Rights</h3>
                    <p className="text-muted-foreground">
                      You can manage most privacy settings directly in the app under Settings &gt; Privacy & Security. 
                      For additional requests or assistance, contact us at <strong>privacy@neighborlink.ng</strong>. 
                      We will respond to your request within 30 days.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 6: Data Security */}
          <Collapsible 
            id="data-security"
            open={openSections.includes('data-security')}
            onOpenChange={() => toggleSection('data-security')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">6. Data Security</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('data-security') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <p className="text-muted-foreground">
                    We implement industry-standard security measures to protect your personal information:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Encryption</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• TLS/SSL encryption for data in transit</li>
                        <li>• AES-256 encryption for data at rest</li>
                        <li>• End-to-end encryption for direct messages</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Authentication</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Secure password hashing (bcrypt)</li>
                        <li>• Multi-factor authentication (MFA) support</li>
                        <li>• Biometric authentication option</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Access Controls</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Role-based access for employees</li>
                        <li>• Audit logging of data access</li>
                        <li>• Regular access reviews</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Monitoring</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 24/7 security monitoring</li>
                        <li>• Intrusion detection systems</li>
                        <li>• Regular security assessments</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Incident Response</h3>
                    <p className="text-muted-foreground">
                      In the event of a data breach, we will notify affected users and relevant authorities within 72 hours 
                      as required by law, and take immediate steps to mitigate any potential harm.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 7: Data Retention */}
          <Collapsible 
            id="data-retention"
            open={openSections.includes('data-retention')}
            onOpenChange={() => toggleSection('data-retention')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">7. Data Retention</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('data-retention') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Active Account</h4>
                        <p className="text-sm text-muted-foreground">We retain your personal data for as long as your account is active and you continue to use our services.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-6 h-6 text-destructive" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Account Deletion</h4>
                        <p className="text-sm text-muted-foreground">When you delete your account, we remove your personal information within 30 days, except for data required for legal compliance or safety purposes.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Scale className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Legal Holds</h4>
                        <p className="text-sm text-muted-foreground">We may retain certain data longer when required by law, legal proceedings, or regulatory requirements.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Database className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Anonymized Data</h4>
                        <p className="text-sm text-muted-foreground">We may retain anonymized, aggregated data that cannot be linked back to you for analytics and service improvement.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 8: Children's Privacy */}
          <Collapsible 
            id="children-privacy"
            open={openSections.includes('children-privacy')}
            onOpenChange={() => toggleSection('children-privacy')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">8. Children's Privacy</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('children-privacy') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-4">
                      <p className="font-semibold text-amber-700 dark:text-amber-400">
                        NeighborLink is not intended for children under the age of 13.
                      </p>
                    </CardContent>
                  </Card>

                  <p className="text-muted-foreground">
                    We do not knowingly collect, use, or disclose personal information from children under 13 years of age. 
                    Our services are designed for adults and teenagers aged 13 and older.
                  </p>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">If We Discover a Child's Data</h3>
                    <p className="text-muted-foreground">
                      If we become aware that we have collected personal information from a child under 13 without 
                      parental consent, we will take steps to delete that information promptly.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Parental Rights</h3>
                    <p className="text-muted-foreground">
                      Parents or guardians who believe their child has provided us with personal information 
                      can contact us at <strong>privacy@neighborlink.ng</strong> to request deletion.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 9: International Transfers */}
          <Collapsible 
            id="international"
            open={openSections.includes('international')}
            onOpenChange={() => toggleSection('international')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">9. International Data Transfers</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('international') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <p className="text-muted-foreground">
                    NeighborLink is based in Nigeria. Your information may be transferred to and processed in 
                    countries other than your own for the purposes described in this policy.
                  </p>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Safeguards</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• We use secure servers with appropriate certifications</li>
                      <li>• Data transfers comply with Nigerian Data Protection Regulation (NDPR)</li>
                      <li>• We implement standard contractual clauses with service providers</li>
                      <li>• Encryption is used for all cross-border data transfers</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Nigerian Data Protection Compliance</h3>
                    <p className="text-muted-foreground">
                      We comply with the Nigeria Data Protection Regulation (NDPR) 2019 and Nigeria Data Protection Act (NDPA) 2023, 
                      which provides guidelines for the collection, storage, and processing of personal data in Nigeria.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 10: Cookies */}
          <Collapsible 
            id="cookies"
            open={openSections.includes('cookies')}
            onOpenChange={() => toggleSection('cookies')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cookie className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">10. Cookies & Tracking Technologies</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('cookies') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <p className="text-muted-foreground">
                    We use minimal cookies and tracking technologies to provide and improve our services:
                  </p>

                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-1">Essential Cookies</h4>
                      <p className="text-sm text-muted-foreground">Required for authentication, security, and basic functionality. Cannot be disabled.</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-1">Session Cookies</h4>
                      <p className="text-sm text-muted-foreground">Temporary cookies that keep you logged in during your session. Deleted when you close the app.</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-1">Analytics (Optional)</h4>
                      <p className="text-sm text-muted-foreground">Help us understand how you use the app to improve features. Can be disabled in settings.</p>
                    </div>
                  </div>

                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-4">
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        We do NOT use third-party advertising cookies or trackers.
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 11: Policy Changes */}
          <Collapsible 
            id="policy-changes"
            open={openSections.includes('policy-changes')}
            onOpenChange={() => toggleSection('policy-changes')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-left">11. Changes to This Policy</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.includes('policy-changes') ? 'rotate-180' : ''}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <p className="text-muted-foreground">
                    We may update this Privacy Policy from time to time to reflect changes in our practices, 
                    technology, legal requirements, or other factors.
                  </p>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">How We Notify You</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• We will post the updated policy on this page with a new effective date</li>
                      <li>• For material changes, we will notify you via email or in-app notification</li>
                      <li>• We may require you to acknowledge significant changes before continuing to use the app</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Your Continued Use</h3>
                    <p className="text-muted-foreground">
                      Your continued use of NeighborLink after the effective date of an updated policy 
                      constitutes your acceptance of the changes. If you do not agree with any changes, 
                      you should stop using our services and delete your account.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Previous Versions</h3>
                    <p className="text-muted-foreground">
                      Prior versions of this Privacy Policy are available upon request by contacting us.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 12: Contact */}
          <Card id="contact" className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">12. Contact Us</h2>
              </div>
              
              <p className="text-muted-foreground">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                please contact our Data Protection Officer:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-background rounded-lg border">
                  <h4 className="font-semibold mb-2">Email</h4>
                  <p className="text-primary">privacy@neighborlink.ng</p>
                </div>
                <div className="p-4 bg-background rounded-lg border">
                  <h4 className="font-semibold mb-2">Phone</h4>
                  <p className="text-muted-foreground">+234 (0) 800-NEIGHBOR</p>
                </div>
              </div>

              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">Mailing Address</h4>
                <p className="text-muted-foreground">
                  Data Protection Officer<br />
                  NeighborLink Nigeria<br />
                  Lagos, Nigeria
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                We aim to respond to all privacy-related inquiries within <strong>30 days</strong>. 
                For urgent matters related to safety or security, we will respond as quickly as possible.
              </p>
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
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
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

export default PrivacyPolicyPage;
