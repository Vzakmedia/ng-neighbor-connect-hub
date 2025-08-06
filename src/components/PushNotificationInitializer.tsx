import { usePushNotifications } from "@/hooks/usePushNotifications";

// Component to initialize push notifications inside AuthProvider context
export const PushNotificationInitializer = () => {
  usePushNotifications();
  return null; // This component doesn't render anything
};