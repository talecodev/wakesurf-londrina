const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=-22.7558&longitude=-51.3789" +
      "&daily=precipitation_sum,wind_speed_10m_max,temperature_2m_max,temperature_2m_min" +
      "&timezone=America/Sao_Paulo&forecast_days=16";
    const r = await fetch(url);
    const data = await r.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});