
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UseLiveKitTokenResult {
    token: string | null;
    isLoading: boolean;
    error: Error | null;
    fetchToken: (roomName: string, participantName?: string) => Promise<string | null>;
}

export const useLiveKitToken = (): UseLiveKitTokenResult => {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchToken = useCallback(async (roomName: string, participantName?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: funcError } = await supabase.functions.invoke('livekit-token', {
                body: {
                    roomName,
                    participantName
                },
            });

            if (funcError) {
                throw new Error(funcError.message || 'Failed to fetch token');
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            if (!data?.token) {
                throw new Error('No token received');
            }

            setToken(data.token);
            return data.token;
        } catch (err: any) {
            console.error('Error fetching LiveKit token:', err);
            setError(err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { token, isLoading, error, fetchToken };
};
