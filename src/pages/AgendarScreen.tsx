import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Waves, CloudRain, Wind, Sun, CloudSun, Loader2 } from "lucide-react";
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
import { useWeatherForecast, type DayWeather } from "@/hooks/useWeatherForecast";

const TIME_SLOTS = ["07:00", "08:30", "10:00", "11:30", "14:00", "15:30", "17:00"];

const WeatherIcon = ({ condition }: { condition: DayWeather["condition"] }) => {
  switch (condition) {
    case "good":
      return <Sun className="h-3.5 w-3.5 text-emerald-400" />;
    case "moderate":
      return <CloudSun className="h-3.5 w-3.5 text-amber-400" />;
    case "bad":
      return <CloudRain className="h-3.5 w-3.5 text-red-400" />;
  }
};

const WeatherBadge = ({ weather, selected }: { weather?: DayWeather; selected: boolean }) => {
  if (!weather) return null;
  return (
    <div className="mt-1">
      <WeatherIcon condition={weather.condition} />
    </div>
  );
};

const AgendarScreen = () => {
  const navigate = useNavigate();
  const now = new Date();
  const today = startOfDay(now);
  // Se não há mais slots disponíveis hoje, default para amanhã
  const lastSlot = TIME_SLOTS[TIME_SLOTS.length - 1];
  const [lh, lm] = lastSlot.split(":").map(Number);
  const todayHasSlots = now.getHours() < lh || (now.getHours() === lh && now.getMinutes() < lm);
  const defaultDate = todayHasSlots ? today : addDays(today, 1);
  const [weekStart, setWeekStart] = useState(startOfWeek(defaultDate, { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(defaultDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const { getWeatherForDate, loading: weatherLoading } = useWeatherForecast();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const selectedWeather = selectedDate ? getWeatherForDate(selectedDate) : undefined;

  // Filtra horários passados quando a data selecionada for hoje
  const availableSlots = useMemo(() => {
    if (!selectedDate || !isSameDay(selectedDate, today)) return TIME_SLOTS;
    return TIME_SLOTS.filter((t) => {
      const [h, m] = t.split(":").map(Number);
      return h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
    });
  }, [selectedDate]);

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

      {/* Weather Legend */}
      <div className="px-6 pb-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Sun className="h-3 w-3 text-emerald-400" /> Bom</span>
        <span className="flex items-center gap-1"><CloudSun className="h-3 w-3 text-amber-400" /> Moderado</span>
        <span className="flex items-center gap-1"><CloudRain className="h-3 w-3 text-red-400" /> Ruim</span>
        {weatherLoading && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
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
            const weather = getWeatherForDate(day);
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
                {!past && <WeatherBadge weather={weather} selected={!!selected} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weather Detail Card */}
      <AnimatePresence mode="wait">
        {selectedDate && selectedWeather && (
          <motion.div
            key={`weather-${selectedDate.toISOString()}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 pb-4"
          >
            <div
              className={`glass rounded-2xl p-4 flex items-center gap-4 border-l-4 ${
                selectedWeather.condition === "good"
                  ? "border-l-emerald-400"
                  : selectedWeather.condition === "moderate"
                  ? "border-l-amber-400"
                  : "border-l-red-400"
              }`}
            >
              <WeatherIcon condition={selectedWeather.condition} />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {selectedWeather.condition === "good"
                    ? "Condições ideais para wakeboard! 🤙"
                    : selectedWeather.condition === "moderate"
                    ? "Condições aceitáveis, fique atento."
                    : "Condições desfavoráveis para wakeboard."}
                </p>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CloudRain className="h-3 w-3" /> {selectedWeather.precipitationMm.toFixed(1)}mm
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="h-3 w-3" /> {selectedWeather.windMaxKmh.toFixed(0)} km/h
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              {availableSlots.length === 0 && (
                <p className="col-span-3 text-sm text-muted-foreground text-center py-4">
                  Não há mais horários disponíveis hoje. Selecione outro dia.
                </p>
              )}
              {availableSlots.map((time) => {
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
