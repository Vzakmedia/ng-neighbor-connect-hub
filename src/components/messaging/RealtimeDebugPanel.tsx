import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserPresence } from '@/hooks/useUserPresence';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bug, Copy, Trash2, X } from 'lucide-react';

interface LogEntry {
  id: string;
  time: string;
  source: 'presence' | 'messages' | 'conversations' | 'connection' | 'error';
  event: string;
  details?: any;
}

interface RealtimeDebugPanelProps {
  open: boolean;
  onClose: () => void;
}

const formatTime = (d = new Date()) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const MAX_LOGS = 300;

const RealtimeDebugPanel = ({ open, onClose }: RealtimeDebugPanelProps) => {
  const { user } = useAuth();
  const { totalOnlineUsers, onlineUsers } = useUserPresence();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'time'>) => {
    const newEntry: LogEntry = {
      id: crypto.randomUUID(),
      time: formatTime(),
      ...entry,
    };
    setLogs((prev) => {
      const next = [newEntry, ...prev];
      return next.slice(0, MAX_LOGS);
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    addLog({ source: 'connection', event: 'debug_panel_open' });

    // Postgres changes channel
    const changes = supabase
      .channel('realtime_debug_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, (payload) => {
        addLog({ source: 'messages', event: `postgres:${(payload as any).eventType}`, details: { id: (payload as any).new?.id ?? (payload as any).old?.id } });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_conversations' }, (payload) => {
        addLog({ source: 'conversations', event: `postgres:${(payload as any).eventType}`, details: { id: (payload as any).new?.id ?? (payload as any).old?.id } });
      })
      .subscribe((status) => {
        addLog({ source: 'connection', event: `changes_channel:${status}` });
      });

    // Presence channel
    const presence = supabase
      .channel('global_user_presence', { config: { presence: { key: user?.id || 'debug' } } })
      .on('presence', { event: 'sync' }, () => {
        try {
          const state = presence.presenceState();
          addLog({ source: 'presence', event: 'sync', details: { keys: Object.keys(state).length } });
        } catch (e) {
          addLog({ source: 'error', event: 'presence_sync_error', details: String(e) });
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        addLog({ source: 'presence', event: 'join', details: { key, count: newPresences?.length } });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        addLog({ source: 'presence', event: 'leave', details: { key, count: leftPresences?.length } });
      })
      .subscribe(async (status) => {
        addLog({ source: 'connection', event: `presence_channel:${status}` });
        if (status === 'SUBSCRIBED') {
          try {
            await presence.track({ user_id: user?.id || 'debug', debug_viewer: true, online_at: new Date().toISOString() });
            addLog({ source: 'presence', event: 'track_debug_viewer' });
          } catch (e) {
            addLog({ source: 'error', event: 'presence_track_error', details: String(e) });
          }
        }
      });

    return () => {
      try { supabase.removeChannel(changes); } catch {}
      try { supabase.removeChannel(presence); } catch {}
      addLog({ source: 'connection', event: 'debug_panel_closed' });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const copyLogs = async () => {
    try {
      const text = JSON.stringify([...logs].reverse(), null, 2);
      await navigator.clipboard.writeText(text);
      addLog({ source: 'connection', event: 'copied_logs' });
    } catch (e) {
      addLog({ source: 'error', event: 'copy_failed', details: String(e) });
    }
  };

  const onlinePreview = useMemo(() => onlineUsers.slice(0, 8), [onlineUsers]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-background/80" onClick={onClose} />
      <div className="absolute bottom-4 right-4 w-full max-w-xl">
        <Card className="shadow-lg border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">Realtime Debug</h2>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={copyLogs} aria-label="Copy logs" title="Copy logs">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setLogs([])} aria-label="Clear logs" title="Clear logs">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="px-4">
            <div className="mb-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Presence:</span> {totalOnlineUsers} online
              {onlinePreview.length > 0 && (
                <span> • {onlinePreview.join(', ')}{onlineUsers.length > onlinePreview.length ? '…' : ''}</span>
              )}
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="text-xs font-medium mb-2">Event log</div>
            <ScrollArea className="h-64 border rounded">
              <div className="p-2 space-y-2">
                {logs.length === 0 && (
                  <div className="text-xs text-muted-foreground">No events yet. Interact with messaging to see updates.</div>
                )}
                {logs.map((l) => (
                  <div key={l.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{l.time}</span>
                      <span className="px-1.5 py-0.5 rounded border text-foreground">{l.source}</span>
                      <span className="font-medium">{l.event}</span>
                    </div>
                    {l.details !== undefined && (
                      <pre className="mt-1 text-[10px] text-muted-foreground overflow-hidden text-ellipsis whitespace-pre-wrap max-h-20">
                        {(() => {
                          try {
                            const s = JSON.stringify(l.details);
                            return s.length > 180 ? s.slice(0, 180) + '…' : s;
                          } catch {
                            return String(l.details);
                          }
                        })()}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RealtimeDebugPanel;
