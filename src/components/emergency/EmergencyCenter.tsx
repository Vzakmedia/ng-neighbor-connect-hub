import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { EmergencyFilters, EmergencyViewMode, SafetyAlert, PanicAlert } from '@/types/emergency';
import { useEmergencyAlerts } from '@/hooks/emergency/useEmergencyAlerts';
import { useEmergencySubscriptions } from '@/hooks/emergency/useEmergencySubscriptions';
import { useAlertSystem } from '@/hooks/useAlertSystem';

// Component imports
import EmergencyHeader from './EmergencyHeader';
import EmergencyStatsComponent from './EmergencyStats';
import EmergencyFiltersComponent from './EmergencyFilters';
import EmergencyAlertList from './EmergencyAlertList';
import PanicAlertManager from './PanicAlertManager';
import SafetyMap from '../SafetyMap';
import AlertStatusManager from '../AlertStatusManager';
import RealTimeAlertFeed from '../RealTimeAlertFeed';
import { AlertDashboard } from '../alert-system/AlertDashboard';

const EmergencyCenter = () => {
  const { user } = useAuth();
  const { processAlert } = useAlertSystem();
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [selectedPanicAlert, setSelectedPanicAlert] = useState<PanicAlert | null>(null);
  const [viewMode, setViewMode] = useState<EmergencyViewMode['mode']>('list');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filters, setFilters] = useState<EmergencyFilters>({
    severity: 'all',
    type: 'all',
    status: 'all'
  });

  const {
    alerts,
    panicAlerts,
    loading,
    fetchAlerts,
    fetchPanicAlerts,
    updateAlertStatus,
    updatePanicAlertStatus,
    addNewAlert,
    setAlerts,
    clearCache
  } = useEmergencyAlerts();

  // Set up real-time subscriptions with reduced frequency
  useEmergencySubscriptions({
    onNewAlert: async (newAlert) => {
      // Add to local state for immediate UI update
      addNewAlert(newAlert);
      
      // Process through alert system for real-time delivery
      try {
        await processAlert(newAlert.id, getSeverityPriority(newAlert.severity));
      } catch (error) {
        console.error('Failed to process new alert:', error);
      }
    },
    onAlertUpdate: (alertId, updates) => {
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, ...updates } : alert
        )
      );
    },
    onRefreshNeeded: () => {
      console.log('Emergency subscription error - manual refresh needed');
    },
    filters
  });

  const getSeverityPriority = (severity: string): number => {
    switch (severity) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      case 'low': return 4;
      default: return 3;
    }
  };

  useEffect(() => {
    if (user) {
      console.log('EmergencyCenter: Initial data fetch');
      clearCache(); // Clear cache when user changes
      fetchAlerts(filters, true); // Force initial fetch
      fetchPanicAlerts(true);
    }
  }, [user, clearCache]); // Only depend on user, not filters

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const handlePanicAlertStatusUpdate = (alertId: string, newStatus: string) => {
    updatePanicAlertStatus(alertId, newStatus);
    
    if (selectedPanicAlert?.id === alertId) {
      setSelectedPanicAlert(prev => prev ? { 
        ...prev, 
        is_resolved: newStatus === 'resolved',
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString() 
      } : null);
    }

    // Refresh safety alerts as they should be updated by the trigger
    setTimeout(() => fetchAlerts(filters), 1000);
  };

  const handleStatusUpdate = (alertId: string, newStatus: string, note?: string) => {
    updateAlertStatus(alertId, newStatus);
    
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(prev => prev ? { ...prev, status: newStatus as any } : null);
    }

    // Also refresh panic alerts to keep both views in sync
    fetchPanicAlerts(true);
  };

  const handleRefresh = () => {
    console.log('EmergencyCenter: Manual refresh triggered');
    fetchAlerts(filters, true); // Force refresh
    fetchPanicAlerts(true);
  };

  // Filter change handler that triggers refetch
  const handleFilterChange = (newFilters: EmergencyFilters) => {
    console.log('EmergencyCenter: Filters changed', newFilters);
    setFilters(newFilters);
    fetchAlerts(newFilters, true); // Force refresh on filter change
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Header with Panic Button */}
      <EmergencyHeader />

      {/* Quick Stats */}
      <EmergencyStatsComponent 
        alerts={alerts}
        panicAlerts={panicAlerts}
        userId={user?.id}
      />

      {/* View Toggle and Filters */}
      <EmergencyFiltersComponent
        filters={filters}
        viewMode={viewMode}
        onFilterChange={handleFilterChange}
        onViewModeChange={setViewMode}
        onRefresh={handleRefresh}
        autoRefresh={autoRefresh}
        onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
      />

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as EmergencyViewMode['mode'])}>
        <TabsList className="md:hidden grid w-full grid-cols-4">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          <EmergencyAlertList
            alerts={alerts}
            loading={loading}
            onAlertClick={(alert: SafetyAlert) => setSelectedAlert(alert)}
            getTimeSince={getTimeSince}
          />
        </TabsContent>

        {/* Map View */}
        <TabsContent value="map" className="space-y-4">
          <div className="h-[600px] w-full rounded-lg border overflow-hidden">
            <SafetyMap 
              alerts={alerts}
              onAlertClick={(alert: SafetyAlert) => setSelectedAlert(alert)}
            />
          </div>
        </TabsContent>

        {/* Live Feed */}
        <TabsContent value="feed" className="space-y-4">
          <RealTimeAlertFeed 
            onAlertClick={(alert) => {
              // Convert RealtimeAlert to SafetyAlert format - we'll just handle the basic case
              setSelectedAlert(null); // For now, just clear selection as RealTimeAlertFeed has different structure
            }}
          />
          </TabsContent>

        {/* System Dashboard */}
        <TabsContent value="system" className="space-y-4">
          <AlertDashboard />
        </TabsContent>
      </Tabs>

      {/* Alert Details Dialog */}
      {selectedAlert && (
        <AlertStatusManager
          alert={selectedAlert}
          onStatusUpdate={handleStatusUpdate}
          isOwner={selectedAlert.user_id === user?.id}
          canModerate={true} // You can implement proper permission check here
        />
      )}

      {/* Panic Alert Details Dialog */}
      <PanicAlertManager
        panicAlert={selectedPanicAlert}
        isOpen={!!selectedPanicAlert}
        onClose={() => setSelectedPanicAlert(null)}
        onStatusUpdate={handlePanicAlertStatusUpdate}
        getTimeSince={getTimeSince}
      />
    </div>
  );
};

export default EmergencyCenter;