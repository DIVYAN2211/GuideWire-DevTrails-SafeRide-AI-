import mongoose from "mongoose";
import { User } from "../models/User.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { Claim } from "../models/Claim.js";
import { Transaction } from "../models/Transaction.js";
import { FraudAlert } from "../models/FraudAlert.js";
import { CLAIM_TX_TYPES } from "./accountLedgerService.js";

const ACTIVITY_EVENTS = [
  "app_heartbeat",
  "delivery_completed_simulated",
  "delivery_completed",
];

const EARTH_KM = 6371;

function toObjectId(userId) {
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  return new mongoose.Types.ObjectId(String(userId));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in km */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_KM * c;
}

function zoneRadiusKm() {
  const r = Number(process.env.DELIVERY_ZONE_RADIUS_KM);
  return Number.isFinite(r) && r > 0 ? r : 25;
}

async function countConsistentActivityDays(userId, days = 14) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const logs = await ActivityLog.find({
    userId,
    createdAt: { $gte: since },
    event: { $in: ACTIVITY_EVENTS },
  })
    .select("createdAt")
    .lean();

  const keys = new Set();
  for (const l of logs) {
    const d = new Date(l.createdAt);
    keys.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  return keys.size;
}

async function persistAlertIfNew(userId, code, message, severity) {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const exists = await FraudAlert.findOne({
    userId,
    code,
    createdAt: { $gte: since },
  }).lean();
  if (exists) return;
  await FraudAlert.create({ userId, code, message, severity });
}

/**
 * Evaluate fraud rules and persist alerts (deduped per 6h per code).
 */
export async function evaluateFraudRules(userId, ctx = {}) {
  const { locationMismatch = false } = ctx;
  const uid = toObjectId(userId);

  const user = await User.findById(uid).lean();
  if (!user) return;

  const now = Date.now();
  const h48 = new Date(now - 48 * 60 * 60 * 1000);
  const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const claimBurst = await Transaction.countDocuments({
    userId: uid,
    type: { $in: CLAIM_TX_TYPES },
    createdAt: { $gte: h48 },
  });
  if (claimBurst > 3) {
    await persistAlertIfNew(
      uid,
      "TOO_MANY_CLAIMS",
      "Too many claims detected in a short period",
      "HIGH"
    );
  }

  const claims7d = await Transaction.countDocuments({
    userId: uid,
    type: { $in: CLAIM_TX_TYPES },
    createdAt: { $gte: d7 },
  });
  const hb7d = await ActivityLog.countDocuments({
    userId: uid,
    event: "app_heartbeat",
    createdAt: { $gte: d7 },
  });
  const deliveries = user.totalDeliveries ?? 0;
  if (claims7d > 0 && deliveries === 0 && hb7d < 2) {
    await persistAlertIfNew(
      uid,
      "CLAIMS_WITHOUT_ACTIVITY",
      "Claims recorded with very low app activity",
      "MEDIUM"
    );
  }

  if (locationMismatch) {
    await persistAlertIfNew(
      uid,
      "LOCATION_MISMATCH",
      "Current location does not match your registered delivery zone",
      "HIGH"
    );
  }

  const dupes = await ActivityLog.countDocuments({
    userId: uid,
    event: "duplicate_claim_prevented",
    createdAt: { $gte: d7 },
  });
  if (dupes >= 3) {
    await persistAlertIfNew(
      uid,
      "SUSPICIOUS_REPEAT",
      "Suspicious repeated claim patterns detected",
      "HIGH"
    );
  }
}

