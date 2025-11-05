import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { EmergencyFilters, SafetyAlert, PanicAlert } from '@/types/emergency';
import { useEmergencyAlerts } from '@/hooks/emergency/useEmergencyAlerts';
import { useEmergencySubscriptions } from '@/hooks/emergency/useEmergencySubscriptions';
import { useAlertSystem } from '@/hooks/useAlertSystem';

// Component imports
import EmergencyHeader from './EmergencyHeader';
import EmergencyStatsComponent from './EmergencyStats';
import HorizontalFilters, { FilterCategory } from './HorizontalFilters';
import SafetyAlertsSplitView from './SafetyAlertsSplitView';
import PanicAlertManager from './PanicAlertManager';
import AlertStatusManager from '../AlertStatusManager';

const EmergencyCenter = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { processAlert } = useAlertSystem();
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [selectedPanicAlert, setSelectedPanicAlert] = useState<PanicAlert | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [filters, setFilters] = useState<EmergencyFilters>({
    severity: 'all',
    type: 'all',
    status: 'all',
    category: 'all'
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

  const handleCategoryChange = (category: FilterCategory) => {
    console.log('[EmergencyCenter] Category changed:', category);
    setSelectedCategory(category);
    const newFilters = { ...filters, category };
    setFilters(newFilters);
    fetchAlerts(newFilters, true);
  };

  // User location will be undefined for now - can be added when geolocation is implemented
  const userLocation = undefined;

  const getLocationText = () => {
    if (profile?.neighborhood) {
      return `Alerts in ${profile.neighborhood}`;
    } else if (profile?.city) {
      return `Alerts in ${profile.city}`;
    } else if (profile?.state) {
      return `Alerts in ${profile.state}`;
    }
    return 'Safety Center';
  };

  return (
    <div className="space-y-3">
      <SafetyAlertsSplitView
        alerts={alerts}
        userLocation={userLocation}
        onAlertClick={setSelectedAlert}
        locationText={getLocationText()}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />

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