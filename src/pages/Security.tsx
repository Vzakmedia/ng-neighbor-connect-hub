import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Shield, Lock, Eye, Server, File as FileCheck, AlertTriangle, Key as KeyRound, Mail } from '@/lib/icons';

const Security = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6 md:px-12 lg:px-16 xl:px-24">
          <Link to="/landing" className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">NeighborLink</span>
          </Link>
          <Link to="/landing">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 md:px-12 lg:px-16 xl:px-24">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-[0.5px] h-6 bg-primary"></div>
            <span className="text-sm uppercase tracking-wider text-primary font-medium">Security</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Security You Can Trust
              </h1>
            </div>
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                Your safety and privacy are our top priorities. We implement industry-leading security measures to protect your data and ensure a safe community experience.
              </p>
              <div className="flex gap-4 pt-4">
                <a href="#measures">
                  <Button size="lg">Security Measures</Button>
                </a>
                <a href="#report">
                  <Button size="lg" variant="outline">Report Issue</Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Security */}
      <section className="py-24 px-6 md:px-12 lg:px-16 xl:px-24 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-[0.5px] h-6 bg-primary"></div>
            <span className="text-sm uppercase tracking-wider text-primary font-medium">Platform</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Platform Security
              </h2>
            </div>
            <div>
              <p className="text-lg text-muted-foreground">
                Our infrastructure is built with security at its core, protecting your data at every layer of the system.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">End-to-End Encryption</h3>
                    <p className="text-muted-foreground mb-4">
                      All data transmitted between your device and our servers is protected with industry-standard SSL/TLS encryption, ensuring your communications remain private and secure.
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• 256-bit SSL/TLS encryption</li>
                      <li>• Perfect forward secrecy</li>
                      <li>• HTTPS-only connections</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                    <Server className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Secure Infrastructure</h3>
                    <p className="text-muted-foreground mb-4">
                      Our servers are hosted in secure, certified data centers with physical security controls, redundant systems, and regular security audits.
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• SOC 2 compliant data centers</li>
                      <li>• 24/7 monitoring and alerts</li>
                      <li>• Regular penetration testing</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                    <KeyRound className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Multi-Factor Authentication</h3>
                    <p className="text-muted-foreground mb-4">
                      Optional two-factor authentication (2FA) adds an extra layer of security to your account, protecting against unauthorized access.
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• SMS-based verification</li>
                      <li>• Authenticator app support</li>
                      <li>• Backup recovery codes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Privacy Controls</h3>
                    <p className="text-muted-foreground mb-4">
                      Granular privacy settings give you full control over who can see your information, posts, and activity on the platform.
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Profile visibility controls</li>
                      <li>• Post privacy settings</li>
                      <li>• Block and report features</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Data Protection */}
      <section className="py-24 px-6 md:px-12 lg:px-16 xl:px-24">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-[0.5px] h-6 bg-primary"></div>
            <span className="text-sm uppercase tracking-wider text-primary font-medium">Data Protection</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">
                How We Protect Your Data
              </h2>
            </div>
            <div>
              <p className="text-lg text-muted-foreground">
                We employ multiple layers of protection to keep your personal information safe and secure.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <Lock className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Encrypted Storage</h3>
                <p className="text-sm text-muted-foreground">
                  All sensitive data is encrypted at rest using AES-256 encryption
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Shield className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Access Controls</h3>
                <p className="text-sm text-muted-foreground">
                  Strict role-based access controls limit data access to authorized personnel only
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Server className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Regular Backups</h3>
                <p className="text-sm text-muted-foreground">
                  Automated backups ensure data recovery in case of system failures
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Eye className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Audit Logs</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive logging of all data access and system changes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <FileCheck className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Data Minimization</h3>
                <p className="text-sm text-muted-foreground">
                  We only collect data necessary for platform functionality
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <AlertTriangle className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Breach Monitoring</h3>
                <p className="text-sm text-muted-foreground">
                  Continuous monitoring for security threats and anomalies
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-24 px-6 md:px-12 lg:px-16 xl:px-24 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-[0.5px] h-6 bg-primary"></div>
            <span className="text-sm uppercase tracking-wider text-primary font-medium">Compliance</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Compliance & Standards
              </h2>
            </div>
            <div>
              <p className="text-lg text-muted-foreground">
                We adhere to international security standards and data protection regulations to ensure the highest level of security.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Data Protection Regulations</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  We comply with NDPR (Nigeria Data Protection Regulation) and GDPR principles to protect user privacy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Security Certifications</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Our systems undergo regular security audits and penetration testing by third-party experts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Incident Response</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  We maintain a comprehensive incident response plan to quickly address any security concerns.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Employee Training</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  All team members receive regular security awareness training and follow strict security protocols.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section id="measures" className="py-24 px-6 md:px-12 lg:px-16 xl:px-24">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-[0.5px] h-6 bg-primary"></div>
            <span className="text-sm uppercase tracking-wider text-primary font-medium">Measures</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Additional Security Measures
              </h2>
            </div>
            <div>
              <p className="text-lg text-muted-foreground">
                Beyond our core security infrastructure, we implement additional protections to keep your account and data safe.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-3">Account Activity Monitoring</h3>
                <p className="text-muted-foreground">
                  We monitor account activity for suspicious behavior and notify you of any unusual login attempts or changes to your account settings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-3">Content Moderation</h3>
                <p className="text-muted-foreground">
                  Our moderation team and automated systems work together to identify and remove harmful content, spam, and policy violations to maintain a safe community.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-3">Fraud Prevention</h3>
                <p className="text-muted-foreground">
                  Advanced fraud detection systems identify and prevent scams, fake accounts, and other malicious activities on the platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-3">Secure Development Practices</h3>
                <p className="text-muted-foreground">
                  Our development team follows secure coding practices, conducts code reviews, and performs security testing before releasing new features.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Report Issue */}
      <section id="report" className="py-24 px-6 md:px-12 lg:px-16 xl:px-24 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-[0.5px] h-6 bg-primary"></div>
            <span className="text-sm uppercase tracking-wider text-primary font-medium">Contact</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Report a Security Issue
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                If you discover a security vulnerability or have concerns about platform security, please contact our security team immediately.
              </p>
            </div>
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">Security Contact</h3>
                    <div className="space-y-3 text-sm">
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">Email:</strong> security@neighborlink.com
                      </p>
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">Response Time:</strong> Within 24 hours for critical issues
                      </p>
                      <p className="text-muted-foreground">
                        We take all security reports seriously and investigate them promptly. Responsible disclosure is appreciated.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6 md:px-12 lg:px-16 xl:px-24">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 NeighborLink. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link to="/community-guidelines" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Community Guidelines
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Security;
