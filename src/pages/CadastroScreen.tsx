import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Waves, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const WAKESURF_WHATSAPP = "5544988586268";

interface FormData {
  nome: string;
  telefone: string;
  peso: string;
  sexo: string;
  idade: string;
  contraindicacoes: string;
}

const steps = [
  { key: "nome", label: "Como podemos te chamar?", placeholder: "Seu nome completo", type: "text" },
  { key: "telefone", label: "Qual seu WhatsApp?", placeholder: "(11) 99999-9999", type: "tel" },
  { key: "peso", label: "Qual seu peso?", subtitle: "Importante para configurar o lastro da lancha.", placeholder: "Ex: 75", type: "number", suffix: "kg" },
  { key: "sexo", label: "Sexo", type: "select", options: ["Masculino", "Feminino", "Outro"] },
  { key: "idade", label: "Qual sua idade?", placeholder: "Ex: 28", type: "number" },
  { key: "contraindicacoes", label: "Possui contraindicações médicas ou limitação física?", placeholder: "Descreva ou deixe em branco", type: "textarea" },
] as const;

const CadastroScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { date, time } = (location.state as { date: string; time: string }) || {};

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    nome: "",
    telefone: "",
    peso: "",
    sexo: "",
    idade: "",
    contraindicacoes: "",
  });

  const current = steps[step];
  const value = form[current.key as keyof FormData];
  const isRequired = current.key !== "contraindicacoes";
  const canAdvance = !isRequired || value.trim().length > 0;

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
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
        const result = data as { profile_id: string; session_id: string };

        const dataFmt = date
          ? format(new Date(date), "dd/MM/yyyy (EEEE)", { locale: ptBR })
          : "(sem data)";

        const resumo =
          `🏄 *Nova solicitação de Session — Wakesurf*\n\n` +
          `*Data desejada:* ${dataFmt}\n` +
          `*Horário:* ${time ?? "-"}\n\n` +
          `*Nome:* ${form.nome}\n` +
          `*WhatsApp:* ${form.telefone}\n` +
          `*Peso:* ${form.peso ? form.peso + " kg" : "-"}\n` +
          `*Sexo:* ${form.sexo || "-"}\n` +
          `*Idade:* ${form.idade || "-"}\n` +
          `*Contraindicações:* ${form.contraindicacoes?.trim() || "Nenhuma"}\n\n` +
          `Entrar em contato para confirmar agendamento.`;

        supabase.functions
          .invoke("send-whatsapp", {
            body: { number: WAKESURF_WHATSAPP, body: resumo },
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
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else navigate(-1);
  };

  const updateField = (val: string) => {
    setForm({ ...form, [current.key]: val });
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
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "gradient-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground mt-2 block">
          {step + 1} de {steps.length}
        </span>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-6">
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

            {current.type === "select" && "options" in current ? (
              <div className="flex flex-col gap-3 mt-6">
                {current.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => updateField(opt)}
                    className={`py-4 px-6 rounded-2xl font-medium text-left transition-all ${
                      value === opt
                        ? "gradient-primary text-primary-foreground shadow-glow"
                        : "glass text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : current.type === "textarea" ? (
              <textarea
                value={value}
                onChange={(e) => updateField(e.target.value)}
                placeholder={current.placeholder}
                rows={4}
                className="w-full bg-muted border-none rounded-2xl px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none text-lg"
              />
            ) : (
              <div className="relative">
                <input
                  type={current.type}
                  value={value}
                  onChange={(e) => updateField(e.target.value)}
                  placeholder={current.placeholder}
                  autoFocus
                  className="w-full bg-muted border-none rounded-2xl px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-lg"
                />
                {"suffix" in current && current.suffix && (
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    {current.suffix}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="p-6">
        <button
          disabled={!canAdvance || saving}
          onClick={handleNext}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-glow disabled:opacity-30 disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {step < steps.length - 1 ? "Continuar" : "Ir para pagamento"}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CadastroScreen;
