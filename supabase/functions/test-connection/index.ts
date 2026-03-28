// supabase/functions/test-connection/index.ts
// Retrieves encrypted keys from vault and tests the provider API.
// Never returns or logs the actual key values.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const token = authHeader.replace("Bearer ", "");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { workspace_id, provider } = await req.json();

    // Verify membership
    const { data: membership } = await serviceClient
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "manager"].includes(membership.role)) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), { status: 403 });
    }

    // Get integration + vault references
    const { data: integration } = await serviceClient
      .from("integrations")
      .select(`id, provider, environment, integration_secrets(vault_api_key_id, vault_api_secret_id)`)
      .eq("workspace_id", workspace_id)
      .eq("provider", provider)
      .single();

    if (!integration) {
      return new Response(JSON.stringify({ error: "Integration not configured" }), { status: 404 });
    }

    const secrets = (integration as any).integration_secrets;
    if (!secrets?.vault_api_key_id) {
      return new Response(JSON.stringify({ error: "No credentials stored" }), { status: 400 });
    }

    // Retrieve from vault (service role only)
    const { data: apiKeyData } = await serviceClient
      .rpc("vault_get_secret", { p_id: secrets.vault_api_key_id });
    const { data: apiSecretData } = await serviceClient
      .rpc("vault_get_secret", { p_id: secrets.vault_api_secret_id });

    if (!apiKeyData || !apiSecretData) {
      throw new Error("Failed to retrieve credentials from vault");
    }

    const startTime = Date.now();
    let testResult = { success: false, message: "", latency_ms: 0 };

    // Provider-specific test calls
    if (provider === "buildium") {
      testResult = await testBuildiumConnection(apiKeyData, apiSecretData, integration.environment);
    } else {
      testResult = { success: false, message: `Provider ${provider} not yet supported`, latency_ms: 0 };
    }

    testResult.latency_ms = Date.now() - startTime;

    // Update integration status
    await serviceClient
      .from("integrations")
      .update({
        status: testResult.success ? "connected" : "error",
        last_tested_at: new Date().toISOString(),
        last_test_result: testResult,
      })
      .eq("id", integration.id);

    // Audit log
    await serviceClient.from("audit_log").insert({
      workspace_id,
      actor_user_id: user.id,
      action: "integration_tested",
      resource_type: "integration",
      resource_id: integration.id,
      metadata: { provider, success: testResult.success, latency_ms: testResult.latency_ms },
    });

    // Return result (never return the actual keys)
    return new Response(JSON.stringify({
      success: testResult.success,
      message: testResult.message,
      latency_ms: testResult.latency_ms,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("test-connection error (sanitized)");
    return new Response(JSON.stringify({ error: "Connection test failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function testBuildiumConnection(
  clientId: string,
  clientSecret: string,
  environment: string
): Promise<{ success: boolean; message: string; latency_ms: number }> {
  const baseUrl = environment === "sandbox"
    ? "https://apisandbox.buildium.com/v1"
    : "https://api.buildium.com/v1";

  try {
    const response = await fetch(`${baseUrl}/properties?limit=1`, {
      headers: {
        "x-buildium-client-id": clientId,
        "x-buildium-client-secret": clientSecret,
        Accept: "application/json",
      },
    });

    if (response.ok) {
      return { success: true, message: "Connected successfully", latency_ms: 0 };
    } else if (response.status === 401) {
      return { success: false, message: "Invalid credentials — check your Client ID and Secret", latency_ms: 0 };
    } else {
      return { success: false, message: `API returned ${response.status}`, latency_ms: 0 };
    }
  } catch (err) {
    return { success: false, message: "Could not reach Buildium API", latency_ms: 0 };
  }
}
