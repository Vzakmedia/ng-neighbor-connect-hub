import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApiStatus {
    googleMaps: 'unknown' | 'active' | 'error';
    stripe: 'unknown' | 'active' | 'error';
    mapbox: 'unknown' | 'active' | 'error';
    sms: 'unknown' | 'active' | 'error';
    email: 'unknown' | 'active' | 'error';
    supabase: 'unknown' | 'active' | 'error';
    webhooks: 'unknown' | 'active' | 'error';
}

interface ApiConfig {
    googleMaps: { enabled: boolean; hasKey: boolean; defaultZoom: number };
    stripe: { enabled: boolean; hasKey: boolean; currency: string };
    mapbox: { enabled: boolean; hasKey: boolean; style: string };
    email: { enabled: boolean; fromAddress: string };
    push: { enabled: boolean; emergencyPriority: boolean };
    webhooks: { enabled: boolean; secret: boolean; timeout: number };
    sms: { enabled: boolean; provider: string };
    supabase: { connected: boolean; url: string; project: string };
}

export const useApiIntegrations = (userId?: string) => {
    const { toast } = useToast();
    const [apiStatus, setApiStatus] = useState<ApiStatus>({
        googleMaps: 'unknown',
        stripe: 'unknown',
        mapbox: 'unknown',
        sms: 'unknown',
        email: 'unknown',
        supabase: 'unknown',
        webhooks: 'unknown',
    });

    const [currentApiConfig, setCurrentApiConfig] = useState<ApiConfig>({
        googleMaps: { enabled: false, hasKey: false, defaultZoom: 12 },
        stripe: { enabled: false, hasKey: false, currency: 'NGN' },
        mapbox: { enabled: false, hasKey: false, style: 'light' },
        email: { enabled: true, fromAddress: '' },
        push: { enabled: true, emergencyPriority: true },
        webhooks: { enabled: false, secret: false, timeout: 30 },
        sms: { enabled: false, provider: 'twilio' },
        supabase: { connected: true, url: '', project: 'cowiviqhrnmhttugozbz' },
    });

    const [testingApi, setTestingApi] = useState('');
    const [monitoringActive, setMonitoringActive] = useState(false);
    const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const checkApiStatus = useCallback(async () => {
        try {
            // Check Google Maps
            const mapsResponse = await supabase.functions.invoke('get-google-maps-token');
            setApiStatus(prev => ({
                ...prev,
                googleMaps: mapsResponse.error ? 'error' : 'active',
            }));

            // Check Stripe
            const stripeResponse = await supabase.functions.invoke('test-stripe-api');
            setApiStatus(prev => ({
                ...prev,
                stripe: stripeResponse.error ? 'error' : 'active',
            }));

            // Check Mapbox
            const mapboxResponse = await supabase.functions.invoke('test-mapbox-api');
            setApiStatus(prev => ({
                ...prev,
                mapbox: mapboxResponse.error ? 'error' : 'active',
            }));

            // Check Supabase
            const { error: supabaseError } = await supabase
                .from('app_configuration')
                .select('config_key')
                .limit(1);

            setApiStatus(prev => ({
                ...prev,
                supabase: supabaseError ? 'error' : 'active',
            }));
        } catch (error) {
            console.error('Error checking API status:', error);
        }
    }, []);

    const fetchApiConfig = useCallback(async () => {
        try {
            const { data: configs, error } = await supabase
                .from('app_configuration')
                .select('config_key, config_value')
                .in('config_key', [
                    'google_maps_enabled', 'maps_default_zoom',
                    'stripe_enabled', 'stripe_currency',
                    'mapbox_enabled', 'mapbox_style',
                    'email_enabled', 'email_from_address',
                    'push_notifications_enabled', 'emergency_push_priority',
                    'webhooks_enabled', 'webhook_secret', 'webhook_timeout',
                    'sms_enabled', 'sms_provider',
                ]);

            if (error) throw error;

            const configMap: Record<string, any> = {};
            configs?.forEach(config => {
                configMap[config.config_key] = config.config_value;
            });

            setCurrentApiConfig({
                googleMaps: {
                    enabled: configMap['google_maps_enabled'] || false,
                    hasKey: true,
                    defaultZoom: configMap['maps_default_zoom'] || 12,
                },
                stripe: {
                    enabled: configMap['stripe_enabled'] || false,
                    hasKey: true,
                    currency: configMap['stripe_currency'] || 'NGN',
                },
                mapbox: {
                    enabled: configMap['mapbox_enabled'] || false,
                    hasKey: true,
                    style: configMap['mapbox_style'] || 'mapbox://styles/mapbox/light-v11',
                },
                email: {
                    enabled: configMap['email_enabled'] !== false,
                    fromAddress: configMap['email_from_address'] || '',
                },
                push: {
                    enabled: configMap['push_notifications_enabled'] !== false,
                    emergencyPriority: configMap['emergency_push_priority'] !== false,
                },
                webhooks: {
                    enabled: configMap['webhooks_enabled'] || false,
                    secret: !!configMap['webhook_secret'],
                    timeout: configMap['webhook_timeout'] || 30,
                },
                sms: {
                    enabled: configMap['sms_enabled'] || false,
                    provider: configMap['sms_provider'] || 'twilio',
                },
                supabase: {
                    connected: true,
                    url: 'https://cowiviqhrnmhttugozbz.supabase.co',
                    project: 'cowiviqhrnmhttugozbz',
                },
            });
        } catch (error) {
            console.error('Error fetching API config:', error);
        }
    }, []);

    const testApiIntegration = useCallback(async (apiType: string) => {
        setTestingApi(apiType);

        try {
            switch (apiType) {
                case 'googleMaps':
                    const mapsResponse = await supabase.functions.invoke('get-google-maps-token');
                    if (mapsResponse.error) throw new Error(mapsResponse.error.message);
                    setApiStatus(prev => ({ ...prev, googleMaps: 'active' }));
                    toast({
                        title: 'Google Maps API ✅',
                        description: 'API is working correctly',
                    });
                    break;

                case 'stripe':
                    const stripeResponse = await supabase.functions.invoke('test-stripe-api');
                    if (stripeResponse.error) throw new Error(stripeResponse.error.message);
                    setApiStatus(prev => ({ ...prev, stripe: 'active' }));
                    toast({
                        title: 'Stripe API ✅',
                        description: 'Connected successfully',
                    });
                    break;

                case 'email':
                    const emailResponse = await supabase.functions.invoke('send-email-notification', {
                        body: {
                            to: 'admin@example.com',
                            subject: 'API Test Email',
                            body: 'Test email from admin dashboard',
                            type: 'admin_test',
                            userId,
                        },
                    });
                    if (emailResponse.error) throw new Error(emailResponse.error.message);
                    setApiStatus(prev => ({ ...prev, email: 'active' }));
                    toast({
                        title: 'Email Service ✅',
                        description: 'Test email sent successfully',
                    });
                    break;

                default:
                    throw new Error(`API test not implemented for: ${apiType}`);
            }
        } catch (error: any) {
            console.error(`${apiType} API test error:`, error);
            setApiStatus(prev => ({ ...prev, [apiType]: 'error' }));
            toast({
                title: `${apiType} API Test Failed ❌`,
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setTestingApi('');
        }
    }, [userId, toast]);

    const startLiveMonitoring = useCallback(() => {
        setMonitoringActive(true);
        checkApiStatus();

        const interval = setInterval(() => {
            checkApiStatus();
        }, 30000); // Every 30 seconds

        monitoringIntervalRef.current = interval;
    }, [checkApiStatus]);

    const stopLiveMonitoring = useCallback(() => {
        setMonitoringActive(false);
        if (monitoringIntervalRef.current) {
            clearInterval(monitoringIntervalRef.current);
            monitoringIntervalRef.current = null;
        }
    }, []);

    return {
        apiStatus,
        currentApiConfig,
        testingApi,
        monitoringActive,
        checkApiStatus,
        fetchApiConfig,
        testApiIntegration,
        startLiveMonitoring,
        stopLiveMonitoring,
    };
};
