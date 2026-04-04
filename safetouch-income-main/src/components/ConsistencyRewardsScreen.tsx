import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Star,
  Zap,
  Shield,
  Gift,
  ArrowLeft,
  Trophy,
  Loader2,
  Sparkles,
  Lock,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BadgeRow = {
  key: string;
  label: string;
  badgeName?: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

type RewardRow = {
  key: string;
  type: string;
  description: string;
  claimed: boolean;
  date: string | null;
  amountInr: number | null;
};

type GamificationEvents = {
  newBadges: { key: string; label: string; description: string; unlockedAt: string | null }[];
  newRewards: { key: string; type: string; description: string; achievedAt?: string }[];
  streakMilestone: number | null;
  streakBroken: boolean;
};

type ActivityLogResponse = {
  success: boolean;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  activityDays: string[];
  badges: BadgeRow[];
  rewards: RewardRow[];
  progress: {
    nextStreakRewardDays: number;
    nextStreakRewardLabel: string;
    message: string;
  };
  reminder: string | null;
  rewardsSummary?: { id: string; text: string; unlocked?: boolean; claimed?: boolean }[];
  events?: GamificationEvents;
};

const BADGE_ICONS: Record<string, typeof Star> = {
  starter: Star,
  consistent_rider: Flame,
  reliable_earner: Zap,
  protected_pro: Shield,
  streak_master: Trophy,
};

function playCelebrationChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.26);
  } catch {
    /* optional */
  }
}

function ConfettiBurst({ show }: { show: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 0.25,
        duration: 1.1 + Math.random() * 0.9,
        hue: [28, 142, 200, 280][i % 4],
      })),
    [show]
  );

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, y: "10vh", x: 0, rotate: 0, scale: 1 }}
          animate={{
            opacity: 0,
            y: "110vh",
            x: (Math.random() - 0.5) * 160,
            rotate: 360 + Math.random() * 360,
            scale: 0.4,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          className="absolute top-0 h-2 w-2 rounded-sm shadow-sm"
          style={{
            left: p.left,
            backgroundColor: `hsl(${p.hue} 85% 55%)`,
          }}
        />
      ))}
    </div>
  );
}

