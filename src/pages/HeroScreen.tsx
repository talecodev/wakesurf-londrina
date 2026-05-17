import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Wind, Droplets, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logo from "@/assets/logo-light.png";
import { supabase } from "@/integrations/supabase/client";
import { useWeatherForecast } from "@/hooks/useWeatherForecast";

const HeroScreen = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const { forecast, loading: weatherLoading } = useWeatherForecast();
  const today = forecast[0];
  const tomorrow = forecast[1];
  const [splash, setSplash] = useState(true);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1600);
    return () => clearTimeout(t);
  }, []);

  const handleHeroClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: Date.now(),
    });
  };

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
      {/* Splash overlay on first load */}
      <AnimatePresence>
        {splash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background pointer-events-none"
          >
            <motion.img
              src={logo}
              alt=""
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-72 w-auto drop-shadow-[0_0_60px_hsl(var(--primary)/0.6)]"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 6, opacity: 0 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="absolute h-40 w-40 rounded-full bg-primary/30 blur-3xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div
        onClick={handleHeroClick}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background px-6 py-10 cursor-pointer"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-0 -right-24 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
        </div>

        {/* Click ripple effect */}
        <AnimatePresence>
          {ripple && (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              onAnimationComplete={() => setRipple(null)}
              style={{ left: ripple.x - 40, top: ripple.y - 40 }}
              className="pointer-events-none absolute h-20 w-20 rounded-full bg-primary/40 blur-2xl"
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8"
        >
          <motion.img
            src={logo}
            alt="WAKESURF LONDRINA"
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-72 sm:h-80 w-auto object-contain drop-shadow-2xl"
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
          </div>
        </motion.div>
      </div>

      {/* Weather Section — Today & Tomorrow */}
      <div className="px-6 pt-8 pb-2 space-y-4">
        <div className="flex items-center gap-2">
          <Wind className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground font-display">Condições — Porecatu</h2>
          {weatherLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Hoje", data: today },
            { label: "Amanhã", data: tomorrow },
          ].map(({ label, data }) => (
            <div key={label} className="liquid-glass rounded-2xl p-4 space-y-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
              {data ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-foreground font-display">
                      {Math.round(data.tempMaxC)}°
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {Math.round(data.tempMinC)}°
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Wind className="h-3 w-3 text-primary" />
                      {data.windMaxKmh.toFixed(0)} km/h
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="h-3 w-3 text-primary" />
                      {data.precipitationMm.toFixed(1)}mm
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-12 flex items-center text-xs text-muted-foreground">—</div>
              )}
            </div>
          ))}
        </div>
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

      {/* Admin login — always at the very bottom */}
      <div className="px-6 pb-10 pt-4">
        <button
          onClick={() => navigate("/admin/login")}
          className="w-full max-w-sm mx-auto block py-3 px-8 rounded-2xl glass text-muted-foreground font-medium text-xs active:scale-[0.98] transition-transform"
        >
          Fazer login como administrador
        </button>
      </div>
    </div>
  );
};

export default HeroScreen;
