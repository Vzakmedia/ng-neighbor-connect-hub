import { playNotification } from '@/utils/audioUtils';

// Simple test function to verify audio works
export const testAudioSystem = async (): Promise<boolean> => {
  console.log('=== AUDIO SYSTEM TEST START ===');
  
  try {
    // Test 1: Check if AudioContext is available
    console.log('Test 1: Checking AudioContext availability...');
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      console.error('Test 1 FAILED: AudioContext not supported in this browser');
      return false;
    }
    console.log('Test 1 PASSED: AudioContext is available');
    
    // Test 2: Try to create and use AudioContext
    console.log('Test 2: Creating AudioContext...');
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log('Test 2: AudioContext created with state:', audioContext.state);
    
    if (audioContext.state === 'suspended') {
      console.log('Test 2: AudioContext suspended, attempting to resume...');
      await audioContext.resume();
      console.log('Test 2: AudioContext resume attempt completed, new state:', audioContext.state);
    }
    
    if (audioContext.state !== 'running') {
      console.error('Test 2 FAILED: AudioContext not running after resume attempt');
      return false;
    }
    console.log('Test 2 PASSED: AudioContext is running');
    
    // Test 3: Try to play a simple sound
    console.log('Test 3: Attempting to play notification sound...');
    await playNotification('notification', 0.5);
    console.log('Test 3 COMPLETED: Notification sound function called without errors');
    
    console.log('=== AUDIO SYSTEM TEST COMPLETED SUCCESSFULLY ===');
    return true;
    
  } catch (error) {
    console.error('=== AUDIO SYSTEM TEST FAILED ===');
    console.error('Error details:', error);
    return false;
  }
};