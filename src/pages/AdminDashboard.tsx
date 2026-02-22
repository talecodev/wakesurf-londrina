import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, Calendar, CloudRain, Wind, Sun, CloudSun,
  Clock, MessageSquare, LogOut, Loader2, Plus, Trash2, Send,
  ChevronLeft, Image as ImageIcon, Upload
} from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useWeatherForecast, type DayWeather } from "@/hooks/useWeatherForecast";

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
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-6">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Dashboard Admin</h1>
        <button onClick={handleLogout} className="text-muted-foreground">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wider">Faturamento</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              R$ {revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="glass rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wider">Horas na Água</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalHours}h</p>
          </div>
        </div>

        {/* Clima - Próximos 5 dias */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CloudRain className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Clima — Porecatu, PR
            </h2>
          </div>
          {weatherLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
          ) : (
            <div className="flex gap-2">
              {weatherNext5.map(({ date, weather }) => (
                <div
                  key={date.toISOString()}
                  className="flex-1 bg-secondary/50 rounded-xl p-3 flex flex-col items-center gap-1"
                >
                  <span className="text-xs text-muted-foreground capitalize">
                    {format(date, "EEE", { locale: ptBR })}
                  </span>
                  <span className="text-sm font-bold text-foreground">{format(date, "dd")}</span>
                  {weather ? (
                    <>
                      <WeatherIcon condition={weather.condition} />
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Wind className="h-2.5 w-2.5" />{weather.windMaxKmh.toFixed(0)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calendário - Próximas sessões */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Próximas Sessões (5 dias)
            </h2>
          </div>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sessão agendada</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-secondary/50 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {s.profiles?.nome || "Cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.session_date + "T12:00:00"), "dd/MM", { locale: ptBR })} às {s.session_time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      s.status === "confirmed"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {s.status === "confirmed" ? "Confirmado" : "Pendente"}
                    </span>
                    {s.profiles?.telefone && (
                      <button
                        onClick={() => handleSendWhatsApp(s)}
                        disabled={sendingWhatsApp === s.id}
                        className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
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
        </div>

        {/* Mural de Recados */}
        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Mural de Recados
            </h2>
          </div>

          {/* Novo recado */}
          <div className="space-y-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título do recado"
              className="w-full px-3 py-2 rounded-xl bg-secondary/50 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Conteúdo..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-secondary/50 text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handlePostMessage}
              disabled={!newTitle.trim() || !newContent.trim()}
              className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium text-sm disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" /> Publicar Recado
            </button>
          </div>

          {/* Lista de recados */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary/50 rounded-xl p-3 flex justify-between items-start gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(m.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteMessage(m.id)}
                  className="text-destructive/60 hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Galeria de Fotos */}
        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Galeria de Fotos
            </h2>
          </div>

          <div className="space-y-2">
            <input
              value={photoTitle}
              onChange={(e) => setPhotoTitle(e.target.value)}
              placeholder="Título da foto (opcional)"
              className="w-full px-3 py-2 rounded-xl bg-secondary/50 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <label className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Enviando..." : "Enviar Foto"}
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadPhoto}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {galleryPhotos.map((p) => (
              <div key={p.id} className="relative rounded-xl overflow-hidden bg-secondary/50 aspect-square group">
                <img src={p.image_url} alt={p.title || "Foto"} className="h-full w-full object-cover" />
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeletePhoto(p.id, p.image_url)}
                    className="p-1.5 rounded-lg bg-destructive/80 text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                {p.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-white truncate">{p.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
