const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;
const getPlatform = () => (window as any).Capacitor?.getPlatform?.() || 'web';

export const useNativeStatusBar = () => {
  const isNative = isNativePlatform();

  const setStyle = async (style: 'light' | 'dark') => {
    if (!isNative) return;

    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({
        style: style === 'light' ? Style.Light : Style.Dark,
      });
    } catch (error) {
      console.error('StatusBar error:', error);
    }
  };

  const setBackgroundColor = async (color: string) => {
    if (!isNative || getPlatform() !== 'android') return;

    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.error('StatusBar error:', error);
    }
  };

  const show = async () => {
    if (!isNative) return;

    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.show();
    } catch (error) {
      console.error('StatusBar error:', error);
    }
  };

  const hide = async () => {
    if (!isNative) return;

    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.hide();
    } catch (error) {
      console.error('StatusBar error:', error);
    }
  };

  return {
    setStyle,
    setBackgroundColor,
    show,
    hide,
    isNative,
  };
};

/**
 * Initialize status bar on app start
 */
export const initializeStatusBar = async (theme: 'light' | 'dark' = 'light') => {
  if (!isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({
      style: theme === 'light' ? Style.Dark : Style.Light,
    });

    if (getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#667eea' });
    }
  } catch (error) {
    console.error('Failed to initialize status bar:', error);
  }
};
