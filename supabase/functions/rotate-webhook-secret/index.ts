// supabase/functions/rotate-webhook-secret/index.ts
// Stores Buildium's webhook signing secret in encrypted vault.
// The secret is provided by the client (copied from Buildium's UI).

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
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const token = authHeader.replace("Bearer ", "");
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error } = await serviceClient.auth.getUser(token);
    if (error || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { workspace_id, provider, signing_secret } = await req.json();

    if (!signing_secret) {
      return new Response(JSON.stringify({ error: "Missing signing_secret" }), { status: 400, headers: corsHeaders });
    }

    const { data: membership } = await serviceClient
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only owners can configure webhooks" }), { status: 403, headers: corsHeaders });
    }

    const endpointPath = `/${workspace_id}/${provider}`;

    // Store Buildium's secret in vault (encrypted)
    const { data: vaultId, error: vaultError } = await serviceClient
      .rpc("vault_create_secret", {
        p_secret: signing_secret,
        p_name: `helixis_${workspace_id}_${provider}_webhook_secret`,
        p_description: `Webhook signing secret for ${provider} in workspace ${workspace_id}`,
      });

    if (vaultError) throw new Error("Failed to store webhook secret");

    // Upsert webhook row
    const { data: webhook } = await serviceClient
      .from("webhooks")
      .upsert({
        workspace_id,
        provider,
        endpoint_path: endpointPath,
        vault_signing_secret_id: vaultId,
        secret_viewed_at: new Date().toISOString(),
      }, { onConflict: "workspace_id,provider" })
      .select()
      .single();

    await serviceClient.from("audit_log").insert({
      workspace_id,
      actor_user_id: user.id,
      action: "webhook_secret_generated",
      resource_type: "webhook",
      resource_id: webhook?.id,
      metadata: { provider },
    });

    return new Response(JSON.stringify({
      success: true,
      endpoint_url: `https://hooks.helixis.com${endpointPath}`,
      webhook_id: webhook?.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("rotate-webhook-secret error (sanitized)");
    return new Response(JSON.stringify({ error: "Failed to save webhook secret" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
