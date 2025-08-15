import { ScrollArea } from "@/components/ui/scroll-area";

export const TermsAndConditions = () => {
  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-4 text-sm">
        <h2 className="text-lg font-semibold">Terms and Conditions</h2>
        
        <section>
          <h3 className="font-medium mb-2">1. Acceptance of Terms</h3>
          <p className="text-muted-foreground">
            By creating an account with NeighborLink, you agree to be bound by these Terms and Conditions. 
            If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">2. User Account and Data Collection</h3>
          <p className="text-muted-foreground mb-2">
            To provide our neighborhood networking services, we collect and process the following information:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Personal identification information (full name, email address, phone number)</li>
            <li>Location information (state, city, neighborhood, address)</li>
            <li>Profile picture (optional)</li>
            <li>Communication data (messages, posts, interactions)</li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section>
          <h3 className="font-medium mb-2">3. Location Data Usage</h3>
          <p className="text-muted-foreground">
            Your location information is essential for connecting you with your local neighborhood community. 
            We use this data to:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Match you with neighbors in your area</li>
            <li>Show local community posts and events</li>
            <li>Enable location-based safety features</li>
            <li>Provide relevant local services and marketplace items</li>
          </ul>
        </section>

        <section>
          <h3 className="font-medium mb-2">4. Communication and Safety</h3>
          <p className="text-muted-foreground">
            NeighborLink includes safety features such as emergency alerts and neighborhood watch capabilities. 
            By using these features, you consent to sharing relevant safety information with your neighbors and local authorities when necessary.
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">5. User Conduct</h3>
          <p className="text-muted-foreground">
            You agree to use NeighborLink responsibly and in compliance with all applicable laws. 
            Prohibited activities include harassment, spam, sharing false information, and any illegal activities.
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">6. Data Security</h3>
          <p className="text-muted-foreground">
            We implement industry-standard security measures to protect your personal information. 
            However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">7. Account Termination</h3>
          <p className="text-muted-foreground">
            You may delete your account at any time. We reserve the right to suspend or terminate accounts 
            that violate these terms or engage in harmful behavior.
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">8. Changes to Terms</h3>
          <p className="text-muted-foreground">
            We may update these terms from time to time. Users will be notified of significant changes, 
            and continued use of the service constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">9. Contact Information</h3>
          <p className="text-muted-foreground">
            If you have questions about these terms, please contact us through the support section of the app.
          </p>
        </section>

        <p className="text-xs text-muted-foreground mt-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </ScrollArea>
  );
};