import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import logo from "@/assets/logo-light.png";

const RiderLoginScreen = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [needsNickname, setNeedsNickname] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          const { data: profile } = await supabase
            .from("rider_profiles")
            .select("id")
            .eq("user_id", u.id)
            .maybeSingle();
          if (profile) {
            navigate("/rider/dashboard");
          } else {
            setNeedsNickname(true);
          }
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        supabase
          .from("rider_profiles")
          .select("id")
          .eq("user_id", u.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile) {
              navigate("/rider/dashboard");
            } else {
              setNeedsNickname(true);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setError("Erro ao fazer login com Google");
      setLoading(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!nickname.trim() || !user) return;
    setSaving(true);
    setError("");

    const { error: insertError } = await supabase
      .from("rider_profiles")
      .insert({ user_id: user.id, nickname: nickname.trim() });

    if (insertError) {
      if (insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
        setError("Esse apelido já está em uso. Escolha outro.");
      } else {
        setError("Erro ao salvar apelido. Tente novamente.");
      }
      setSaving(false);
      return;
    }

    navigate("/rider/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center px-6 pt-12 pb-4">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="flex flex-col items-center gap-4">
            <img src={logo} alt="WAKESURF" className="h-24 w-auto object-contain drop-shadow-xl" />
            <h1 className="text-2xl font-bold text-foreground font-display">Área do Rider</h1>
            <p className="text-sm text-muted-foreground text-center">
              Faça login para acompanhar seu progresso e ranking
            </p>
          </div>

          {!user && (
            <button
              onClick={handleGoogleLogin}
              className="w-full py-4 rounded-2xl glass text-foreground font-semibold text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </button>
          )}

          {needsNickname && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="glass rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Escolha seu apelido de rider</span>
                </div>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ex: WaveKing, AquaRider..."
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                onClick={handleSaveNickname}
                disabled={!nickname.trim() || saving}
                className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-base disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirmar apelido
              </button>
            </motion.div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RiderLoginScreen;
