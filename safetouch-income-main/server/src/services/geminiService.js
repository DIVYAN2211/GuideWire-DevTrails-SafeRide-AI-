import { GoogleGenerativeAI } from "@google/generative-ai";
import { THRESHOLDS } from "../constants/plans.js";

function heuristicRisk(weather) {
  const { rainfallMm1h, temperatureC, aqi } = weather;
  let score = 0;
  if (rainfallMm1h >= THRESHOLDS.rainfallMm * 0.7) score += 0.35;
  if (temperatureC >= THRESHOLDS.temperatureC * 0.85) score += 0.3;
  if (aqi >= THRESHOLDS.aqi * 0.75) score += 0.35;
  const probability = Math.min(0.99, Math.max(0.05, score));
  let riskLevel = "Low";
  if (probability >= 0.7) riskLevel = "High";
  else if (probability >= 0.35) riskLevel = "Medium";
  const suggestion =
    riskLevel === "High"
      ? "Avoid extended outdoor deliveries; expect possible auto-payout if conditions worsen."
      : riskLevel === "Medium"
        ? "Monitor conditions; keep emergency rain gear and hydrate."
        : "Conditions look manageable; maintain normal safety routines.";
  return { riskLevel, probability, suggestion, source: "heuristic" };
}

export async function analyzeRiskWithGemini(weather) {
  const apiKey = process.env.GEMINI_API_KEY;
  const { rainfallMm1h, temperatureC, aqi } = weather;

  if (!apiKey) {
    return heuristicRisk(weather);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const prompt = `You are an insurance risk assistant for gig delivery workers in India.
Given:
- rainfall last ~1h (mm): ${rainfallMm1h}
- temperature (°C): ${temperatureC}
- estimated AQI: ${aqi}

Thresholds for automatic claims: rain > ${THRESHOLDS.rainfallMm}mm, temp > ${THRESHOLDS.temperatureC}°C, AQI > ${THRESHOLDS.aqi}.

Respond with ONLY valid JSON:
{"riskLevel":"Low"|"Medium"|"High","probability":number between 0 and 1,"suggestion":"one short sentence for the rider"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return {
      riskLevel: parsed.riskLevel || "Medium",
      probability:
        typeof parsed.probability === "number"
          ? Math.min(1, Math.max(0, parsed.probability))
          : 0.5,
      suggestion: parsed.suggestion || "Stay safe and monitor weather updates.",
      source: "gemini",
    };
  } catch (e) {
    console.warn("Gemini failed, using heuristic:", e.message);
    const h = heuristicRisk(weather);
    return { ...h, source: "heuristic_fallback" };
  }
}
