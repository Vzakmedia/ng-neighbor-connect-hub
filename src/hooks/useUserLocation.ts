import { useState, useCallback, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useGoogleMapsCache } from '@/hooks/useGoogleMapsCache';
import { MapLocation, isNativePlatform } from '@/utils/map-utils';

export const useUserLocation = () => {
    const { profile } = useProfile();
    const { geocodeAddress, isScriptLoaded } = useGoogleMapsCache();
    const [userLocation, setUserLocation] = useState<MapLocation | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    const getProfileLocation = useCallback(async () => {
        if (!isScriptLoaded) return null;

        if (profile?.neighborhood || profile?.city || profile?.state) {
            const addressParts = [
                profile.neighborhood,
                profile.city,
                profile.state,
                'Nigeria'
            ].filter(Boolean);

            const fullAddress = addressParts.join(', ');
            const location = await geocodeAddress(fullAddress);

            if (location) {
                setUserLocation(location);
                return location;
            }
        }
        return null;
    }, [profile, geocodeAddress, isScriptLoaded]);

    const getDeviceLocation = useCallback(async () => {
        return new Promise<MapLocation | null>((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(location);
                    resolve(location);
                },
                (error) => {
                    console.warn('Geolocation error:', error.message);
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    }, []);

    const refreshLocation = useCallback(async () => {
        setIsLocating(true);
        try {
            let location = null;
            // Only try profile location if map script is ready, otherwise we might fail or just need to wait
            if (isScriptLoaded) {
                location = await getProfileLocation();
            }

            // If no profile location (or script not ready), try device location as fallback
            if (!location) {
                location = await getDeviceLocation();
            }
            return location;
        } finally {
            setIsLocating(false);
        }
    }, [getProfileLocation, getDeviceLocation, isScriptLoaded]);

    useEffect(() => {
        refreshLocation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    return {
        userLocation,
        isLocating,
        refreshLocation,
        getProfileLocation,
        getDeviceLocation
    };
};
