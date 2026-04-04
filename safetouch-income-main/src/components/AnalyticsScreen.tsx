import { motion } from "framer-motion";
import { TrendingUp, ShieldCheck, Zap, BarChart3, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type StatsApi = {
  success: boolean;
  totalProtected: number;
  totalClaims: number;
  avgPayout: number;
  coverageRate: number;
  weeklyCoverage: { week: string; covered: boolean; claimAmount: number }[];
  monthlyEarnings: Record<string, number>;
  ledger?: {
    walletBalance: number;
    premiumPaid: number;
    netBenefit: number;
  };
  trends?: {
    recentGrowthPct: number;
    totalProtectedPrev30d: number;
    totalProtectedLast15d: number;
  };
  bestMonth?: string | null;
};

const fmt = (n: number) =>
  `₹${Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const AnalyticsScreen = () => {
  const [data, setData] = useState<Omit<StatsApi, "success"> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<StatsApi>("/api/stats")
      .then((r) => {
        if (!cancelled) {
          const { success: _s, ...rest } = r;
          setData(rest);
        }
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return (
      <div className="px-4 pb-24 pt-6">
        <p className="text-destructive text-sm">{err}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 pb-24 pt-6 space-y-3 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const monthlyEntries = Object.entries(data.monthlyEarnings).filter(([, v]) => v > 0);
  const maxWeekly = Math.max(...data.weeklyCoverage.map((w) => w.claimAmount), 1);
  const growth = data.trends?.recentGrowthPct ?? 0;

  const stats = [
    { icon: TrendingUp, label: "Total protected (claims)", value: fmt(data.totalProtected), color: "text-primary" },
    { icon: Zap, label: "Total claims", value: String(data.totalClaims), color: "text-accent" },
    {
      icon: ShieldCheck,
      label: "Coverage rate",
      value: `${data.coverageRate}%`,
      color: "text-success",
      sub: "Days with protection vs your active window",
    },
    { icon: BarChart3, label: "Avg payout", value: fmt(data.avgPayout), color: "text-warning" },
  ];

  return (
    <div className="px-4 pb-24 pt-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">From CLAIM transactions and subscription coverage</p>
      </div>

      {data.trends && (data.trends.totalProtectedLast15d > 0 || data.trends.totalProtectedPrev30d > 0) && (
        <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">Recent trend</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Last 15 days vs prior 15 days (claim payouts)
            </p>
          </div>
          <span className={growth >= 0 ? "text-success font-bold" : "text-warning font-bold"}>
            {growth >= 0 ? "+" : ""}
            {growth}%
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
            <p className="text-muted-foreground text-xs leading-tight">{stat.label}</p>
            <p className="text-foreground font-bold text-xl mt-0.5">{stat.value}</p>
            {"sub" in stat && stat.sub && (
              <p className="text-muted-foreground text-[10px] mt-1 leading-tight">{stat.sub}</p>
            )}
          </motion.div>
        ))}
      </div>

      {data.bestMonth && (
        <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
          <Trophy className="w-5 h-5 text-warning shrink-0" />
          <span className="text-foreground">
            Best month: <span className="font-semibold">{data.bestMonth}</span>
          </span>
        </div>
      )}

      {data.ledger && (
        <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm space-y-1">
          <p className="font-semibold text-foreground">Ledger</p>
          <p className="text-muted-foreground">
            Wallet {fmt(data.ledger.walletBalance)} · Premium {fmt(data.ledger.premiumPaid)} · Net{" "}
            <span className={data.ledger.netBenefit >= 0 ? "text-success" : "text-warning"}>
              {fmt(data.ledger.netBenefit)}
            </span>
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-foreground font-semibold mb-4">Weekly claim amounts</h3>
        <div className="flex items-end gap-3 h-32">
          {data.weeklyCoverage.map((w, i) => (
            <div key={w.week} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={{
                  height: `${w.covered ? Math.max((w.claimAmount / maxWeekly) * 100, w.claimAmount > 0 ? 15 : 8) : 8}%`,
                }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                className={`w-full rounded-lg ${w.covered && w.claimAmount > 0 ? "gradient-primary" : "bg-secondary"}`}
              />
              <span className="text-muted-foreground text-xs">{w.week}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded gradient-primary" />
            <span>Claim payout in week</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-secondary" />
            <span>None</span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-foreground font-semibold mb-3">Monthly claim payouts</h3>
        {monthlyEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No monthly claim data yet.</p>
        ) : (
          <div className="space-y-3">
            {monthlyEntries.map(([month, amount]) => (
              <div key={month} className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">{month}</span>
                <span className="text-foreground font-semibold">{fmt(amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsScreen;
