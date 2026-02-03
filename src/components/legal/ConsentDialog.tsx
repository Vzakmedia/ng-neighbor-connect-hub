import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsAndConditions } from "./TermsAndConditions";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { Shield, FileText, Eye, Check as CheckSquare } from '@/lib/icons';

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

  // Device Permissions
  cameraAccessAccepted: boolean;
  microphoneAccessAccepted: boolean;
  pushNotificationsAccepted: boolean;
  fileAccessAccepted: boolean;

  // Security & Analytics
  deviceStorageAccepted: boolean;
  analyticsAccepted: boolean;
  crashReportingAccepted: boolean;

  // Enhanced Location
  preciseLocationAccepted: boolean;
  backgroundLocationAccepted: boolean;
  locationHistoryAccepted: boolean;

  // Advanced Features
  voiceVideoCallsAccepted: boolean;
  emergencyContactsAccepted: boolean;
  externalIntegrationsAccepted: boolean;

  // Commercial/Business
  marketplaceTransactionsAccepted: boolean;
  businessVerificationAccepted: boolean;
  paymentProcessingAccepted: boolean;

  // Content & AI
  contentProcessingAccepted: boolean;
  contentModerationAccepted: boolean;
  recommendationsAccepted: boolean;

  // Third-Party Integration
  googleServicesAccepted: boolean;
  externalApisAccepted: boolean;
  crossPlatformSyncAccepted: boolean;
}

