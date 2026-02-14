import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Waves, Copy, Check, Clock, Calendar, Loader2, CalendarPlus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

const PagamentoScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as Record<string, string> | null;
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [calendarSynced, setCalendarSynced] = useState(false);

  const profileId = state?.profileId || null;
  const { isConnected, loading: calLoading, syncing, connect, createEvent, googleEmail } = useGoogleCalendar(profileId);

  // Check if returning from Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_connected") === "true") {
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("google_connected");
      window.history.replaceState({}, "", url.pathname);
    }
  }, []);

  const pixCode = "00020126580014br.gov.bcb.pix0136wakepro-school-demo-pix-key5204000053039865802BR";

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePay = async () => {
    setProcessing(true);
    try {
      if (state?.paymentId) {
        await supabase
          .from("payments")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", state.paymentId);
      }
      if (state?.sessionId) {
        await supabase
          .from("sessions")
          .update({ status: "confirmed" })
          .eq("id", state.sessionId);
      }

      // Auto-sync to Google Calendar if connected
      if (isConnected && state?.sessionId && state?.date && state?.time) {
        const result = await createEvent({
          session_id: state.sessionId,
          session_date: format(new Date(state.date), "yyyy-MM-dd"),
          session_time: state.time,
          nome: state.nome,
        });
        if (result?.success) {
          setCalendarSynced(true);
        }
      }

      setPaid(true);
    } catch (err) {
      console.error("Erro ao confirmar pagamento:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (paid) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="h-24 w-24 rounded-full gradient-primary flex items-center justify-center shadow-glow mb-8"
        >
          <Check className="h-12 w-12 text-primary-foreground" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-3"
        >
          <h1 className="text-3xl font-bold text-foreground">Session Confirmada!</h1>
          <p className="text-muted-foreground">
            Você receberá uma confirmação via WhatsApp com todos os detalhes.
          </p>
          {calendarSynced && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 text-sm text-primary"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Adicionado ao Google Agenda</span>
            </motion.div>
          )}
          {state?.date && (
            <div className="glass rounded-2xl p-5 mt-6 space-y-3">
              <div className="flex items-center gap-3 text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium capitalize">
                  {format(new Date(state.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">{state.time}</span>
              </div>
            </div>
          )}

          {/* Connect Google Calendar if not connected */}
          {!isConnected && !calLoading && profileId && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={() => connect()}
              className="mt-4 w-full glass rounded-2xl p-4 flex items-center justify-center gap-3 text-foreground hover:border-primary/30 transition-all"
            >
              <CalendarPlus className="h-5 w-5 text-primary" />
              <span className="font-medium">Conectar Google Agenda</span>
            </motion.button>
          )}
        </motion.div>
        <button
          onClick={() => navigate("/")}
          className="mt-10 w-full max-w-sm py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-glow active:scale-[0.98] transition-transform"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Pagamento</span>
        </div>
        <div className="w-6" />
      </div>

      <div className="flex-1 px-6 space-y-6">
        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 space-y-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Session Wakeboard</span>
            <span className="text-xl font-bold text-foreground">R$ 250,00</span>
          </div>
          {state?.date && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="capitalize">
                {format(new Date(state.date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
              <Clock className="h-4 w-4 text-primary ml-2" />
              <span>{state.time}</span>
            </div>
          )}
          {state?.nome && (
            <div className="text-sm text-muted-foreground">
              {state.nome}
            </div>
          )}
        </motion.div>

        {/* Google Calendar Connect */}
        {!calLoading && profileId && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {isConnected ? (
              <div className="glass rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Google Agenda conectado</p>
                  {googleEmail && (
                    <p className="text-xs text-muted-foreground">{googleEmail}</p>
                  )}
                </div>
                <CalendarPlus className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : (
              <button
                onClick={() => connect()}
                className="w-full glass rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 transition-all"
              >
                <CalendarPlus className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">Conectar Google Agenda</p>
                  <p className="text-xs text-muted-foreground">Adicionar sessão automaticamente</p>
                </div>
              </button>
            )}
          </motion.div>
        )}

        {/* PIX */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Pague via PIX
          </h3>

          {/* QR Code placeholder */}
          <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="h-48 w-48 bg-foreground rounded-xl flex items-center justify-center">
              <div className="h-44 w-44 bg-background rounded-lg grid grid-cols-8 gap-0.5 p-2">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${
                      Math.random() > 0.4 ? "bg-foreground" : "bg-background"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Escaneie o QR Code ou copie o código abaixo
            </p>
          </div>

          {/* Copy code */}
          <button
            onClick={handleCopy}
            className="w-full glass rounded-2xl p-4 flex items-center justify-between"
          >
            <span className="text-sm text-muted-foreground truncate mr-4 flex-1 text-left">
              {pixCode.slice(0, 32)}...
            </span>
            {copied ? (
              <Check className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <Copy className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
          </button>
        </motion.div>
      </div>

      {/* CTA */}
      <div className="p-6">
        <button
          onClick={handleSimulatePay}
          disabled={processing}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-glow active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {syncing ? "Sincronizando agenda..." : "Processando..."}
            </>
          ) : (
            "Já realizei o pagamento"
          )}
        </button>
      </div>
    </div>
  );
};

export default PagamentoScreen;
