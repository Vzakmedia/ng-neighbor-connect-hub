import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsAndConditions } from "./TermsAndConditions";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { Shield, FileText, Eye, CheckSquare } from "lucide-react";

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
    <Dialog open={open} onOpenChange={() => {}}>
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
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0 text-xs sm:text-sm">
            <TabsTrigger value="overview" className="px-2 sm:px-4">Consent Overview</TabsTrigger>
            <TabsTrigger value="terms" className="px-2 sm:px-4">Terms & Conditions</TabsTrigger>
            <TabsTrigger value="privacy" className="px-2 sm:px-4">Privacy Policy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 mt-4 pr-2">
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

              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">Quick Action</p>
                  <p className="text-xs text-muted-foreground">
                    {allConsentsChecked ? "All consents accepted" : "Accept all consents at once"}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={allConsentsChecked ? handleUntickAll : handleTickAll}
                  className="ml-4"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {allConsentsChecked ? "Untick All" : "Tick All"}
                </Button>
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

                <h3 className="font-semibold">Device Permissions</h3>
                <p className="text-xs text-muted-foreground mb-3">These permissions are needed for full app functionality</p>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="camera"
                      checked={consents.cameraAccessAccepted}
                      onCheckedChange={(checked) => handleConsentChange('cameraAccessAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="camera" className="text-sm font-medium cursor-pointer">
                        Camera Access
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Take photos for your profile, posts, and marketplace listings.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="microphone"
                      checked={consents.microphoneAccessAccepted}
                      onCheckedChange={(checked) => handleConsentChange('microphoneAccessAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="microphone" className="text-sm font-medium cursor-pointer">
                        Microphone Access
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Enable voice and video calls with neighbors.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="pushNotifications"
                      checked={consents.pushNotificationsAccepted}
                      onCheckedChange={(checked) => handleConsentChange('pushNotificationsAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="pushNotifications" className="text-sm font-medium cursor-pointer">
                        Push Notifications
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Receive alerts for messages, safety notifications, and community updates.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="fileAccess"
                      checked={consents.fileAccessAccepted}
                      onCheckedChange={(checked) => handleConsentChange('fileAccessAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="fileAccess" className="text-sm font-medium cursor-pointer">
                        File Access
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Upload images, documents, and files for posts and marketplace items.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold">Enhanced Location Services</h3>
                <p className="text-xs text-muted-foreground mb-3">For improved neighborhood matching and safety features</p>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="preciseLocation"
                      checked={consents.preciseLocationAccepted}
                      onCheckedChange={(checked) => handleConsentChange('preciseLocationAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="preciseLocation" className="text-sm font-medium cursor-pointer">
                        Precise Location (GPS)
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Get exact location for emergency alerts and precise neighborhood matching.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="backgroundLocation"
                      checked={consents.backgroundLocationAccepted}
                      onCheckedChange={(checked) => handleConsentChange('backgroundLocationAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="backgroundLocation" className="text-sm font-medium cursor-pointer">
                        Background Location
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Enable automatic safety check-ins and location-based emergency features.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold">Analytics & Performance</h3>
                <p className="text-xs text-muted-foreground mb-3">Help us improve the app and provide better services</p>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="analytics"
                      checked={consents.analyticsAccepted}
                      onCheckedChange={(checked) => handleConsentChange('analyticsAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="analytics" className="text-sm font-medium cursor-pointer">
                        Usage Analytics
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Anonymous data about how you use the app to improve features.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="crashReporting"
                      checked={consents.crashReportingAccepted}
                      onCheckedChange={(checked) => handleConsentChange('crashReportingAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="crashReporting" className="text-sm font-medium cursor-pointer">
                        Crash Reporting
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Automatic crash reports to help us fix bugs and improve stability.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold">Advanced Features</h3>
                <p className="text-xs text-muted-foreground mb-3">Enhanced app functionality and integrations</p>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="voiceVideoCalls"
                      checked={consents.voiceVideoCallsAccepted}
                      onCheckedChange={(checked) => handleConsentChange('voiceVideoCallsAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="voiceVideoCalls" className="text-sm font-medium cursor-pointer">
                        Voice & Video Calls
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Processing of call data for neighbor communication features.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="emergencyContacts"
                      checked={consents.emergencyContactsAccepted}
                      onCheckedChange={(checked) => handleConsentChange('emergencyContactsAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="emergencyContacts" className="text-sm font-medium cursor-pointer">
                        Emergency Contact System
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Access and notify your emergency contacts during safety alerts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="googleServices"
                      checked={consents.googleServicesAccepted}
                      onCheckedChange={(checked) => handleConsentChange('googleServicesAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="googleServices" className="text-sm font-medium cursor-pointer">
                        Google Services Integration
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Sync with Google Calendar, Maps, and other Google services.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold">Commercial Features</h3>
                <p className="text-xs text-muted-foreground mb-3">For marketplace and business functionality</p>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="marketplaceTransactions"
                      checked={consents.marketplaceTransactionsAccepted}
                      onCheckedChange={(checked) => handleConsentChange('marketplaceTransactionsAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="marketplaceTransactions" className="text-sm font-medium cursor-pointer">
                        Marketplace Transactions
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Process marketplace purchases, bookings, and transaction data.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="paymentProcessing"
                      checked={consents.paymentProcessingAccepted}
                      onCheckedChange={(checked) => handleConsentChange('paymentProcessingAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="paymentProcessing" className="text-sm font-medium cursor-pointer">
                        Payment Processing
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Process payments for services, promotions, and marketplace items.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold">Optional Communication</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/20">
                    <Checkbox
                      id="communication"
                      checked={consents.communicationAccepted}
                      onCheckedChange={(checked) => handleConsentChange('communicationAccepted', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <label htmlFor="communication" className="text-sm font-medium cursor-pointer">
                        Community Updates & Notifications
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

          <TabsContent value="terms" className="flex-1 overflow-y-auto mt-4 pr-2">
            <TermsAndConditions />
          </TabsContent>

          <TabsContent value="privacy" className="flex-1 overflow-y-auto mt-4 pr-2">
            <PrivacyPolicy />
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 border-t flex-shrink-0">
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