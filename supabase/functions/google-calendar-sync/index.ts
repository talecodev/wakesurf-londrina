import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error("Token refresh failed:", await res.text());
    return null;
  }
  return res.json();
}

async function getValidToken(supabase: any, profileId: string) {
  const { data: integration } = await supabase
    .from("google_integrations")
    .select("*")
    .eq("profile_id", profileId)
    .single();

  if (!integration) return null;

  // Check if token is expired (with 5 min buffer)
  const expiresAt = new Date(integration.token_expiration).getTime();
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(integration.refresh_token);
    if (!refreshed) return null;

    const newExpiration = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await supabase
      .from("google_integrations")
      .update({
        access_token: refreshed.access_token,
        token_expiration: newExpiration,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", profileId);

    return refreshed.access_token;
  }

  return integration.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, profile_id, session_id, session_date, session_time, nome, google_event_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const accessToken = await getValidToken(supabase, profile_id);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Google Calendar not connected or token expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calendarId = "primary";

    if (action === "create") {
      // Build event
      const startDateTime = `${session_date}T${session_time}:00`;
      const [hours, minutes] = session_time.split(":").map(Number);
      const endHour = hours + 1;
      const endTime = `${String(endHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      const endDateTime = `${session_date}T${endTime}:00`;

      const event = {
        summary: "Sessão Wakeboard 🏄",
        description: `Sessão de Wakeboard\nParticipante: ${nome || "N/A"}\nID: ${session_id}`,
        location: "Wakesurf Londrina",
        start: { dateTime: startDateTime, timeZone: "America/Sao_Paulo" },
        end: { dateTime: endDateTime, timeZone: "America/Sao_Paulo" },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 1440 }, // 24h
            { method: "popup", minutes: 60 },    // 1h
          ],
        },
      };

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!res.ok) {
        const errBody = await res.text();
        console.error("Google Calendar create error:", errBody);
        return new Response(
          JSON.stringify({ error: "Failed to create event", details: errBody }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const createdEvent = await res.json();

      // Update session with google_event_id
      await supabase
        .from("sessions")
        .update({
          google_event_id: createdEvent.id,
          google_calendar_id: calendarId,
          last_sync_at: new Date().toISOString(),
        })
        .eq("id", session_id);

      return new Response(
        JSON.stringify({ success: true, event_id: createdEvent.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete" && google_event_id) {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${google_event_id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // 204 or 410 means deleted
      if (!res.ok && res.status !== 410) {
        const errBody = await res.text();
        console.error("Google Calendar delete error:", errBody);
      }

      if (session_id) {
        await supabase
          .from("sessions")
          .update({
            google_event_id: null,
            google_calendar_id: null,
            last_sync_at: new Date().toISOString(),
          })
          .eq("id", session_id);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'create' or 'delete'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
