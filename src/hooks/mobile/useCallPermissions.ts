import { useToast } from '@/components/ui/use-toast';
import { useNativePermissions } from './useNativePermissions';

export const useCallPermissions = () => {
  const { toast } = useToast();
  const { requestMicrophonePermission, requestCameraPermission } = useNativePermissions();

  const requestMicrophoneForCall = async (): Promise<boolean> => {
    try {
      const granted = await requestMicrophonePermission();
      
      if (!granted) {
        toast({
          title: "Microphone Access Required",
          description: "Please enable microphone access in your device settings to make voice calls.",
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request microphone access. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const requestVideoCallPermissions = async (): Promise<boolean> => {
    try {
      // Request microphone first
      const micGranted = await requestMicrophonePermission();
      
      if (!micGranted) {
        toast({
          title: "Microphone Access Required",
          description: "Please enable microphone access in your device settings to make video calls.",
          variant: "destructive"
        });
        return false;
      }

      // Then request camera
      const cameraGranted = await requestCameraPermission();
      
      if (!cameraGranted) {
        toast({
          title: "Camera Access Required",
          description: "Please enable camera access in your device settings to make video calls.",
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting video call permissions:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request camera and microphone access. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    requestMicrophoneForCall,
    requestVideoCallPermissions
  };
};
