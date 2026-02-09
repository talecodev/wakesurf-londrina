import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Waves } from "lucide-react";
import {
  addDays,
  format,
  startOfWeek,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const TIME_SLOTS = ["07:00", "08:30", "10:00", "11:30", "14:00", "15:30", "17:00"];

const AgendarScreen = () => {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = startOfDay(new Date());

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      navigate("/cadastro", {
        state: {
          date: selectedDate.toISOString(),
          time: selectedTime,
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Agendar Session</span>
        </div>
        <div className="w-6" />
      </div>

      {/* Month/Year */}
      <div className="px-6 pb-4 flex items-center justify-between">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))}>
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h2 className="text-lg font-semibold text-foreground capitalize">
          {format(weekStart, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))}>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Week Carousel */}
      <div className="px-4 pb-6">
        <div className="flex gap-2 justify-between">
          {weekDays.map((day) => {
            const past = isBefore(day, today);
            const selected = selectedDate && isSameDay(day, selectedDate);
            return (
              <button
                key={day.toISOString()}
                disabled={past}
                onClick={() => {
                  setSelectedDate(day);
                  setSelectedTime(null);
                }}
                className={`flex-1 flex flex-col items-center py-3 rounded-2xl transition-all ${
                  selected
                    ? "gradient-primary shadow-glow"
                    : past
                    ? "opacity-30"
                    : "glass"
                }`}
              >
                <span
                  className={`text-xs font-medium uppercase ${
                    selected ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {format(day, "EEE", { locale: ptBR })}
                </span>
                <span
                  className={`text-lg font-bold mt-1 ${
                    selected ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {format(day, "dd")}
                </span>
                {isToday(day) && (
                  <div
                    className={`h-1 w-1 rounded-full mt-1 ${
                      selected ? "bg-primary-foreground" : "bg-primary"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate.toISOString()}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex-1 px-6"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Horários disponíveis
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {TIME_SLOTS.map((time) => {
                const active = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                      active
                        ? "gradient-primary text-primary-foreground shadow-glow"
                        : "glass text-foreground hover:border-primary/30"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <div className="p-6 mt-auto">
        <button
          disabled={!selectedDate || !selectedTime}
          onClick={handleContinue}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-glow disabled:opacity-30 disabled:shadow-none active:scale-[0.98] transition-all"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default AgendarScreen;
