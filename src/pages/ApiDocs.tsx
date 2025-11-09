import { useState } from "react";
import { ArrowLeft, Code, Key, Book, ExternalLink, Search, Copy, Check, Shield, Database, MapPin, CreditCard, Bell, AlertTriangle, Zap, Sparkles, Settings, TestTube } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

// Edge Function Type Definition
interface EdgeFunction {
  name: string;
  category: string;
  method: string;
  path: string;
  auth: 'Public' | 'Required' | 'Admin Only';
  description: string;
  icon: any;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  responseExample: string;
  requestExample: string;
}

// Real Supabase Edge Functions Data
const edgeFunctions: EdgeFunction[] = [
  // Authentication & User Management
  {
    name: 'delete-user',
    category: 'Authentication & User Management',
    method: 'POST',
    path: '/functions/v1/delete-user',
    auth: 'Admin Only',
    description: 'Delete a user account and all associated data (profiles, roles)',
    icon: Shield,
    parameters: [
      { name: 'userId', type: 'string', required: true, description: 'UUID of the user to delete' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('delete-user', {
  body: { userId: 'user-uuid-here' }
});`,
    responseExample: `{ "success": true, "message": "User deleted successfully" }`
  },
  {
    name: 'logout-user',
    category: 'Authentication & User Management',
    method: 'POST',
    path: '/functions/v1/logout-user',
    auth: 'Admin Only',
    description: 'Force logout a specific user by invalidating their session',
    icon: Shield,
    parameters: [
      { name: 'userId', type: 'string', required: true, description: 'UUID of the user to logout' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('logout-user', {
  body: { userId: 'user-uuid-here' }
});`,
    responseExample: `{ "success": true, "message": "User logged out successfully" }`
  },
  {
    name: 'restore-user',
    category: 'Authentication & User Management',
    method: 'POST',
    path: '/functions/v1/restore-user',
    auth: 'Admin Only',
    description: 'Restore a previously deleted user account',
    icon: Shield,
    parameters: [
      { name: 'userId', type: 'string', required: true, description: 'UUID of the user to restore' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('restore-user', {
  body: { userId: 'user-uuid-here' }
});`,
    responseExample: `{ "success": true, "message": "User restoration initiated" }`
  },
  {
    name: 'get-deleted-users',
    category: 'Authentication & User Management',
    method: 'GET',
    path: '/functions/v1/get-deleted-users',
    auth: 'Admin Only',
    description: 'Retrieve a list of all deleted users with their metadata',
    icon: Shield,
    parameters: [],
    requestExample: `const { data, error } = await supabase.functions.invoke('get-deleted-users');`,
    responseExample: `{ "users": [{ "id": "uuid", "email": "user@example.com", "deleted_at": "2025-01-01T00:00:00Z" }] }`
  },
  
  // Cloud Storage & Media
  {
    name: 'generate-cloudinary-signature',
    category: 'Cloud Storage & Media',
    method: 'POST',
    path: '/functions/v1/generate-cloudinary-signature',
    auth: 'Required',
    description: 'Generate a secure upload signature for Cloudinary image uploads',
    icon: Database,
    parameters: [
      { name: 'folder', type: 'string', required: false, description: 'Cloudinary folder name for organizing uploads' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('generate-cloudinary-signature', {
  body: { folder: 'profile-pictures' }
});`,
    responseExample: `{ "signature": "abc123...", "timestamp": 1234567890, "api_key": "your-api-key", "folder": "profile-pictures" }`
  },
  {
    name: 'delete-cloudinary-image',
    category: 'Cloud Storage & Media',
    method: 'POST',
    path: '/functions/v1/delete-cloudinary-image',
    auth: 'Required',
    description: 'Delete an image from Cloudinary storage using its public ID',
    icon: Database,
    parameters: [
      { name: 'publicId', type: 'string', required: true, description: 'Cloudinary public ID of the image to delete' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('delete-cloudinary-image', {
  body: { publicId: 'folder/image-name' }
});`,
    responseExample: `{ "success": true, "result": "ok" }`
  },
  
  // Location & Maps
  {
    name: 'nigeria-locations',
    category: 'Location & Maps',
    method: 'POST',
    path: '/functions/v1/nigeria-locations',
    auth: 'Public',
    description: 'Get Nigerian states, cities, and neighborhoods based on query type',
    icon: MapPin,
    parameters: [
      { name: 'type', type: 'string', required: true, description: 'Type: "states", "cities", or "neighborhoods"' },
      { name: 'state', type: 'string', required: false, description: 'State name (required for cities)' },
      { name: 'city', type: 'string', required: false, description: 'City name (required for neighborhoods)' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('nigeria-locations', {
  body: { type: 'states' }
});`,
    responseExample: `{ "locations": ["Lagos", "Abuja", "Rivers", ...] }`
  },
  {
    name: 'nigeria-reverse-geocode',
    category: 'Location & Maps',
    method: 'POST',
    path: '/functions/v1/nigeria-reverse-geocode',
    auth: 'Public',
    description: 'Convert geographic coordinates to Nigerian address (state, city)',
    icon: MapPin,
    parameters: [
      { name: 'latitude', type: 'number', required: true, description: 'Latitude coordinate' },
      { name: 'longitude', type: 'number', required: true, description: 'Longitude coordinate' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('nigeria-reverse-geocode', {
  body: { latitude: 6.5244, longitude: 3.3792 }
});`,
    responseExample: `{ "state": "Lagos", "city": "Ikeja" }`
  },
  {
    name: 'get-google-maps-token',
    category: 'Location & Maps',
    method: 'GET',
    path: '/functions/v1/get-google-maps-token',
    auth: 'Required',
    description: 'Retrieve Google Maps API key for client-side map rendering',
    icon: MapPin,
    parameters: [],
    requestExample: `const { data, error } = await supabase.functions.invoke('get-google-maps-token');`,
    responseExample: `{ "apiKey": "AIza..." }`
  },
  
  // Payments & Commerce
  {
    name: 'create-ad-campaign-payment',
    category: 'Payments & Commerce',
    method: 'POST',
    path: '/functions/v1/create-ad-campaign-payment',
    auth: 'Required',
    description: 'Create a Stripe checkout session for ad campaign payment',
    icon: CreditCard,
    parameters: [
      { name: 'campaignId', type: 'string', required: true, description: 'Ad campaign UUID' },
      { name: 'amount', type: 'number', required: true, description: 'Payment amount in cents' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('create-ad-campaign-payment', {
  body: { campaignId: 'campaign-uuid', amount: 5000 }
});`,
    responseExample: `{ "sessionId": "cs_test_...", "url": "https://checkout.stripe.com/..." }`
  },
  {
    name: 'stripe-webhook',
    category: 'Payments & Commerce',
    method: 'POST',
    path: '/functions/v1/stripe-webhook',
    auth: 'Public',
    description: 'Handle Stripe payment webhooks for payment confirmation',
    icon: CreditCard,
    parameters: [],
    requestExample: `// This endpoint is called by Stripe automatically`,
    responseExample: `{ "received": true }`
  },
  {
    name: 'ad-payment-webhook',
    category: 'Payments & Commerce',
    method: 'POST',
    path: '/functions/v1/ad-payment-webhook',
    auth: 'Public',
    description: 'Process ad campaign payment webhooks and update campaign status',
    icon: CreditCard,
    parameters: [],
    requestExample: `// This endpoint is called by payment provider automatically`,
    responseExample: `{ "received": true }`
  },
  
  // Notifications & Communications
  {
    name: 'send-push-notification',
    category: 'Notifications & Communications',
    method: 'POST',
    path: '/functions/v1/send-push-notification',
    auth: 'Required',
    description: 'Send push notifications to mobile devices',
    icon: Bell,
    parameters: [
      { name: 'userId', type: 'string', required: true, description: 'Recipient user UUID' },
      { name: 'title', type: 'string', required: true, description: 'Notification title' },
      { name: 'body', type: 'string', required: true, description: 'Notification message body' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: { userId: 'user-uuid', title: 'New Message', body: 'You have a new message' }
});`,
    responseExample: `{ "success": true, "messageId": "msg-123" }`
  },
  {
    name: 'send-sms-notification',
    category: 'Notifications & Communications',
    method: 'POST',
    path: '/functions/v1/send-sms-notification',
    auth: 'Required',
    description: 'Send SMS notifications via Twilio',
    icon: Bell,
    parameters: [
      { name: 'to', type: 'string', required: true, description: 'Phone number (E.164 format)' },
      { name: 'body', type: 'string', required: true, description: 'SMS message body' },
      { name: 'userId', type: 'string', required: false, description: 'User UUID for logging' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('send-sms-notification', {
  body: { to: '+2348012345678', body: 'Your verification code is 123456' }
});`,
    responseExample: `{ "success": true, "sid": "SM..." }`
  },
  {
    name: 'send-email-notification',
    category: 'Notifications & Communications',
    method: 'POST',
    path: '/functions/v1/send-email-notification',
    auth: 'Required',
    description: 'Send email notifications to users',
    icon: Bell,
    parameters: [
      { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
      { name: 'subject', type: 'string', required: true, description: 'Email subject' },
      { name: 'html', type: 'string', required: true, description: 'HTML email body' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('send-email-notification', {
  body: { to: 'user@example.com', subject: 'Welcome!', html: '<p>Welcome to NeighborLink</p>' }
});`,
    responseExample: `{ "success": true, "messageId": "email-123" }`
  },
  {
    name: 'send-notification-email',
    category: 'Notifications & Communications',
    method: 'POST',
    path: '/functions/v1/send-notification-email',
    auth: 'Required',
    description: 'Send templated notification emails',
    icon: Bell,
    parameters: [
      { name: 'userId', type: 'string', required: true, description: 'Recipient user UUID' },
      { name: 'type', type: 'string', required: true, description: 'Email template type' },
      { name: 'data', type: 'object', required: true, description: 'Template data' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('send-notification-email', {
  body: { userId: 'user-uuid', type: 'welcome', data: { name: 'John' } }
});`,
    responseExample: `{ "success": true }`
  },
  {
    name: 'send-support-email-response',
    category: 'Notifications & Communications',
    method: 'POST',
    path: '/functions/v1/send-support-email-response',
    auth: 'Admin Only',
    description: 'Send email responses to support ticket inquiries',
    icon: Bell,
    parameters: [
      { name: 'ticketId', type: 'string', required: true, description: 'Support ticket UUID' },
      { name: 'response', type: 'string', required: true, description: 'Support response message' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('send-support-email-response', {
  body: { ticketId: 'ticket-uuid', response: 'We have resolved your issue...' }
});`,
    responseExample: `{ "success": true }`
  },
  {
    name: 'notification-delivery',
    category: 'Notifications & Communications',
    method: 'POST',
    path: '/functions/v1/notification-delivery',
    auth: 'Required',
    description: 'Manage notification delivery status and tracking',
    icon: Bell,
    parameters: [
      { name: 'notificationId', type: 'string', required: true, description: 'Notification UUID' },
      { name: 'status', type: 'string', required: true, description: 'Delivery status' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('notification-delivery', {
  body: { notificationId: 'notif-uuid', status: 'delivered' }
});`,
    responseExample: `{ "success": true }`
  },
  
  // Emergency & Safety
  {
    name: 'emergency-alert',
    category: 'Emergency & Safety',
    method: 'POST',
    path: '/functions/v1/emergency-alert',
    auth: 'Required',
    description: 'Create and broadcast emergency alerts to nearby users',
    icon: AlertTriangle,
    parameters: [
      { name: 'type', type: 'string', required: true, description: 'Alert type: "medical", "fire", "crime", etc.' },
      { name: 'location', type: 'object', required: true, description: 'Location coordinates' },
      { name: 'message', type: 'string', required: true, description: 'Alert message' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('emergency-alert', {
  body: { 
    type: 'medical', 
    location: { lat: 6.5244, lng: 3.3792 }, 
    message: 'Medical assistance needed' 
  }
});`,
    responseExample: `{ "success": true, "alertId": "alert-uuid" }`
  },
  {
    name: 'alert-processor',
    category: 'Emergency & Safety',
    method: 'POST',
    path: '/functions/v1/alert-processor',
    auth: 'Required',
    description: 'Process and distribute emergency alerts to relevant users',
    icon: AlertTriangle,
    parameters: [
      { name: 'alertId', type: 'string', required: true, description: 'Alert UUID to process' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('alert-processor', {
  body: { alertId: 'alert-uuid' }
});`,
    responseExample: `{ "success": true, "notifiedUsers": 42 }`
  },
  {
    name: 'update-panic-alert-status',
    category: 'Emergency & Safety',
    method: 'POST',
    path: '/functions/v1/update-panic-alert-status',
    auth: 'Required',
    description: 'Update the status of a panic alert (resolved, active, etc.)',
    icon: AlertTriangle,
    parameters: [
      { name: 'alertId', type: 'string', required: true, description: 'Panic alert UUID' },
      { name: 'status', type: 'string', required: true, description: 'New status' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('update-panic-alert-status', {
  body: { alertId: 'alert-uuid', status: 'resolved' }
});`,
    responseExample: `{ "success": true }`
  },
  {
    name: 'process-escalations',
    category: 'Emergency & Safety',
    method: 'POST',
    path: '/functions/v1/process-escalations',
    auth: 'Required',
    description: 'Handle notification escalations for unacknowledged alerts',
    icon: AlertTriangle,
    parameters: [
      { name: 'alertId', type: 'string', required: true, description: 'Alert UUID to escalate' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('process-escalations', {
  body: { alertId: 'alert-uuid' }
});`,
    responseExample: `{ "success": true, "escalated": true }`
  },
  {
    name: 'emergency-contact-invitation',
    category: 'Emergency & Safety',
    method: 'POST',
    path: '/functions/v1/emergency-contact-invitation',
    auth: 'Required',
    description: 'Send invitations to emergency contacts',
    icon: AlertTriangle,
    parameters: [
      { name: 'contactEmail', type: 'string', required: true, description: 'Contact email address' },
      { name: 'userId', type: 'string', required: true, description: 'User UUID sending invitation' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('emergency-contact-invitation', {
  body: { contactEmail: 'contact@example.com', userId: 'user-uuid' }
});`,
    responseExample: `{ "success": true }`
  },
  
  // Automation & Webhooks
  {
    name: 'automation-processor',
    category: 'Automation & Webhooks',
    method: 'POST',
    path: '/functions/v1/automation-processor',
    auth: 'Required',
    description: 'Process and execute home automation rules and triggers',
    icon: Zap,
    parameters: [
      { name: 'automationId', type: 'string', required: true, description: 'Automation rule UUID' },
      { name: 'trigger', type: 'object', required: true, description: 'Trigger event data' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('automation-processor', {
  body: { automationId: 'auto-uuid', trigger: { type: 'time', value: '08:00' } }
});`,
    responseExample: `{ "success": true, "executed": true }`
  },
  {
    name: 'process-webhook',
    category: 'Automation & Webhooks',
    method: 'POST',
    path: '/functions/v1/process-webhook',
    auth: 'Public',
    description: 'Handle generic webhook events from external services',
    icon: Zap,
    parameters: [
      { name: 'source', type: 'string', required: true, description: 'Webhook source identifier' },
      { name: 'payload', type: 'object', required: true, description: 'Webhook payload data' }
    ],
    requestExample: `// This endpoint is called by external services automatically`,
    responseExample: `{ "received": true }`
  },
  
  // AI & Recommendations
  {
    name: 'generate-feed-recommendations',
    category: 'AI & Recommendations',
    method: 'POST',
    path: '/functions/v1/generate-feed-recommendations',
    auth: 'Required',
    description: 'Generate personalized community feed recommendations using AI',
    icon: Sparkles,
    parameters: [
      { name: 'userId', type: 'string', required: true, description: 'User UUID for personalization' },
      { name: 'limit', type: 'number', required: false, description: 'Number of recommendations' }
    ],
    requestExample: `const { data, error } = await supabase.functions.invoke('generate-feed-recommendations', {
  body: { userId: 'user-uuid', limit: 10 }
});`,
    responseExample: `{ "recommendations": [{ "postId": "post-uuid", "score": 0.95 }] }`
  },
  
  // Integrations & Configuration
  {
    name: 'get-google-calendar-config',
    category: 'Integrations & Configuration',
    method: 'GET',
    path: '/functions/v1/get-google-calendar-config',
    auth: 'Required',
    description: 'Retrieve Google Calendar API configuration and credentials',
    icon: Settings,
    parameters: [],
    requestExample: `const { data, error } = await supabase.functions.invoke('get-google-calendar-config');`,
    responseExample: `{ "apiKey": "AIza...", "clientId": "client-id", "discoveryDocs": [...], "scopes": [...] }`
  },
  
  // Testing & Utilities
  {
    name: 'test-stripe-api',
    category: 'Testing & Utilities',
    method: 'GET',
    path: '/functions/v1/test-stripe-api',
    auth: 'Admin Only',
    description: 'Test Stripe API connectivity and configuration',
    icon: TestTube,
    parameters: [],
    requestExample: `const { data, error } = await supabase.functions.invoke('test-stripe-api');`,
    responseExample: `{ "success": true, "account": { "id": "acct_...", "business_profile": {...} } }`
  },
  {
    name: 'test-mapbox-api',
    category: 'Testing & Utilities',
    method: 'GET',
    path: '/functions/v1/test-mapbox-api',
    auth: 'Admin Only',
    description: 'Test Mapbox API connectivity and configuration',
    icon: TestTube,
    parameters: [],
    requestExample: `const { data, error } = await supabase.functions.invoke('test-mapbox-api');`,
    responseExample: `{ "success": true, "status": "ok" }`
  }
];

const ApiDocs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [authFilter, setAuthFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(edgeFunctions.map(ef => ef.category)))];

  // Filter functions
  const filteredFunctions = edgeFunctions.filter(func => {
    const matchesSearch = func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         func.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || func.category === categoryFilter;
    const matchesAuth = authFilter === 'all' || func.auth === authFilter;
    return matchesSearch && matchesCategory && matchesAuth;
  });

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Get method color
  const getMethodColor = (method: string) => {
    switch(method) {
      case 'GET': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'POST': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'DELETE': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Get auth badge variant
  const getAuthVariant = (auth: string) => {
    switch(auth) {
      case 'Public': return 'secondary';
      case 'Required': return 'default';
      case 'Admin Only': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" 
                alt="NeighborLink Logo" 
                className="h-8 w-8" 
              />
              <span className="font-bold text-xl">NeighborLink API</span>
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
      <main className="container px-4 py-12 max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              NeighborLink API Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Build on top of NeighborLink's community platform with 26 powerful Supabase Edge Functions
            </p>
            <div className="flex gap-4 justify-center items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>All systems operational</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span>Base URL: https://cowiviqhrnmhttugozbz.supabase.co</span>
            </div>
          </div>

          <Separator />

          {/* Quick Start */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Quick Start</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    1. Authenticate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use Supabase Auth to get a JWT token for authenticated requests.
                  </p>
                  <div className="bg-muted p-3 rounded-lg text-xs font-mono">
                    const &#123; data &#125; = await supabase.auth.getSession()
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    2. Make API Call
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Invoke edge functions using the Supabase client.
                  </p>
                  <div className="bg-muted p-3 rounded-lg text-xs font-mono">
                    supabase.functions.invoke('function-name')
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5 text-primary" />
                    3. Handle Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Process the response data and handle errors appropriately.
                  </p>
                  <div className="bg-muted p-3 rounded-lg text-xs font-mono">
                    if (error) &#123; /* handle */ &#125;
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* API Overview Tabs */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">API Reference</h2>
            <Tabs defaultValue="endpoints" className="w-full">
              <TabsList className="flex mb-4 flex-wrap">
                <TabsTrigger value="endpoints">Endpoints ({edgeFunctions.length})</TabsTrigger>
                <TabsTrigger value="authentication">Authentication</TabsTrigger>
                <TabsTrigger value="examples">Code Examples</TabsTrigger>
                <TabsTrigger value="errors">Error Handling</TabsTrigger>
                <TabsTrigger value="sdks">Supabase Client</TabsTrigger>
              </TabsList>

              {/* Endpoints Tab */}
              <TabsContent value="endpoints" className="space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search endpoints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[280px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={authFilter} onValueChange={setAuthFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Filter by auth" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Auth Types</SelectItem>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Required">Auth Required</SelectItem>
                      <SelectItem value="Admin Only">Admin Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-sm text-muted-foreground">
                  Showing {filteredFunctions.length} of {edgeFunctions.length} endpoints
                </div>

                {/* Endpoints List */}
                <div className="space-y-3">
                  {filteredFunctions.map((func) => {
                    const Icon = func.icon;
                    const isExpanded = expandedEndpoint === func.name;
                    
                    return (
                      <Collapsible 
                        key={func.name}
                        open={isExpanded}
                        onOpenChange={(open) => setExpandedEndpoint(open ? func.name : null)}
                      >
                        <Card className="hover:border-primary/50 transition-colors">
                          <CollapsibleTrigger className="w-full">
                            <CardHeader className="cursor-pointer">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                  <Icon className="h-5 w-5 text-primary mt-0.5" />
                                  <div className="text-left space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge className={`${getMethodColor(func.method)} border font-mono`}>
                                        {func.method}
                                      </Badge>
                                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                        {func.path}
                                      </code>
                                    </div>
                                    <CardTitle className="text-lg">{func.name}</CardTitle>
                                    <CardDescription>{func.description}</CardDescription>
                                    <Badge variant={getAuthVariant(func.auth)} className="w-fit">
                                      {func.auth}
                                    </Badge>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  {isExpanded ? 'Hide' : 'Details'}
                                </Button>
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <CardContent className="pt-0 space-y-4">
                              <Separator />
                              
                              {/* Parameters */}
                              {func.parameters.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-3">Parameters</h4>
                                  <div className="space-y-2">
                                    {func.parameters.map((param) => (
                                      <div key={param.name} className="flex items-start gap-3 text-sm border rounded-lg p-3 bg-muted/30">
                                        <code className="font-mono font-medium text-primary">{param.name}</code>
                                        <Badge variant="outline" className="text-xs">{param.type}</Badge>
                                        {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                                        <span className="text-muted-foreground flex-1">{param.description}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Request Example */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold">Request Example</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(func.requestExample, `req-${func.name}`)}
                                  >
                                    {copiedCode === `req-${func.name}` ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                                  <pre className="text-sm"><code>{func.requestExample}</code></pre>
                                </div>
                              </div>

                              {/* Response Example */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold">Response Example</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(func.responseExample, `res-${func.name}`)}
                                  >
                                    {copiedCode === `res-${func.name}` ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                                  <pre className="text-sm"><code>{func.responseExample}</code></pre>
                                </div>
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Authentication Tab */}
              <TabsContent value="authentication" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Supabase JWT Authentication</CardTitle>
                    <CardDescription>
                      NeighborLink uses Supabase's built-in authentication system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Authentication Flow</h4>
                      <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                        <li>User signs in via Supabase Auth (email/password, OAuth, etc.)</li>
                        <li>Supabase generates a JWT access token</li>
                        <li>Include the JWT in the Authorization header for protected endpoints</li>
                        <li>Edge functions validate the JWT automatically</li>
                      </ol>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Getting the JWT Token</h4>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm"><code>{`import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://cowiviqhrnmhttugozbz.supabase.co',
  'your-anon-key'
)

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Get session token
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token`}</code></pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Making Authenticated Requests</h4>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm"><code>{`// Supabase client handles authentication automatically
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* your data */ }
})

// For manual HTTP requests
fetch('https://cowiviqhrnmhttugozbz.supabase.co/functions/v1/function-name', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${session.access_token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* your data */ })
})`}</code></pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Public vs Protected Endpoints</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-3 p-3 border rounded-lg bg-green-500/5">
                          <Badge variant="secondary">Public</Badge>
                          <p className="text-muted-foreground">No authentication required (e.g., nigeria-locations)</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 border rounded-lg bg-blue-500/5">
                          <Badge>Required</Badge>
                          <p className="text-muted-foreground">Valid JWT token required (most endpoints)</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 border rounded-lg bg-red-500/5">
                          <Badge variant="destructive">Admin Only</Badge>
                          <p className="text-muted-foreground">Requires admin role in user_roles table</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">CORS & Security</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• All edge functions support CORS for web applications</li>
                        <li>• JWTs expire after 1 hour by default</li>
                        <li>• Refresh tokens are used for automatic session renewal</li>
                        <li>• Row Level Security (RLS) policies enforce data access</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Examples Tab */}
              <TabsContent value="examples" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Common Integration Examples</CardTitle>
                    <CardDescription>
                      Real-world code examples for common use cases
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Initialize Supabase Client (TypeScript)</h4>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm"><code>{`import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cowiviqhrnmhttugozbz.supabase.co'
const supabaseAnonKey = 'your-anon-key-here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)`}</code></pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Get Nigerian States (JavaScript)</h4>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm"><code>{`const { data, error } = await supabase.functions.invoke('nigeria-locations', {
  body: { type: 'states' }
})

if (error) {
  console.error('Error:', error)
} else {
  console.log('States:', data.locations)
  // Output: ["Lagos", "Abuja", "Rivers", ...]
}`}</code></pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Create Emergency Alert (React)</h4>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm"><code>{`const createEmergencyAlert = async () => {
  const { data, error } = await supabase.functions.invoke('emergency-alert', {
    body: {
      type: 'medical',
      location: { lat: 6.5244, lng: 3.3792 },
      message: 'Medical assistance needed urgently',
      severity: 'high'
    }
  })

  if (error) {
    toast.error('Failed to create alert')
    return
  }

  toast.success('Emergency alert sent!')
  return data.alertId
}`}</code></pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Upload Image with Cloudinary (TypeScript)</h4>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm"><code>{`const uploadImage = async (file: File) => {
  // 1. Get signature
  const { data: signData, error: signError } = 
    await supabase.functions.invoke('generate-cloudinary-signature', {
      body: { folder: 'profile-pictures' }
    })

  if (signError) throw signError

  // 2. Upload to Cloudinary
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', signData.api_key)
  formData.append('timestamp', signData.timestamp)
  formData.append('signature', signData.signature)
  formData.append('folder', signData.folder)

  const response = await fetch(
    'https://api.cloudinary.com/v1_1/your-cloud/image/upload',
    { method: 'POST', body: formData }
  )

  return await response.json()
}`}</code></pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">cURL Example</h4>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm"><code>{`curl -X POST \\
  https://cowiviqhrnmhttugozbz.supabase.co/functions/v1/nigeria-locations \\
  -H 'Content-Type: application/json' \\
  -d '{"type": "states"}'

# With authentication
curl -X POST \\
  https://cowiviqhrnmhttugozbz.supabase.co/functions/v1/emergency-alert \\
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "type": "medical",
    "location": {"lat": 6.5244, "lng": 3.3792},
    "message": "Medical assistance needed"
  }'`}</code></pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Error Handling Tab */}
              <TabsContent value="errors" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Error Handling</CardTitle>
                    <CardDescription>
                      Common error codes and how to handle them
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="border rounded-lg p-4 bg-red-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive" className="font-mono">400</Badge>
                          <h4 className="font-semibold">Bad Request</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Invalid request parameters or missing required fields
                        </p>
                        <div className="bg-muted p-3 rounded text-xs font-mono">
                          &#123; "error": "Missing required field: userId" &#125;
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-orange-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive" className="font-mono">401</Badge>
                          <h4 className="font-semibold">Unauthorized</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Missing or invalid authentication token
                        </p>
                        <div className="bg-muted p-3 rounded text-xs font-mono">
                          &#123; "error": "Authentication required" &#125;
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-yellow-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive" className="font-mono">403</Badge>
                          <h4 className="font-semibold">Forbidden</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Insufficient permissions (e.g., admin-only endpoint)
                        </p>
                        <div className="bg-muted p-3 rounded text-xs font-mono">
                          &#123; "error": "Admin access required" &#125;
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-blue-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="font-mono">404</Badge>
                          <h4 className="font-semibold">Not Found</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Requested resource does not exist
                        </p>
                        <div className="bg-muted p-3 rounded text-xs font-mono">
                          &#123; "error": "Resource not found" &#125;
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-purple-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive" className="font-mono">429</Badge>
                          <h4 className="font-semibold">Too Many Requests</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Rate limit exceeded
                        </p>
                        <div className="bg-muted p-3 rounded text-xs font-mono">
                          &#123; "error": "Rate limit exceeded. Try again later." &#125;
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-red-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive" className="font-mono">500</Badge>
                          <h4 className="font-semibold">Internal Server Error</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Unexpected server error
                        </p>
                        <div className="bg-muted p-3 rounded text-xs font-mono">
                          &#123; "error": "Internal server error" &#125;
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3">Error Handling Best Practices</h4>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm"><code>{`const makeApiCall = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('function-name', {
      body: { /* params */ }
    })

    if (error) {
      // Handle Supabase error
      console.error('API Error:', error)
      
      if (error.message.includes('401')) {
        // Redirect to login
        router.push('/auth')
      } else if (error.message.includes('429')) {
        // Show rate limit message
        toast.error('Too many requests. Please wait.')
      } else {
        // Generic error
        toast.error('Something went wrong')
      }
      return null
    }

    return data
  } catch (err) {
    // Handle network or unexpected errors
    console.error('Unexpected error:', err)
    toast.error('Network error. Please check your connection.')
    return null
  }
}`}</code></pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SDKs Tab */}
              <TabsContent value="sdks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Supabase Client Libraries</CardTitle>
                    <CardDescription>
                      Official Supabase SDKs for different platforms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">JavaScript / TypeScript</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Official Supabase JS client for web, Node.js, and Deno
                        </p>
                        <code className="text-sm bg-muted p-2 rounded block mb-3">
                          npm install @supabase/supabase-js
                        </code>
                        <a 
                          href="https://supabase.com/docs/reference/javascript/introduction" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="w-full">
                            View Documentation
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </a>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Python</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Official Supabase Python client
                        </p>
                        <code className="text-sm bg-muted p-2 rounded block mb-3">
                          pip install supabase
                        </code>
                        <a 
                          href="https://supabase.com/docs/reference/python/introduction" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="w-full">
                            View Documentation
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </a>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Flutter / Dart</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Official Supabase Dart client for Flutter
                        </p>
                        <code className="text-sm bg-muted p-2 rounded block mb-3">
                          supabase_flutter: ^2.0.0
                        </code>
                        <a 
                          href="https://supabase.com/docs/reference/dart/introduction" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="w-full">
                            View Documentation
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </a>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Swift (iOS)</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Official Supabase Swift client for iOS
                        </p>
                        <code className="text-sm bg-muted p-2 rounded block mb-3">
                          .package(url: "https://github.com/supabase/supabase-swift")
                        </code>
                        <a 
                          href="https://supabase.com/docs/reference/swift/introduction" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="w-full">
                            View Documentation
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </a>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Kotlin (Android)</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Official Supabase Kotlin client for Android
                        </p>
                        <code className="text-sm bg-muted p-2 rounded block mb-3">
                          implementation("io.github.jan-tennert.supabase:postgrest-kt")
                        </code>
                        <a 
                          href="https://supabase.com/docs/reference/kotlin/introduction" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="w-full">
                            View Documentation
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </a>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">C# / .NET</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Community Supabase client for C#
                        </p>
                        <code className="text-sm bg-muted p-2 rounded block mb-3">
                          dotnet add package supabase-csharp
                        </code>
                        <a 
                          href="https://supabase.com/docs/reference/csharp/introduction" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="w-full">
                            View Documentation
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3">Environment Variables</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Required environment variables for NeighborLink API:
                      </p>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto space-y-2">
                        <div className="font-mono text-sm">
                          <span className="text-primary">SUPABASE_URL</span>=https://cowiviqhrnmhttugozbz.supabase.co
                        </div>
                        <div className="font-mono text-sm">
                          <span className="text-primary">SUPABASE_ANON_KEY</span>=your-anon-key-here
                        </div>
                        <div className="font-mono text-sm text-muted-foreground">
                          # Optional for server-side operations
                        </div>
                        <div className="font-mono text-sm">
                          <span className="text-primary">SUPABASE_SERVICE_ROLE_KEY</span>=your-service-role-key
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          {/* Developer Resources */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Developer Resources</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Supabase Dashboard</CardTitle>
                  <CardDescription>
                    View logs, monitor usage, and manage your project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a 
                    href="https://supabase.com/dashboard/project/cowiviqhrnmhttugozbz" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="w-full">
                      Open Dashboard
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Edge Function Logs</CardTitle>
                  <CardDescription>
                    Debug and monitor edge function executions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a 
                    href="https://supabase.com/dashboard/project/cowiviqhrnmhttugozbz/functions" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="w-full">
                      View Logs
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Support</CardTitle>
                  <CardDescription>
                    Get help from the NeighborLink team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Email: <span className="font-mono">dev@neighborlink.ng</span>
                  </p>
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link to="/settings">Contact Support</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-12">
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

export default ApiDocs;