function parseClientCoords(query) {
  const lat = query.lat != null ? Number(query.lat) : NaN;
  const lon = query.lon != null ? Number(query.lon) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

/**
 * Compare client GPS to allowed zone (circle around saved profile location, else env default).
 */
export function computeLocationVerified(user, clientLat, clientLon) {
  const centerLat =
    user.latitude != null && user.longitude != null
      ? user.latitude
      : Number(process.env.DEFAULT_LAT) || 12.9716;
  const centerLon =
    user.latitude != null && user.longitude != null
      ? user.longitude
      : Number(process.env.DEFAULT_LON) || 77.5946;

  if (clientLat == null || clientLon == null) {
    return { verified: false, mismatch: true, reason: "no_client_gps" };
  }

  const d = distanceKm(clientLat, clientLon, centerLat, centerLon);
  const r = zoneRadiusKm();
  if (d <= r) {
    return { verified: true, mismatch: false, distanceKm: d };
  }
  return { verified: false, mismatch: true, distanceKm: d };
}

function clampTrust(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * GET /api/security/status payload + extended fields for UI.
 */
export async function buildSecurityStatus(userId, query = {}) {
  const uid = toObjectId(userId);
  const user = await User.findById(uid).lean();
  if (!user) return null;

  const coords = parseClientCoords(query);
  const loc = computeLocationVerified(
    user,
    coords?.lat ?? null,
    coords?.lon ?? null
  );

  await evaluateFraudRules(uid, { locationMismatch: loc.mismatch });

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const alertDocs = await FraudAlert.find({
    userId: uid,
    createdAt: { $gte: since30d },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const fraudAlertsCount = alertDocs.length;
  const consistentActivityDays = await countConsistentActivityDays(uid, 14);
  const locationMismatch = loc.mismatch === true;

  let trustScore = clampTrust(
    100 -
      fraudAlertsCount * 20 -
      (locationMismatch ? 15 : 0) +
      consistentActivityDays * 2
  );

  const fraudAlerts = alertDocs.map((a) => ({
    type: "FRAUD_ALERT",
    message: a.message,
    severity: a.severity,
    date: a.createdAt.toISOString(),
    code: a.code,
  }));

  const activityCount = user.totalDeliveries ?? 0;
  const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
  const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
  const staleActive =
    !lastActive || Date.now() - lastActive.getTime() > 7 * 24 * 60 * 60 * 1000;
  const activityWarning =
    (accountAgeMs > 7 * 24 * 60 * 60 * 1000 && activityCount === 0 && staleActive) ||
    fraudAlerts.some((x) => x.severity === "HIGH");

  const logs = await ActivityLog.find({ userId: uid })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  return {
    locationVerified: loc.verified,
    activityCount,
    fraudAlerts,
    trustScore,
    locationMismatch,
    consistentActivityDays,
    appUsageSecondsTotal: user.appUsageSecondsTotal ?? 0,
    lastActiveAt: user.lastActiveAt
      ? new Date(user.lastActiveAt).toISOString()
      : null,
    activityWarning,
    trustLabel:
      trustScore >= 80 ? "Excellent" : trustScore >= 50 ? "Fair" : "Needs attention",
    recentActivity: logs.map((l) => ({
      time: l.createdAt.toISOString(),
      event: l.event,
      ok: l.ok,
    })),
  };
}

/** Backward-compatible overview (maps to status fields). */
export async function buildSecurityOverview(userId) {
  const status = await buildSecurityStatus(userId, {});
  if (!status) return null;
  const fraudClear = status.fraudAlerts.length === 0;
  return {
    verification: [
      {
        key: "location",
        label: "Location Verified",
        ok: status.locationVerified,
        detail: status.locationVerified
          ? "GPS matches delivery zone"
          : "Not verified — enable location or check zone",
      },
      {
        key: "activity",
        label: "Activity Tracking",
        ok: !status.activityWarning,
        detail: `${status.activityCount} deliveries · last active ${
          status.lastActiveAt
            ? new Date(status.lastActiveAt).toLocaleString("en-IN")
            : "never"
        }`,
      },
      {
        key: "fraud",
        label: "Fraud Alerts",
        ok: fraudClear,
        detail: fraudClear
          ? "No alerts in the last 30 days"
          : `${status.fraudAlerts.length} alert(s) — review below`,
      },
    ],
    duplicateClaimsPrevented7d: await ActivityLog.countDocuments({
      userId: toObjectId(userId),
      event: "duplicate_claim_prevented",
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
    trustScore: status.trustScore,
    trustLabel: status.trustLabel,
    recentActivity: status.recentActivity,
    recentClaimsPreview: await Claim.find({ userId: toObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean()
      .then((rows) =>
        rows.map((c) => ({
          type: c.type,
          amount: c.amount,
          at: c.createdAt,
        }))
      ),
  };
}

export async function touchSimulatedDelivery(userId) {
  const uid = toObjectId(userId);
  await User.findByIdAndUpdate(uid, {
    $inc: { deliveriesToday: 1, totalDeliveries: 1 },
  });
  await ActivityLog.create({
    userId: uid,
    event: "delivery_completed_simulated",
    ok: true,
  });
  return { deliveriesIncremented: 1 };
}

export async function recordHeartbeat(userId, body = {}) {
  const uid = toObjectId(userId);
  const delta = Math.min(
    3600,
    Math.max(0, Math.floor(Number(body.seconds) || 0))
  );
  const update = { $set: { lastActiveAt: new Date() } };
  if (delta > 0) update.$inc = { appUsageSecondsTotal: delta };
  await User.findByIdAndUpdate(uid, update);
  await ActivityLog.create({
    userId: uid,
    event: "app_heartbeat",
    ok: true,
    meta: delta ? { seconds: delta } : {},
  });
  return { ok: true };
}
