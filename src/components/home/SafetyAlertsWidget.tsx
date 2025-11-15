import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon, ChevronRightIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useSafetyAlerts } from "@/hooks/useDashboardSections";
import { Badge } from "@/components/ui/badge";

export const SafetyAlertsWidget = () => {
  const navigate = useNavigate();
  const { alerts, loading } = useSafetyAlerts(2);

  if (loading || alerts.length === 0) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldExclamationIcon className="h-5 w-5 text-orange-500" />
          <h2 className="font-semibold text-foreground">Safety Alerts</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/safety")}
          className="text-primary"
        >
          View All
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => navigate("/safety")}
            className="bg-background rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors"
          >
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground text-sm">{alert.title}</h3>
                  <Badge variant="outline" className={`text-xs ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
