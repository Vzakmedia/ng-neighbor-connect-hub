import { useState, useEffect } from 'react';
const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

export interface BatteryInfo {
  batteryLevel: number; // 0.0 to 1.0
  isCharging: boolean;
  isLowBattery: boolean; // < 20%
  isCriticalBattery: boolean; // < 10%
}

export const useBatteryStatus = () => {
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo>({
    batteryLevel: 1.0,
    isCharging: false,
    isLowBattery: false,
    isCriticalBattery: false,
  });
  const isNative = isNativePlatform();

  useEffect(() => {
    if (!isNative) {
      // Web fallback using Battery Status API
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          const updateBatteryInfo = () => {
            setBatteryInfo({
              batteryLevel: battery.level,
              isCharging: battery.charging,
              isLowBattery: battery.level < 0.2,
              isCriticalBattery: battery.level < 0.1,
            });
          };

          updateBatteryInfo();
          battery.addEventListener('levelchange', updateBatteryInfo);
          battery.addEventListener('chargingchange', updateBatteryInfo);

          return () => {
            battery.removeEventListener('levelchange', updateBatteryInfo);
            battery.removeEventListener('chargingchange', updateBatteryInfo);
          };
        });
      }
      return;
    }

    // Native battery status
    let mounted = true;

    const checkBattery = async () => {
      try {
        const { Device } = await import('@capacitor/device');
        const info = await Device.getBatteryInfo();
        if (mounted && info.batteryLevel !== undefined) {
          setBatteryInfo({
            batteryLevel: info.batteryLevel,
            isCharging: info.isCharging || false,
            isLowBattery: info.batteryLevel < 0.2,
            isCriticalBattery: info.batteryLevel < 0.1,
          });
        }
      } catch (error) {
        console.error('Error getting battery info:', error);
      }
    };

    // Check immediately
    checkBattery();

    // Check every 5 minutes
    const interval = setInterval(checkBattery, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isNative]);

  return {
    ...batteryInfo,
    isNative,
    shouldPauseBackgroundTasks: batteryInfo.isLowBattery && !batteryInfo.isCharging,
    shouldReduceQuality: batteryInfo.isLowBattery,
  };
};
