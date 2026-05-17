import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export type DayWeather = {
  date: string; // yyyy-MM-dd
  precipitationMm: number;
  windMaxKmh: number;
  tempMaxC: number;
  tempMinC: number;
  condition: "good" | "moderate" | "bad";
};

function classifyCondition(rainMm: number, windKmh: number): DayWeather["condition"] {
  // Condições ruins para wakeboard: chuva forte ou vento muito forte
  if (rainMm > 5 || windKmh > 30) return "bad";
  // Condições moderadas: alguma chuva ou vento moderado
  if (rainMm > 1 || windKmh > 20) return "moderate";
  return "good";
}

export function useWeatherForecast() {
  const [forecast, setForecast] = useState<DayWeather[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("weather-forecast");
        if (error || !data?.daily) throw error ?? new Error("no data");

        const days: DayWeather[] = data.daily.time.map((date: string, i: number) => ({
          date,
          precipitationMm: data.daily.precipitation_sum[i] ?? 0,
          windMaxKmh: data.daily.wind_speed_10m_max[i] ?? 0,
          tempMaxC: data.daily.temperature_2m_max?.[i] ?? 0,
          tempMinC: data.daily.temperature_2m_min?.[i] ?? 0,
          condition: classifyCondition(
            data.daily.precipitation_sum[i] ?? 0,
            data.daily.wind_speed_10m_max[i] ?? 0
          ),
        }));

        setForecast(days);
      } catch (err) {
        console.error("Erro ao buscar previsão:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherForDate = (date: Date): DayWeather | undefined => {
    const key = format(date, "yyyy-MM-dd");
    return forecast.find((d) => d.date === key);
  };

  return { forecast, loading, getWeatherForDate };
}
