import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { analyzeRiskWithGemini } from "../services/geminiService.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

/** Body or query: rainfallMm1h, temperatureC, aqi — for testing / custom inputs */
router.post("/risk-assessment", requireAuth, async (req, res, next) => {
  try {
    const src = { ...req.query, ...req.body };
    const rainfallMm1h = Number(src.rainfallMm1h ?? 0);
    const temperatureC = Number(src.temperatureC ?? 0);
    const aqi = Number(src.aqi ?? 0);

    if ([rainfallMm1h, temperatureC, aqi].some((n) => Number.isNaN(n))) {
      throw new HttpError(400, "rainfallMm1h, temperatureC, aqi must be numbers");
    }

    const result = await analyzeRiskWithGemini({
      rainfallMm1h,
      temperatureC,
      aqi,
    });

    res.json({
      success: true,
      input: { rainfallMm1h, temperatureC, aqi },
      riskLevel: result.riskLevel,
      probability: result.probability,
      suggestion: result.suggestion,
      source: result.source,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
