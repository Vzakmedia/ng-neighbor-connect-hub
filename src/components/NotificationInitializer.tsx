import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { checkNotificationPermission } from '@/utils/audioUtils';
import { useToast } from '@/hooks/use-toast';

const NotificationInitializer = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const initializeNotifications = async () => {
      if (!user) return;

      try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
          console.log('Browser does not support notifications');
          return;
        }

        // Request notification permission if not already granted
        if (Notification.permission === 'default') {
          console.log('Requesting notification permission...');
          
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            toast({
              title: "Notifications Enabled",
              description: "You'll receive alerts for emergency situations and important updates.",
            });
            
            // Test notification to confirm it's working
            setTimeout(() => {
              new Notification('Welcome!', {
                body: 'Emergency alerts and notifications are now active.',
                icon: '/favicon.ico',
                silent: true,
                tag: 'welcome-notification'
              });
            }, 1000);
          } else if (permission === 'denied') {
            toast({
              title: "Notifications Blocked",
              description: "To receive emergency alerts, please enable notifications in your browser settings.",
              variant: "destructive",
            });
          }
        } else if (Notification.permission === 'granted') {
          console.log('Notification permission already granted');
        }

        // Initialize audio context on user interaction (required by browsers)
        const initializeAudio = () => {
          // Create a silent audio context to enable sound for later
          try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
              const audioContext = new AudioContext();
              if (audioContext.state === 'suspended') {
                audioContext.resume();
              }
              console.log('Audio context initialized for notifications');
            }
          } catch (error) {
            console.error('Error initializing audio context:', error);
          }
          
          // Remove event listener after first interaction
          document.removeEventListener('click', initializeAudio);
          document.removeEventListener('touchstart', initializeAudio);
        };

        // Wait for user interaction to initialize audio
        document.addEventListener('click', initializeAudio, { once: true });
        document.addEventListener('touchstart', initializeAudio, { once: true });

      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [user, toast]);

  // This component doesn't render anything
  return null;
};

export default NotificationInitializer;