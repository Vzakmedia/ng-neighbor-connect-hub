import { useState, useEffect, useCallback } from 'react';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

interface KeyboardState {
  isVisible: boolean;
  keyboardHeight: number;
}

export const useIOSKeyboard = () => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    keyboardHeight: 0,
  });

  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';

  useEffect(() => {
    if (!isNative || !isIOS) return;

    const handleKeyboardWillShow = (info: KeyboardInfo) => {
      setKeyboardState({
        isVisible: true,
        keyboardHeight: info.keyboardHeight,
      });
    };

    const handleKeyboardWillHide = () => {
      setKeyboardState({
        isVisible: false,
        keyboardHeight: 0,
      });
    };

    let showListener: any;
    let hideListener: any;

    const setupListeners = async () => {
      showListener = await Keyboard.addListener('keyboardWillShow', handleKeyboardWillShow);
      hideListener = await Keyboard.addListener('keyboardWillHide', handleKeyboardWillHide);
    };

    setupListeners();

    return () => {
      showListener?.remove();
      hideListener?.remove();
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
