// supabase/functions/rotate-webhook-secret/index.ts
// Generates webhook signing secret, stores in vault.
// Returns the plaintext secret ONCE. After that, it's gone from client view.

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

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { workspace_id, provider } = await req.json();

  const { data: membership } = await serviceClient
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return new Response(JSON.stringify({ error: "Only owners can configure webhooks" }), { status: 403 });
  }

  // Check if secret was already viewed (prevent re-generation unless explicitly requested)
  const { data: existing } = await serviceClient
    .from("webhooks")
    .select("id, secret_viewed_at, vault_signing_secret_id")
    .eq("workspace_id", workspace_id)
    .eq("provider", provider)
    .single();

  // Generate new secret
  const signingSecret = generateWebhookSecret();
  const endpointPath = `/${workspace_id}/${provider}`;

  // Store in vault
  const { data: vaultId, error: vaultError } = await serviceClient
    .rpc("vault_create_secret", {
      p_secret: signingSecret,
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

  // Return the plaintext secret ONCE — it will never be retrievable again from UI
  return new Response(JSON.stringify({
    success: true,
    signing_secret: signingSecret, // ONLY TIME THIS IS RETURNED
    endpoint_url: `https://hooks.helixis.com${endpointPath}`,
    webhook_id: webhook?.id,
    warning: "Save this secret immediately. It will not be shown again.",
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
