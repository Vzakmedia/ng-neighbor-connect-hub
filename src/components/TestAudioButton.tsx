import { Button } from '@/components/ui/button';
import { Volume2, TestTube } from 'lucide-react';
import { playNotification } from '@/utils/audioUtils';

const TestAudioButton = () => {
  const testNotificationSound = async () => {
    console.log('=== USER CLICKED TEST SOUND BUTTON ===');
    console.log('TestAudioButton: Test button clicked');
    try {
      console.log('TestAudioButton: Calling playNotification...');
      await playNotification('notification', 0.8);
      console.log('TestAudioButton: playNotification completed successfully');
      alert('Audio test completed! Check console for detailed logs.');
    } catch (error) {
      console.error('TestAudioButton: Error playing test notification:', error);
      alert('Audio test failed: ' + error.message + '\nCheck console for details.');
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={testNotificationSound}
        className="flex items-center gap-2"
      >
        <Volume2 className="h-4 w-4" />
        Test Sound
      </Button>
    </div>
  );
};

export default TestAudioButton;