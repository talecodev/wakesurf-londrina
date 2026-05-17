import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logo from "@/assets/logo-light.png";
import { supabase } from "@/integrations/supabase/client";

const HeroScreen = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("board_messages")
      .select("id, title, content, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setMessages(data || []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background px-6 py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-0 -right-24 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8"
        >
          <img
            src={logo}
            alt="WAKESURF LONDRINA"
            className="h-56 w-auto object-contain drop-shadow-2xl"
          />

          <div className="flex flex-col items-center gap-4 w-full">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight font-display text-center">
              Domine as <br />
              <span className="text-gradient">águas.</span>
            </h1>
            <div className="liquid-glass rounded-3xl px-5 py-3.5 w-full max-w-xs">
              <p className="text-foreground/85 text-xs leading-relaxed text-center font-light">
                Pratique um esporte e conecte-se com a natureza, recarregue as energias e eleve a sua inspiração.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={() => navigate("/agendar")}
              className="w-full py-4 px-8 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-glow active:scale-[0.98] transition-transform"
            >
              Quero agendar minha session
            </button>

            <button
              onClick={() => navigate("/rider/login")}
              className="w-full py-3 px-8 rounded-2xl glass text-foreground font-medium text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              🏄 Entrar como Rider
            </button>

            <button
              onClick={() => navigate("/admin/login")}
              className="w-full py-3 px-8 rounded-2xl glass text-muted-foreground font-medium text-xs active:scale-[0.98] transition-transform"
            >
              Fazer login como administrador
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mural de Recados */}
      {messages.length > 0 && (
        <div className="px-6 py-8 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Mural de Recados</h2>
          </div>
          <div className="space-y-3">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-4 space-y-1"
              >
                <p className="text-sm font-semibold text-foreground">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.content}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroScreen;
