import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsAndConditions } from "./TermsAndConditions";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { Shield, FileText, Eye } from "lucide-react";

interface ConsentDialogProps {
  open: boolean;
  onConsentGiven: (consents: ConsentState) => void;
  onCancel: () => void;
}

export interface ConsentState {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dataProcessingAccepted: boolean;
  locationSharingAccepted: boolean;
  communicationAccepted: boolean;
}

export const ConsentDialog = ({ open, onConsentGiven, onCancel }: ConsentDialogProps) => {
  const [consents, setConsents] = useState<ConsentState>({
    termsAccepted: false,
    privacyAccepted: false,
    dataProcessingAccepted: false,
    locationSharingAccepted: false,
    communicationAccepted: false,
  });

  const [currentTab, setCurrentTab] = useState("overview");

  const handleConsentChange = (key: keyof ConsentState, value: boolean) => {
    setConsents(prev => ({ ...prev, [key]: value }));
  };

  const allRequiredConsentsGiven = 
    consents.termsAccepted && 
    consents.privacyAccepted && 
    consents.dataProcessingAccepted && 
    consents.locationSharingAccepted;

  const handleProceed = () => {
    if (allRequiredConsentsGiven) {
      onConsentGiven(consents);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Consent & Terms Agreement
          </DialogTitle>
          <DialogDescription>
            Please review and consent to our data collection and usage practices before creating your account.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Consent Overview</TabsTrigger>
            <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Data Collection Summary
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  To provide neighborhood networking services, we need to collect and process certain information:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>Personal Info:</strong> Name, email, phone number</li>
                  <li>• <strong>Location Data:</strong> Address, neighborhood, city, state</li>
                  <li>• <strong>Profile Data:</strong> Profile picture, bio, preferences</li>
                  <li>• <strong>Communication:</strong> Messages, posts, community interactions</li>
                  <li>• <strong>Usage Analytics:</strong> How you use the app (anonymized)</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Required Consents</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id="terms"
                      checked={consents.termsAccepted}
                      onCheckedChange={(checked) => handleConsentChange('termsAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                        I agree to the Terms and Conditions <span className="text-destructive">*</span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        This covers your account usage, user conduct, and our service terms.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id="privacy"
                      checked={consents.privacyAccepted}
                      onCheckedChange={(checked) => handleConsentChange('privacyAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="privacy" className="text-sm font-medium cursor-pointer">
                        I agree to the Privacy Policy <span className="text-destructive">*</span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        This covers how we collect, use, and protect your personal information.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id="dataProcessing"
                      checked={consents.dataProcessingAccepted}
                      onCheckedChange={(checked) => handleConsentChange('dataProcessingAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="dataProcessing" className="text-sm font-medium cursor-pointer">
                        I consent to data processing for neighborhood services <span className="text-destructive">*</span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        We process your data to connect you with neighbors, enable messaging, and provide local community features.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id="location"
                      checked={consents.locationSharingAccepted}
                      onCheckedChange={(checked) => handleConsentChange('locationSharingAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="location" className="text-sm font-medium cursor-pointer">
                        I consent to location-based neighborhood matching <span className="text-destructive">*</span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Your neighborhood/area information is used to connect you with nearby residents and show local content.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold">Optional Consents</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="communication"
                      checked={consents.communicationAccepted}
                      onCheckedChange={(checked) => handleConsentChange('communicationAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="communication" className="text-sm font-medium cursor-pointer">
                        I consent to receiving community updates and notifications
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Receive emails about neighborhood events, safety alerts, and app updates. You can opt out anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="mt-4">
            <TermsAndConditions />
          </TabsContent>

          <TabsContent value="privacy" className="mt-4">
            <PrivacyPolicy />
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="space-x-2">
            {currentTab === "overview" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setCurrentTab("terms")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Terms
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentTab("privacy")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Privacy Policy
                </Button>
              </>
            )}
            {currentTab !== "overview" && (
              <Button
                variant="outline"
                onClick={() => setCurrentTab("overview")}
              >
                Back to Consent
              </Button>
            )}
            {currentTab === "overview" && (
              <Button
                onClick={handleProceed}
                disabled={!allRequiredConsentsGiven}
                className="min-w-[120px]"
              >
                {allRequiredConsentsGiven ? "Continue Signup" : "Please Accept Required Terms"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};