import { useState, useEffect, useCallback } from 'react';

const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;
const getPlatform = () => (window as any).Capacitor?.getPlatform?.() || 'web';

interface KeyboardState {
  isVisible: boolean;
  keyboardHeight: number;
}

export const useIOSKeyboard = () => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    keyboardHeight: 0,
  });

  const isNative = isNativePlatform();
  const isIOS = getPlatform() === 'ios';

  useEffect(() => {
    if (!isNative || !isIOS) return;

    let showListener: any;
    let hideListener: any;

    const setupListeners = async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        
        showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
          setKeyboardState({
            isVisible: true,
            keyboardHeight: info.keyboardHeight,
          });
        });
        
        hideListener = await Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardState({
            isVisible: false,
            keyboardHeight: 0,
          });
        });
      } catch (error) {
        console.error('Failed to setup keyboard listeners:', error);
      }
    };

    setupListeners();

    return () => {
      showListener?.remove?.();
      hideListener?.remove?.();
    };
  }, [isNative, isIOS]);

  const scrollToInput = useCallback((element: HTMLElement) => {
    if (!isNative || !isIOS) return;

    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, [isNative, isIOS]);

  const hideKeyboard = useCallback(async () => {
    if (!isNative || !isIOS) return;

    try {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.hide();
    } catch (error) {
      console.error('Failed to hide keyboard:', error);
    }
  }, [isNative, isIOS]);

  return {
    ...keyboardState,
    scrollToInput,
    hideKeyboard,
  };
};
