import { Card, CardContent } from '@/components/ui/card';
import { ExclamationTriangleIcon, CheckCircleIcon, MagnifyingGlassIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { SafetyAlert, PanicAlert, EmergencyStats } from '@/types/emergency';

interface EmergencyStatsProps {
  alerts: SafetyAlert[];
  panicAlerts: PanicAlert[];
  userId?: string;
}

const EmergencyStatsComponent = ({ alerts, panicAlerts, userId }: EmergencyStatsProps) => {
  const stats: EmergencyStats = {
    activeAlerts: alerts.filter(a => a.status === 'active').length,
    resolvedToday: alerts.filter(a => 
      a.status === 'resolved' && 
      new Date(a.created_at).toDateString() === new Date().toDateString()
    ).length,
    investigating: alerts.filter(a => a.status === 'investigating').length,
    myPanicAlerts: panicAlerts.filter(a => a.user_id === userId).length,
    totalReports: alerts.length
  };

  const statItems = [
    { 
      label: 'Active Alerts', 
      value: stats.activeAlerts, 
      color: 'text-red-600', 
      icon: AlertTriangle 
    },
    { 
      label: 'Resolved Today', 
      value: stats.resolvedToday, 
      color: 'text-green-600', 
      icon: CheckCircle 
    },
    { 
      label: 'Under Investigation', 
      value: stats.investigating, 
      color: 'text-yellow-600', 
      icon: Search 
    },
    { 
      label: 'My Panic Alerts', 
      value: stats.myPanicAlerts, 
      color: 'text-purple-600', 
      icon: AlertTriangle 
    },
    { 
      label: 'Total Reports', 
      value: stats.totalReports, 
      color: 'text-blue-600', 
      icon: Shield 
    }
  ];

  return null;
};

export default EmergencyStatsComponent;