import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExclamationCircleIcon, CheckCircleIcon, Cog6ToothIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { openAppSettings } from "@/utils/iosSettingsHelper";

export const IOSTroubleshootingGuide = () => {
  const issues = [
    {
      title: "Can't Sign In",
      symptoms: [
        "Getting 'requested path is invalid' error",
        "Redirected to localhost:3000",
        "Email verification not working"
      ],
      solutions: [
        "Check if you're in Private Browsing mode - disable it in Safari settings",
        "Clear Safari website data: Settings > Safari > Clear History and Website Data",
        "Make sure cookies are enabled: Settings > Safari > Block All Cookies (should be OFF)",
        "Try signing in again after clearing data"
      ]
    },
    {
      title: "Notifications Not Working",
      symptoms: [
        "Not receiving notifications",
        "Notification permission request not showing",
        "Notifications showing but no sound"
      ],
      solutions: [
        "Open Settings > NeighborLink > Notifications",
        "Enable 'Allow Notifications'",
        "Enable 'Sounds' and 'Badges'",
        "Make sure 'Do Not Disturb' is off",
        "Restart the app after changing settings"
      ]
    },
    {
      title: "Location Not Updating",
      symptoms: [
        "Location stuck at old position",
        "Can't find nearby posts",
        "'Always' location permission not working"
      ],
      solutions: [
        "Open Settings > NeighborLink > Location",
        "Select 'Always' (not 'While Using')",
        "Enable 'Precise Location'",
        "Make sure Location Services are on: Settings > Privacy > Location Services",
        "Force close and reopen the app"
      ]
    },
    {
      title: "Camera/Photos Not Working",
      symptoms: [
        "Can't upload photos",
        "Camera permission denied",
        "Photos appear corrupted"
      ],
      solutions: [
        "Open Settings > NeighborLink > Photos",
        "Select 'All Photos' (not 'Selected Photos')",
        "For camera: Settings > NeighborLink > Camera > Enable",
        "Try taking a new photo instead of selecting from library",
        "Restart the app after changing permissions"
      ]
    },
    {
      title: "App Feels Slow or Freezing",
      symptoms: [
        "App stutters when scrolling",
        "Takes long time to load",
        "Sudden crashes"
      ],
      solutions: [
        "Close other apps running in background",
        "Clear app cache: Go to Device tab in Settings",
        "Check available storage: Settings > General > iPhone Storage",
        "Free up space if less than 1GB available",
        "Force restart your iPhone if issues persist"
      ]
    },
    {
      title: "Can't Send Messages",
      symptoms: [
        "Messages stuck sending",
        "Can't see other users online",
        "Real-time updates not working"
      ],
      solutions: [
        "Check internet connection (WiFi or cellular data)",
        "Try switching between WiFi and cellular",
        "Disable VPN if using one",
        "Go to Device tab in Settings and tap 'Refresh Connection'",
        "Sign out and sign back in"
      ]
    }
  ];

  const generalTips = [
    "Keep iOS updated to the latest version for best compatibility",
    "Use Safari browser if accessing via web",
    "Avoid using Private Browsing mode",
    "Grant all requested permissions when prompted",
    "Regularly clear app cache if experiencing issues",
    "Force close and restart the app periodically"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">iOS Troubleshooting Guide</h2>
        <p className="text-muted-foreground">
          Common iOS issues and how to fix them
        </p>
      </div>

      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex gap-3">
          <ExclamationCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-2">Quick Fix Steps</h3>
            <ol className="space-y-2 text-sm">
              <li>1. Check your internet connection</li>
              <li>2. Make sure you're not in Private Browsing mode</li>
              <li>3. Verify all permissions are enabled in Settings</li>
              <li>4. Try force closing and reopening the app</li>
              <li>5. If still not working, clear cache and restart</li>
            </ol>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {issues.map((issue, index) => (
          <Card key={index} className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ExclamationCircleIcon className="h-4 w-4 text-destructive" />
              {issue.title}
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-muted-foreground mb-1">Symptoms:</p>
                <ul className="space-y-1 ml-4">
                  {issue.symptoms.map((symptom, idx) => (
                    <li key={idx} className="list-disc">{symptom}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-medium text-muted-foreground mb-1">Solutions:</p>
                <ul className="space-y-1 ml-4">
                  {issue.solutions.map((solution, idx) => (
                    <li key={idx} className="list-disc">{solution}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 border-success/20 bg-success/5">
        <div className="flex gap-3">
          <CheckCircleIcon className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-2">General iOS Tips</h3>
            <ul className="space-y-1 text-sm">
              {generalTips.map((tip, idx) => (
                <li key={idx} className="list-disc ml-4">{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button 
          onClick={openAppSettings}
          className="flex-1"
          variant="outline"
        >
          <Cog6ToothIcon className="h-4 w-4 mr-2" />
          Open iOS Settings
        </Button>
        
        <Button 
          onClick={() => window.location.reload()}
          className="flex-1"
          variant="outline"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Reload App
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Still having issues? Contact support with details from the Device diagnostics page.
      </p>
    </div>
  );
};
