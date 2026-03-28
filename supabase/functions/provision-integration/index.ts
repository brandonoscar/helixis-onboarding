// supabase/functions/provision-integration/index.ts
// Called by UI to store API keys. NEVER logs plaintext keys.
// Uses Supabase Vault (pg_sodium) for encryption.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Authenticate the calling user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const token = authHeader.replace("Bearer ", "");

    // Service client — for vault writes, secret inserts, and auth verification
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const body = await req.json();
    const { workspace_id, provider, api_key, api_secret, environment = "production" } = body;

    // Validate required fields (do NOT log values)
    if (!workspace_id || !provider || !api_key || !api_secret) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Verify user is owner of this workspace
    const { data: membership } = await serviceClient
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only workspace owners can provision integrations" }), { status: 403 });
    }

    // Check if integration already exists and is locked
    const { data: existing } = await serviceClient
      .from("integrations")
      .select("id, locked")
      .eq("workspace_id", workspace_id)
      .eq("provider", provider)
      .single();

    if (existing?.locked) {
      return new Response(JSON.stringify({ error: "Integration is locked. Submit a change request." }), { status: 409 });
    }

    // Upsert integration row
    const { data: integration, error: integrationError } = await serviceClient
      .from("integrations")
      .upsert({
        workspace_id,
        provider,
        status: "pending",
        environment,
        updated_at: new Date().toISOString(),
      }, { onConflict: "workspace_id,provider" })
      .select()
      .single();

    if (integrationError) throw integrationError;

    // Store secrets in Vault using pg_sodium
    // vault.create_secret(secret_value, name, description)
    const keyHint = `...${api_key.slice(-4)}`;

    const { data: vaultKeyResult, error: vaultKeyError } = await serviceClient
      .rpc("vault_create_secret", {
        p_secret: api_key,
        p_name: `helixis_${workspace_id}_${provider}_api_key`,
        p_description: `API key for ${provider} integration in workspace ${workspace_id}`,
      });

    if (vaultKeyError) {
      // Fallback: use pgcrypto if vault RPC not available
      // In production, set up vault via Supabase dashboard
      console.error("Vault error (non-secret info):", vaultKeyError.message);
      throw new Error("Failed to store credentials securely");
    }

    const { data: vaultSecretResult, error: vaultSecretError } = await serviceClient
      .rpc("vault_create_secret", {
        p_secret: api_secret,
        p_name: `helixis_${workspace_id}_${provider}_api_secret`,
        p_description: `API secret for ${provider} integration in workspace ${workspace_id}`,
      });

    if (vaultSecretError) throw new Error("Failed to store credentials securely");

    // Store vault references (IDs only — never plaintext)
    await serviceClient.from("integration_secrets").upsert({
      integration_id: integration.id,
      vault_api_key_id: vaultKeyResult,
      vault_api_secret_id: vaultSecretResult,
      key_hint: keyHint,
      rotated_at: new Date().toISOString(),
    }, { onConflict: "integration_id" });

    // Write audit log
    await serviceClient.from("audit_log").insert({
      workspace_id,
      actor_user_id: user.id,
      action: "integration_provisioned",
      resource_type: "integration",
      resource_id: integration.id,
      metadata: { provider, environment, key_hint: keyHint },
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });

    return new Response(JSON.stringify({
      success: true,
      integration_id: integration.id,
      key_hint: keyHint,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    // Never log the actual error message if it might contain secrets
    console.error("provision-integration error (sanitized)");
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper RPC to create vault secrets (add to Supabase SQL editor):
// CREATE OR REPLACE FUNCTION vault_create_secret(p_secret TEXT, p_name TEXT, p_description TEXT)
// RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
// DECLARE v_id UUID;
// BEGIN
//   INSERT INTO vault.secrets (secret, name, description) VALUES (p_secret, p_name, p_description)
//   RETURNING id INTO v_id;
//   RETURN v_id;
// END; $$;
