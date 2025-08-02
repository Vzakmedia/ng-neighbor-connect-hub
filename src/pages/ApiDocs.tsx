import { ArrowLeft, Code, Key, Book, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ApiDocs = () => {
  const endpoints = [
    {
      method: "GET",
      path: "/api/communities",
      description: "Get list of communities",
      auth: "Required"
    },
    {
      method: "POST",
      path: "/api/communities",
      description: "Create a new community",
      auth: "Required"
    },
    {
      method: "GET",
      path: "/api/users/profile",
      description: "Get user profile information",
      auth: "Required"
    },
    {
      method: "POST",
      path: "/api/emergency/alert",
      description: "Create emergency alert",
      auth: "Required"
    },
    {
      method: "GET",
      path: "/api/services",
      description: "Get local services",
      auth: "Optional"
    }
  ];

  const sdks = [
    {
      language: "JavaScript",
      description: "Official JavaScript/Node.js SDK",
      install: "npm install neighborlink-js",
      docs: "#"
    },
    {
      language: "Python",
      description: "Official Python SDK",
      install: "pip install neighborlink-python",
      docs: "#"
    },
    {
      language: "Java",
      description: "Official Java SDK",
      install: "Maven/Gradle dependency",
      docs: "#"
    },
    {
      language: "PHP",
      description: "Official PHP SDK",
      install: "composer require neighborlink/php-sdk",
      docs: "#"
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
            <h1 className="text-4xl font-bold">API Documentation</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Build on top of NeighborLink's community platform with our comprehensive APIs
            </p>
          </div>

          <Separator />

          {/* Quick Start */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Quick Start</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    1. Get API Key
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign up for a developer account and generate your API key from the dashboard.
                  </p>
                  <Button size="sm">Get API Key</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    2. Make First Call
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Test your integration with our simple authentication endpoint.
                  </p>
                  <Button size="sm" variant="outline">View Examples</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5 text-primary" />
                    3. Explore Docs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Dive deep into our comprehensive API reference and guides.
                  </p>
                  <Button size="sm" variant="outline">Browse Docs</Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* API Overview */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">API Overview</h2>
            <Tabs defaultValue="endpoints" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="authentication">Authentication</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
                <TabsTrigger value="sdks">SDKs</TabsTrigger>
              </TabsList>

              <TabsContent value="endpoints" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Endpoints</CardTitle>
                    <CardDescription>
                      Core API endpoints for community platform integration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {endpoints.map((endpoint, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                                {endpoint.method}
                              </Badge>
                              <code className="text-sm font-mono">{endpoint.path}</code>
                            </div>
                            <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                          </div>
                          <Badge variant="outline">{endpoint.auth}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="authentication" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>
                      Secure your API requests with proper authentication
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">API Key Authentication</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Include your API key in the request headers:
                      </p>
                      <div className="bg-muted p-4 rounded-lg">
                        <code className="text-sm">
                          Authorization: Bearer YOUR_API_KEY<br/>
                          Content-Type: application/json
                        </code>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Rate Limits</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 1000 requests per hour for free tier</li>
                        <li>• 10,000 requests per hour for premium tier</li>
                        <li>• Rate limit headers included in responses</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="examples" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Code Examples</CardTitle>
                    <CardDescription>
                      Common integration patterns and examples
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Get Communities (JavaScript)</h4>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code className="text-sm whitespace-pre">
{`const response = await fetch('https://api.neighborlink.ng/v1/communities', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const communities = await response.json();
console.log(communities);`}
                        </code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Create Emergency Alert (Python)</h4>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code className="text-sm whitespace-pre">
{`import requests

url = "https://api.neighborlink.ng/v1/emergency/alert"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "type": "medical",
    "location": {"lat": 6.5244, "lng": 3.3792},
    "message": "Medical assistance needed"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`}
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sdks" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {sdks.map((sdk, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>{sdk.language}</CardTitle>
                        <CardDescription>{sdk.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Installation:</p>
                          <code className="text-sm bg-muted p-2 rounded block">{sdk.install}</code>
                        </div>
                        <Button size="sm" variant="outline" className="w-full">
                          View Documentation
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {/* Support */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Support & Resources</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Developer Forum</CardTitle>
                  <CardDescription>
                    Connect with other developers and get help
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline" className="w-full">
                    Join Forum
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Status</CardTitle>
                  <CardDescription>
                    Check real-time API status and uptime
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline" className="w-full">
                    View Status
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Support</CardTitle>
                  <CardDescription>
                    Get direct help from our technical team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Email: <span className="font-mono">api-support@neighborlink.ng</span>
                  </p>
                </CardContent>
              </Card>
            </div>
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

export default ApiDocs;