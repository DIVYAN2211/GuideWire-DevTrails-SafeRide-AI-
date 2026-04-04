import { motion } from "framer-motion";
import { MapPin, Activity, ShieldAlert, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type FraudAlert = {
  type: string;
  message: string;
  severity: string;
  date: string;
  code?: string;
};

type SecurityStatus = {
  success: boolean;
  locationVerified: boolean;
  activityCount: number;
  fraudAlerts: FraudAlert[];
  trustScore: number;
  activityWarning?: boolean;
  appUsageSecondsTotal?: number;
  lastActiveAt?: string | null;
  trustLabel?: string;
  recentActivity?: { time: string; event: string; ok: boolean }[];
};

const POLL_MS = 15_000;

function formatDuration(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function relTime(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 48) return `${h}h ago`;
  return new Date(iso).toLocaleDateString("en-IN");
}

function trustTone(score: number): "safe" | "warn" | "risk" {
  if (score >= 70) return "safe";
  if (score >= 40) return "warn";
  return "risk";
}

const FraudScreen = () => {
  const [data, setData] = useState<SecurityStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  const loadStatus = useCallback(async () => {
    const q = coordsRef.current;
    const path =
      q != null
        ? `/api/security/status?lat=${encodeURIComponent(q.lat)}&lon=${encodeURIComponent(q.lon)}`
        : "/api/security/status";
    const res = await api<SecurityStatus>(path);
    setData(res);
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoDenied(false);
      },
      () => {
        setCoords(null);
        setGeoDenied(true);
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        await api("/api/security/heartbeat", {
          method: "POST",
          body: JSON.stringify({ seconds: Math.floor(POLL_MS / 1000) }),
        });
      } catch {
        /* ignore heartbeat errors */
      }
    };

    const run = async () => {
      try {
        await loadStatus();
        if (!cancelled) setErr(null);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      }
    };

    run();
    tick();
    const id = window.setInterval(() => {
      run();
      tick();
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [loadStatus]);

  if (err && !data) {
    return (
      <div className="px-4 pb-24 pt-6">
        <p className="text-destructive text-sm">{err}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 pb-24 pt-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading security status…</span>
      </div>
    );
  }

  const tone = trustTone(data.trustScore);
  const ringColor =
    tone === "safe"
      ? "hsl(142, 71%, 45%)"
      : tone === "warn"
        ? "hsl(38, 92%, 50%)"
        : "hsl(0, 72%, 51%)";
  const dash = `${data.trustScore}, 100`;
  const fraudClear = data.fraudAlerts.length === 0;
  const usage = data.appUsageSecondsTotal ?? 0;

  const rows = [
    {
      icon: MapPin,
      label: "Location",
      ok: data.locationVerified,
      detail: data.locationVerified
        ? "GPS matches your registered delivery zone"
        : geoDenied
          ? "Allow location access to verify, or status stays Not verified"
          : "Not verified — outside zone or missing GPS",
    },
    {
      icon: Activity,
      label: "Activity",
      ok: !data.activityWarning,
      detail: `${data.activityCount} deliveries · ~${formatDuration(usage)} app time · last active ${
        data.lastActiveAt ? relTime(data.lastActiveAt) : "—"
      }`,
    },
    {
      icon: ShieldAlert,
      label: "Fraud alerts",
      ok: fraudClear,
      detail: fraudClear ? "No alerts in the last 30 days" : `${data.fraudAlerts.length} open alert(s)`,
    },
  ];

  return (
    <div className="px-4 pb-24 pt-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Fraud Detection</h1>
        <p className="text-muted-foreground text-sm mt-1">Live security & verification (refreshes every ~15s)</p>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card border border-border rounded-2xl p-5 space-y-4"
      >
        <h3 className="text-foreground font-semibold">Verification</h3>
        {rows.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.ok ? "bg-success/15" : item.label === "Activity" ? "bg-warning/15" : "bg-destructive/10"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${
                    item.ok ? "text-success" : item.label === "Activity" ? "text-warning" : "text-destructive"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-foreground font-medium text-sm">{item.label}</p>
                <p className="text-muted-foreground text-xs break-words">{item.detail}</p>
              </div>
            </div>
            {item.label === "Fraud alerts" ? (
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                  fraudClear ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
                }`}
              >
                {fraudClear ? "Clear" : "Review"}
              </span>
            ) : item.ok ? (
              <CheckCircle className="w-5 h-5 text-success shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className={`bg-card border rounded-2xl p-5 ${
          tone === "safe"
            ? "border-success/30"
            : tone === "warn"
              ? "border-warning/40"
              : "border-destructive/40"
        }`}
      >
        <h3 className="text-foreground font-semibold mb-3">Trust score</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="3"
              />
              <motion.path
                key={dash}
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={ringColor}
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: dash }}
                transition={{ duration: 0.8 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-foreground font-bold text-lg">{data.trustScore}</span>
            </div>
          </div>
          <div>
            <p
              className={`font-semibold ${
                tone === "safe" ? "text-success" : tone === "warn" ? "text-warning" : "text-destructive"
              }`}
            >
              {data.trustLabel ?? (tone === "safe" ? "Good standing" : tone === "warn" ? "Caution" : "High risk")}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Computed from alerts, location, and recent activity consistency.
            </p>
          </div>
        </div>
      </motion.div>

      {!fraudClear && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h3 className="text-foreground font-semibold">Alerts</h3>
          {data.fraudAlerts.map((a) => (
            <div
              key={`${a.code ?? a.message}-${a.date}`}
              className={`rounded-xl px-3 py-2 text-sm ${
                a.severity === "HIGH"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : a.severity === "MEDIUM"
                    ? "bg-warning/10 text-warning border border-warning/20"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              <p className="font-medium">{a.message}</p>
              <p className="text-xs opacity-80 mt-0.5">{relTime(a.date)} · {a.severity}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-foreground font-semibold mb-3">Recent activity</h3>
        <div className="space-y-3">
          {(data.recentActivity?.length ? data.recentActivity : []).map((log, i) => (
            <div key={`${log.time}-${i}`} className="flex items-start gap-3">
              <div className="mt-0.5">
                {log.ok ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                )}
              </div>
              <div>
                <p className="text-foreground text-sm">{log.event.replace(/_/g, " ")}</p>
                <p className="text-muted-foreground text-xs">{relTime(log.time)}</p>
              </div>
            </div>
          ))}
          {(!data.recentActivity || data.recentActivity.length === 0) && (
            <p className="text-muted-foreground text-sm">No recent events yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FraudScreen;
