/**
 * Background Runner entry point — com.neighborlink.background
 *
 * IMPORTANT CONSTRAINTS:
 *   - This file runs inside an isolated JS engine (JavaScriptCore on iOS,
 *     V8 on Android). There is NO DOM, NO React, NO Supabase JS client.
 *   - Only these globals are available: fetch, setTimeout, clearTimeout,
 *     setInterval, clearInterval, console, and the injected
 *     CapacitorKV / CapacitorNotifications / CapacitorGeolocation globals
 *     from @capacitor/background-runner.
 *   - Keep imports to zero — this file is bundled separately via vite build
 *     with a dedicated entry point.
 *
 * Flow:
 *   1. Read Supabase credentials + offline queue from CapacitorKV (Preferences)
 *   2. For each pending operation, POST directly to the Supabase REST API
 *   3. Remove successful operations from the queue
 *   4. Write the trimmed queue back to CapacitorKV
 */

const QUEUE_KEY = 'background_sync_queue';
const AUTH_KEY  = 'neighborlink-auth';      // Must match Supabase storageKey in client.ts

type QueuedOperationType = 'post' | 'message' | 'upload' | 'update';

interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

interface SupabaseSession {
  access_token: string;
  refresh_token?: string;
}

// CapacitorKV is injected by @capacitor/background-runner at runtime.
declare const CapacitorKV: {
  get: (options: { key: string }) => Promise<{ value: string | null }>;
  set: (options: { key: string; value: string }) => Promise<void>;
  remove: (options: { key: string }) => Promise<void>;
};

/** Read JSON value from CapacitorKV, returning null on any error. */
async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const result = await CapacitorKV.get({ key });
    if (!result.value) return null;
    return JSON.parse(result.value) as T;
  } catch {
    return null;
  }
}

async function kvSet(key: string, value: unknown): Promise<void> {
  try {
    await CapacitorKV.set({ key, value: JSON.stringify(value) });
  } catch (e) {
    console.error('[bgSync] kvSet error', e);
  }
}

/** Supabase REST endpoint — read from KV or fall back to hard-coded project ref. */
const SUPABASE_URL = 'https://cowiviqhrnmhttugozbz.supabase.co';
const SUPABASE_ANON_KEY_KV = 'supabase_anon_key';

async function restPost(
  table: string,
  body: Record<string, unknown>,
  accessToken: string,
  anonKey: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function processOperation(
  op: QueuedOperation,
  accessToken: string,
  anonKey: string,
): Promise<boolean> {
  switch (op.type) {
    case 'post':
      return restPost('community_posts', op.data, accessToken, anonKey);

    case 'message':
      return restPost('direct_messages', op.data, accessToken, anonKey);

    case 'update': {
      const { table, id, ...fields } = op.data as Record<string, unknown>;
      if (!table || !id) return false;
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${accessToken}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify(fields),
          },
        );
        return res.ok;
      } catch {
        return false;
      }
    }

    default:
      // 'upload' and other types require Supabase Storage SDK — skip in background
      return false;
  }
}

/** Main background task — called by the runner on the syncOfflineQueue event. */
addEventListener('syncOfflineQueue', async () => {
  console.log('[bgSync] syncOfflineQueue fired');

  const session = await kvGet<SupabaseSession>(AUTH_KEY);
  if (!session?.access_token) {
    console.log('[bgSync] no auth token — skipping');
    return;
  }

  const anonKey = (await kvGet<string>(SUPABASE_ANON_KEY_KV)) ?? '';
  if (!anonKey) {
    console.log('[bgSync] no anon key — skipping');
    return;
  }

  const queue = (await kvGet<QueuedOperation[]>(QUEUE_KEY)) ?? [];
  if (queue.length === 0) {
    console.log('[bgSync] queue empty — nothing to sync');
    return;
  }

  console.log(`[bgSync] processing ${queue.length} queued operation(s)`);

  const remaining: QueuedOperation[] = [];

  for (const op of queue) {
    if (op.retryCount >= op.maxRetries) {
      console.log(`[bgSync] dropping ${op.id} — max retries exceeded`);
      continue;
    }

    const success = await processOperation(op, session.access_token, anonKey);

    if (success) {
      console.log(`[bgSync] synced ${op.id}`);
    } else {
      remaining.push({ ...op, retryCount: op.retryCount + 1, lastError: 'background sync failed' });
    }
  }

  await kvSet(QUEUE_KEY, remaining);
  console.log(`[bgSync] done — ${queue.length - remaining.length} synced, ${remaining.length} remaining`);
});
