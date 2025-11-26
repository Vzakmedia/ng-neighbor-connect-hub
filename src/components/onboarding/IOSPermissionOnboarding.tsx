import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BellIcon,
  MapPinIcon,
  CameraIcon,
  UsersIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Geolocation } from "@capacitor/geolocation";
import { Camera as CapCamera } from "@capacitor/camera";
import { Contacts } from "@capacitor-community/contacts";
import { useToast } from "@/hooks/use-toast";

interface PermissionStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  details: string[];
  granted?: boolean;
}

export const IOSPermissionOnboarding = ({ onComplete }: { onComplete: () => void }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const steps: PermissionStep[] = [
    {
      id: "intro",
      title: "Welcome to NeighborLink",
      description: "To give you the best experience, we need a few permissions",
      icon: ShieldCheckIcon,
      details: [
        "All permissions are optional",
        "You control what you share",
        "Change anytime in Settings",
        "Your privacy is our priority"
      ]
    },
    {
      id: "notifications",
      title: "Stay Connected",
      description: "Get notified about messages, safety alerts, and community updates",
      icon: BellIcon,
      details: [
        "Important safety alerts in your area",
        "Messages from neighbors",
        "Updates on your posts",
        "Event reminders"
      ]
    },
    {
      id: "location",
      title: "Find Your Community",
      description: "See posts, events, and neighbors near you",
      icon: MapPinIcon,
      details: [
        "See content relevant to your area",
        "Find nearby services and events",
        "Share your location only when you choose",
        "Works best with 'Always' access"
      ]
    },
    {
      id: "camera",
      title: "Share Moments",
      description: "Post photos and videos to your community",
      icon: CameraIcon,
      details: [
        "Share photos in posts and messages",
        "Upload profile pictures",
        "Document community events",
        "Report issues with photos"
      ]
    },
    {
      id: "contacts",
      title: "Connect Easier",
      description: "Find neighbors you already know (optional)",
      icon: UsersIcon,
      details: [
        "Find friends already on NeighborLink",
        "Invite contacts to join",
        "Never shared without permission",
        "Completely optional"
      ]
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = (currentStep / (steps.length - 1)) * 100;

  const requestPermission = async () => {
    const stepId = currentStepData.id;

    try {
      switch (stepId) {
        case "notifications":
          const notifResult = await LocalNotifications.requestPermissions();
          const granted = notifResult.display === "granted";
          setPermissions({ ...permissions, notifications: granted });
          toast({
            title: granted ? "Notifications enabled" : "Notifications skipped",
            description: granted ? "You'll receive important updates" : "You can enable this later in Settings"
          });
          break;

        case "location":
          const locResult = await Geolocation.requestPermissions();
          const locGranted = locResult.location === "granted";
          setPermissions({ ...permissions, location: locGranted });
          toast({
            title: locGranted ? "Location enabled" : "Location skipped",
            description: locGranted ? "You'll see nearby content" : "You can enable this later in Settings"
          });
          break;

        case "camera":
          const camResult = await CapCamera.requestPermissions();
          const camGranted = camResult.camera === "granted" && camResult.photos === "granted";
          setPermissions({ ...permissions, camera: camGranted });
          toast({
            title: camGranted ? "Camera enabled" : "Camera skipped",
            description: camGranted ? "You can now share photos" : "You can enable this later in Settings"
          });
          break;

        case "contacts":
          const contactsResult = await Contacts.requestPermissions();
          const contactsGranted = contactsResult.contacts === "granted";
          setPermissions({ ...permissions, contacts: contactsGranted });
          toast({
            title: contactsGranted ? "Contacts enabled" : "Contacts skipped",
            description: contactsGranted ? "Find friends on NeighborLink" : "You can enable this later"
          });
          break;
      }

      nextStep();
    } catch (error) {
      console.error("Permission request failed:", error);
      toast({
        title: "Couldn't request permission",
        description: "You can enable this later in Settings",
        variant: "destructive"
      });
      nextStep();
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const skipStep = () => {
    nextStep();
  };

  const Icon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col">
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
              <p className="text-muted-foreground">{currentStepData.description}</p>
            </div>
          </div>

          <div className="space-y-3">
            {currentStepData.details.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p>{detail}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4">
            {currentStepData.id === "intro" ? (
              <Button onClick={nextStep} className="w-full" size="lg">
                Get Started
                <ChevronRightIcon className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <>
                <Button onClick={requestPermission} className="w-full" size="lg">
                  {currentStep === steps.length - 1 ? "Finish Setup" : "Allow"}
                  <ChevronRightIcon className="h-5 w-5 ml-2" />
                </Button>
                
                <Button onClick={skipStep} variant="ghost" className="w-full">
                  {currentStep === steps.length - 1 ? "Skip" : "Not Now"}
                </Button>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can change these permissions anytime in Settings
          </p>
        </Card>
      </div>
    </div>
  );
};
