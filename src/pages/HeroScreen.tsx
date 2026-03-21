import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import heroImage from "@/assets/hero-wakeboard.jpg";
import logo from "@/assets/logo-wakesurf-full.jpeg";
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
      <div className="relative h-screen flex flex-col items-center justify-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Wakeboard rider at sunset"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 gradient-dark-overlay" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-4 left-0 right-0 flex items-center justify-center z-20"
        >
          <img
            src={logo}
            alt="WAKESURF LONDRINA"
            className="h-24 w-auto object-contain drop-shadow-2xl"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative z-10 w-full px-6 pb-12 flex flex-col items-center gap-6"
        >
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
              Domine as <br />
              <span className="text-gradient">águas.</span>
            </h1>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="liquid-glass rounded-3xl px-5 py-4 max-w-xs mx-auto"
            >
              <p className="text-foreground/90 text-base leading-relaxed text-center font-light">
                Pratique um esporte e conecte-se com a natureza, recarregue as energias e eleve a sua inspiração.
              </p>
            </motion.div>
          </div>

          <button
            onClick={() => navigate("/agendar")}
            className="w-full max-w-sm py-4 px-8 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-glow active:scale-[0.98] transition-transform"
          >
            Quero agendar minha session
          </button>

          <button
            onClick={() => navigate("/rider/login")}
            className="w-full max-w-sm py-3 px-8 rounded-2xl glass text-foreground font-medium text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            🏄 Entrar como Rider
          </button>

          <button
            onClick={() => navigate("/admin/login")}
            className="w-full max-w-sm py-3 px-8 rounded-2xl glass text-muted-foreground font-medium text-xs active:scale-[0.98] transition-transform"
          >
            Fazer login como administrador
          </button>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="text-center">
              <span className="block text-xl font-bold text-foreground">500+</span>
              Sessions
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <span className="block text-xl font-bold text-foreground">1h</span>
              de Londrina
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <span className="block text-xl font-bold text-foreground">10+</span>
              Anos
            </div>
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
