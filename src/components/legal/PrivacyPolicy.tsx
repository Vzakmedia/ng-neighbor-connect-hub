import { ScrollArea } from "@/components/ui/scroll-area";

export const PrivacyPolicy = () => {
  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-4 text-sm">
        <h2 className="text-lg font-semibold">Privacy Policy</h2>
        
        <section>
          <h3 className="font-medium mb-2">1. Information We Collect</h3>
          <p className="text-muted-foreground mb-2">
            We collect information you provide directly to us:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li><strong>Account Information:</strong> Full name, email address, phone number, password</li>
            <li><strong>Profile Information:</strong> Profile picture, bio, preferences</li>
            <li><strong>Location Information:</strong> State, city, neighborhood, and address</li>
            <li><strong>Communication Data:</strong> Messages, posts, comments, and other interactions</li>
            <li><strong>Usage Data:</strong> How you interact with our services, features used, time spent</li>
          </ul>
        </section>

        <section>
          <h3 className="font-medium mb-2">2. How We Use Your Information</h3>
          <p className="text-muted-foreground mb-2">We use your information to:</p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Provide and maintain our neighborhood networking services</li>
            <li>Connect you with neighbors and local community members</li>
            <li>Enable communication features (messaging, community posts)</li>
            <li>Provide location-based services and recommendations</li>
            <li>Enhance safety features and emergency response capabilities</li>
            <li>Improve our services through analytics and user feedback</li>
            <li>Send important notifications about your account or community</li>
          </ul>
        </section>

        <section>
          <h3 className="font-medium mb-2">3. Information Sharing</h3>
          <p className="text-muted-foreground mb-2">
            We may share your information in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li><strong>With Neighbors:</strong> Basic profile information (name, neighborhood) is visible to verified neighbors</li>
            <li><strong>Emergency Situations:</strong> Safety-related information may be shared with emergency contacts or authorities</li>
            <li><strong>Service Providers:</strong> With trusted third parties who help us operate our services</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and users' safety</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            <strong>We never sell your personal information to third parties.</strong>
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">4. Location Data Privacy</h3>
          <p className="text-muted-foreground">
            Your location information is used exclusively for neighborhood-based features. We implement 
            privacy measures such as approximate location sharing and do not track your real-time location 
            without explicit consent.
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">5. Data Security</h3>
          <p className="text-muted-foreground">
            We protect your information using encryption, secure servers, and access controls. 
            We regularly review our security practices and update them as needed to protect your privacy.
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">6. Your Privacy Rights</h3>
          <p className="text-muted-foreground mb-2">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Access and review your personal information</li>
            <li>Update or correct your information</li>
            <li>Delete your account and associated data</li>
            <li>Control privacy settings for your profile</li>
            <li>Opt out of non-essential communications</li>
          </ul>
        </section>

        <section>
          <h3 className="font-medium mb-2">7. Data Retention</h3>
          <p className="text-muted-foreground">
            We retain your information as long as your account is active or as needed to provide services. 
            When you delete your account, we delete your personal information within 30 days, except as 
            required for legal compliance or safety purposes.
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">8. Children's Privacy</h3>
          <p className="text-muted-foreground">
            NeighborLink is not intended for children under 13. We do not knowingly collect personal 
            information from children under 13 years of age.
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">9. Privacy Policy Updates</h3>
          <p className="text-muted-foreground">
            We may update this privacy policy from time to time. We will notify users of material changes 
            and obtain consent where required by law.
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">10. Contact Us</h3>
          <p className="text-muted-foreground">
            If you have questions about this privacy policy or our data practices, please contact us 
            through the support section of the app.
          </p>
        </section>

        <p className="text-xs text-muted-foreground mt-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </ScrollArea>
  );
};