import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNativePermissions } from '@/hooks/mobile/useNativePermissions';

export const GPSDiagnostic = () => {
  const { getCurrentPosition } = useNativePermissions();
  const [status, setStatus] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const runDiagnostic = async () => {
    setTesting(true);
    setStatus('🛰️ Testing GPS...\n\n');

    try {
      setStatus(prev => prev + 'Step 1: Checking permissions...\n');
      
      const position = await getCurrentPosition(25);
      const { latitude, longitude, accuracy, altitude, speed } = position.coords;
      
      setStatus(prev => prev + `✅ GPS Working!\n\n`);
      setStatus(prev => prev + `📍 Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n`);
      setStatus(prev => prev + `📏 Accuracy: ±${accuracy.toFixed(1)}m\n`);
      setStatus(prev => prev + `⛰️ Altitude: ${altitude ?? 'N/A'}m\n`);
      setStatus(prev => prev + `🏃 Speed: ${speed ?? 'N/A'}m/s\n\n`);
      
      if (accuracy <= 20) {
        setStatus(prev => prev + `✅ Excellent GPS accuracy!\n`);
      } else if (accuracy <= 50) {
        setStatus(prev => prev + `⚠️ Fair GPS accuracy. Move outdoors for better results.\n`);
      } else if (accuracy <= 100) {
        setStatus(prev => prev + `⚠️ Poor GPS accuracy. GPS satellites partially acquired.\n`);
      } else {
        setStatus(prev => prev + `❌ Very poor accuracy. GPS not working properly.\n`);
        setStatus(prev => prev + `Likely using cell tower / Wi-Fi positioning.\n\n`);
        setStatus(prev => prev + `Troubleshooting:\n`);
        setStatus(prev => prev + `• Are you indoors? Move outdoors.\n`);
        setStatus(prev => prev + `• Is GPS enabled in device settings?\n`);
        setStatus(prev => prev + `• Is browser allowed to access GPS?\n`);
        setStatus(prev => prev + `• Wait 30-60 seconds for GPS to warm up.\n`);
      }
      
    } catch (error) {
      setStatus(prev => prev + `\n❌ GPS Test Failed:\n${error}\n`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">GPS Diagnostic Tool</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Test your device's GPS accuracy and troubleshoot location issues.
      </p>
      <Button onClick={runDiagnostic} disabled={testing}>
        {testing ? 'Testing...' : 'Test GPS Accuracy'}
      </Button>
      {status && (
        <pre className="mt-4 p-3 bg-muted rounded text-sm whitespace-pre-wrap font-mono">
          {status}
        </pre>
      )}
    </Card>
  );
};
