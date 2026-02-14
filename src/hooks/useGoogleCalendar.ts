import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useGoogleCalendar = (profileId: string | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from("google_integrations")
        .select("google_email")
        .eq("profile_id", profileId)
        .maybeSingle();

      setIsConnected(!!data);
      setGoogleEmail(data?.google_email || null);
    } catch (err) {
      console.error("Error checking Google Calendar connection:", err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = useCallback(async (redirectUrl?: string) => {
    if (!profileId) return;
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { profile_id: profileId, redirect_url: redirectUrl || window.location.href },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error connecting Google Calendar:", err);
    }
  }, [profileId]);

  const createEvent = useCallback(async (params: {
    session_id: string;
    session_date: string;
    session_time: string;
    nome?: string;
  }) => {
    if (!profileId || !isConnected) return null;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: {
          action: "create",
          profile_id: profileId,
          ...params,
        },
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error creating Google Calendar event:", err);
      return null;
    } finally {
      setSyncing(false);
    }
  }, [profileId, isConnected]);

  const deleteEvent = useCallback(async (sessionId: string, googleEventId: string) => {
    if (!profileId) return;
    setSyncing(true);
    try {
      await supabase.functions.invoke("google-calendar-sync", {
        body: {
          action: "delete",
          profile_id: profileId,
          session_id: sessionId,
          google_event_id: googleEventId,
        },
      });
    } catch (err) {
      console.error("Error deleting Google Calendar event:", err);
    } finally {
      setSyncing(false);
    }
  }, [profileId]);

  return {
    isConnected,
    loading,
    syncing,
    googleEmail,
    connect,
    createEvent,
    deleteEvent,
    checkConnection,
  };
};
