import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Mail, 
  Phone, 
  Shield, 
  Users, 
  MapPin, 
  Settings, 
  FileText,
  ArrowLeft,
  ExternalLink
} from "lucide-react";

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: Shield,
      title: "Safety & Security",
      description: "Learn about panic alerts, emergency contacts, and safety features",
      color: "text-red-500",
      link: "#safety"
    },
    {
      icon: Users,
      title: "Account & Profile",
      description: "Manage your account, privacy settings, and profile information",
      color: "text-blue-500",
      link: "#account"
    },
    {
      icon: MapPin,
      title: "Community & Events",
      description: "Join local communities, create events, and connect with neighbors",
      color: "text-green-500",
      link: "#community"
    },
    {
      icon: Settings,
      title: "App Settings",
      description: "Customize notifications, privacy, and app preferences",
      color: "text-purple-500",
      link: "#settings"
    },
  ];

  const faqs = [
    {
      category: "safety",
      question: "How do I send a panic alert?",
      answer: "To send a panic alert, tap the red panic button on the home screen or use the quick action from your device's emergency menu. The alert will be sent to your emergency contacts immediately along with your location."
    },
    {
      category: "safety",
      question: "How do I add emergency contacts?",
      answer: "Go to Settings > Emergency Contacts and tap 'Add Contact'. You can select from your phone contacts or enter details manually. We recommend adding at least 3 trusted contacts."
    },
    {
      category: "safety",
      question: "What happens when I send a panic alert?",
      answer: "When you send a panic alert: 1) Your emergency contacts receive instant notifications, 2) Your real-time location is shared, 3) A record is created in your safety history, 4) Local authorities can be notified (if enabled in settings)."
    },
    {
      category: "account",
      question: "How do I update my profile information?",
      answer: "Go to your profile by tapping the profile icon, then tap 'Edit Profile'. You can update your name, photo, bio, and contact information. Remember to save your changes."
    },
    {
      category: "account",
      question: "How do I change my password?",
      answer: "Navigate to Settings > Account Security > Change Password. You'll need to enter your current password and then your new password twice to confirm."
    },
    {
      category: "account",
      question: "Can I delete my account?",
      answer: "Yes, go to Settings > Account > Delete Account. Please note this action is permanent and will delete all your data including posts, messages, and connections."
    },
    {
      category: "community",
      question: "How do I join a discussion board?",
      answer: "Browse available boards in the Community section. Tap on any board to view details, then tap 'Join Board'. Some boards may require approval from moderators."
    },
    {
      category: "community",
      question: "How do I create an event?",
      answer: "Tap the '+' button on the Events page, fill in event details (title, date, location, description), choose privacy settings, and tap 'Create Event'. You can invite specific people or make it public."
    },
    {
      category: "community",
      question: "How do I report inappropriate content?",
      answer: "Tap the three dots menu on any post or message, select 'Report', choose a reason, and add details if needed. Our moderation team reviews all reports within 24 hours."
    },
    {
      category: "settings",
      question: "How do I manage notification settings?",
      answer: "Go to Settings > Notifications. You can customize notifications for alerts, messages, events, community posts, and more. Toggle each category on/off or set quiet hours."
    },
    {
      category: "settings",
      question: "How do I control my privacy?",
      answer: "Navigate to Settings > Privacy. Here you can control who can see your profile, location sharing preferences, message settings, and visibility in search results."
    },
    {
      category: "settings",
      question: "Is my location data stored?",
      answer: "We only store your location when you send a panic alert or check in at an event. You can view and delete your location history in Settings > Privacy > Location History."
    },
  ];

  const filteredFaqs = faqs.filter(faq =>
    searchQuery === "" ||
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickLinks = [
    { title: "API Documentation", icon: FileText, href: "/api-docs" },
    { title: "Admin Dashboard", icon: Shield, href: "/admin" },
    { title: "Community Guidelines", icon: Users, href: "#guidelines" },
    { title: "Terms of Service", icon: BookOpen, href: "#terms" },
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

      <div className="container py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl font-bold">How can we help you?</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Search our knowledge base or browse categories below
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for help articles, FAQs, guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {categories.map((category, index) => (
            <a key={index} href={category.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3 ${category.color}`}>
                    <category.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>

        {/* FAQs */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              {searchQuery ? `Found ${filteredFaqs.length} results` : 'Browse common questions and answers'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No results found. Try different keywords.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-1">
                          {faq.category}
                        </Badge>
                        <span>{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-20 text-muted-foreground">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Links</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {quickLinks.map((link, index) => (
              <Link key={index} to={link.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <link.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{link.title}</h3>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Still need help?
            </CardTitle>
            <CardDescription>
              Our support team is here to assist you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background">
                <Mail className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Email Support</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Get help via email within 24 hours
                  </p>
                  <a href="mailto:support@neighborlink.com" className="text-sm text-primary hover:underline">
                    support@neighborlink.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-background">
                <Phone className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Phone Support</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Available Mon-Fri, 9AM-6PM
                  </p>
                  <a href="tel:+1234567890" className="text-sm text-primary hover:underline">
                    +1 (234) 567-890
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-background">
                <MessageCircle className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Live Chat</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Chat with our support team
                  </p>
                  <Button variant="link" className="h-auto p-0 text-sm">
                    Start chat
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpCenter;
