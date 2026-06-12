import { supabase } from '@/integrations/supabase/client';

export interface AblyChatEvent {
  name: 'new_message' | 'message_updated' | string;
  data: Record<string, unknown>;
}

type AblyChatHandler = (event: AblyChatEvent) => void;

/**
 * Primary chat delivery layer over Ably.
 *
 * Subscribes to the current user's chat:{userId} channel using a scoped
 * subscribe-only token from the ably-token edge function. Messages are
 * published server-side by the direct_messages database trigger.
 *
 * Designed to degrade silently: if the edge function isn't deployed, the
 * ABLY_API_KEY secret isn't set, or Ably is unreachable, this connects
 * nothing and the existing Supabase Realtime subscriptions carry chat alone.
 *
 * Returns a cleanup function that closes the connection.
 */
export async function connectAblyChat(
  userId: string,
  onEvent: AblyChatHandler,
): Promise<() => void> {
  let closed = false;

  try {
    // First check the token endpoint works before pulling in the SDK —
    // avoids loading ~100kb of ably-js when the layer isn't configured.
    const { data, error } = await supabase.functions.invoke('ably-token', { body: {} });
    if (error || !data?.tokenRequest) {
      console.warn('[AblyChat] Token endpoint unavailable — using Supabase Realtime only');
      return () => {};
    }

    // Lazy-load the SDK only when Ably is actually configured
    const Ably = (await import('ably')).default;

    const client = new Ably.Realtime({
      authCallback: (_params, callback) => {
        supabase.functions
          .invoke('ably-token', { body: {} })
          .then(({ data: tokenData, error: tokenError }) => {
            if (tokenError || !tokenData?.tokenRequest) {
              callback(tokenError?.message || 'Failed to fetch Ably token', null);
            } else {
              callback(null, tokenData.tokenRequest);
            }
          })
          .catch((err) => callback(err?.message || 'Failed to fetch Ably token', null));
      },
      // Don't spin forever on a misconfigured account — fall back quietly
      disconnectedRetryTimeout: 15000,
      suspendedRetryTimeout: 30000,
    });

    client.connection.on('failed', () => {
      console.warn('[AblyChat] Connection failed — Supabase Realtime fallback remains active');
    });

    const channel = client.channels.get(`chat:${userId}`);
    await channel.subscribe((message) => {
      if (closed) return;
      onEvent({
        name: message.name ?? '',
        data: (message.data ?? {}) as Record<string, unknown>,
      });
    });

    if (import.meta.env.DEV) {
      console.log('[AblyChat] Connected as primary chat delivery layer');
    }

    return () => {
      closed = true;
      try {
        channel.unsubscribe();
        client.close();
      } catch {
        // already closed
      }
    };
  } catch (err) {
    console.warn('[AblyChat] Setup failed — using Supabase Realtime only:', err);
    return () => {
      closed = true;
    };
  }
}