export const ConsentDialog = ({ open, onConsentGiven, onCancel }: ConsentDialogProps) => {
  const [consents, setConsents] = useState<ConsentState>({
    termsAccepted: false,
    privacyAccepted: false,
    dataProcessingAccepted: false,
    locationSharingAccepted: false,
    communicationAccepted: false,

    // Device Permissions
    cameraAccessAccepted: false,
    microphoneAccessAccepted: false,
    pushNotificationsAccepted: false,
    fileAccessAccepted: false,

    // Security & Analytics
    deviceStorageAccepted: false,
    analyticsAccepted: false,
    crashReportingAccepted: false,

    // Enhanced Location
    preciseLocationAccepted: false,
    backgroundLocationAccepted: false,
    locationHistoryAccepted: false,

    // Advanced Features
    voiceVideoCallsAccepted: false,
    emergencyContactsAccepted: false,
    externalIntegrationsAccepted: false,

    // Commercial/Business
    marketplaceTransactionsAccepted: false,
    businessVerificationAccepted: false,
    paymentProcessingAccepted: false,

    // Content & AI
    contentProcessingAccepted: false,
    contentModerationAccepted: false,
    recommendationsAccepted: false,

    // Third-Party Integration
    googleServicesAccepted: false,
    externalApisAccepted: false,
    crossPlatformSyncAccepted: false,
  });

  const [currentTab, setCurrentTab] = useState("overview");

  const handleConsentChange = (key: keyof ConsentState, value: boolean) => {
    setConsents(prev => ({ ...prev, [key]: value }));
  };

  const handleTickAll = () => {
    setConsents({
      termsAccepted: true,
      privacyAccepted: true,
      dataProcessingAccepted: true,
      locationSharingAccepted: true,
      communicationAccepted: true,
      cameraAccessAccepted: true,
      microphoneAccessAccepted: true,
      pushNotificationsAccepted: true,
      fileAccessAccepted: true,
      deviceStorageAccepted: true,
      analyticsAccepted: true,
      crashReportingAccepted: true,
      preciseLocationAccepted: true,
      backgroundLocationAccepted: true,
      locationHistoryAccepted: true,
      voiceVideoCallsAccepted: true,
      emergencyContactsAccepted: true,
      externalIntegrationsAccepted: true,
      marketplaceTransactionsAccepted: true,
      businessVerificationAccepted: true,
      paymentProcessingAccepted: true,
      contentProcessingAccepted: true,
      contentModerationAccepted: true,
      recommendationsAccepted: true,
      googleServicesAccepted: true,
      externalApisAccepted: true,
      crossPlatformSyncAccepted: true,
    });
  };

  const handleUntickAll = () => {
    setConsents({
      termsAccepted: false,
      privacyAccepted: false,
      dataProcessingAccepted: false,
      locationSharingAccepted: false,
      communicationAccepted: false,
      cameraAccessAccepted: false,
      microphoneAccessAccepted: false,
      pushNotificationsAccepted: false,
      fileAccessAccepted: false,
      deviceStorageAccepted: false,
      analyticsAccepted: false,
      crashReportingAccepted: false,
      preciseLocationAccepted: false,
      backgroundLocationAccepted: false,
      locationHistoryAccepted: false,
      voiceVideoCallsAccepted: false,
      emergencyContactsAccepted: false,
      externalIntegrationsAccepted: false,
      marketplaceTransactionsAccepted: false,
      businessVerificationAccepted: false,
      paymentProcessingAccepted: false,
      contentProcessingAccepted: false,
      contentModerationAccepted: false,
      recommendationsAccepted: false,
      googleServicesAccepted: false,
      externalApisAccepted: false,
      crossPlatformSyncAccepted: false,
    });
  };

  const allConsentsChecked = Object.values(consents).every(value => value === true);

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
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] w-[95vw] sm:w-full overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            Privacy Consent & Terms Agreement
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Please review and consent to our data collection and usage practices before creating your account.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex mb-4 flex-wrap text-xs sm:text-sm">
            <TabsTrigger value="overview" className="px-2 sm:px-4">Consent Overview</TabsTrigger>
            <TabsTrigger value="terms" className="px-2 sm:px-4">Terms & Conditions</TabsTrigger>
            <TabsTrigger value="privacy" className="px-2 sm:px-4">Privacy Policy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 mt-4 pr-2">
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <h3 className="font-semibold text-xs mb-2 flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  Data Processing Overview
                </h3>
                <p className="text-[11px] leading-tight text-muted-foreground mb-2">
                  To provide neighborhood networking services, we collect and process your personal info (name, email, phone), location data (address, neighborhood), profile details, community interactions, and anonymized usage analytics.
                </p>
                <ul className="text-[11px] leading-tight space-y-0.5 text-muted-foreground">
                  <li>• Connect with verified neighbors nearby</li>
                  <li>• Enable secure messaging and community posts</li>
                  <li>• Provide local safety alerts and emergency features</li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 border rounded-lg bg-primary/5 border-primary/20">
                  <Checkbox
                    id="all-inclusive"
                    checked={allConsentsChecked}
                    onCheckedChange={(checked) => checked ? handleTickAll() : handleUntickAll()}
                  />
                  <div className="space-y-1">
                    <label htmlFor="all-inclusive" className="text-xs font-semibold cursor-pointer leading-tight">
                      I agree to the Terms & Conditions, Privacy Policy, and all required data processing. <span className="text-destructive">*</span>
                    </label>
                    <p className="text-[10px] leading-tight text-muted-foreground">
                      By checking this, you consent to our use of location services, device permissions (camera/mic), and analytics to provide the full NeighborLink experience.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 p-2 rounded text-[10px] text-muted-foreground leading-tight italic">
                  Note: You are accepting terms for account usage, data protection, location matching, device access for calls/media, and security analytics. You can manage specific permissions in your profile settings later.
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="flex-1 overflow-y-auto mt-2 pr-2 text-[11px]">
            <TermsAndConditions />
          </TabsContent>

          <TabsContent value="privacy" className="flex-1 overflow-y-auto mt-2 pr-2 text-[11px]">
            <PrivacyPolicy />
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-3 border-t flex-shrink-0">
          <Button variant="outline" onClick={onCancel} className="order-1 sm:order-none">
            Cancel
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 order-2">
            {currentTab === "overview" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setCurrentTab("terms")}
                  className="text-xs sm:text-sm"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  View Terms
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentTab("privacy")}
                  className="text-xs sm:text-sm"
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  View Privacy Policy
                </Button>
              </>
            )}
            {currentTab !== "overview" && (
              <Button
                variant="outline"
                onClick={() => setCurrentTab("overview")}
                className="text-xs sm:text-sm"
              >
                Back to Consent
              </Button>
            )}
            {currentTab === "overview" && (
              <Button
                onClick={handleProceed}
                disabled={!allRequiredConsentsGiven}
                className="min-w-[120px] text-xs sm:text-sm"
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