import { THRESHOLDS } from "../constants/plans.js";

function fmtInr(amount) {
  return `₹${Math.round(Number(amount) || 0).toLocaleString("en-IN")}`;
}

/**
 * Human-readable "why you got paid" — avoids false "X > Y" when stored reading doesn't exceed threshold
 * (e.g. legacy rows or snapshot drift).
 */
export function formatClaimExplanation(claim) {
  const amount = Math.round(Number(claim.amount) || 0);
  const tv = claim.triggeredValue != null ? String(claim.triggeredValue) : "—";
  const th = claim.threshold != null ? String(claim.threshold) : "";

  switch (claim.type) {
    case "rainfall": {
      const mm = parseFloat(tv);
      const limit = THRESHOLDS.rainfallMm;
      const val = Number.isFinite(mm) ? Math.round(mm * 10) / 10 : tv;
      if (Number.isFinite(mm) && mm > limit) {
        return `${fmtInr(amount)} credited — heavy rainfall (${val}mm exceeded the ${limit}mm payout threshold).`;
      }
      return `${fmtInr(amount)} credited under rainfall cover (recorded ${val}mm; payout threshold ${limit}mm${th ? `, rule ${th}` : ""}).`;
    }
    case "temperature": {
      const c = parseFloat(tv);
      const limit = THRESHOLDS.temperatureC;
      const val = Number.isFinite(c) ? Math.round(c * 100) / 100 : tv;
      if (Number.isFinite(c) && c > limit) {
        return `${fmtInr(amount)} credited — extreme heat (${val}°C exceeded the ${limit}°C payout threshold).`;
      }
      return `${fmtInr(amount)} credited under heat cover (recorded ${val}°C; payout threshold ${limit}°C${th ? `, rule ${th}` : ""}).`;
    }
    case "aqi": {
      const a = parseFloat(tv);
      const limit = THRESHOLDS.aqi;
      const val = Number.isFinite(a) ? Math.round(a) : tv;
      if (Number.isFinite(a) && a > limit) {
        return `${fmtInr(amount)} credited — air quality (AQI ${val} exceeded the ${limit} payout threshold).`;
      }
      return `${fmtInr(amount)} credited under AQI cover (recorded AQI ${val}; threshold ${limit}${th ? `, rule ${th}` : ""}).`;
    }
    case "curfew":
      return `${fmtInr(amount)} credited — curfew / disruption event (${tv}${th ? `, ${th}` : ""}).`;
    default:
      return `${fmtInr(amount)} credited — ${claim.type} (trigger: ${tv}${th ? `, ${th}` : ""}).`;
  }
}
