import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { EmergencyFilters, EmergencyViewMode, SafetyAlert, PanicAlert } from '@/types/emergency';
import { useEmergencyAlerts } from '@/hooks/emergency/useEmergencyAlerts';
import { useEmergencySubscriptions } from '@/hooks/emergency/useEmergencySubscriptions';

// Component imports
import EmergencyHeader from './EmergencyHeader';
import EmergencyStatsComponent from './EmergencyStats';
import EmergencyFiltersComponent from './EmergencyFilters';
import EmergencyAlertList from './EmergencyAlertList';
import PanicAlertManager from './PanicAlertManager';
import SafetyMap from '../SafetyMap';
import AlertStatusManager from '../AlertStatusManager';
import RealTimeAlertFeed from '../RealTimeAlertFeed';

const EmergencyCenter = () => {
  const { user } = useAuth();
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
    setAlerts
  } = useEmergencyAlerts();

  // Set up real-time subscriptions
  useEmergencySubscriptions({
    onNewAlert: addNewAlert,
    onAlertUpdate: (alertId, updates) => {
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, ...updates } : alert
        )
      );
    },
    onRefreshNeeded: () => {
      fetchAlerts(filters);
      fetchPanicAlerts();
    },
    filters
  });

  useEffect(() => {
    if (user) {
      fetchAlerts(filters);
      fetchPanicAlerts();
    }
  }, [user, filters, fetchAlerts, fetchPanicAlerts]);

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
  };

  const handleRefresh = () => {
    fetchAlerts(filters);
    fetchPanicAlerts();
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
        onFilterChange={setFilters}
        onViewModeChange={setViewMode}
        onRefresh={handleRefresh}
        autoRefresh={autoRefresh}
        onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
      />

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as EmergencyViewMode['mode'])}>
        <TabsList className="md:hidden grid w-full grid-cols-3">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
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