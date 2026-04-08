// supabase/functions/rotate-webhook-secret/index.ts
// Stores webhook signing secret in vault.
// For Buildium: accepts user-provided signing_secret from Buildium's dashboard.
// For AppFolio: no signing secret needed (uses JWKS public keys for verification).
// Returns the endpoint URL for the webhook.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateWebhookSecret(length = 48): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return "whsec_" + Array.from(array, (b) => chars[b % chars.length]).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: { user }, error } = await serviceClient.auth.getUser(token);
  if (error || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { workspace_id, provider, signing_secret } = await req.json();

  const { data: membership } = await serviceClient
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return new Response(JSON.stringify({ error: "Only owners can configure webhooks" }), { status: 403 });
  }

  const endpointPath = `/${workspace_id}/${provider}`;
  let vaultId: string | null = null;

  // For Buildium: store the user-provided signing secret from Buildium's dashboard
  // For AppFolio: no secret needed (webhook verification uses JWKS public keys)
  if (provider === "buildium") {
    const secret = signing_secret || generateWebhookSecret();
    const { data: vid, error: vaultError } = await serviceClient
      .rpc("vault_create_secret", {
        p_secret: secret,
        p_name: `helixis_${workspace_id}_${provider}_webhook_secret`,
        p_description: `Webhook signing secret for ${provider} in workspace ${workspace_id}`,
      });

    if (vaultError) throw new Error("Failed to store webhook secret");
    vaultId = vid;
  }

  // Upsert webhook row
  const webhookRow: Record<string, unknown> = {
    workspace_id,
    provider,
    endpoint_path: endpointPath,
  };
  if (vaultId) {
    webhookRow.vault_signing_secret_id = vaultId;
    webhookRow.secret_viewed_at = new Date().toISOString();
  }

  const { data: webhook } = await serviceClient
    .from("webhooks")
    .upsert(webhookRow, { onConflict: "workspace_id,provider" })
    .select()
    .single();

  await serviceClient.from("audit_log").insert({
    workspace_id,
    actor_user_id: user.id,
    action: signing_secret ? "webhook_secret_stored" : "webhook_configured",
    resource_type: "webhook",
    resource_id: webhook?.id,
    metadata: { provider, user_provided: !!signing_secret },
  });

  return new Response(JSON.stringify({
    success: true,
    endpoint_url: `https://hooks.helixis.com${endpointPath}`,
    webhook_id: webhook?.id,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
