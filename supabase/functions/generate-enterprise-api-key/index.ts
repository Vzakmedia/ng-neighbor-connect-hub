import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext, hasAnyRole } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface GenerateKeyRequest {
  company_name: string;
  company_domain?: string;
  billing_email: string;
  technical_contact_email: string;
  industry?: string;
  company_size?: string;
  website?: string;
  request_id?: string;
  key_name: string;
  environment: "production" | "development" | "staging";
  permissions: string[];
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  expires_at?: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing") || message.startsWith("Invalid")) return 400;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: false, requireUser: true });

    if (!context.user || !hasAnyRole(context.roles, ["admin", "super_admin"])) {
      throw new Error("Forbidden");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "generate-enterprise-api-key",
      scope: `user:${context.user.id}`,
      limit: 20,
      windowMinutes: 15,
    });

    const requestData: GenerateKeyRequest = await req.json();

    if (
      !requestData.company_name ||
      !requestData.billing_email ||
      !requestData.technical_contact_email ||
      !requestData.key_name ||
      !requestData.environment ||
      !Array.isArray(requestData.permissions) ||
      requestData.permissions.length === 0
    ) {
      throw new Error("Missing required fields");
    }

    if (!isValidEmail(requestData.billing_email) || !isValidEmail(requestData.technical_contact_email)) {
      throw new Error("Invalid email address");
    }

    let companyId: string;

    const { data: existingCompany, error: findCompanyError } = await context.admin
      .from("companies")
      .select("id")
      .eq("name", requestData.company_name)
      .maybeSingle();

    if (findCompanyError) {
      throw new Error("Failed to load company");
    }

    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const { data: newCompany, error: createCompanyError } = await context.admin
        .from("companies")
        .insert({
          name: requestData.company_name,
          domain: requestData.company_domain,
          billing_email: requestData.billing_email,
          technical_contact_email: requestData.technical_contact_email,
          industry: requestData.industry,
          size: requestData.company_size,
          website: requestData.website,
          is_active: true,
          plan_type: "free",
        })
        .select("id")
        .single();

      if (createCompanyError || !newCompany) {
        throw new Error("Failed to create company");
      }

      companyId = newCompany.id;
    }

    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const keySecret = Array.from(randomBytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const fullKey = `nlk_${requestData.environment}_${keySecret}`;

    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fullKey));
    const keyHash = Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const { data: apiKey, error: createKeyError } = await context.admin
      .from("enterprise_api_keys")
      .insert({
        key_name: requestData.key_name,
        key_prefix: fullKey.substring(0, 20),
        key_hash: keyHash,
        company_id: companyId,
        request_id: requestData.request_id || null,
        created_by: context.user.id,
        permissions: requestData.permissions,
        rate_limit_per_hour: requestData.rate_limit_per_hour || 1000,
        rate_limit_per_day: requestData.rate_limit_per_day || 10000,
        environment: requestData.environment,
        is_active: true,
        expires_at: requestData.expires_at || null,
      })
      .select("id, key_prefix")
      .single();

    if (createKeyError || !apiKey) {
      throw new Error("Failed to create API key");
    }

    if (requestData.request_id) {
      const { error: updateRequestError } = await context.admin
        .from("api_access_requests")
        .update({
          status: "resolved",
          company_id: companyId,
          api_key_id: apiKey.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", requestData.request_id);

      if (updateRequestError) {
        console.error("generate-enterprise-api-key request update error:", updateRequestError);
      }
    }

    await context.admin.from("activity_logs").insert({
      user_id: context.user.id,
      action_type: "api_key_generated",
      resource_type: "enterprise_api_key",
      resource_id: apiKey.id,
      details: {
        company_name: requestData.company_name,
        key_name: requestData.key_name,
        environment: requestData.environment,
        permissions: requestData.permissions,
      },
    });

    return jsonResponse(req, {
      success: true,
      api_key: fullKey,
      key_id: apiKey.id,
      key_prefix: apiKey.key_prefix,
      company_id: companyId,
      message: "API key generated successfully. Save this key now - it will never be shown again.",
    });
  } catch (error) {
    console.error("generate-enterprise-api-key error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message, success: false },
      status,
    );
  }
});
