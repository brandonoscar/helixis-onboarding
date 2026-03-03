// supabase/functions/lock-integration/index.ts
// Locks an integration after owner confirms setup is complete.
// Once locked, secrets become immutable from UI.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  const { workspace_id, integration_id } = await req.json();

  const { data: membership } = await serviceClient
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return new Response(JSON.stringify({ error: "Only owners can lock integrations" }), { status: 403 });
  }

  const { data: integration } = await serviceClient
    .from("integrations")
    .select("id, status, locked")
    .eq("id", integration_id)
    .eq("workspace_id", workspace_id)
    .single();

  if (!integration) return new Response(JSON.stringify({ error: "Integration not found" }), { status: 404 });
  if (integration.locked) return new Response(JSON.stringify({ error: "Already locked" }), { status: 409 });
  if (integration.status !== "connected") {
    return new Response(JSON.stringify({ error: "Integration must be connected before locking" }), { status: 400 });
  }

  await serviceClient
    .from("integrations")
    .update({
      locked: true,
      locked_at: new Date().toISOString(),
      locked_by: user.id,
      status: "locked",
    })
    .eq("id", integration_id);

  await serviceClient.from("audit_log").insert({
    workspace_id,
    actor_user_id: user.id,
    action: "integration_locked",
    resource_type: "integration",
    resource_id: integration_id,
    metadata: {},
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
