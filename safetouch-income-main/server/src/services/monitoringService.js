import { User } from "../models/User.js";
import { fetchWeatherAndAqi } from "./weatherService.js";
import { resolveWeatherCoords } from "../utils/weatherLocation.js";
import { analyzeRiskWithGemini } from "./geminiService.js";
import { evaluateZeroTouchClaims } from "./claimService.js";
import { THRESHOLDS, PAYOUT_AMOUNTS } from "../constants/plans.js";

function safetyStatus(weather) {
  const high =
    weather.rainfallMm1h > THRESHOLDS.rainfallMm ||
    weather.temperatureC > THRESHOLDS.temperatureC ||
    weather.aqi > THRESHOLDS.aqi;
  return high ? "High Risk" : "Safe";
}

export async function buildMonitoring(userId, query) {
  const profile = await User.findById(userId).lean();
  const { lat, lon, source: coordsSource } = resolveWeatherCoords(query, profile);

  const weather = await fetchWeatherAndAqi(lat, lon);
  const simulateCurfew = process.env.SIMULATE_CURFEW === "true";
  const claimResult = await evaluateZeroTouchClaims(userId, weather, {
    simulateCurfew,
  });

  const ai = await analyzeRiskWithGemini(weather);
  const status = safetyStatus(weather);

  return {
    overallStatus: status,
    conditions: [
      {
        key: "rainfall",
        label: "Rainfall",
        valueMm1h: Math.round(weather.rainfallMm1h * 10) / 10,
        threshold: `> ${THRESHOLDS.rainfallMm}mm`,
        payoutInr: PAYOUT_AMOUNTS.rainfall,
        safe: weather.rainfallMm1h <= THRESHOLDS.rainfallMm,
      },
      {
        key: "temperature",
        label: "Temperature",
        valueC: Math.round(weather.temperatureC * 10) / 10,
        threshold: `> ${THRESHOLDS.temperatureC}°C`,
        payoutInr: PAYOUT_AMOUNTS.temperature,
        safe: weather.temperatureC <= THRESHOLDS.temperatureC,
      },
      {
        key: "aqi",
        label: "AQI",
        value: Math.round(weather.aqi),
        threshold: `> ${THRESHOLDS.aqi}`,
        payoutInr: PAYOUT_AMOUNTS.aqi,
        safe: weather.aqi <= THRESHOLDS.aqi,
      },
    ],
    autoTriggerSummary: [
      { label: "Rain above threshold", payoutInr: PAYOUT_AMOUNTS.rainfall },
      { label: "Temperature above threshold", payoutInr: PAYOUT_AMOUNTS.temperature },
      { label: "AQI above threshold", payoutInr: PAYOUT_AMOUNTS.aqi },
    ],
    ai: {
      riskLevel: ai.riskLevel,
      probability: ai.probability,
      suggestion: ai.suggestion,
      source: ai.source,
    },
    claimsJustEvaluated: claimResult.triggered,
    rawWeatherSource: weather.source,
    weatherCoordsSource: coordsSource,
    location: weather.location,
    ...(weather.source === "fallback" && {
      weatherNotice:
        "Live weather unavailable (invalid or missing OpenWeather key). Demo values are used.",
    }),
  };
}
