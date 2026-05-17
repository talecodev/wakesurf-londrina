import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2, Trophy, Star, Download,
  Zap, Award, Crown, Shield, Flame, Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SectionCard, StatCard } from "@/components/layout/SectionCard";

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
    <DashboardLayout
      variant="rider"
      title={profile.nickname}
      subtitle={`Nível ${currentLevel.level} · ${currentLevel.name}`}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Hero profile card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-elevated relative overflow-hidden p-6 md:p-8"
        >
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className={`h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-muted border border-border flex items-center justify-center ${currentLevel.color}`}>
              <LevelIcon className="h-10 w-10 md:h-12 md:w-12" />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground font-display tracking-tight">
                  {profile.nickname}
                </p>
                <p className={`text-sm font-medium ${currentLevel.color}`}>
                  Nível {currentLevel.level} — {currentLevel.name}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground">
                    {sessionCount} sessões realizadas
                  </span>
                  {nextLevel && (
                    <span className="text-[11px] text-muted-foreground">
                      Próximo: {nextLevel.name}
                    </span>
                  )}
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted border border-border">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full gradient-primary"
                  />
                </div>
                {nextLevel ? (
                  <p className="text-[11px] text-muted-foreground">
                    Faltam <span className="text-foreground font-medium">{nextLevel.minSessions - sessionCount}</span> sessões para {nextLevel.name}
                  </p>
                ) : (
                  <p className="text-[11px] text-primary font-semibold">
                    🏆 Nível máximo alcançado
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Sessões" value={sessionCount} icon={Trophy} accent />
          <StatCard label="Nível atual" value={currentLevel.level} icon={Star} />
          <StatCard
            label="Posição"
            value={
              ranking.findIndex((r) => r.nickname === profile.nickname) + 1 || "—"
            }
            icon={Award}
            hint={`de ${ranking.length} riders`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Níveis */}
          <SectionCard title="Progressão de níveis" icon={Star}>
            <div className="space-y-1.5">
              {LEVELS.map((l) => {
                const Icon = l.icon;
                const isActive = currentLevel.level >= l.level;
                const isCurrent = currentLevel.level === l.level;
                return (
                  <div
                    key={l.level}
                    className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors ${
                      isCurrent
                        ? "bg-primary/5 border-primary/30"
                        : isActive
                        ? "bg-muted/40 border-border"
                        : "border-transparent opacity-40"
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-md bg-muted flex items-center justify-center ${l.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        Nível {l.level} — {l.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {l.minSessions === 0
                          ? "0-5"
                          : l.level === 5
                          ? "51+"
                          : `${l.minSessions}-${LEVELS[l.level]?.minSessions - 1}`}{" "}
                        sessões
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold border border-primary/20">
                        Atual
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Ranking */}
          <SectionCard title="Ranking da comunidade" icon={Trophy}>
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum rider ainda
              </p>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {ranking.map((r, i) => {
                  const rLevel = getLevel(r.sessions);
                  const RIcon = rLevel.icon;
                  const isMe = r.nickname === profile.nickname;
                  return (
                    <div
                      key={r.nickname}
                      className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors ${
                        isMe
                          ? "bg-primary/5 border-primary/30"
                          : "bg-muted/20 border-transparent hover:bg-muted/40"
                      }`}
                    >
                      <span
                        className={`text-sm font-bold w-7 text-center font-display ${
                          i === 0
                            ? "text-amber-400"
                            : i === 1
                            ? "text-slate-300"
                            : i === 2
                            ? "text-amber-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <RIcon className={`h-4 w-4 ${rLevel.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {r.nickname}
                          {isMe && <span className="ml-1.5 text-primary">·  você</span>}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {r.sessions}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Galeria */}
        <SectionCard title="Galeria de fotos" icon={ImageIcon} description="Imagens das sessões de treino">
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma foto disponível ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {photos.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 aspect-square"
                >
                  <img
                    src={p.image_url}
                    alt={p.title || "Foto de treino"}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
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
        </SectionCard>
      </div>
    </DashboardLayout>
  );
};

export default RiderDashboard;
