import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getRequestContext } from '../_shared/auth.ts';
import { sendSilentFcmMessage } from '../_shared/fcm.ts';
import { handleCors, jsonResponse } from '../_shared/http.ts';

/**
 * Sends a silent FCM data message to all of a user's registered devices.
 * The app receives it in the background and drains its offline sync queue.
 *
 * Called internally by other edge functions (e.g. after a new DM is sent,
 * after an emergency alert is posted) so the recipient's app syncs immediately
 * without waiting for the next WorkManager interval.
 *
 * Body: { userId: string, reason?: string }
 */
serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const context = await getRequestContext(req, { allowInternal: true, requireUser: false });

    if (!context.isInternal && !context.user) {
      return jsonResponse(req, { error: 'Unauthorized' }, 401);
    }

    const { userId, reason = 'sync' } = await req.json() as { userId: string; reason?: string };

    if (!userId) {
      return jsonResponse(req, { error: 'Missing userId' }, 400);
    }

    // Only privileged callers may trigger sync for other users
    if (!context.isInternal && context.user?.id !== userId) {
      return jsonResponse(req, { error: 'Forbidden' }, 403);
    }

    const { data: devices } = await context.admin
      .from('user_devices')
      .select('fcm_token, platform')
      .eq('user_id', userId)
      .not('fcm_token', 'is', null)
      .order('last_active_at', { ascending: false })
      .limit(5); // cap to 5 most-recent devices

    if (!devices?.length) {
      return jsonResponse(req, { status: 'no_devices' });
    }

    const payload = {
      notification_type: 'background_sync',
      reason,
      ts: Date.now().toString(),
    };

    const results = await Promise.allSettled(
      devices.map((d) => sendSilentFcmMessage(d.fcm_token, payload, 'high')),
    );

    const sent = results.filter((r) => r.status === 'fulfilled' && (r as any).value.ok).length;

    return jsonResponse(req, { sent, total: devices.length });
  } catch (err) {
    console.error('[trigger-background-sync]', err);
    return jsonResponse(req, { error: 'Internal error' }, 500);
  }
});
