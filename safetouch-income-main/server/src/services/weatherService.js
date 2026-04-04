/**
 * OpenWeather: current weather + air pollution (same API key).
 * Rainfall uses last 1h mm when available; otherwise 3h/3 or 0.
 */

function pm25ToApproxAqi(pm25) {
  if (pm25 == null || Number.isNaN(pm25)) return 0;
  // Rough US-style scale for demo (not regulatory)
  return Math.min(500, Math.round(pm25 * 5));
}

function fallbackWeather(lat, lon, reason, detail) {
  const la = lat ?? Number(process.env.DEFAULT_LAT || "12.9716");
  const lo = lon ?? Number(process.env.DEFAULT_LON || "77.5946");
  return {
    source: "fallback",
    fallbackReason: reason,
    fallbackDetail: detail,
    temperatureC: 34,
    rainfallMm1h: 0,
    aqi: 185,
    pm25: 37,
    weatherMain: "Clear",
    raw: null,
    location: { lat: la, lon: lo },
  };
}

export async function fetchWeatherAndAqi(lat, lon) {
  const key = process.env.OPENWEATHER_API_KEY?.trim();
  const la = lat ?? Number(process.env.DEFAULT_LAT || "12.9716");
  const lo = lon ?? Number(process.env.DEFAULT_LON || "77.5946");

  if (!key) {
    return fallbackWeather(la, lo, "missing_key", "Set OPENWEATHER_API_KEY in server/.env");
  }

  let weatherRes;
  let airRes;
  try {
    [weatherRes, airRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${la}&lon=${lo}&units=metric&appid=${key}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${la}&lon=${lo}&appid=${key}`
      ),
    ]);
  } catch (e) {
    console.warn("OpenWeather network error, using fallback:", e.message);
    return fallbackWeather(la, lo, "network_error", e.message);
  }

  if (!weatherRes.ok) {
    const t = await weatherRes.text();
    console.warn(
      `OpenWeather weather HTTP ${weatherRes.status}, using fallback:`,
      t.slice(0, 200)
    );
    return fallbackWeather(
      la,
      lo,
      "weather_http_error",
      `${weatherRes.status} ${t.slice(0, 120)}`
    );
  }
  if (!airRes.ok) {
    const t = await airRes.text();
    console.warn(
      `OpenWeather air HTTP ${airRes.status}, using fallback:`,
      t.slice(0, 200)
    );
    return fallbackWeather(
      la,
      lo,
      "air_http_error",
      `${airRes.status} ${t.slice(0, 120)}`
    );
  }

  const w = await weatherRes.json();
  const a = await airRes.json();

  const rain1h = w.rain?.["1h"] ?? null;
  const rain3h = w.rain?.["3h"] ?? null;
  const rainfallMm1h =
    rain1h != null ? rain1h : rain3h != null ? rain3h / 3 : 0;

  const pm25 = a.list?.[0]?.components?.pm2_5 ?? 0;
  const aqi = pm25ToApproxAqi(pm25);

  return {
    source: "openweather",
    temperatureC: w.main?.temp ?? 0,
    rainfallMm1h,
    feelsLikeC: w.main?.feels_like,
    humidity: w.main?.humidity,
    weatherMain: w.weather?.[0]?.main,
    weatherDescription: w.weather?.[0]?.description,
    aqi,
    pm25,
    raw: { weather: w, air: a },
    location: { lat: la, lon: lo, name: w.name },
  };
}
