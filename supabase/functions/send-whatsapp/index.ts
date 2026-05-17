import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const N8N_WEBHOOK_URL =
      "https://n8n.paessolucoes.com/webhook/wakesurf-londrina";

    const incoming = await req.json();
    const { number, body, payload } = incoming ?? {};

    // Two modes:
    //  - structured payload (new): forward `payload` shape to n8n
    //  - legacy text message: forward { number, body }
    let outgoing: Record<string, unknown>;
    if (payload && typeof payload === "object") {
      outgoing = {
        ...payload,
        number: String(number ?? (payload as any).whatsapp ?? "").replace(/\D/g, ""),
      };
    } else if (number && body) {
      outgoing = {
        number: String(number).replace(/\D/g, ""),
        body,
        message: body,
      };
    } else {
      return new Response(
        JSON.stringify({ error: "payload or (number + body) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(outgoing),
    });

    const raw = await response.text();
    let data: unknown = raw;
    try {
      data = JSON.parse(raw);
    } catch {
      // n8n pode responder texto puro
    }

    if (!response.ok) {
      console.error("n8n webhook error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to send message", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-whatsapp error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
