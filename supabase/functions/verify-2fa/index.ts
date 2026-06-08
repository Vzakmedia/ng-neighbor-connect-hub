import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { TOTP } from "https://deno.land/x/otpauth@9.3.4/dist/otpauth.esm.js";
import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const ctx = await getRequestContext(req, { requireUser: true });
    if (!ctx.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = ctx.user.id;

    // Rate-limit: 10 attempts per 15 minutes per user
    await enforceRateLimit(ctx.admin, userId, "verify_2fa", 10, 900);

    const body = await req.json();
    const code: string | undefined = body?.code;
    const backupCode: string | undefined = body?.backup_code;

    // ── TOTP path ────────────────────────────────────────────────────────────
    if (code) {
      if (!/^\d{6}$/.test(code)) {
        return jsonResponse({ success: false, error: "Invalid code format" }, 400);
      }

      // Fetch secret with service-role key — never exposed to the client
      const { data: row, error: fetchErr } = await ctx.admin
        .from("user_2fa")
        .select("secret")
        .eq("user_id", userId)
        .eq("is_enabled", true)
        .maybeSingle();

      if (fetchErr || !row) {
        return jsonResponse({ success: false, error: "2FA not configured" }, 400);
      }

      const totp = new TOTP({ secret: row.secret });
      const delta = totp.validate({ token: code, window: 1 });

      if (delta === null) {
        await ctx.admin.rpc("log_2fa_attempt", {
          _user_id: userId,
          _attempt_type: "totp",
          _success: false,
        });
        return jsonResponse({ success: false, error: "Invalid code" }, 401);
      }

      // Record verification server-side (service role bypasses RLS)
      await Promise.all([
        ctx.admin.from("user_2fa_sessions").upsert(
          {
            user_id: userId,
            verified_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          },
          { onConflict: "user_id" }
        ),
        ctx.admin
          .from("user_2fa")
          .update({ last_used_at: new Date().toISOString() })
          .eq("user_id", userId),
        ctx.admin.rpc("log_2fa_attempt", {
          _user_id: userId,
          _attempt_type: "totp",
          _success: true,
        }),
      ]);

      return jsonResponse({ success: true });
    }

    // ── Backup-code path ─────────────────────────────────────────────────────
    if (backupCode) {
      const { data: isValid, error: rpcErr } = await ctx.admin.rpc(
        "verify_backup_code",
        { _user_id: userId, _backup_code: backupCode }
      );

      if (rpcErr) throw rpcErr;

      await ctx.admin.rpc("log_2fa_attempt", {
        _user_id: userId,
        _attempt_type: "backup_code",
        _success: !!isValid,
      });

      if (!isValid) {
        return jsonResponse({ success: false, error: "Invalid backup code" }, 401);
      }

      await ctx.admin.from("user_2fa_sessions").upsert(
        {
          user_id: userId,
          verified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "user_id" }
      );

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Missing code or backup_code" }, 400);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = msg === "Unauthorized" ? 401 : msg === "Rate limit exceeded" ? 429 : 500;
    return jsonResponse({ error: msg }, status);
  }
});
