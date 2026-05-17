import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, Calendar, Clock, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SolicitacaoEnviadaScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { nome?: string; date?: string; time?: string } | null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
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
        className="text-center space-y-3 max-w-sm"
      >
        <h1 className="text-3xl font-bold text-foreground font-display">
          Solicitação enviada!
        </h1>
        <p className="text-muted-foreground">
          {state?.nome ? `Valeu, ${state.nome.split(" ")[0]}! ` : ""}
          Recebemos sua solicitação e a equipe da Wakesurf vai te chamar no WhatsApp para confirmar o agendamento.
        </p>

        {state?.date && (
          <div className="glass rounded-2xl p-5 mt-6 space-y-3 text-left">
            <div className="flex items-center gap-3 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium capitalize">
                {format(new Date(state.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
            {state.time && (
              <div className="flex items-center gap-3 text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">{state.time}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-6">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span>Fique de olho no seu WhatsApp 🤙</span>
        </div>
      </motion.div>

      <button
        onClick={() => navigate("/")}
        className="mt-10 w-full max-w-sm py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-glow active:scale-[0.98] transition-transform"
      >
        Voltar ao início
      </button>
    </div>
  );
};

export default SolicitacaoEnviadaScreen;
