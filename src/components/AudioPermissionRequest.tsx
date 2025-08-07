import { toast } from 'sonner';
import { AudioInitializer } from './AudioInitializer';

// Component to show audio permission request
export const AudioPermissionRequest = () => {
  const requestPermission = async () => {
    try {
      console.log('Requesting notification permission...');
      
      // Request notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        
        if (permission === 'granted') {
          toast.success('Audio permissions granted! Sounds will now work.');
        } else {
          toast.error('Audio permissions denied. Please enable in browser settings.');
        }
      }
      
      // Initialize audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('Audio context resumed');
      }
      
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      toast.error('Failed to initialize audio. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-muted/50">
      <p className="text-sm text-center text-muted-foreground">
        To enable notification sounds, please allow audio permissions for this site.
      </p>
      <button
        onClick={requestPermission}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Enable Audio Notifications
      </button>
      <AudioInitializer />
    </div>
  );
};