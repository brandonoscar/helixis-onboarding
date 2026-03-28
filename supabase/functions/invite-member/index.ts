// supabase/functions/invite-member/index.ts
// Sends workspace invitation emails and creates pending invite records.

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

  const token = authHeader.replace("Bearer ", "");
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: { user }, error } = await serviceClient.auth.getUser(token);
  if (error || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { workspace_id, email, role } = await req.json();

  if (!["owner", "manager", "employee"].includes(role)) {
    return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400 });
  }

  const { data: membership } = await serviceClient
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return new Response(JSON.stringify({ error: "Only owners can invite members" }), { status: 403 });
  }

  // Get workspace info
  const { data: workspace } = await serviceClient
    .from("workspaces")
    .select("name")
    .eq("id", workspace_id)
    .single();

  // Create invitation record
  const { data: invitation, error: inviteError } = await serviceClient
    .from("invitations")
    .insert({ workspace_id, email, role, invited_by: user.id })
    .select()
    .single();

  if (inviteError) {
    return new Response(JSON.stringify({ error: "Failed to create invitation" }), { status: 500 });
  }

  // Send invite email via Supabase Auth (or custom SMTP)
  // Using Supabase's built-in invite for now — configure custom SMTP in dashboard
  const { error: emailError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: {
      workspace_id,
      workspace_name: workspace?.name,
      role,
      invitation_id: invitation.id,
    },
    redirectTo: `${Deno.env.get("SITE_URL")}/join?token=${invitation.token}`,
  });

  if (emailError) {
    console.error("Email send failed:", emailError.message);
    // Don't fail — invitation record exists, email can be resent
  }

  await serviceClient.from("audit_log").insert({
    workspace_id,
    actor_user_id: user.id,
    action: "member_invited",
    resource_type: "invitation",
    resource_id: invitation.id,
    metadata: { email, role },
  });

  return new Response(JSON.stringify({
    success: true,
    invitation_id: invitation.id,
    email_sent: !emailError,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
