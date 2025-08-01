import { Button } from '@/components/ui/button';
import { Volume2, TestTube } from 'lucide-react';
import { playNotification } from '@/utils/audioUtils';
import { testAudioSystem } from '@/utils/audioTest';

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

  const runFullAudioTest = async () => {
    console.log('=== USER CLICKED FULL AUDIO TEST BUTTON ===');
    const success = await testAudioSystem();
    if (success) {
      alert('Full audio system test PASSED! Check console for details.');
    } else {
      alert('Full audio system test FAILED! Check console for details.');
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
      <Button 
        variant="outline" 
        size="sm" 
        onClick={runFullAudioTest}
        className="flex items-center gap-2"
      >
        <TestTube className="h-4 w-4" />
        Full Test
      </Button>
    </div>
  );
};

export default TestAudioButton;