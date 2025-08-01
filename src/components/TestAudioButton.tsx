import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { playNotification } from '@/utils/audioUtils';

const TestAudioButton = () => {
  const testNotificationSound = async () => {
    console.log('TestAudioButton: Test button clicked');
    try {
      console.log('TestAudioButton: Calling playNotification...');
      await playNotification('notification', 0.8);
      console.log('TestAudioButton: playNotification completed successfully');
    } catch (error) {
      console.error('TestAudioButton: Error playing test notification:', error);
      alert('Audio test failed: ' + error.message);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={testNotificationSound}
      className="flex items-center gap-2"
    >
      <Volume2 className="h-4 w-4" />
      Test Sound
    </Button>
  );
};

export default TestAudioButton;