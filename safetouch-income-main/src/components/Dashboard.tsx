import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CloudRain,
  Thermometer,
  AlertTriangle,
  Eye,
  CreditCard,
  Zap,
  Trophy,
  LogOut,
  Compass,
} from "lucide-react";
import { api } from "@/lib/api";

type DashboardApi = {
  success: boolean;
  dashboard: {
    userName: string;
    activePlan: {
      key: string;
      weeklyPrice: number;
      coverageAmount: number;
      expiresAt: string;
      isFreeWeek: boolean;
    } | null;
    weeklyEarningsProtected: number;
    riskLevel: string;
    ai: { probability: number; suggestion: string; source: string };
    weatherAlert: string;
    temperatureC: number;
    streak: { current: number; longest: number };
    rewardsSummary: { id: string; text: string; unlocked?: boolean }[];
    claimsJustEvaluated: unknown[];
    weatherDataSource?: string;
    weatherNotice?: string;
    /** saved_profile | query | server_default */
    weatherCoordsSource?: string;
    location?: { lat?: number; lon?: number; name?: string };
  };
};

const Dashboard = ({
  onNavigate,
  userName,
  onLogout,
}: {
  onNavigate: (screen: string) => void;
  userName: string;
  onLogout: () => void;
}) => {
  const [data, setData] = useState<DashboardApi["dashboard"] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<DashboardApi>("/api/dashboard");
        if (!cancelled) setData(res.dashboard);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Could not load dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    api("/api/activity/log", {
      method: "POST",
      body: JSON.stringify({ source: "dashboard" }),
    }).catch(() => {});
  }, []);

  const riskLevel = data?.riskLevel ?? "Medium";
  const riskColor =
    riskLevel === "Low" ? "text-success" : riskLevel === "Medium" ? "text-warning" : "text-danger";

  const displayName = data?.userName ?? userName;
  const protectedAmt = data?.weeklyEarningsProtected ?? 4200;
  const planLine = data?.activePlan
    ? `Plan: ₹${data.activePlan.weeklyPrice}/week`
    : "No active plan";
  const isActive = Boolean(data?.activePlan);
  const weatherLabel = data?.weatherAlert ?? "—";
  const tempLabel =
    data != null ? `${data.temperatureC}°C` : "—";
  const streakHint =
    data?.streak != null
      ? `${data.streak.current}d streak · longest ${data.streak.longest}d`
      : "Streaks, badges & free insurance";

  return (
    <div className="px-4 pb-24 pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Good morning,</p>
          <h1 className="text-xl font-bold text-foreground">{displayName} 👋</h1>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {err && (
        <p className="text-destructive text-sm" role="alert">
          {err} (showing defaults)
        </p>
      )}

      {data?.weatherNotice && !err && (
        <p className="text-warning text-sm rounded-lg border border-warning/30 bg-warning/10 px-3 py-2" role="status">
          {data.weatherNotice}
        </p>
      )}

      {data?.weatherCoordsSource === "saved_profile" && !err && (
        <p className="text-muted-foreground text-xs text-center" role="status">
          Weather uses the location you shared at sign-up
          {data.location?.name ? ` (${data.location.name})` : ""}.
        </p>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="gradient-card border border-border rounded-2xl p-5 glow-primary"
      >
        <p className="text-muted-foreground text-sm mb-1">Weekly Earnings Protected</p>
        <h2 className="text-3xl font-bold text-gradient">₹{protectedAmt.toLocaleString("en-IN")}</h2>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full animate-pulse-glow ${isActive ? "bg-success" : "bg-muted-foreground"}`}
            />
            <span className={`text-sm font-medium ${isActive ? "text-success" : "text-muted-foreground"}`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <span className="text-muted-foreground text-sm">{planLine}</span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("account")}
          className="w-full mt-4 text-sm font-medium text-primary hover:underline text-left"
        >
          My account & savings →
        </button>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <AlertTriangle className={`w-6 h-6 ${riskColor} mb-2`} />
          <p className="text-muted-foreground text-xs">Risk Level</p>
          <p className={`text-lg font-bold ${riskColor}`}>{riskLevel}</p>
          {data?.ai?.suggestion && (
            <p className="text-muted-foreground text-[10px] mt-1 leading-tight line-clamp-3">
              {data.ai.suggestion}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <CloudRain className="w-6 h-6 text-primary mb-2" />
          <p className="text-muted-foreground text-xs">Weather Alert</p>
          <p className="text-lg font-bold text-primary">{weatherLabel}</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4"
      >
        <Thermometer className="w-8 h-8 text-warning" />
        <div>
          <p className="text-muted-foreground text-xs">Current Temperature</p>
          <p className="text-foreground font-bold text-lg">{tempLabel}</p>
        </div>
      </motion.div>

      {data && !err && (
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm font-semibold text-foreground">What to do next</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Weather here is your <span className="text-foreground font-medium">live risk snapshot</span>. SafeRide pays
            automatically when limits are crossed—only if you have an active plan.
          </p>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {!isActive ? (
              <>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">1.</span>
                  <span>
                    <button
                      type="button"
                      onClick={() => onNavigate("plans")}
                      className="text-primary font-semibold underline-offset-2 hover:underline"
                    >
                      Pick a plan
                    </button>{" "}
                    (try a free week) so income protection and auto-payouts can turn on.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">2.</span>
                  <span>
                    Open{" "}
                    <button
                      type="button"
                      onClick={() => onNavigate("monitoring")}
                      className="text-primary font-semibold underline-offset-2 hover:underline"
                    >
                      Live Monitor
                    </button>{" "}
                    for rain, temperature, and AQI vs. payout thresholds.
                  </span>
                </li>
              </>
            ) : (
              <>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">•</span>
                  <span>
                    Use{" "}
                    <button
                      type="button"
                      onClick={() => onNavigate("monitoring")}
                      className="text-primary font-semibold underline-offset-2 hover:underline"
                    >
                      Live Monitor
                    </button>{" "}
                    while working; if conditions breach limits, a claim can credit your wallet without you filing
                    anything.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">•</span>
                  <span>
                    After rough weather, check{" "}
                    <button
                      type="button"
                      onClick={() => onNavigate("claims")}
                      className="text-primary font-semibold underline-offset-2 hover:underline"
                    >
                      Claims & payouts
                    </button>
                    .
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">•</span>
                  <span>
                    Track totals in{" "}
                    <button
                      type="button"
                      onClick={() => onNavigate("analytics")}
                      className="text-primary font-semibold underline-offset-2 hover:underline"
                    >
                      Stats
                    </button>{" "}
                    and streaks in{" "}
                    <button
                      type="button"
                      onClick={() => onNavigate("rewards")}
                      className="text-primary font-semibold underline-offset-2 hover:underline"
                    >
                      Rewards
                    </button>
                    .
                  </span>
                </li>
              </>
            )}
          </ul>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigate("plans")}
          className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <CreditCard className="w-7 h-7 text-primary" />
          <span className="text-foreground text-sm font-medium">View Plans</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("monitoring")}
          className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <Eye className="w-7 h-7 text-accent" />
          <span className="text-foreground text-sm font-medium">Live Monitor</span>
        </button>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => onNavigate("rewards")}
        className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
      >
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center glow-primary">
          <Trophy className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="text-left">
          <p className="text-foreground font-semibold">Consistency & Rewards</p>
          <p className="text-muted-foreground text-xs">{streakHint}</p>
        </div>
      </motion.button>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => onNavigate("claims")}
        className="w-full gradient-danger text-foreground font-semibold py-4 rounded-2xl text-base flex items-center justify-center gap-2"
      >
        <Zap className="w-5 h-5" /> Claims & payouts
      </motion.button>
    </div>
  );
};

export default Dashboard;
