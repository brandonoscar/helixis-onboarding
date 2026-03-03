// supabase/functions/create-workspace/index.ts
// Creates a workspace and assigns the calling user as owner.

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

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return new Response(JSON.stringify({ error: "Missing name or slug" }), { status: 400, headers: corsHeaders });
    }

    // Create workspace
    const { data: workspace, error: wsError } = await serviceClient
      .from("workspaces")
      .insert({ name, slug })
      .select()
      .single();

    if (wsError) {
      const msg = wsError.code === "23505" ? "A workspace with this slug already exists" : wsError.message;
      return new Response(JSON.stringify({ error: msg }), { status: 409, headers: corsHeaders });
    }

    // Add calling user as owner
    const { error: memberError } = await serviceClient
      .from("workspace_members")
      .insert({ workspace_id: workspace.id, user_id: user.id, role: "owner", accepted_at: new Date().toISOString() });

    if (memberError) {
      return new Response(JSON.stringify({ error: memberError.message }), { status: 500, headers: corsHeaders });
    }

    // Audit log
    await serviceClient.from("audit_log").insert({
      workspace_id: workspace.id,
      actor_user_id: user.id,
      action: "workspace_created",
      resource_type: "workspace",
      resource_id: workspace.id,
      metadata: { name, slug },
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
      user_agent: req.headers.get("user-agent"),
    });

    return new Response(
      JSON.stringify({ success: true, workspace_id: workspace.id, name, slug }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
