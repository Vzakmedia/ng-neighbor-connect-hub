import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export interface AudioPermissionState {
    granted: boolean;
    requesting: boolean;
    error: string | null;
}

export const useAudioPermissions = () => {
    const [permissionState, setPermissionState] = useState<AudioPermissionState>({
        granted: false,
        requesting: false,
        error: null,
    });

    const requestPermission = async (): Promise<boolean> => {
        setPermissionState(prev => ({ ...prev, requesting: true, error: null }));

        try {
            // On web, use browser API
            if (!Capacitor.isNativePlatform()) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    // Stop the stream immediately, we just needed permission
                    stream.getTracks().forEach(track => track.stop());
                    setPermissionState({ granted: true, requesting: false, error: null });
                    return true;
                } catch (err: any) {
                    const error = err.name === 'NotAllowedError'
                        ? 'Microphone permission denied'
                        : 'Could not access microphone';
                    setPermissionState({ granted: false, requesting: false, error });
                    return false;
                }
            }

            // On native platforms, check if already granted
            if (Capacitor.isNativePlatform()) {
                // For native, we'll rely on LiveKit's built-in permission handling
                // But we can pre-check using Capacitor Permissions if available
                try {
                    const { Permissions } = await import('@capacitor/core');
                    // Note: There's no direct RECORD_AUDIO in Capacitor core permissions
                    // LiveKit will handle this, but we can try to request via getUserMedia
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(track => track.stop());
                    setPermissionState({ granted: true, requesting: false, error: null });
                    return true;
                } catch (err: any) {
                    console.error('Permission error:', err);
                    setPermissionState({
                        granted: false,
                        requesting: false,
                        error: 'Please enable microphone permission in Settings'
                    });
                    return false;
                }
            }

            return false;
        } catch (error: any) {
            console.error('Unexpected permission error:', error);
            setPermissionState({
                granted: false,
                requesting: false,
                error: error.message || 'Permission request failed'
            });
            return false;
        }
    };

    // Check permission on mount
    useEffect(() => {
        const checkPermission = async () => {
            try {
                const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                setPermissionState(prev => ({
                    ...prev,
                    granted: result.state === 'granted'
                }));

                // Listen for permission changes
                result.addEventListener('change', () => {
                    setPermissionState(prev => ({
                        ...prev,
                        granted: result.state === 'granted'
                    }));
                });
            } catch (err) {
                // Permissions API not supported, will check when requesting
                console.log('Permissions API not supported');
            }
        };

        checkPermission();
    }, []);

    return {
        ...permissionState,
        requestPermission,
    };
};
