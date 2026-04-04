import { motion } from "framer-motion";
import { CheckCircle, Zap, Clock, IndianRupee } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type ClaimsApi = {
  success: boolean;
  activeClaim: {
    id: string;
    type: string;
    amount: number;
    triggeredValue?: string;
    threshold?: string;
    explanation?: string;
    creditedAt?: string;
  } | null;
  transactions: {
    id: string;
    type: string;
    amount: number;
    description?: string;
    date: string;
    explanation?: string;
  }[];
  claims?: {
    id: string;
    type: string;
    amount: number;
    status: string;
    explanation: string | null;
    triggeredValue?: string;
    threshold?: string;
    createdAt: string;
  }[];
  summary: {
    claimEventCount: number;
    walletBalance: number;
    totalClaims: number;
    premiumPaid: number;
    netBenefit: number;
  };
};

const fmt = (n: number) =>
  `₹${Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const ClaimsScreen = () => {
  const [data, setData] = useState<ClaimsApi | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<ClaimsApi>("/api/claims")
      .then((r) => {
        if (!cancelled) setData(r);
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
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-40 bg-muted rounded-2xl" />
        <div className="h-32 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Claims & Payouts</h1>
        <p className="text-muted-foreground text-sm mt-1">Auto-triggered payouts (wallet updates on CLAIM only)</p>
      </div>

      {data.activeClaim && (
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="gradient-success rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-success-foreground" />
              <span className="text-success-foreground font-semibold text-sm">Recent payout</span>
            </div>
            <p className="text-success-foreground/90 text-sm mb-3 leading-snug border border-success-foreground/20 rounded-xl px-3 py-2 bg-black/10">
              <span className="text-[10px] uppercase tracking-wide text-success-foreground/70 block mb-1">
                Why you got paid
              </span>
              {data.activeClaim.explanation ??
                `Automatic payout for ${data.activeClaim.type.replace(/_/g, " ")}.`}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/70 text-xs">Amount credited to wallet</p>
                <p className="text-3xl font-bold text-success-foreground">{fmt(data.activeClaim.amount)}</p>
              </div>
              <CheckCircle className="w-14 h-14 text-success-foreground" />
            </div>
            <p className="text-success-foreground/80 text-xs mt-2 capitalize">
              {data.activeClaim.type.replace(/_/g, " ")} · reading {data.activeClaim.triggeredValue ?? "—"}
              {data.activeClaim.threshold ? ` · rule ${data.activeClaim.threshold}` : ""}
            </p>
          </div>
        </motion.div>
      )}

      {data.claims && data.claims.filter((c) => c.status === "credited" && c.explanation).length > 0 && (
        <div>
          <h2 className="text-foreground font-semibold mb-3">Why each claim paid</h2>
          <div className="space-y-2">
            {data.claims
              .filter((c) => c.status === "credited" && c.explanation)
              .slice(0, 8)
              .map((c) => (
                <div
                  key={String(c.id)}
                  className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-muted-foreground leading-snug"
                >
                  <p className="text-foreground text-xs font-medium mb-1">
                    {fmt(c.amount)} · {new Date(c.createdAt).toLocaleString("en-IN")}
                  </p>
                  {c.explanation}
                </div>
              ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-foreground font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" /> Activity (claims & plan payments)
        </h2>
        <div className="space-y-3">
          {data.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            data.transactions.map((tx, i) => {
              const isClaim = tx.type === "CLAIM";
              return (
                <motion.div
                  key={tx.id}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.05, 0.4) }}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                      <CheckCircle className={`w-5 h-5 ${isClaim ? "text-success" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground font-medium text-sm">
                        {isClaim ? "Claim payout" : "Plan payment"}
                      </p>
                      {isClaim && tx.explanation && (
                        <p className="text-muted-foreground text-[11px] leading-snug mt-1">{tx.explanation}</p>
                      )}
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {new Date(tx.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isClaim ? "text-success" : "text-foreground"}`}>
                      {isClaim ? "+" : "−"}
                      {fmt(tx.amount)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-foreground font-semibold mb-3">Summary (from ledger)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-xs">Claim events</p>
            <p className="text-foreground font-bold text-xl">{data.summary.claimEventCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Wallet (claims)</p>
            <p className="text-gradient font-bold text-xl">{fmt(data.summary.walletBalance)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Premium paid</p>
            <p className="text-foreground font-bold text-xl">{fmt(data.summary.premiumPaid)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Net benefit</p>
            <p className={`font-bold text-xl ${data.summary.netBenefit >= 0 ? "text-success" : "text-warning"}`}>
              {fmt(data.summary.netBenefit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimsScreen;
