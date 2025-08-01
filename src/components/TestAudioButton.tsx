import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { playNotification } from '@/utils/audioUtils';

const TestAudioButton = () => {
  const testNotificationSound = async () => {
    try {
      await playNotification('notification', 0.8);
      console.log('Test notification sound played');
    } catch (error) {
      console.error('Error playing test notification:', error);
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