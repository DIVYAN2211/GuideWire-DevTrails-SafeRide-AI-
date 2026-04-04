import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { api } from "@/lib/api";

type TxRow = {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  claimId?: string | null;
};

type WalletApi = {
  success: boolean;
  wallet: {
    walletBalance: number;
    totalClaims: number;
    premiumPaid: number;
    netBenefit: number;
    transactions: TxRow[];
    userName: string;
    phone: string;
    activePlan: {
      planKey: string;
      weeklyPrice: number;
      coverageAmount: number;
      expiresAt: string;
      isFreeWeek: boolean;
    } | null;
  };
};

const fmt = (n: number) =>
  `₹${Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const AccountScreen = ({ onNavigate }: { onNavigate: (s: string) => void }) => {
  const [data, setData] = useState<WalletApi["wallet"] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setErr(null);
    api<WalletApi>("/api/wallet")
      .then((r) => setData(r.wallet))
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="px-4 pb-28 pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My account</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Wallet from claims only · premium is separate
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center active:scale-95"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {err && (
        <p className="text-destructive text-sm" role="alert">
          {err}
        </p>
      )}

      {loading && !data ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="h-24 bg-muted rounded-2xl" />
          <div className="h-40 bg-muted rounded-2xl" />
        </div>
      ) : data ? (
        <>
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-2xl border border-success/30 bg-success/10 p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Wallet balance
                </p>
                <p className="text-3xl font-bold text-foreground">{fmt(data.walletBalance)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Earnings from claim payouts only (starts at ₹0)
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-2xl p-4 space-y-3"
          >
            <p className="text-sm font-semibold text-foreground">Insurance accounting</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total claim payouts</span>
                <span className="font-semibold text-success">{fmt(data.totalClaims)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-1">
                Same as wallet balance (sum of CLAIM transactions)
              </p>
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground">Premium paid (subscriptions)</span>
                <span className="font-semibold">{fmt(data.premiumPaid)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-1">
                Plan fees only — never added to wallet
              </p>
              <div className="flex justify-between pt-2 border-t border-border items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Net benefit
                </span>
                <span
                  className={`font-bold ${data.netBenefit >= 0 ? "text-success" : "text-warning"}`}
                >
                  {fmt(data.netBenefit)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Claim payouts − premium paid</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="bg-card border border-border rounded-2xl p-4 space-y-3"
          >
            <p className="text-sm font-semibold text-foreground">Recent activity</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions yet.</p>
              ) : (
                data.transactions.map((t) => {
                  const isClaim = t.type === "CLAIM";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-2 py-2 border-b border-border/60 last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isClaim ? (
                          <ArrowDownCircle className="w-4 h-4 text-success shrink-0" />
                        ) : (
                          <ArrowUpCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {isClaim ? "Claim payout" : "Plan payment"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(t.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${isClaim ? "text-success" : ""}`}>
                        {isClaim ? "+" : "−"}
                        {fmt(t.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              <CreditCard className="w-4 h-4 text-accent" />
              Active plan
            </div>
            {data.activePlan ? (
              <div className="text-sm space-y-1">
                <p className="text-foreground capitalize font-medium">{data.activePlan.planKey} plan</p>
                <p className="text-muted-foreground">
                  Coverage up to {fmt(data.activePlan.coverageAmount)} · ₹{data.activePlan.weeklyPrice}/week
                  {data.activePlan.isFreeWeek ? " (free week)" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Renews / ends {new Date(data.activePlan.expiresAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active plan — choose one to unlock auto-payouts.</p>
            )}
            <button
              type="button"
              onClick={() => onNavigate("plans")}
              className="mt-3 w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-primary/10 text-primary text-sm font-medium"
            >
              View plans
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>

          <p className="text-xs text-muted-foreground text-center px-2">
            Signed in as {data.userName} · +91 {data.phone}
          </p>
        </>
      ) : null}
    </div>
  );
};

export default AccountScreen;
