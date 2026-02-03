import { useState, useCallback, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useGoogleMapsCache } from '@/hooks/useGoogleMapsCache';
import { MapLocation, isNativePlatform } from '@/utils/map-utils';

export const useUserLocation = () => {
    const { profile } = useProfile();
    const { geocodeAddress } = useGoogleMapsCache();
    const [userLocation, setUserLocation] = useState<MapLocation | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    const getProfileLocation = useCallback(async () => {
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
    }, [profile, geocodeAddress]);

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
            let location = await getProfileLocation();
            if (!location) {
                location = await getDeviceLocation();
            }
            return location;
        } finally {
            setIsLocating(false);
        }
    }, [getProfileLocation, getDeviceLocation]);

    useEffect(() => {
        refreshLocation();
    }, [refreshLocation]);

    return {
        userLocation,
        isLocating,
        refreshLocation,
        getProfileLocation,
        getDeviceLocation
    };
};
