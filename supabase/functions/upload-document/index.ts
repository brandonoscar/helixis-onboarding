// supabase/functions/upload-document/index.ts
// Handles document uploads and business context text for AI memory.
// Files are stored in Supabase Storage; text content is extracted
// and aggregated into workspace_memory for AI context.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/rtf",
  "application/rtf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const BUCKET_NAME = "workspace-documents";

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });

    const token = authHeader.replace("Bearer ", "");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      data: { user },
      error: authError,
    } = await serviceClient.auth.getUser(token);
    if (authError || !user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });

    const contentType = req.headers.get("content-type") || "";

    // ── Handle multipart file upload ──
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const workspaceId = formData.get("workspace_id") as string;
      const file = formData.get("file") as File;

      if (!workspaceId || !file) {
        return new Response(
          JSON.stringify({ error: "Missing workspace_id or file" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Verify user is workspace owner
      const { data: membership } = await serviceClient
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .single();

      if (!membership || membership.role !== "owner") {
        return new Response(
          JSON.stringify({ error: "Only workspace owners can upload documents" }),
          { status: 403, headers: corsHeaders }
        );
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return new Response(
          JSON.stringify({
            error: `File type not allowed: ${file.type}. Only documents are accepted (PDF, DOC, DOCX, TXT, RTF, CSV, XLS, XLSX).`,
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ error: "File too large. Maximum size is 10 MB." }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Upload to Supabase Storage
      const filePath = `${workspaceId}/${Date.now()}_${file.name}`;
      const fileBuffer = await file.arrayBuffer();

      const { error: uploadError } = await serviceClient.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return new Response(
          JSON.stringify({ error: `Upload failed: ${uploadError.message}` }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Extract text for plain text files immediately
      let contentText: string | null = null;
      let wordCount = 0;
      let status: "ready" | "pending" = "pending";

      if (file.type === "text/plain" || file.type === "text/csv") {
        contentText = new TextDecoder().decode(fileBuffer);
        wordCount = countWords(contentText);
        status = "ready";
      }

      // Store document record
      const { data: doc, error: docError } = await serviceClient
        .from("workspace_documents")
        .insert({
          workspace_id: workspaceId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          content_text: contentText,
          word_count: wordCount,
          status,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (docError) {
        return new Response(
          JSON.stringify({ error: docError.message }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Update workspace memory aggregate
      await rebuildWorkspaceMemory(serviceClient, workspaceId);

      // Audit log
      await serviceClient.from("audit_log").insert({
        workspace_id: workspaceId,
        actor_user_id: user.id,
        action: "document_uploaded",
        resource_type: "document",
        resource_id: doc.id,
        metadata: {
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          word_count: wordCount,
        },
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
        user_agent: req.headers.get("user-agent"),
      });

      return new Response(
        JSON.stringify({
          success: true,
          document_id: doc.id,
          file_name: file.name,
          status,
          word_count: wordCount,
        }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Handle JSON body (business description text) ──
    const body = await req.json();
    const { workspace_id, description } = body;

    if (!workspace_id || !description) {
      return new Response(
        JSON.stringify({ error: "Missing workspace_id or description" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify user is workspace owner
    const { data: membership } = await serviceClient
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "owner") {
      return new Response(
        JSON.stringify({ error: "Only workspace owners can save business context" }),
        { status: 403, headers: corsHeaders }
      );
    }

    const wordCount = countWords(description);

    if (wordCount < 100) {
      return new Response(
        JSON.stringify({
          error: `Description must be at least 100 words. Current: ${wordCount} words.`,
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Upsert the business description as a document
    // Check for existing description entry
    const { data: existing } = await serviceClient
      .from("workspace_documents")
      .select("id")
      .eq("workspace_id", workspace_id)
      .is("file_path", null)
      .limit(1)
      .single();

    if (existing) {
      await serviceClient
        .from("workspace_documents")
        .update({
          content_text: description,
          word_count: wordCount,
          status: "ready",
        })
        .eq("id", existing.id);
    } else {
      await serviceClient.from("workspace_documents").insert({
        workspace_id,
        file_name: null,
        file_path: null,
        file_type: null,
        file_size: null,
        content_text: description,
        word_count: wordCount,
        status: "ready",
        uploaded_by: user.id,
      });
    }

    // Rebuild workspace memory
    await rebuildWorkspaceMemory(serviceClient, workspace_id);

    // Audit log
    await serviceClient.from("audit_log").insert({
      workspace_id,
      actor_user_id: user.id,
      action: "business_context_saved",
      resource_type: "workspace",
      resource_id: workspace_id,
      metadata: { word_count: wordCount },
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
      user_agent: req.headers.get("user-agent"),
    });

    return new Response(
      JSON.stringify({ success: true, word_count: wordCount }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

/**
 * Rebuilds the workspace_memory row by aggregating all ready documents.
 * This combined text becomes the AI's context/memory about the business.
 */
async function rebuildWorkspaceMemory(
  serviceClient: any,
  workspaceId: string
) {
  const { data: docs } = await serviceClient
    .from("workspace_documents")
    .select("content_text, word_count, file_name")
    .eq("workspace_id", workspaceId)
    .eq("status", "ready")
    .order("created_at", { ascending: true });

  if (!docs) return;

  const sections: string[] = [];
  let totalWords = 0;

  for (const doc of docs) {
    if (!doc.content_text) continue;
    const header = doc.file_name
      ? `--- Source: ${doc.file_name} ---`
      : "--- Business Description ---";
    sections.push(`${header}\n${doc.content_text}`);
    totalWords += doc.word_count || 0;
  }

  const contextText = sections.join("\n\n");

  await serviceClient.from("workspace_memory").upsert(
    {
      workspace_id: workspaceId,
      context_text: contextText,
      total_word_count: totalWords,
      document_count: docs.length,
      last_updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id" }
  );
}
