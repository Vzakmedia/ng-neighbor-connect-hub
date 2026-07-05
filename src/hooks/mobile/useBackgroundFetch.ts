import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const isNative = () => (window as any).Capacitor?.isNativePlatform?.() === true;

/**
 * Registers a periodic WorkManager task (Android) / BGAppRefreshTask (iOS)
 * that drains the offline sync queue even when the app is backgrounded.
 *
 * Fires every ~15 minutes at minimum (OS-enforced floor).
 * On Android this uses WorkManager; no background service is kept running.
 */
export function useBackgroundFetch() {
  const { user } = useAuth();
  const initialised = useRef(false);

  useEffect(() => {
    if (!isNative() || !user || initialised.current) return;
    initialised.current = true;

    const setup = async () => {
      try {
        const { BackgroundFetch } = await import('@transistorsoft/capacitor-background-fetch');

        const status = await BackgroundFetch.configure(
          {
            minimumFetchInterval: 15,       // minutes (OS floor)
            stopOnTerminate: false,          // keep running after app is killed
            startOnBoot: true,              // restart after device reboot
            enableHeadless: true,           // Android headless task support
            requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
          },
          async (taskId) => {
            // This callback fires in both foreground and background.
            // Keep it fast — drain queue then immediately finish.
            try {
              await drainQueue(user.id);
            } catch (e) {
              console.error('[BackgroundFetch] drainQueue error:', e);
            } finally {
              BackgroundFetch.finish(taskId);
            }
          },
          (taskId) => {
            // OS called timeout — must finish immediately.
            console.warn('[BackgroundFetch] timeout for task:', taskId);
            BackgroundFetch.finish(taskId);
          },
        );

        if (status !== BackgroundFetch.STATUS_AVAILABLE) {
          console.warn('[BackgroundFetch] not available, status:', status);
        }
      } catch (e) {
        console.error('[BackgroundFetch] setup error:', e);
      }
    };

    setup();
  }, [user]);
}

/**
 * Lightweight queue drain: fetch pending items from Supabase that
 * were queued locally via useBackgroundSync and flush them.
 * This mirrors the processOperation logic from useBackgroundSync but
 * runs as a pure async function (no React state).
 */
async function drainQueue(userId: string): Promise<void> {
  const { Preferences } = await import('@capacitor/preferences');
  const { value } = await Preferences.get({ key: 'background_sync_queue' });
  if (!value) return;

  let queue: Array<{
    id: string;
    type: string;
    data: any;
    retryCount: number;
    maxRetries: number;
  }>;

  try {
    queue = JSON.parse(value);
  } catch {
    return;
  }

  if (!queue.length) return;

  const remaining: typeof queue = [];

  for (const op of queue) {
    if (op.retryCount >= op.maxRetries) continue; // drop exhausted items

    try {
      await processOp(op.type, op.data);
    } catch {
      remaining.push({ ...op, retryCount: op.retryCount + 1 });
    }
  }

  await Preferences.set({
    key: 'background_sync_queue',
    value: JSON.stringify(remaining),
  });

  // Update last-sync timestamp so the app can show "last synced X ago"
  await supabase
    .from('profiles')
    .update({ updated_at: new Date().toISOString() } as any)
    .eq('user_id', userId)
    .throwOnError()
    .then(() => {/* noop */})
    .catch(() => {/* non-critical */});
}

async function processOp(type: string, data: any): Promise<void> {
  switch (type) {
    case 'post':
      await supabase.from('community_posts').insert({
        title: data.title,
        content: data.content,
        post_type: data.post_type || 'general',
        tags: data.tags || [],
        location: data.location,
        image_urls: data.image_urls || [],
        user_id: data.user_id,
      }).throwOnError();
      break;

    case 'message':
      await supabase.from('direct_messages').insert({
        conversation_id: data.conversation_id,
        sender_id: data.sender_id,
        content: data.content,
        message_type: data.message_type || 'text',
      }).throwOnError();
      break;

    case 'update':
      await (supabase as any)
        .from(data.table)
        .update(data.updates)
        .eq(data.match_field || 'id', data.id)
        .throwOnError();
      break;

    case 'upload': {
      let fileData = data.file;
      if (typeof fileData === 'string' && fileData.startsWith('data:')) {
        const res = await fetch(fileData);
        fileData = await res.blob();
      }
      // Storage requests don't support .throwOnError() — check the error manually
      const { error: uploadError } = await supabase.storage
        .from(data.bucket)
        .upload(data.path, fileData, { contentType: data.contentType });
      if (uploadError) throw uploadError;
      break;
    }

    default:
      throw new Error(`Unknown op type: ${type}`);
  }
}
