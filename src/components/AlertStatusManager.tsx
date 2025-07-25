import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckCircle, 
  Search, 
  AlertTriangle, 
  XCircle, 
  MessageSquare,
  Shield
} from 'lucide-react';

interface AlertStatusManagerProps {
  alert: {
    id: string;
    title: string;
    status: 'active' | 'resolved' | 'investigating' | 'false_alarm';
    user_id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  onStatusUpdate: (alertId: string, newStatus: string, note?: string) => void;
  isOwner: boolean;
  canModerate?: boolean;
}

const AlertStatusManager: React.FC<AlertStatusManagerProps> = ({ 
  alert, 
  onStatusUpdate, 
  isOwner, 
  canModerate = false 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(alert.status);
  const [statusNote, setStatusNote] = useState('');

  const statusConfig = {
    active: { 
      label: 'Active', 
      icon: AlertTriangle, 
      color: 'bg-red-100 text-red-800 border-red-200',
      description: 'Alert is currently active and ongoing'
    },
    investigating: { 
      label: 'Under Investigation', 
      icon: Search, 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      description: 'Alert is being investigated by authorities'
    },
    resolved: { 
      label: 'Resolved', 
      icon: CheckCircle, 
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Alert has been resolved and is no longer active'
    },
    false_alarm: { 
      label: 'False Alarm', 
      icon: XCircle, 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'Alert was determined to be a false alarm'
    }
  };

  const canUpdateStatus = isOwner || canModerate || user?.id === alert.user_id;

  const handleStatusUpdate = async () => {
    if (!canUpdateStatus || selectedStatus === alert.status) return;

    setIsUpdating(true);
    try {
      const updateData: any = {
        status: selectedStatus,
        updated_at: new Date().toISOString()
      };

      // Add resolution timestamp if resolving
      if (selectedStatus === 'resolved' && alert.status !== 'resolved') {
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = user?.id;
      }

      const { error } = await supabase
        .from('safety_alerts')
        .update(updateData)
        .eq('id', alert.id);

      if (error) throw error;

      // Add status update note if provided
      if (statusNote.trim()) {
        await supabase
          .from('alert_responses')
          .insert({
            alert_id: alert.id,
            user_id: user?.id,
            response_type: 'status_update',
            comment: `Status changed to ${selectedStatus}: ${statusNote.trim()}`
          });
      }

      onStatusUpdate(alert.id, selectedStatus, statusNote);
      
      toast({
        title: "Status Updated",
        description: `Alert status changed to ${statusConfig[selectedStatus].label}`,
      });

      setStatusNote('');
    } catch (error) {
      console.error('Error updating alert status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update alert status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatus = statusConfig[alert.status];
  const CurrentIcon = currentStatus.icon;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4" />
          Alert Status Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status Display */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <CurrentIcon className="h-5 w-5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">Current Status:</span>
              <Badge className={currentStatus.color}>
                {currentStatus.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentStatus.description}
            </p>
          </div>
        </div>

        {/* Status Update Controls */}
        {canUpdateStatus && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Update Status</label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStatus !== alert.status && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Status Update Note (Optional)
                </label>
                <Textarea
                  placeholder="Add a note about this status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            <Button 
              onClick={handleStatusUpdate}
              disabled={isUpdating || selectedStatus === alert.status}
              className="w-full"
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        )}

        {/* Permission message for non-owners */}
        {!canUpdateStatus && (
          <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Only the alert creator or moderators can update the status.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertStatusManager;