import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Waves, CalendarPlus, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

const AdminCalendarScreen = () => {
  const navigate = useNavigate();
  const { connectOwner } = useGoogleCalendar();
  const [integration, setIntegration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchIntegration = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("google_integrations")
      .select("google_email, updated_at")
      .eq("is_owner", true)
      .maybeSingle();
    setIntegration(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchIntegration();
    // Check if just connected
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_connected") === "true") {
      const url = new URL(window.location.href);
      url.searchParams.delete("google_connected");
      window.history.replaceState({}, "", url.pathname);
      fetchIntegration();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 pt-12 pb-4">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Google Agenda</span>
        </div>
        <div className="w-6" />
      </div>

      <div className="flex-1 px-6 space-y-6 pt-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : integration ? (
          <>
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Google Agenda conectado</p>
                  <p className="text-sm text-muted-foreground">{integration.google_email}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Sessões confirmadas serão automaticamente adicionadas à sua agenda.
              </p>
            </div>

            <button
              onClick={() => connectOwner(window.location.origin + "/admin/calendar")}
              className="w-full glass rounded-2xl p-4 flex items-center justify-center gap-3 text-foreground hover:border-primary/30 transition-all"
            >
              <RefreshCw className="h-5 w-5 text-primary" />
              <span className="font-medium">Reconectar conta</span>
            </button>
          </>
        ) : (
          <div className="text-center space-y-6 pt-12">
            <CalendarPlus className="h-16 w-16 text-primary mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Conecte sua Google Agenda</h2>
              <p className="text-muted-foreground text-sm">
                As sessões confirmadas pelos clientes serão automaticamente adicionadas à sua agenda.
              </p>
            </div>
            <button
              onClick={() => connectOwner(window.location.origin + "/admin/calendar")}
              className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-glow active:scale-[0.98] transition-transform"
            >
              Conectar Google Agenda
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCalendarScreen;
