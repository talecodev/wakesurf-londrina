import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return new Response(`<html><body><script>window.close();</script><p>Authorization cancelled.</p></body></html>`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (!code || !stateParam) {
      return new Response("Missing code or state", { status: 400 });
    }

    const { profile_id, redirect_url } = JSON.parse(atob(stateParam));

    // Exchange code for tokens
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Token exchange failed:", tokens);
      return new Response(`<html><body><p>Token exchange failed. Please try again.</p></body></html>`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Get user info for google email
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json();

    // Store in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const tokenExpiration = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: dbError } = await supabase
      .from("google_integrations")
      .upsert(
        {
          profile_id,
          google_email: userInfo.email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiration: tokenExpiration,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id" }
      );

    if (dbError) {
      console.error("DB error:", dbError);
    }

    const finalRedirect = redirect_url || "/";
    const separator = finalRedirect.includes("?") ? "&" : "?";

    return new Response(
      `<html><body><script>window.location.href="${finalRedirect}${separator}google_connected=true";</script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(`<html><body><p>An error occurred. Please try again.</p></body></html>`, {
      headers: { "Content-Type": "text/html" },
    });
  }
});
