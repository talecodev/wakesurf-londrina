import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, Calendar, CloudRain, Wind, Sun, CloudSun,
  Clock, MessageSquare, Loader2, Plus, Trash2, Send,
  Image as ImageIcon, Upload
} from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useWeatherForecast, type DayWeather } from "@/hooks/useWeatherForecast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SectionCard, StatCard } from "@/components/layout/SectionCard";

const WeatherIcon = ({ condition }: { condition: DayWeather["condition"] }) => {
  switch (condition) {
    case "good": return <Sun className="h-5 w-5 text-emerald-400" />;
    case "moderate": return <CloudSun className="h-5 w-5 text-amber-400" />;
    case "bad": return <CloudRain className="h-5 w-5 text-red-400" />;
  }
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAdminAuth();
  const { forecast, loading: weatherLoading } = useWeatherForecast();

  const [revenue, setRevenue] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [sessions, setSessions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [photoTitle, setPhotoTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [authLoading, user, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    const today = format(startOfDay(new Date()), "yyyy-MM-dd");
    const in5Days = format(addDays(new Date(), 5), "yyyy-MM-dd");

    // Faturamento (pagamentos confirmados)
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("status", "confirmed");
    const total = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    setRevenue(total);

    // Total horas (cada session = 1h)
    const { data: allSessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("status", "confirmed");
    setTotalHours((allSessions || []).length);

    // Próximas 5 dias de sessões
    const { data: upcoming } = await supabase
      .from("sessions")
      .select("*, profiles(nome, telefone)")
      .gte("session_date", today)
      .lte("session_date", in5Days)
      .order("session_date", { ascending: true })
      .order("session_time", { ascending: true });
    setSessions(upcoming || []);

    // Mural
    const { data: msgs } = await supabase
      .from("board_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setMessages(msgs || []);

    // Gallery
    const { data: gallery } = await supabase
      .from("gallery_photos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setGalleryPhotos(gallery || []);

    setLoadingData(false);
  };

  const handlePostMessage = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    await supabase.from("board_messages").insert({
      title: newTitle.trim(),
      content: newContent.trim(),
      author_id: user!.id,
    });
    setNewTitle("");
    setNewContent("");
    fetchData();
  };

  const handleDeleteMessage = async (id: string) => {
    await supabase.from("board_messages").delete().eq("id", id);
    fetchData();
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("gallery").upload(path, file);
    if (uploadError) {
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(path);
    await supabase.from("gallery_photos").insert({
      title: photoTitle.trim() || null,
      image_url: urlData.publicUrl,
      uploaded_by: user!.id,
    });
    setPhotoTitle("");
    setUploading(false);
    fetchData();
  };

  const handleDeletePhoto = async (id: string, url: string) => {
    const path = url.split("/gallery/")[1];
    if (path) await supabase.storage.from("gallery").remove([path]);
    await supabase.from("gallery_photos").delete().eq("id", id);
    fetchData();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleSendWhatsApp = async (session: any) => {
    const telefone = session.profiles?.telefone;
    const nome = session.profiles?.nome || "Cliente";
    if (!telefone) return;
    setSendingWhatsApp(session.id);
    try {
      const dateStr = format(new Date(session.session_date + "T12:00:00"), "dd/MM", { locale: ptBR });
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          number: `55${telefone.replace(/\D/g, "")}`,
          body: `Olá ${nome}! Precisamos remarcar sua sessão do dia ${dateStr} às ${session.session_time}. Entre em contato conosco. — Wakesurf Londrina`,
        },
      });
    } catch (err) {
      console.error("Erro ao enviar WhatsApp:", err);
    } finally {
      setSendingWhatsApp(null);
    }
  };

  const next5Days = Array.from({ length: 5 }, (_, i) => addDays(new Date(), i));
  const weatherNext5 = next5Days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return { date: d, weather: forecast.find((f) => f.date === key) };
  });

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout
      variant="admin"
      title="Visão geral"
      subtitle="Painel administrativo · Wakesurf Londrina"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Faturamento"
            value={`R$ ${revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            hint="Pagamentos confirmados"
            accent
          />
          <StatCard
            label="Horas na água"
            value={`${totalHours}h`}
            icon={Clock}
            hint="Sessões confirmadas"
          />
          <StatCard
            label="Próximas (5d)"
            value={sessions.length}
            icon={Calendar}
            hint="Sessões agendadas"
          />
          <StatCard
            label="Recados ativos"
            value={messages.length}
            icon={MessageSquare}
            hint="Publicados no mural"
          />
        </div>

        {/* Two-column grid on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Clima */}
            <SectionCard
              title="Clima — Porecatu, PR"
              icon={CloudRain}
              description="Previsão para os próximos 5 dias"
            >
              {weatherLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {weatherNext5.map(({ date, weather }) => (
                    <div
                      key={date.toISOString()}
                      className="rounded-lg border border-border bg-muted/40 p-3 flex flex-col items-center gap-1.5"
                    >
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {format(date, "EEE", { locale: ptBR })}
                      </span>
                      <span className="text-base font-bold text-foreground font-display">
                        {format(date, "dd")}
                      </span>
                      {weather ? (
                        <>
                          <WeatherIcon condition={weather.condition} />
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Wind className="h-2.5 w-2.5" />
                            {weather.windMaxKmh.toFixed(0)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Próximas sessões */}
            <SectionCard
              title="Próximas sessões"
              icon={Calendar}
              description="Agendamentos confirmados e pendentes"
            >
              {sessions.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma sessão agendada</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60 -mx-5">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {s.profiles?.nome || "Cliente"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(s.session_date + "T12:00:00"), "dd 'de' MMM", { locale: ptBR })} · {s.session_time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            s.status === "confirmed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {s.status === "confirmed" ? "Confirmado" : "Pendente"}
                        </span>
                        {s.profiles?.telefone && (
                          <button
                            onClick={() => handleSendWhatsApp(s)}
                            disabled={sendingWhatsApp === s.id}
                            className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                            title="Enviar alerta via WhatsApp"
                          >
                            {sendingWhatsApp === s.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Galeria */}
            <SectionCard
              title="Galeria de fotos"
              icon={ImageIcon}
              description="Imagens visíveis para os riders"
            >
              <div className="space-y-3 mb-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    placeholder="Título da foto (opcional)"
                    className="flex-1 px-3 py-2 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus-ring"
                  />
                  <label className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all shrink-0">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Enviando..." : "Enviar foto"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadPhoto}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {galleryPhotos.length === 0 ? (
                <div className="text-center py-10">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma foto enviada</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {galleryPhotos.map((p) => (
                    <div
                      key={p.id}
                      className="relative rounded-lg overflow-hidden border border-border bg-muted/30 aspect-square group"
                    >
                      <img src={p.image_url} alt={p.title || "Foto"} className="h-full w-full object-cover" />
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeletePhoto(p.id, p.image_url)}
                          className="p-1.5 rounded-md bg-destructive/80 text-destructive-foreground backdrop-blur"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {p.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-[11px] text-white truncate">{p.title}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Side column: Mural */}
          <div className="space-y-6">
            <SectionCard title="Mural de recados" icon={MessageSquare}>
              <div className="space-y-2 mb-4">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Título do recado"
                  className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus-ring"
                />
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Conteúdo..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground text-sm resize-none focus-ring"
                />
                <button
                  onClick={handlePostMessage}
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="w-full py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <Plus className="h-4 w-4" /> Publicar
                </button>
              </div>

              <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum recado publicado
                  </p>
                ) : (
                  messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-md border border-border bg-muted/30 p-3 flex justify-between items-start gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{m.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {format(new Date(m.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteMessage(m.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
