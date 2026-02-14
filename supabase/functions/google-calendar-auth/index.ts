import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile_id, redirect_url } = await req.json();

    if (!profile_id) {
      return new Response(
        JSON.stringify({ error: "profile_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-callback`;

    const scopes = [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar",
    ].join(" ");

    // Store profile_id and redirect_url in state param
    const state = btoa(JSON.stringify({ profile_id, redirect_url: redirect_url || "" }));

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    return new Response(
      JSON.stringify({ url: authUrl.toString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating auth URL:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate auth URL" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