const ConsistencyRewardsScreen = ({ onBack }: { onBack: () => void }) => {
  const [data, setData] = useState<ActivityLogResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [celebrateTitle, setCelebrateTitle] = useState("");
  const [celebrateBody, setCelebrateBody] = useState<string[]>([]);
  const [confetti, setConfetti] = useState(false);

  const runCelebration = useCallback((ev: GamificationEvents) => {
    const lines: string[] = [];
    if (ev.newBadges.length) {
      ev.newBadges.forEach((b) =>
        lines.push(`Badge: ${b.label} — ${b.description}`)
      );
    }
    if (ev.newRewards.length) {
      ev.newRewards.forEach((r) => lines.push(`Reward: ${r.description}`));
    }
    if (ev.streakMilestone) {
      lines.push(`Streak milestone: ${ev.streakMilestone} day${ev.streakMilestone === 1 ? "" : "s"} 🔥`);
    }

    const shouldParty =
      ev.newBadges.length > 0 || ev.newRewards.length > 0 || ev.streakMilestone != null;
    if (!shouldParty) return;

    setCelebrateTitle("Congratulations! 🎉");
    setCelebrateBody(lines);
    setConfetti(true);
    setCelebrateOpen(true);
    playCelebrationChime();
    window.setTimeout(() => setConfetti(false), 2200);
  }, []);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await api<ActivityLogResponse>("/api/activity/log", {
        method: "POST",
        body: JSON.stringify({ source: "rewards_screen" }),
      });
      setData(res);
      if (res.events && (res.events.newBadges.length || res.events.newRewards.length || res.events.streakMilestone)) {
        runCelebration(res.events);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, [runCelebration]);

  useEffect(() => {
    load();
  }, [load]);

  const streakGoal = 7;
  const progressPct = data
    ? Math.min(100, (data.currentStreak / streakGoal) * 100)
    : 0;

  const handleClaimBonus = async (key: string) => {
    setClaiming(key);
    try {
      const res = await api<ActivityLogResponse>("/api/rewards/claim", {
        method: "POST",
        body: JSON.stringify({ key }),
      });
      setData(res);
      setCelebrateTitle("Bonus claimed! 🎉");
      setCelebrateBody([`₹${res.rewards?.find((r) => r.key === key)?.amountInr ?? 100} added to your wallet.`]);
      setConfetti(true);
      setCelebrateOpen(true);
      playCelebrationChime();
      window.setTimeout(() => setConfetti(false), 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not claim");
    } finally {
      setClaiming(null);
    }
  };

  if (err && !data) {
    return (
      <div className="px-4 pb-24 pt-6 space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-destructive text-sm">{err}</p>
        <Button variant="outline" size="sm" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 pb-24 pt-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading your streak & rewards…</span>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-6 space-y-5">
      <ConfettiBurst show={confetti} />

      <Dialog open={celebrateOpen} onOpenChange={setCelebrateOpen}>
        <DialogContent className="max-w-[min(100%,24rem)] rounded-2xl border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-center">{celebrateTitle}</DialogTitle>
            <DialogDescription className="sr-only">Celebration details</DialogDescription>
            <ul className="text-left text-sm text-muted-foreground space-y-2 pt-2 list-disc pl-4">
              {celebrateBody.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </DialogHeader>
          <Button className="w-full" onClick={() => setCelebrateOpen(false)}>
            Awesome
          </Button>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Consistency & Rewards</h1>
      </div>

      {data.reminder && (
        <p className="text-xs text-center text-warning bg-warning/10 border border-warning/25 rounded-xl px-3 py-2">
          {data.reminder}
        </p>
      )}

      {data.events?.streakBroken && (
        <p className="text-xs text-muted-foreground text-center">
          You started a fresh streak — keep logging in daily to climb back up.
        </p>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="gradient-card border border-border rounded-2xl p-5 glow-primary"
      >
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-6 h-6 text-warning" />
          <h2 className="text-lg font-bold text-foreground">Streak tracker</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-background/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gradient">🔥 {data.currentStreak}</p>
            <p className="text-muted-foreground text-xs">Current streak (days)</p>
          </div>
          <div className="bg-background/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{data.longestStreak}</p>
            <p className="text-muted-foreground text-xs">Longest streak</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {data.currentStreak}/{streakGoal} days toward streak reward
            </span>
            <span className="text-right max-w-[55%]">{data.progress.nextStreakRewardLabel}</span>
          </div>
          <div className="w-full h-3 bg-background/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="h-full gradient-primary rounded-full"
            />
          </div>
          <p className="text-muted-foreground text-xs text-center mt-1">{data.progress.message}</p>
          <p className="text-muted-foreground text-[10px] text-center">
            {data.activityDays.length} active day{data.activityDays.length === 1 ? "" : "s"} recorded · last:{" "}
            {data.lastActiveDate ?? "—"}
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.08 }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Badges</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {data.badges.map((badge, i) => {
            const Icon = BADGE_ICONS[badge.key] ?? Star;
            return (
              <motion.div
                key={badge.key}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className={`bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-all ${
                  !badge.unlocked ? "opacity-45 grayscale" : ""
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    badge.unlocked ? "gradient-primary glow-primary" : "bg-muted"
                  }`}
                >
                  {badge.unlocked ? (
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-foreground text-sm font-semibold">{badge.label}</p>
                <p className="text-muted-foreground text-[11px] leading-tight">{badge.description}</p>
                {badge.unlocked && (
                  <span className="text-xs font-medium text-success">Unlocked</span>
                )}
                {!badge.unlocked && <span className="text-xs font-medium text-muted-foreground">Locked</span>}
                {badge.unlockedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(badge.unlockedAt).toLocaleDateString("en-IN")}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-warning" />
          <h2 className="text-lg font-bold text-foreground">Rewards</h2>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {data.rewards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Hit milestones (streak, claims, calm periods) to unlock rewards — all tracked automatically.
              </p>
            ) : (
              data.rewards.map((r) => (
                <motion.div
                  key={r.key}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                      <Gift className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground text-sm font-medium leading-snug">{r.description}</p>
                      <p className="text-muted-foreground text-[10px] mt-1">
                        {r.date ? new Date(r.date).toLocaleString("en-IN") : ""}
                        {r.claimed ? " · Claimed" : " · Ready"}
                      </p>
                    </div>
                  </div>
                  {r.type === "BONUS_PAYOUT" && !r.claimed && (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={claiming === r.key}
                      onClick={() => handleClaimBonus(r.key)}
                    >
                      {claiming === r.key ? "Claiming…" : `Claim ₹${r.amountInr ?? 100} to wallet`}
                    </Button>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <Button variant="outline" className="w-full" onClick={load}>
        Refresh status
      </Button>
    </div>
  );
};

export default ConsistencyRewardsScreen;
