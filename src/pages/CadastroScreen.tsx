import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Waves, ArrowRight, Loader2, Check, Pencil, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const WAKESURF_WHATSAPP = "5544988586268";

interface Participante {
  nome: string;
  peso: string;
}

interface FormData {
  nome: string;
  telefone: string;
  tipo: string; // wake_day | session_curta
  participantes: number;
  lista: Participante[];
  experiencia: string;
  peso: string;
  sexo: string;
  idade: string;
  contraindicacoes: string;
}

type Step =
  | { kind: "text"; key: keyof FormData; label: string; subtitle?: string; placeholder?: string; type: "text" | "tel" | "number"; suffix?: string }
  | { kind: "textarea"; key: keyof FormData; label: string; subtitle?: string; placeholder?: string; optional?: boolean }
  | { kind: "select"; key: keyof FormData; label: string; subtitle?: string; options: { label: string; value: string }[] }
  | { kind: "counter"; key: "participantes"; label: string; subtitle?: string; min: number; max: number }
  | { kind: "lista"; label: string; subtitle?: string };

const TIPO_OPTIONS = [
  { label: "Wake Day Completo", value: "wake_day" },
  { label: "Session Curta", value: "session_curta" },
];

const EXPERIENCIA_OPTIONS = [
  { label: "Nunca surfei", value: "Nunca surfei" },
  { label: "Iniciante", value: "Iniciante" },
  { label: "Intermediário", value: "Intermediário" },
  { label: "Avançado", value: "Avançado" },
];

const SEXO_OPTIONS = [
  { label: "Masculino", value: "Masculino" },
  { label: "Feminino", value: "Feminino" },
  { label: "Outro", value: "Outro" },
];

const steps: Step[] = [
  { kind: "text", key: "nome", label: "Como podemos te chamar?", placeholder: "Seu nome completo", type: "text" },
  { kind: "text", key: "telefone", label: "Qual seu WhatsApp?", placeholder: "(11) 99999-9999", type: "tel" },
  { kind: "select", key: "tipo", label: "Que tipo de reserva você quer?", options: TIPO_OPTIONS },
  { kind: "counter", key: "participantes", label: "Quantas pessoas vão participar?", subtitle: "Incluindo você.", min: 1, max: 8 },
  { kind: "text", key: "peso", label: "Qual seu peso?", subtitle: "Importante para configurar o lastro da lancha.", placeholder: "Ex: 75", type: "number", suffix: "kg" },
  { kind: "lista", label: "Quem mais vai com você?", subtitle: "Nome e peso de cada participante." },
  { kind: "select", key: "experiencia", label: "Qual seu nível de experiência?", options: EXPERIENCIA_OPTIONS },
  { kind: "select", key: "sexo", label: "Sexo", options: SEXO_OPTIONS },
  { kind: "text", key: "idade", label: "Qual sua idade?", placeholder: "Ex: 28", type: "number" },
  { kind: "textarea", key: "contraindicacoes", label: "Possui contraindicações médicas ou limitação física?", placeholder: "Descreva ou deixe em branco", optional: true },
];

const labelFromValue = (opts: { label: string; value: string }[], v: string) =>
  opts.find((o) => o.value === v)?.label ?? v ?? "-";

const CadastroScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { date, time } = (location.state as { date: string; time: string }) || {};

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [form, setForm] = useState<FormData>({
    nome: "",
    telefone: "",
    tipo: "",
    participantes: 1,
    lista: [],
    experiencia: "",
    peso: "",
    sexo: "",
    idade: "",
    contraindicacoes: "",
  });

  // Sync extras list size with participantes count (excluding the main user)
  useEffect(() => {
    const extras = Math.max(0, form.participantes - 1);
    setForm((prev) => {
      const lista = [...prev.lista];
      while (lista.length < extras) lista.push({ nome: "", peso: "" });
      while (lista.length > extras) lista.pop();
      return { ...prev, lista };
    });
  }, [form.participantes]);

  // Visible steps (skip "lista" when only 1 participant)
  const visibleSteps = steps.filter((s) => !(s.kind === "lista" && form.participantes <= 1));
  const current = visibleSteps[step];

  const canAdvance = (() => {
    if (!current) return false;
    if (current.kind === "counter") return form.participantes >= current.min;
    if (current.kind === "lista") {
      return form.lista.every((p) => p.nome.trim().length > 0 && p.peso.trim().length > 0);
    }
    if (current.kind === "textarea" && current.optional) return true;
    const v = (form[current.key as keyof FormData] as string) ?? "";
    return typeof v === "string" && v.trim().length > 0;
  })();

  const handleNext = () => {
    if (step < visibleSteps.length - 1) setStep(step + 1);
    else setReviewing(true);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("create_booking", {
        _nome: form.nome,
        _telefone: form.telefone,
        _peso: form.peso ? Number(form.peso) : null,
        _sexo: form.sexo || null,
        _idade: form.idade ? Number(form.idade) : null,
        _contraindicacoes: form.contraindicacoes || null,
        _session_date: date,
        _session_time: time,
      });
      if (error || !data) throw error;

      const dataFmt = date ? format(new Date(date), "dd/MM/yyyy", { locale: ptBR }) : "";

      const listaCompleta = [
        { nome: form.nome, peso: form.peso ? `${form.peso}kg` : "" },
        ...form.lista.map((p) => ({
          nome: p.nome.trim(),
          peso: p.peso.trim().endsWith("kg") ? p.peso.trim() : `${p.peso.trim()}kg`,
        })),
      ];

      const payload = {
        origem: "webapp",
        nome: form.nome,
        whatsapp: form.telefone.replace(/\D/g, ""),
        tipo: form.tipo,
        data: dataFmt,
        horario: time ?? "",
        participantes: form.participantes,
        lista: listaCompleta,
        experiencia: form.experiencia,
        sexo: form.sexo || null,
        idade: form.idade ? Number(form.idade) : null,
        contraindicacoes: form.contraindicacoes?.trim() || null,
      };

      // Fire webhook (don't block UI on failure)
      supabase.functions
        .invoke("send-whatsapp", {
          body: { number: WAKESURF_WHATSAPP, payload },
        })
        .catch(() => {});

      navigate("/solicitacao-enviada", {
        state: { nome: form.nome, date, time },
      });
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (reviewing) setReviewing(false);
    else if (step > 0) setStep(step - 1);
    else navigate(-1);
  };

  const updateField = (val: string | number) => {
    if (!current || current.kind === "lista") return;
    setForm({ ...form, [current.key]: val });
  };

  const updateExtra = (i: number, field: keyof Participante, val: string) => {
    const lista = [...form.lista];
    lista[i] = { ...lista[i], [field]: val };
    setForm({ ...form, lista });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4">
        <button onClick={handleBack} className="text-muted-foreground">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Cadastro</span>
        </div>
        <div className="w-6" />
      </div>

      {/* Progress */}
      <div className="px-6 pb-8">
        <div className="flex gap-1.5">
          {visibleSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                reviewing || i <= step ? "gradient-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground mt-2 block">
          {reviewing ? "Revisão" : `${step + 1} de ${visibleSteps.length}`}
        </span>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-6">
        {reviewing ? (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pb-6"
          >
            <h2 className="text-2xl font-bold text-foreground font-display">Confira seus dados</h2>
            <p className="text-sm text-muted-foreground">
              Revise antes de enviar sua solicitação de reserva.
            </p>

            <div className="glass rounded-2xl p-5 space-y-3 mt-4">
              {date && (
                <ReviewRow
                  label="Data"
                  value={format(new Date(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                />
              )}
              {time && <ReviewRow label="Horário" value={time} />}
              <ReviewRow label="Tipo" value={labelFromValue(TIPO_OPTIONS, form.tipo)} />
              <ReviewRow label="Nome" value={form.nome} />
              <ReviewRow label="WhatsApp" value={form.telefone} />
              <ReviewRow label="Participantes" value={String(form.participantes)} />
              <ReviewRow label="Experiência" value={form.experiencia || "-"} />
            </div>

            <div className="glass rounded-2xl p-5 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Lista de participantes
              </p>
              <div className="space-y-1.5 mt-2">
                <div className="flex justify-between text-sm text-foreground">
                  <span className="font-medium">{form.nome}</span>
                  <span className="text-muted-foreground">{form.peso ? `${form.peso} kg` : "-"}</span>
                </div>
                {form.lista.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm text-foreground">
                    <span className="font-medium">{p.nome}</span>
                    <span className="text-muted-foreground">
                      {p.peso ? (p.peso.endsWith("kg") ? p.peso : `${p.peso} kg`) : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5 space-y-3">
              <ReviewRow label="Sexo" value={form.sexo || "-"} />
              <ReviewRow label="Idade" value={form.idade || "-"} />
              <ReviewRow
                label="Contraindicações"
                value={form.contraindicacoes?.trim() || "Nenhuma"}
              />
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-foreground font-display">{current.label}</h2>
              {"subtitle" in current && current.subtitle && (
                <p className="text-sm text-muted-foreground">{current.subtitle}</p>
              )}

              {current.kind === "select" && (
                <div className="flex flex-col gap-3 mt-6">
                  {current.options.map((opt) => {
                    const v = form[current.key as keyof FormData] as string;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateField(opt.value)}
                        className={`py-4 px-6 rounded-2xl font-medium text-left transition-all ${
                          v === opt.value
                            ? "gradient-primary text-primary-foreground shadow-glow"
                            : "glass text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {current.kind === "counter" && (
                <div className="flex items-center justify-center gap-6 mt-10">
                  <button
                    onClick={() =>
                      updateField(Math.max(current.min, form.participantes - 1))
                    }
                    disabled={form.participantes <= current.min}
                    className="h-14 w-14 rounded-full glass flex items-center justify-center text-foreground disabled:opacity-30 active:scale-95 transition-all"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <div className="text-6xl font-bold text-foreground font-display w-24 text-center">
                    {form.participantes}
                  </div>
                  <button
                    onClick={() =>
                      updateField(Math.min(current.max, form.participantes + 1))
                    }
                    disabled={form.participantes >= current.max}
                    className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground shadow-glow disabled:opacity-30 active:scale-95 transition-all"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              )}

              {current.kind === "lista" && (
                <div className="flex flex-col gap-4 mt-2">
                  {form.lista.map((p, i) => (
                    <div key={i} className="glass rounded-2xl p-4 space-y-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                        Participante {i + 2}
                      </p>
                      <input
                        type="text"
                        value={p.nome}
                        onChange={(e) => updateExtra(i, "nome", e.target.value)}
                        placeholder="Nome"
                        className="w-full bg-muted border-none rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <div className="relative">
                        <input
                          type="number"
                          value={p.peso}
                          onChange={(e) => updateExtra(i, "peso", e.target.value)}
                          placeholder="Peso"
                          className="w-full bg-muted border-none rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                          kg
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {current.kind === "textarea" && (
                <textarea
                  value={(form[current.key as keyof FormData] as string) ?? ""}
                  onChange={(e) => updateField(e.target.value)}
                  placeholder={current.placeholder}
                  rows={4}
                  className="w-full bg-muted border-none rounded-2xl px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none text-lg"
                />
              )}

              {current.kind === "text" && (
                <div className="relative">
                  <input
                    type={current.type}
                    value={(form[current.key as keyof FormData] as string) ?? ""}
                    onChange={(e) => updateField(e.target.value)}
                    placeholder={current.placeholder}
                    autoFocus
                    className="w-full bg-muted border-none rounded-2xl px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-lg"
                  />
                  {current.suffix && (
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      {current.suffix}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* CTA */}
      <div className="p-6 space-y-3">
        {reviewing ? (
          <>
            <button
              disabled={saving}
              onClick={handleConfirm}
              className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-glow disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Confirmar reserva
                </>
              )}
            </button>
            <button
              disabled={saving}
              onClick={() => {
                setReviewing(false);
                setStep(0);
              }}
              className="w-full py-4 rounded-2xl glass text-foreground font-semibold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Alterar dados
            </button>
          </>
        ) : (
          <button
            disabled={!canAdvance || saving}
            onClick={handleNext}
            className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-glow disabled:opacity-30 disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {step < visibleSteps.length - 1 ? "Continuar" : "Solicitar reserva"}
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium shrink-0">
        {label}
      </span>
      <span className="text-sm text-foreground font-medium text-right">{value}</span>
    </div>
  );
}

export default CadastroScreen;
