import { User } from "../models/User.js";
import { Claim } from "../models/Claim.js";
import { fetchWeatherAndAqi } from "./weatherService.js";
import { resolveWeatherCoords } from "../utils/weatherLocation.js";
import { THRESHOLDS } from "../constants/plans.js";
import { formatClaimExplanation } from "./claimExplanationService.js";

/**
 * Smart alerts from live weather + recent claims only (does not re-run claim evaluation).
 */
export async function buildSmartNotifications(userId, query = {}) {
  const profile = await User.findById(userId).lean();
  if (!profile) return { items: [] };

  const { lat, lon } = resolveWeatherCoords(query, profile);
  const weather = await fetchWeatherAndAqi(lat, lon);
  const now = Date.now();
  const items = [];

  const recentWindowMs = 50 * 60 * 1000;
  const recentClaim = await Claim.findOne({
    userId,
    status: "credited",
    createdAt: { $gte: new Date(now - recentWindowMs) },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (recentClaim) {
    items.push({
      id: `claim-${String(recentClaim._id)}`,
      category: "claim_credited",
      tone: "success",
      title: "Claim credited",
      message: formatClaimExplanation(recentClaim),
      at: recentClaim.createdAt.toISOString(),
    });
  }

  const aqi = Math.round(weather.aqi);
  if (weather.aqi > THRESHOLDS.aqi) {
    items.push({
      id: `aqi-high-${Math.floor(now / 120000)}`,
      category: "aqi_high",
      tone: "warning",
      title: "High AQI detected",
      message: `Current AQI ${aqi} is above the ${THRESHOLDS.aqi} payout threshold. Protect your health; with an active plan the app evaluates cover automatically.`,
      at: new Date().toISOString(),
    });
  }

  const rainSafe = weather.rainfallMm1h <= THRESHOLDS.rainfallMm;
  const tempSafe = weather.temperatureC <= THRESHOLDS.temperatureC;
  const aqiSafe = weather.aqi <= THRESHOLDS.aqi;
  const allSafe = rainSafe && tempSafe && aqiSafe;

  if (allSafe && !recentClaim) {
    const rain = Math.round(weather.rainfallMm1h * 10) / 10;
    const temp = Math.round(weather.temperatureC * 10) / 10;
    items.push({
      id: `conditions-safe-${Math.floor(now / 480000)}`,
      category: "conditions_safe",
      tone: "neutral",
      title: "Within safe limits",
      message: `Rain (${rain}mm), temperature (${temp}°C) and AQI (${aqi}) are below payout thresholds — no automatic claim from these signals right now.`,
      at: new Date().toISOString(),
    });
  }

  return { items, generatedAt: new Date().toISOString() };
}
