import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Search, Shield } from 'lucide-react';
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

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
      {statItems.map((stat, index) => (
        <Card key={index} className="touch-manipulation">
          <CardContent className="p-3 md:p-4 text-center">
            <stat.icon className={`h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 ${stat.color}`} />
            <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
            <div className="text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EmergencyStatsComponent;