import { useEffect } from 'react';
import { useApiIntegrations } from '@/hooks/admin/useApiIntegrations';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Map, CreditCard, Mail, Bell, Webhook, MessageSquare, Database, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusType = 'unknown' | 'active' | 'error';

const STATUS_BADGE: Record<StatusType, { label: string; className: string }> = {
  unknown: { label: 'Unknown', className: 'bg-muted text-muted-foreground border border-border' },
  active:  { label: 'Active',  className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
  error:   { label: 'Error',   className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' },
};

function StatusDot({ status }: { status: StatusType }) {
  return (
    <span className={cn(
      'inline-block w-2 h-2 rounded-full',
      status === 'active'  && 'bg-emerald-500',
      status === 'error'   && 'bg-rose-500',
      status === 'unknown' && 'bg-muted-foreground',
    )} />
  );
}

function IntegrationCard({
  icon: Icon,
  title,
  description,
  status,
  enabled,
  details,
  apiKey,
  testing,
  onTest,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  status: StatusType;
  enabled: boolean;
  details: string[];
  apiKey?: string;
  testing: boolean;
  onTest: () => void;
}) {
  const badge = STATUS_BADGE[status];
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              enabled ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-muted border border-border',
            )}>
              <Icon className={cn('h-5 w-5', enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')} />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusDot status={status} />
            <Badge className={`${badge.className} text-xs`}>{badge.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {details.map((d, i) => (
            <p key={i} className="text-xs text-muted-foreground bg-muted rounded px-2 py-1 truncate">{d}</p>
          ))}
        </div>
        {apiKey && (
          <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded truncate">
            {apiKey}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <Switch checked={enabled} disabled className="opacity-60" />
          <Button
            size="sm"
            variant="outline"
            onClick={onTest}
            disabled={testing}
            className="text-xs h-7 px-3"
          >
            {testing ? 'Testing…' : 'Test'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminIntegrations() {
  const { user } = useAuth();
  const {
    apiStatus, currentApiConfig, testingApi,
    monitoringActive, fetchApiConfig, checkApiStatus,
    testApiIntegration, startLiveMonitoring, stopLiveMonitoring,
  } = useApiIntegrations(user?.id);

  useEffect(() => {
    fetchApiConfig();
    checkApiStatus();
  }, [fetchApiConfig, checkApiStatus]);

  const INTEGRATIONS = [
    {
      id: 'googleMaps',
      icon: Map,
      title: 'Google Maps',
      description: 'Location services and interactive maps',
      status: apiStatus.googleMaps,
      enabled: currentApiConfig.googleMaps.enabled,
      details: [
        `Default zoom: ${currentApiConfig.googleMaps.defaultZoom}`,
        `Key: ${currentApiConfig.googleMaps.hasKey ? 'Configured' : 'Missing'}`,
      ],
    },
    {
      id: 'stripe',
      icon: CreditCard,
      title: 'Stripe Payments',
      description: 'Secure payment processing',
      status: apiStatus.stripe,
      enabled: currentApiConfig.stripe.enabled,
      details: [
        `Currency: ${currentApiConfig.stripe.currency}`,
        `Key: ${currentApiConfig.stripe.hasKey ? 'Configured' : 'Missing'}`,
      ],
    },
    {
      id: 'email',
      icon: Mail,
      title: 'Email Service',
      description: 'Transactional emails via Resend',
      status: apiStatus.email,
      enabled: currentApiConfig.email.enabled,
      details: [
        `From: ${currentApiConfig.email.fromAddress || 'Not set'}`,
      ],
    },
    {
      id: 'push',
      icon: Bell,
      title: 'Push Notifications',
      description: 'Mobile and web push via OneSignal',
      status: 'unknown' as StatusType,
      enabled: currentApiConfig.push.enabled,
      details: [
        `Emergency priority: ${currentApiConfig.push.emergencyPriority ? 'Yes' : 'No'}`,
      ],
    },
    {
      id: 'webhooks',
      icon: Webhook,
      title: 'Webhooks',
      description: 'Outbound event hooks to external services',
      status: apiStatus.webhooks,
      enabled: currentApiConfig.webhooks.enabled,
      details: [
        `Timeout: ${currentApiConfig.webhooks.timeout}s`,
        `Secret: ${currentApiConfig.webhooks.secret ? 'Set' : 'Not set'}`,
      ],
    },
    {
      id: 'sms',
      icon: MessageSquare,
      title: 'SMS (Twilio)',
      description: 'SMS notifications and verification',
      status: apiStatus.sms,
      enabled: currentApiConfig.sms.enabled,
      details: [
        `Provider: ${currentApiConfig.sms.provider}`,
      ],
    },
    {
      id: 'supabase',
      icon: Database,
      title: 'Supabase',
      description: 'Database, auth, storage, and realtime',
      status: apiStatus.supabase,
      enabled: currentApiConfig.supabase.connected,
      details: [
        `Project: ${currentApiConfig.supabase.project}`,
        `URL: ${currentApiConfig.supabase.url ? 'Set' : 'Not set'}`,
      ],
    },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent inline-block">Integrations</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor and test third-party service connections</p>
        </div>
        <div className="flex items-center gap-3">
          {monitoringActive && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              Live monitoring (30s)
            </div>
          )}
          <Button
            size="sm"
            variant={monitoringActive ? 'destructive' : 'outline'}
            onClick={monitoringActive ? stopLiveMonitoring : startLiveMonitoring}
            className="text-xs"
          >
            {monitoringActive ? 'Stop Monitor' : 'Start Monitor'}
          </Button>
          <Button size="sm" variant="outline" onClick={checkApiStatus} className="text-xs">
            Refresh All
          </Button>
        </div>
      </div>

      {/* Status summary */}
      <div className="flex gap-4 text-sm">
        {(['active', 'error', 'unknown'] as StatusType[]).map(s => {
          const count = Object.values(apiStatus).filter(v => v === s).length;
          const { label, className } = STATUS_BADGE[s];
          return (
            <Badge key={s} className={`${className} border-0`}>
              {count} {label}
            </Badge>
          );
        })}
      </div>

      {/* Integration cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {INTEGRATIONS.map(intg => (
          <IntegrationCard
            key={intg.id}
            icon={intg.icon}
            title={intg.title}
            description={intg.description}
            status={intg.status as StatusType}
            enabled={intg.enabled}
            details={[...intg.details]}
            testing={testingApi === intg.id}
            onTest={() => testApiIntegration(intg.id)}
          />
        ))}
      </div>
    </div>
  );
}
