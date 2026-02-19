import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft, LogOut, Loader2, Trophy, Star, Download,
  Zap, Award, Crown, Shield, Flame, Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type RiderProfile = {
  id: string;
  user_id: string;
  nickname: string;
  profile_id: string | null;
  created_at: string;
};

type GalleryPhoto = {
  id: string;
  title: string | null;
  image_url: string;
  created_at: string;
};

const LEVELS = [
  { level: 1, name: "Iniciante", minSessions: 0, icon: Shield, color: "text-slate-400" },
  { level: 2, name: "Praticante", minSessions: 6, icon: Zap, color: "text-emerald-400" },
  { level: 3, name: "Intermediário", minSessions: 16, icon: Flame, color: "text-amber-400" },
  { level: 4, name: "Avançado", minSessions: 31, icon: Award, color: "text-purple-400" },
  { level: 5, name: "Pro Rider", minSessions: 51, icon: Crown, color: "text-primary" },
];

function getLevel(sessionCount: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (sessionCount >= LEVELS[i].minSessions) return LEVELS[i];
  }
  return LEVELS[0];
}

function getNextLevel(sessionCount: number) {
  const current = getLevel(sessionCount);
  if (current.level >= 5) return null;
  return LEVELS[current.level]; // next level
}

const RiderDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [ranking, setRanking] = useState<{ nickname: string; sessions: number }[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        navigate("/rider/login");
        return;
      }
      setUserId(session.user.id);

      // Get rider profile
      const { data: rp } = await supabase
        .from("rider_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!rp) {
        navigate("/rider/login");
        return;
      }
      setProfile(rp);

      // Get session count for this rider (via profile_id link)
      let myCount = 0;
      if (rp.profile_id) {
        const { count } = await supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("profile_id", rp.profile_id)
          .eq("status", "confirmed");
        myCount = count || 0;
      }
      setSessionCount(myCount);

      // Get all rider profiles for ranking
      const { data: allRiders } = await supabase
        .from("rider_profiles")
        .select("nickname, profile_id");

      // For each rider with a profile_id, count sessions
      const rankingData: { nickname: string; sessions: number }[] = [];
      if (allRiders) {
        for (const r of allRiders) {
          let count = 0;
          if (r.profile_id) {
            const { count: c } = await supabase
              .from("sessions")
              .select("id", { count: "exact", head: true })
              .eq("profile_id", r.profile_id)
              .eq("status", "confirmed");
            count = c || 0;
          }
          rankingData.push({ nickname: r.nickname, sessions: count });
        }
      }
      rankingData.sort((a, b) => b.sessions - a.sessions);
      setRanking(rankingData);

      // Gallery photos
      const { data: galleryData } = await supabase
        .from("gallery_photos")
        .select("id, title, image_url, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setPhotos(galleryData || []);

      setLoading(false);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentLevel = getLevel(sessionCount);
  const nextLevel = getNextLevel(sessionCount);
  const LevelIcon = currentLevel.icon;
  const progress = nextLevel
    ? ((sessionCount - currentLevel.minSessions) / (nextLevel.minSessions - currentLevel.minSessions)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-6">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Meu Progresso</h1>
        <button onClick={handleLogout} className="text-muted-foreground">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 space-y-6">
        {/* Profile + Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 flex flex-col items-center gap-4"
        >
          <div className={`h-20 w-20 rounded-full bg-secondary flex items-center justify-center ${currentLevel.color}`}>
            <LevelIcon className="h-10 w-10" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xl font-bold text-foreground">{profile.nickname}</p>
            <p className={`text-sm font-semibold ${currentLevel.color}`}>
              Nível {currentLevel.level} — {currentLevel.name}
            </p>
            <p className="text-xs text-muted-foreground">{sessionCount} sessões realizadas</p>
          </div>

          {/* Progress bar */}
          <div className="w-full space-y-1">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full gradient-primary"
              />
            </div>
            {nextLevel ? (
              <p className="text-[10px] text-muted-foreground text-center">
                Faltam {nextLevel.minSessions - sessionCount} sessões para {nextLevel.name}
              </p>
            ) : (
              <p className="text-[10px] text-primary text-center font-semibold">
                🏆 Nível máximo alcançado!
              </p>
            )}
          </div>
        </motion.div>

        {/* Levels overview */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Níveis</h2>
          </div>
          <div className="space-y-2">
            {LEVELS.map((l) => {
              const Icon = l.icon;
              const isActive = currentLevel.level >= l.level;
              return (
                <div
                  key={l.level}
                  className={`flex items-center gap-3 p-2 rounded-xl ${
                    isActive ? "bg-secondary/50" : "opacity-40"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${l.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Nível {l.level} — {l.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {l.minSessions === 0 ? "0-5" : l.level === 5 ? "51+" : `${l.minSessions}-${LEVELS[l.level]?.minSessions - 1}`} sessões
                    </p>
                  </div>
                  {isActive && currentLevel.level === l.level && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                      Atual
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Ranking */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Ranking</h2>
          </div>
          {ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum rider ainda</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ranking.map((r, i) => {
                const rLevel = getLevel(r.sessions);
                const RIcon = rLevel.icon;
                const isMe = r.nickname === profile.nickname;
                return (
                  <div
                    key={r.nickname}
                    className={`flex items-center gap-3 p-2 rounded-xl ${
                      isMe ? "bg-primary/10 ring-1 ring-primary/30" : "bg-secondary/30"
                    }`}
                  >
                    <span className={`text-sm font-bold w-6 text-center ${
                      i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {i + 1}º
                    </span>
                    <RIcon className={`h-4 w-4 ${rLevel.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {r.nickname} {isMe && "⭐"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{r.sessions} sess.</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gallery */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Galeria de Fotos</h2>
          </div>
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma foto disponível ainda</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="relative group rounded-xl overflow-hidden bg-secondary/50 aspect-square"
                >
                  <img
                    src={p.image_url}
                    alt={p.title || "Foto de treino"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    {p.title && (
                      <p className="text-xs text-white font-medium truncate">{p.title}</p>
                    )}
                    <a
                      href={p.image_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-[10px] text-white/80 hover:text-white"
                    >
                      <Download className="h-3 w-3" /> Download
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
