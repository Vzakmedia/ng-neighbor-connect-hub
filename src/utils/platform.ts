/** Returns true when running inside a Capacitor native app (iOS or Android). */
export const isNativePlatform = (): boolean =>
  (window as any).Capacitor?.isNativePlatform?.() === true;
