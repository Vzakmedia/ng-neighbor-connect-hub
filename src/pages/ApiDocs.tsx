import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, CheckCircle2, ArrowLeft, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Contact form validation schema
const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  company: z
    .string()
    .trim()
    .min(1, { message: "Company name is required" })
    .max(100, { message: "Company name must be less than 100 characters" }),
  requestType: z.enum(["enterprise", "technical", "partnership", "other"], {
    required_error: "Please select a request type",
  }),
  message: z
    .string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(1000, { message: "Message must be less than 1000 characters" }),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ApiDocs = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const requestType = watch("requestType");

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({
      title: "Copied to clipboard",
      description: "Code snippet has been copied to your clipboard.",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // Insert request into Supabase
      const { data: insertedData, error: insertError } = await supabase
        .from('api_access_requests')
        .insert({
          name: data.name,
          email: data.email,
          company: data.company,
          request_type: data.requestType,
          message: data.message,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      console.log('Request saved to database:', insertedData);
      
      // Send email notification via edge function
      const { error: emailError } = await supabase.functions.invoke(
        'send-api-request-notification',
        {
          body: {
            name: data.name,
            email: data.email,
            company: data.company,
            requestType: data.requestType,
            message: data.message,
            requestId: insertedData.id,
          },
        }
      );
      
      // Don't fail if email fails, request is already saved
      if (emailError) {
        console.error('Email notification failed:', emailError);
      }
      
      toast({
        title: "Request submitted successfully!",
        description: "Our team will review your request and get back to you within 24-48 hours.",
      });
      
      reset();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast({
        title: "Failed to submit request",
        description: "Please try again or contact us directly at api@neighborlink.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/communities",
      description: "Retrieve a list of all communities",
      auth: true,
      params: [
        { name: "page", type: "number", description: "Page number for pagination" },
        { name: "limit", type: "number", description: "Number of results per page" },
        { name: "location", type: "string", description: "Filter by location" },
      ],
    },
    {
      method: "GET",
      path: "/api/v1/communities/:id",
      description: "Get detailed information about a specific community",
      auth: true,
      params: [
        { name: "id", type: "string", description: "Community unique identifier" },
      ],
    },
    {
      method: "POST",
      path: "/api/v1/safety-alerts",
      description: "Create a new safety alert",
      auth: true,
      params: [
        { name: "title", type: "string", description: "Alert title" },
        { name: "description", type: "string", description: "Alert description" },
        { name: "severity", type: "string", description: "Alert severity level (low, medium, high)" },
        { name: "location", type: "object", description: "Location coordinates" },
      ],
    },
    {
      method: "GET",
      path: "/api/v1/events/nearby",
      description: "Get nearby community events",
      auth: true,
      params: [
        { name: "lat", type: "number", description: "Latitude coordinate" },
        { name: "lng", type: "number", description: "Longitude coordinate" },
        { name: "radius", type: "number", description: "Search radius in kilometers" },
      ],
    },
  ];

  const codeExamples = {
    javascript: `// Initialize the API client
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.neighborlink.com';

// Fetch communities
const response = await fetch(\`\${BASE_URL}/v1/communities\`, {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`,
    python: `# Initialize the API client
import requests

API_KEY = 'your_api_key_here'
BASE_URL = 'https://api.neighborlink.com'

# Fetch communities
headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

response = requests.get(f'{BASE_URL}/v1/communities', headers=headers)
data = response.json()
print(data)`,
    curl: `# Fetch communities
curl -X GET 'https://api.neighborlink.com/v1/communities' \\
  -H 'Authorization: Bearer your_api_key_here' \\
  -H 'Content-Type: application/json'`,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/landing">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">API Documentation</h1>
          </div>
          <Button>Get API Key</Button>
        </div>
      </header>

      <div className="container py-12 max-w-6xl">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-4xl font-bold mb-4">NeighborLink API</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Build powerful community-focused applications with our comprehensive RESTful API. 
            Access verified neighborhood data, safety alerts, events, and messaging capabilities.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">RESTful API</Badge>
            <Badge variant="secondary">WebSocket Support</Badge>
            <Badge variant="secondary">JSON Format</Badge>
            <Badge variant="secondary">OAuth 2.0</Badge>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>
                Get started with the NeighborLink API in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Get Your API Key</h4>
                <p className="text-sm text-muted-foreground">
                  Sign up for a developer account and generate your API key from the dashboard.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Make Your First Request</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  All API requests should include your API key in the Authorization header.
                </p>
                <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(codeExamples.curl, 'quickstart')}
                  >
                    {copiedCode === 'quickstart' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                    <code>{codeExamples.curl}</code>
                  </pre>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Handle the Response</h4>
                <p className="text-sm text-muted-foreground">
                  All responses are returned in JSON format with standard HTTP status codes.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Authentication */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-4">Authentication</h3>
          <Card>
            <CardHeader>
              <CardTitle>Bearer Token Authentication</CardTitle>
              <CardDescription>
                Use your API key as a Bearer token in the Authorization header
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4">
                <pre className="text-xs text-green-400 font-mono">
                  <code>Authorization: Bearer your_api_key_here</code>
                </pre>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Note:</strong> Keep your API key secure and never expose it in client-side code. 
                  All API requests should be made from your server.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Code Examples */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-4">Code Examples</h3>
          <Card>
            <CardHeader>
              <CardTitle>Implementation Examples</CardTitle>
              <CardDescription>
                Examples in popular programming languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
                <TabsContent value="javascript">
                  <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(codeExamples.javascript, 'js')}
                    >
                      {copiedCode === 'js' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                      <code>{codeExamples.javascript}</code>
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="python">
                  <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(codeExamples.python, 'py')}
                    >
                      {copiedCode === 'py' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                      <code>{codeExamples.python}</code>
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="curl">
                  <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(codeExamples.curl, 'curl')}
                    >
                      {copiedCode === 'curl' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                      <code>{codeExamples.curl}</code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* API Endpoints */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-4">API Endpoints</h3>
          <div className="space-y-4">
            {endpoints.map((endpoint, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                        className="font-mono"
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                    </div>
                    {endpoint.auth && (
                      <Badge variant="outline">Auth Required</Badge>
                    )}
                  </div>
                  <CardDescription>{endpoint.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="text-sm font-semibold mb-2">Parameters</h4>
                  <div className="space-y-2">
                    {endpoint.params.map((param, pidx) => (
                      <div key={pidx} className="flex items-start gap-2 text-sm">
                        <code className="text-primary">{param.name}</code>
                        <Badge variant="outline" className="text-xs">{param.type}</Badge>
                        <span className="text-muted-foreground">{param.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-4">Rate Limits</h3>
          <Card>
            <CardHeader>
              <CardTitle>API Usage Limits</CardTitle>
              <CardDescription>
                Fair usage policies to ensure service quality for all developers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-1">Free Tier</h4>
                  <p className="text-2xl font-bold text-primary">1,000</p>
                  <p className="text-sm text-muted-foreground">requests/day</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-1">Pro Tier</h4>
                  <p className="text-2xl font-bold text-primary">50,000</p>
                  <p className="text-sm text-muted-foreground">requests/day</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-1">Enterprise</h4>
                  <p className="text-2xl font-bold text-primary">Custom</p>
                  <p className="text-sm text-muted-foreground">unlimited requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Form */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Contact Our API Team</CardTitle>
              <CardDescription>
                Request enterprise API access or ask technical questions about integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      {...register("name")}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      {...register("email")}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Company Field */}
                  <div className="space-y-2">
                    <Label htmlFor="company">
                      Company <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="company"
                      placeholder="ACME Inc."
                      {...register("company")}
                      className={errors.company ? "border-destructive" : ""}
                    />
                    {errors.company && (
                      <p className="text-sm text-destructive">{errors.company.message}</p>
                    )}
                  </div>

                  {/* Request Type Field */}
                  <div className="space-y-2">
                    <Label htmlFor="requestType">
                      Request Type <span className="text-destructive">*</span>
                    </Label>
                    <Select onValueChange={(value) => setValue("requestType", value as any)}>
                      <SelectTrigger className={errors.requestType ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a request type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enterprise">Enterprise API Access</SelectItem>
                        <SelectItem value="technical">Technical Question</SelectItem>
                        <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.requestType && (
                      <p className="text-sm text-destructive">{errors.requestType.message}</p>
                    )}
                  </div>
                </div>

                {/* Message Field */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your use case, expected API volume, or technical question..."
                    rows={6}
                    {...register("message")}
                    className={errors.message ? "border-destructive" : ""}
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {watch("message")?.length || 0} / 1000 characters
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    We typically respond within 24-48 hours
                  </p>
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Support */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
              <CardDescription>
                Join our community and explore more developer resources
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="outline">Join Discord</Button>
              <Button variant="outline">View Examples</Button>
              <Button variant="outline">Status Page</Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default ApiDocs;
