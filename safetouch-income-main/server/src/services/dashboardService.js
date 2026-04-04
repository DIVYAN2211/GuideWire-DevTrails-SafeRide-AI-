import { User } from "../models/User.js";
import { fetchWeatherAndAqi } from "./weatherService.js";
import { analyzeRiskWithGemini } from "./geminiService.js";
import { evaluateZeroTouchClaims } from "./claimService.js";
import { getActiveSubscription } from "./subscriptionService.js";
import { getRewardsSummary, syncBadges } from "./streakRewardsService.js";
import { THRESHOLDS } from "../constants/plans.js";
import { resolveWeatherCoords } from "../utils/weatherLocation.js";

function weatherAlertLabel(weather) {
  if (weather.rainfallMm1h > THRESHOLDS.rainfallMm * 0.8) return "Heavy rain";
  if (weather.temperatureC > THRESHOLDS.temperatureC * 0.9) return "Heat stress";
  if (weather.aqi > THRESHOLDS.aqi * 0.85) return "Poor air quality";
  if (weather.weatherMain === "Rain" || weather.weatherMain === "Drizzle")
    return "Rain";
  return "Clear";
}

export async function buildDashboard(userId, query) {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const { lat, lon, source: coordsSource } = resolveWeatherCoords(query, user);

  const weather = await fetchWeatherAndAqi(lat, lon);
  const simulateCurfew = process.env.SIMULATE_CURFEW === "true";
  const claimResult = await evaluateZeroTouchClaims(userId, weather, {
    simulateCurfew,
  });

  const ai = await analyzeRiskWithGemini(weather);
  await syncBadges(userId);

  const refreshed = await User.findById(userId).lean();
  const sub = await getActiveSubscription(userId);

  const weeklyProtected = sub?.coverageAmount ?? 0;

  return {
    userName: refreshed.name,
    activePlan: sub
      ? {
          key: sub.planKey,
          weeklyPrice: sub.weeklyPrice,
          coverageAmount: sub.coverageAmount,
          expiresAt: sub.expiresAt,
          isFreeWeek: sub.isFreeWeek,
        }
      : null,
    weeklyEarningsProtected: weeklyProtected,
    riskLevel: ai.riskLevel,
    ai: {
      probability: ai.probability,
      suggestion: ai.suggestion,
      source: ai.source,
    },
    weatherAlert: weatherAlertLabel(weather),
    temperatureC: Math.round(weather.temperatureC * 10) / 10,
    streak: refreshed.streak,
    rewardsSummary: getRewardsSummary(refreshed),
    claimsJustEvaluated: claimResult.triggered,
    location: weather.location,
    weatherCoordsSource: coordsSource,
    weatherDataSource: weather.source,
    ...(weather.source === "fallback" && {
      weatherNotice:
        "Live weather unavailable (invalid or missing OpenWeather key). Demo values are used.",
    }),
  };
}
