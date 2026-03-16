import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PRIVILEGED_ROLES = new Set([
  "super_admin",
  "admin",
  "support",
  "manager",
  "moderator",
]);

function getSupabaseUrl(): string {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) {
    throw new Error("Missing SUPABASE_URL");
  }

  return url;
}

function getAnonKey(): string {
  return Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    "";
}

function getServiceRoleKey(): string {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return key;
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function createAdminClient() {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isInternalServiceRequest(req: Request): boolean {
  const serviceRoleKey = getServiceRoleKey();
  const bearer = getBearerToken(req);
  const apiKey = req.headers.get("apikey");
  const forwardedKey = req.headers.get("x-supabase-key");

  return bearer === serviceRoleKey ||
    apiKey === serviceRoleKey ||
    forwardedKey === serviceRoleKey;
}

async function getUserRoles(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<string[]> {
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to load user roles");
  }

  return (data ?? []).map((row: { role: string }) => row.role);
}

export interface RequestContext {
  admin: ReturnType<typeof createAdminClient>;
  user: { id: string; email?: string | null } | null;
  isInternal: boolean;
  roles: string[];
}

interface RequestContextOptions {
  allowInternal?: boolean;
  requireUser?: boolean;
}

export async function getRequestContext(
  req: Request,
  options: RequestContextOptions = {},
): Promise<RequestContext> {
  const { allowInternal = true, requireUser = true } = options;
  const admin = createAdminClient();

  if (allowInternal && isInternalServiceRequest(req)) {
    return {
      admin,
      user: null,
      isInternal: true,
      roles: ["service_role"],
    };
  }

  const anonKey = getAnonKey();
  const authHeader = req.headers.get("authorization");

  if (!anonKey || !authHeader) {
    if (requireUser) {
      throw new Error("Unauthorized");
    }

    return {
      admin,
      user: null,
      isInternal: false,
      roles: [],
    };
  }

  const authClient = createClient(getSupabaseUrl(), anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    if (requireUser) {
      throw new Error("Unauthorized");
    }

    return {
      admin,
      user: null,
      isInternal: false,
      roles: [],
    };
  }

  const roles = await getUserRoles(admin, user.id);

  return {
    admin,
    user: {
      id: user.id,
      email: user.email,
    },
    isInternal: false,
    roles,
  };
}

export function isPrivilegedUser(roles: string[]): boolean {
  return roles.some((role) => PRIVILEGED_ROLES.has(role));
}

export function hasAnyRole(roles: string[], allowedRoles: string[]): boolean {
  const allowed = new Set(allowedRoles);
  return roles.some((role) => allowed.has(role));
}

export function assertSelfOrPrivileged(
  actorUserId: string,
  targetUserId: string | undefined | null,
  roles: string[],
): void {
  if (!targetUserId) {
    throw new Error("Missing target user");
  }

  if (actorUserId === targetUserId || isPrivilegedUser(roles)) {
    return;
  }

  throw new Error("Forbidden");
}
