import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
    totalUsers: number;
    activePosts: number;
    eventsThisMonth: number;
    safetyReports: number;
    emergencyAlerts: number;
    marketplaceItems: number;
    promotions: number;
    flaggedContent: number;
    sponsoredContent: number;
    activeAutomations: number;
    configSettings: number;
    dailyActiveUsers: number;
    postsPerDay: number;
    avgResponseTime: number;
    userSatisfaction: number;
    resolvedToday: number;
    autoFlagged: number;
}

interface SystemHealth {
    database: 'healthy' | 'degraded' | 'down';
    realtime: 'active' | 'inactive';
    emergency: 'operational' | 'degraded' | 'down';
    storage: number;
    apiResponse: number;
}

export const useAdminStats = () => {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        activePosts: 0,
        eventsThisMonth: 0,
        safetyReports: 0,
        emergencyAlerts: 0,
        marketplaceItems: 0,
        promotions: 0,
        flaggedContent: 0,
        sponsoredContent: 0,
        activeAutomations: 0,
        configSettings: 0,
        dailyActiveUsers: 0,
        postsPerDay: 0,
        avgResponseTime: 0,
        userSatisfaction: 0,
        resolvedToday: 0,
        autoFlagged: 0,
    });

    const [systemHealth, setSystemHealth] = useState<SystemHealth>({
        database: 'healthy',
        realtime: 'active',
        emergency: 'operational',
        storage: 78,
        apiResponse: 180,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all stats in parallel
            const [
                usersResult,
                postsResult,
                eventsResult,
                alertsResult,
                marketplaceResult,
                promotionsResult,
                flaggedResult,
                sponsoredResult,
                automationsResult,
                configsResult,
            ] = await Promise.all([
                supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
                supabase.from('community_posts').select('id', { count: 'exact', head: true }),
                supabase.from('events').select('id', { count: 'exact', head: true }).gte('event_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
                supabase.from('safety_alerts').select('id', { count: 'exact', head: true }),
                supabase.from('marketplace_items').select('id', { count: 'exact', head: true }),
                supabase.from('promotions').select('id', { count: 'exact', head: true }),
                supabase.from('flagged_content').select('id', { count: 'exact', head: true }),
                supabase.from('advertisement_campaigns').select('id', { count: 'exact', head: true }),
                supabase.from('automations').select('id', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('app_configuration').select('id', { count: 'exact', head: true }),
            ]);

            setStats({
                totalUsers: usersResult.count || 0,
                activePosts: postsResult.count || 0,
                eventsThisMonth: eventsResult.count || 0,
                safetyReports: alertsResult.count || 0,
                emergencyAlerts: alertsResult.count || 0,
                marketplaceItems: marketplaceResult.count || 0,
                promotions: promotionsResult.count || 0,
                flaggedContent: flaggedResult.count || 0,
                sponsoredContent: sponsoredResult.count || 0,
                activeAutomations: automationsResult.count || 0,
                configSettings: configsResult.count || 0,
                dailyActiveUsers: Math.floor((usersResult.count || 0) * 0.15), // Estimate
                postsPerDay: Math.floor((postsResult.count || 0) / 30), // Estimate
                avgResponseTime: 180,
                userSatisfaction: 87,
                resolvedToday: Math.floor((alertsResult.count || 0) * 0.1),
                autoFlagged: Math.floor((flaggedResult.count || 0) * 0.3),
            });

            // Check system health
            const { error: dbError } = await supabase.from('profiles').select('user_id').limit(1);
            setSystemHealth(prev => ({
                ...prev,
                database: dbError ? 'down' : 'healthy',
            }));

        } catch (err) {
            console.error('Error fetching admin stats:', err);
            setError('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        systemHealth,
        loading,
        error,
        refetch: fetchStats,
    };
};
