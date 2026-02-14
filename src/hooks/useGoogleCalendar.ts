import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useGoogleCalendar = () => {
  const [syncing, setSyncing] = useState(false);

  const createEvent = useCallback(async (params: {
    session_id: string;
    session_date: string;
    session_time: string;
    nome?: string;
  }) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: { action: "create", ...params },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error creating Google Calendar event:", err);
      return null;
    } finally {
      setSyncing(false);
    }
  }, []);

  const connectOwner = useCallback(async (redirectUrl?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { redirect_url: redirectUrl || window.location.href },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error("Error connecting Google Calendar:", err);
    }
  }, []);

  return { syncing, createEvent, connectOwner };
};
