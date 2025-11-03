import { useState, useCallback, useEffect } from 'react';
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
import { useNativeStorage } from './useNativeStorage';

interface BiometricInfo {
  isAvailable: boolean;
  biometryType: BiometryType;
  reason: string;
}

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>(BiometryType.none);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const { toast } = useToast();
  const { getItem, setItem, removeItem } = useNativeStorage();
  const isNative = Capacitor.isNativePlatform();

  // Check biometric availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!isNative) {
        setIsAvailable(false);
        return;
      }

      try {
        const result = await BiometricAuth.checkBiometry();
        setIsAvailable(result.isAvailable);
        setBiometryType(result.biometryType);

        // Check if user has enabled biometric login
        const enabled = await getItem('biometric_enabled');
        setBiometricEnabled(enabled === 'true');
      } catch (error) {
        console.error('Error checking biometry:', error);
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, [isNative, getItem]);

  const getBiometricName = useCallback((): string => {
    switch (biometryType) {
      case BiometryType.faceId:
        return 'Face ID';
      case BiometryType.touchId:
        return 'Touch ID';
      case BiometryType.fingerprintAuthentication:
        return 'Fingerprint';
      case BiometryType.faceAuthentication:
        return 'Face Recognition';
      case BiometryType.irisAuthentication:
        return 'Iris Scan';
      default:
        return 'Biometric';
    }
  }, [biometryType]);

  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    if (!isNative || !isAvailable) {
      console.log('Biometric authentication not available');
      return false;
    }

    try {
      setIsLoading(true);
      await BiometricAuth.authenticate({
        reason: reason || `Login with ${getBiometricName()}`,
        cancelTitle: 'Use Password',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Use Passcode',
        androidTitle: 'Authenticate',
        androidSubtitle: 'Login to Neighborlink',
        androidConfirmationRequired: false,
      });

      // If we get here without exception, authentication succeeded
      return true;
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      
      // Don't show error for user cancellation
      if (error.code === 'userCancel' || error.code === 'appCancel') {
        return false;
      }

      toast({
        title: 'Authentication Failed',
        description: error.message || 'Failed to authenticate',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, isAvailable, getBiometricName, toast]);

  const enableBiometric = useCallback(async (authToken: string): Promise<boolean> => {
    if (!isNative || !isAvailable) {
      toast({
        title: 'Not Available',
        description: `${getBiometricName()} is not available on this device`,
        variant: 'destructive',
      });
      return false;
    }

    try {
      setIsLoading(true);
      
      // First, authenticate to confirm user identity
      const verified = await authenticate(`Enable ${getBiometricName()} login`);
      
      if (!verified) {
        return false;
      }

      // Store encrypted auth token in secure storage
      await setItem('biometric_auth_token', authToken);
      await setItem('biometric_enabled', 'true');
      setBiometricEnabled(true);

      toast({
        title: 'Enabled',
        description: `${getBiometricName()} login is now enabled`,
      });

      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable biometric login',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, isAvailable, authenticate, getBiometricName, setItem, toast]);

  const disableBiometric = useCallback(async (): Promise<void> => {
    try {
      await removeItem('biometric_auth_token');
      await removeItem('biometric_enabled');
      setBiometricEnabled(false);

      toast({
        title: 'Disabled',
        description: `${getBiometricName()} login has been disabled`,
      });
    } catch (error) {
      console.error('Error disabling biometric:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable biometric login',
        variant: 'destructive',
      });
    }
  }, [removeItem, getBiometricName, toast]);

  const loginWithBiometric = useCallback(async (): Promise<string | null> => {
    if (!isNative || !isAvailable || !biometricEnabled) {
      return null;
    }

    try {
      setIsLoading(true);
      
      // Authenticate with biometrics
      const verified = await authenticate('Login to Neighborlink');
      
      if (!verified) {
        return null;
      }

      // Retrieve stored auth token
      const authToken = await getItem('biometric_auth_token');
      
      if (!authToken) {
        toast({
          title: 'Error',
          description: 'Biometric login data not found. Please login with password.',
          variant: 'destructive',
        });
        await disableBiometric();
        return null;
      }

      return authToken;
    } catch (error) {
      console.error('Error during biometric login:', error);
      toast({
        title: 'Login Failed',
        description: 'Please try logging in with your password',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, isAvailable, biometricEnabled, authenticate, getItem, disableBiometric, toast]);

  return {
    isAvailable,
    biometryType,
    biometricName: getBiometricName(),
    isLoading,
    isNative,
    biometricEnabled,
    authenticate,
    enableBiometric,
    disableBiometric,
    loginWithBiometric,
  };
};
