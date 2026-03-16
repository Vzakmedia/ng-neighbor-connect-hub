import { createAdminClient } from "./auth.ts";

type AdminClient = ReturnType<typeof createAdminClient>;

interface RateLimitOptions {
  admin: AdminClient;
  action: string;
  scope: string;
  limit: number;
  windowMinutes: number;
}

function getWindowStart(windowMinutes: number): string {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const bucket = Math.floor(now / windowMs) * windowMs;
  return new Date(bucket).toISOString();
}

export async function enforceRateLimit({
  admin,
  action,
  scope,
  limit,
  windowMinutes,
}: RateLimitOptions): Promise<void> {
  const windowStart = getWindowStart(windowMinutes);

  const { data: existing, error: selectError } = await admin
    .from("function_rate_limits")
    .select("id, count")
    .eq("action", action)
    .eq("scope", scope)
    .eq("window_start", windowStart)
    .maybeSingle();

  if (selectError) {
    throw new Error("Rate limit check failed");
  }

  if (existing && existing.count >= limit) {
    throw new Error("Rate limit exceeded");
  }

  if (existing) {
    const { error: updateError } = await admin
      .from("function_rate_limits")
      .update({
        count: existing.count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error("Rate limit update failed");
    }

    return;
  }

  const { error: insertError } = await admin
    .from("function_rate_limits")
    .insert({
      action,
      scope,
      window_start: windowStart,
      count: 1,
    });

  if (insertError) {
    throw new Error("Rate limit insert failed");
  }
}
