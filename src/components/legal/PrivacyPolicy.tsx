import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, Users, MapPin, Bell, Camera, Mic, Trash2, Clock } from "lucide-react";

export const PrivacyPolicy = () => {
  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-6 text-sm">
        <div className="text-center pb-4 border-b">
          <Badge variant="secondary" className="mb-2">
            <Lock className="w-3 h-3 mr-1" />
            Privacy Policy
          </Badge>
          <h2 className="text-lg font-semibold">NeighborLink Privacy Policy</h2>
          <p className="text-xs text-muted-foreground mt-1">Effective Date: January 27, 2026</p>
        </div>
        
        {/* Quick Summary */}
        <section className="bg-primary/5 p-3 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Quick Summary
          </h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>✓ We only collect data necessary for neighborhood services</li>
            <li>✓ We never sell your personal information</li>
            <li>✓ You can access, export, or delete your data anytime</li>
            <li>✓ We use encryption to protect your data</li>
          </ul>
        </section>

        {/* Information We Collect */}
        <section>
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            1. Information We Collect
          </h3>
          <p className="text-muted-foreground mb-2">
            We collect information you provide directly to us:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li><strong>Account Information:</strong> Full name, email address, phone number, password, profile picture</li>
            <li><strong>Profile Information:</strong> Bio, interests, preferences, emergency contacts</li>
            <li><strong>Location Information:</strong> State, city, neighborhood, and address</li>
            <li><strong>Communication Data:</strong> Messages, posts, comments, and other interactions</li>
            <li><strong>Device Information:</strong> Device type, OS, unique identifiers, IP address</li>
            <li><strong>Usage Data:</strong> Features used, interaction patterns, timestamps</li>
          </ul>
        </section>

        {/* App Permissions */}
        <section>
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            2. App Permissions
          </h3>
          <p className="text-muted-foreground mb-2">We request these permissions:</p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li><strong>Camera:</strong> For photos in posts, profile pictures, marketplace listings</li>
            <li><strong>Microphone:</strong> For voice and video calls</li>
            <li><strong>Location:</strong> For neighborhood features, emergency alerts, Panic Button</li>
            <li><strong>Contacts (Optional):</strong> For finding friends and emergency contacts</li>
            <li><strong>Push Notifications:</strong> For emergency alerts, messages, community updates</li>
            <li><strong>Photos/Media:</strong> For uploading images from gallery</li>
          </ul>
        </section>

        {/* How We Use Information */}
        <section>
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            3. How We Use Your Information
          </h3>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Provide and maintain neighborhood networking services</li>
            <li>Connect you with neighbors and local community members</li>
            <li>Enable messaging, posts, and community interactions</li>
            <li>Power safety features (Panic Button, emergency alerts)</li>
            <li>Provide marketplace and local services functionality</li>
            <li>Improve our services through analytics</li>
            <li>Send important notifications about your account</li>
          </ul>
        </section>

        {/* Information Sharing */}
        <section>
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            4. Information Sharing
          </h3>
          <p className="text-muted-foreground mb-2">
            We may share your information in these circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li><strong>With Neighbors:</strong> Profile information visible based on your privacy settings</li>
            <li><strong>Emergency Situations:</strong> Location shared with emergency contacts via Panic Button</li>
            <li><strong>Service Providers:</strong> Supabase (database), Google Maps, push notification services</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect safety</li>
          </ul>
          <p className="text-muted-foreground mt-2 font-medium">
            We never sell your personal information to third parties.
          </p>
        </section>

        {/* Your Rights */}
        <section>
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            5. Your Rights & Controls
          </h3>
          <p className="text-muted-foreground mb-2">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Access and download your personal information</li>
            <li>Update or correct your information</li>
            <li>Delete your account and associated data</li>
            <li>Control privacy settings (profile visibility, location sharing)</li>
            <li>Opt out of non-essential communications</li>
            <li>Withdraw consent for specific features</li>
          </ul>
        </section>

        {/* Data Security */}
        <section>
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            6. Data Security
          </h3>
          <p className="text-muted-foreground">
            We protect your information using TLS/SSL encryption, secure password hashing, 
            multi-factor authentication options, and regular security assessments. 
            We implement access controls and monitor for unauthorized access.
          </p>
        </section>

        {/* Data Retention */}
        <section>
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            7. Data Retention
          </h3>
          <p className="text-muted-foreground">
            We retain your information while your account is active. When you delete your account, 
            we remove your personal information within 30 days, except data required for legal 
            compliance or safety purposes.
          </p>
        </section>

        {/* Children's Privacy */}
        <section>
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-primary" />
            8. Children's Privacy
          </h3>
          <p className="text-muted-foreground">
            NeighborLink is not intended for children under 13. We do not knowingly collect 
            personal information from children under 13 years of age. If we discover we have 
            collected such data, we will delete it promptly.
          </p>
        </section>

        {/* Nigerian Compliance */}
        <section>
          <h3 className="font-medium mb-2">9. Nigerian Data Protection Compliance</h3>
          <p className="text-muted-foreground">
            We comply with the Nigeria Data Protection Regulation (NDPR) 2019 and Nigeria Data 
            Protection Act (NDPA) 2023, ensuring your data is processed lawfully and protected 
            according to Nigerian standards.
          </p>
        </section>

        {/* Policy Updates */}
        <section>
          <h3 className="font-medium mb-2">10. Policy Updates</h3>
          <p className="text-muted-foreground">
            We may update this privacy policy from time to time. We will notify users of material 
            changes via email or in-app notification. Continued use after changes constitutes acceptance.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-muted/50 p-3 rounded-lg">
          <h3 className="font-medium mb-2">11. Contact Us</h3>
          <p className="text-muted-foreground">
            For privacy questions or to exercise your rights, contact us:
          </p>
          <div className="mt-2 text-xs space-y-1">
            <p><strong>Email:</strong> privacy@neighborlink.ng</p>
            <p><strong>Phone:</strong> +234 (0) 800-NEIGHBOR</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            We respond to all privacy inquiries within 30 days.
          </p>
        </section>

        <p className="text-xs text-muted-foreground text-center pt-4 border-t">
          © 2026 NeighborLink. All rights reserved.
        </p>
      </div>
    </ScrollArea>
  );
};
