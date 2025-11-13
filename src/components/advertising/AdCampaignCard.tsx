import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  MousePointer, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Building as Building2, 
  Globe,
  Play,
  Pause,
  BarChart3 
} from '@/lib/icons';
import { format } from 'date-fns';

interface AdCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  status: string;
  approval_status: string;
  target_geographic_scope: string;
  daily_budget: number;
  total_budget: number;
  total_spent: number;
  total_impressions: number;
  total_clicks: number;
  start_date: string;
  end_date: string;
  created_at: string;
  ad_title?: string;
  ad_description?: string;
}

interface AdCampaignCardProps {
  campaign: AdCampaign;
  onStatusChange?: (campaignId: string, newStatus: string) => void;
  onViewAnalytics?: (campaignId: string) => void;
  onApprove?: (campaignId: string) => void;
  onReject?: (campaignId: string) => void;
}

export const AdCampaignCard = ({ campaign, onStatusChange, onViewAnalytics, onApprove, onReject }: AdCampaignCardProps) => {
  const getStatusColor = (status: string, approvalStatus: string) => {
    if (approvalStatus === 'rejected') return 'destructive';
    if (approvalStatus === 'pending') return 'secondary';
    
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'completed': return 'outline';
      case 'draft': return 'secondary';
      case 'pending_payment': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string, approvalStatus: string) => {
    if (approvalStatus === 'rejected') return 'Rejected';
    if (approvalStatus === 'pending') return 'Pending Approval';
    
    switch (status) {
      case 'active': return 'Active';
      case 'paused': return 'Paused';
      case 'completed': return 'Completed';
      case 'draft': return 'Draft';
      case 'pending_payment': return 'Pending Payment';
      default: return status;
    }
  };

  const getGeographicIcon = () => {
    switch (campaign.target_geographic_scope) {
      case 'city':
        return <MapPin className="h-4 w-4" />;
      case 'state':
        return <Building2 className="h-4 w-4" />;
      case 'nationwide':
        return <Globe className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const calculateProgress = () => {
    if (campaign.total_budget === 0) return 0;
    return (campaign.total_spent / campaign.total_budget) * 100;
  };

  const getClickThroughRate = () => {
    if (campaign.total_impressions === 0) return 0;
    return ((campaign.total_clicks / campaign.total_impressions) * 100).toFixed(2);
  };

  const canPauseResume = () => {
    return campaign.status === 'active' || campaign.status === 'paused';
  };

  const isExpired = () => {
    return new Date(campaign.end_date) < new Date();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{campaign.campaign_name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="capitalize">{campaign.campaign_type.replace('_', ' ')}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {getGeographicIcon()}
                {campaign.target_geographic_scope}
              </span>
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(campaign.status, campaign.approval_status)}>
            {getStatusText(campaign.status, campaign.approval_status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Campaign Content Preview */}
        {campaign.ad_title && (
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm">{campaign.ad_title}</h4>
            {campaign.ad_description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {campaign.ad_description}
              </p>
            )}
          </div>
        )}

        {/* Budget Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Budget Progress</span>
            <span>${campaign.total_spent.toFixed(2)} / ${campaign.total_budget.toFixed(2)}</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              Impressions
            </div>
            <div className="font-semibold">{campaign.total_impressions.toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MousePointer className="h-3 w-3" />
              Clicks
            </div>
            <div className="font-semibold">{campaign.total_clicks.toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <BarChart3 className="h-3 w-3" />
              CTR
            </div>
            <div className="font-semibold">{getClickThroughRate()}%</div>
          </div>
        </div>

        {/* Campaign Dates */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(campaign.start_date), 'MMM d')} - {format(new Date(campaign.end_date), 'MMM d, yyyy')}
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            ${campaign.daily_budget}/day
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {campaign.approval_status === 'pending' ? (
            <>
              <Button
                size="sm"
                onClick={() => onApprove?.(campaign.id)}
                className="flex-1"
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onReject?.(campaign.id)}
                className="flex-1"
              >
                Reject
              </Button>
            </>
          ) : (
            <>
              {canPauseResume() && !isExpired() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange?.(campaign.id, campaign.status === 'active' ? 'paused' : 'active')}
                  className="flex-1"
                >
                  {campaign.status === 'active' ? (
                    <>
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </>
                  )}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewAnalytics?.(campaign.id)}
                className="flex-1"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Analytics
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};