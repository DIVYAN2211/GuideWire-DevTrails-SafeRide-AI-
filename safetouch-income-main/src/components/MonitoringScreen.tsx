import { motion } from "framer-motion";
import { CloudRain, Thermometer, Wind, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Condition = {
  key: string;
  label: string;
  valueMm1h?: number;
  valueC?: number;
  value?: number;
  threshold: string;
  payoutInr: number;
  safe: boolean;
};

type MonitoringApi = {
  success: boolean;
  monitoring: {
    overallStatus: string;
    conditions: Condition[];
    autoTriggerSummary: { label: string; payoutInr: number }[];
    ai: { riskLevel: string; probability: number; suggestion: string; source: string };
    claimsJustEvaluated: unknown[];
    weatherNotice?: string;
    weatherCoordsSource?: string;
    location?: { lat?: number; lon?: number; name?: string };
  };
};

const iconFor = (key: string) => {
  if (key === "rainfall") return CloudRain;
  if (key === "temperature") return Thermometer;
  return Wind;
};

const colorFor = (key: string) => {
  if (key === "rainfall") return "text-primary";
  if (key === "temperature") return "text-warning";
  return "text-accent";
};

function displayValue(c: Condition): string {
  if (c.key === "rainfall" && c.valueMm1h != null) return `${c.valueMm1h}mm`;
  if (c.key === "temperature" && c.valueC != null) return `${c.valueC}°C`;
  if (c.value != null) return String(c.value);
  return "—";
}

function barPercent(c: Condition): number {
  const num = (s: string) => {
    const m = s.match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 1;
  };
  if (c.key === "rainfall" && c.valueMm1h != null) {
    const cap = num(c.threshold) || 50;
    return Math.min((c.valueMm1h / cap) * 100, 100);
  }
  if (c.key === "temperature" && c.valueC != null) {
    const cap = num(c.threshold) || 40;
    return Math.min((c.valueC / cap) * 100, 100);
  }
  if (c.value != null) {
    const cap = num(c.threshold) || 300;
    return Math.min((c.value / cap) * 100, 100);
  }
  return 8;
}

const MonitoringScreen = () => {
  const [data, setData] = useState<MonitoringApi["monitoring"] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<MonitoringApi>("/api/monitoring")
      .then((r) => {
        if (!cancelled) {
          setData(r.monitoring);
          setErr(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        <span className="text-sm">Loading live conditions…</span>
      </div>
    );
  }

  const overallSafe = data.overallStatus !== "High Risk";

  return (
    <div className="px-4 pb-24 pt-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Live Monitoring</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time weather vs payout thresholds</p>
      </div>

      {data.weatherNotice && (
        <p className="text-warning text-xs rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">{data.weatherNotice}</p>
      )}

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`rounded-2xl p-6 flex items-center gap-4 ${
          overallSafe ? "gradient-success glow-success" : "gradient-danger"
        }`}
      >
        {overallSafe ? (
          <ShieldCheck className="w-12 h-12 text-success-foreground" />
        ) : (
          <AlertTriangle className="w-12 h-12 text-danger-foreground" />
        )}
        <div>
          <h2
            className={`text-xl font-bold ${overallSafe ? "text-success-foreground" : "text-danger-foreground"}`}
          >
            {overallSafe ? "Within thresholds" : "Above payout thresholds"}
          </h2>
          <p
            className={`text-sm ${overallSafe ? "text-success-foreground/80" : "text-danger-foreground/80"}`}
          >
            {overallSafe
              ? "Conditions are below auto-payout limits (or check plan eligibility)."
              : "One or more readings exceed limits — auto claims may run if you have an active plan."}
          </p>
        </div>
      </motion.div>

      <div className="space-y-3">
        {data.conditions.map((cond, i) => {
          const Icon = iconFor(cond.key);
          const col = colorFor(cond.key);
          return (
            <motion.div
              key={cond.key}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                    <Icon className={`w-6 h-6 ${col}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-foreground font-semibold">{cond.label}</p>
                    <p className="text-muted-foreground text-xs">Trigger: {cond.threshold}</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">Payout up to ₹{cond.payoutInr}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-foreground font-bold text-xl">{displayValue(cond)}</p>
                  <p className={`text-xs font-medium ${cond.safe ? "text-success" : "text-destructive"}`}>
                    {cond.safe ? "Below threshold ✓" : "Above threshold"}
                  </p>
                </div>
              </div>

              <div className="mt-3 w-full bg-secondary rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barPercent(cond)}%` }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.7 }}
                  className={`h-2 rounded-full ${cond.safe ? "bg-primary/70" : "bg-destructive/80"}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-foreground font-semibold mb-3">Auto-trigger conditions</h3>
        <div className="space-y-2 text-sm">
          {data.autoTriggerSummary.map((row) => (
            <div key={row.label} className="flex justify-between text-muted-foreground gap-2">
              <span>{row.label}</span>
              <span className="text-primary font-medium shrink-0">→ ₹{row.payoutInr}</span>
            </div>
          ))}
        </div>
      </div>

      {data.ai?.suggestion && (
        <p className="text-xs text-muted-foreground border border-border rounded-xl p-3 bg-secondary/30">
          <span className="font-semibold text-foreground">Insight: </span>
          {data.ai.suggestion}
        </p>
      )}
    </div>
  );
};

export default MonitoringScreen;
