import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Play } from 'lucide-react';

// Simple embedded notification tester
const NotificationTester = () => {
  // Log when component mounts
  useEffect(() => {
    console.log('NotificationTester: Component mounted - audio requires user interaction');
  }, []);

  const testBasicAudio = async () => {
    console.log('=== BASIC AUDIO TEST ===');
    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.error('AudioContext not supported');
        alert('AudioContext not supported in this browser');
        return;
      }

      const audioContext = new AudioContext();
      console.log('AudioContext created, state:', audioContext.state);

      // Resume if suspended
      if (audioContext.state === 'suspended') {
        console.log('Resuming suspended AudioContext...');
        await audioContext.resume();
        console.log('AudioContext resumed, new state:', audioContext.state);
      }

      // Create simple beep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800 Hz tone
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      console.log('Basic audio test completed successfully');
    } catch (error) {
      console.error('Basic audio test failed:', error);
      alert('Audio test failed: ' + error.message);
    }
  };

  const testNotificationFile = async () => {
    console.log('=== NOTIFICATION FILE TEST ===');
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.8;
      console.log('Audio element created');
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        console.log('Notification file played successfully');
      }
    } catch (error) {
      console.error('Notification file test failed:', error);
      alert('Notification file test failed: ' + error.message);
    }
  };

  const testUserInteractionAudio = async () => {
    console.log('=== USER INTERACTION AUDIO TEST ===');
    console.log('User clicked - testing audio with user gesture');
    await testBasicAudio();
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-background border rounded-lg p-4 shadow-lg">
      <h3 className="font-semibold mb-2">Audio Test Panel</h3>
      <div className="space-y-2">
        <Button 
          onClick={testUserInteractionAudio}
          size="sm"
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          Test Audio (Click)
        </Button>
        <Button 
          onClick={testNotificationFile}
          size="sm" 
          variant="outline"
          className="w-full"
        >
          <Volume2 className="h-4 w-4 mr-2" />
          Test MP3 File
        </Button>
      </div>
    </div>
  );
};

export default NotificationTester;