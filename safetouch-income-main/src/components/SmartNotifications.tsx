import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Banknote, CheckCircle2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "saferide_dismissed_notifications";
const POLL_MS = 22_000;

type NotifItem = {
  id: string;
  category: string;
  tone: "success" | "warning" | "neutral";
  title: string;
  message: string;
  at: string;
};

type NotificationsApi = {
  success: boolean;
  items: NotifItem[];
  generatedAt?: string;
};

function loadDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function toneStyles(tone: NotifItem["tone"]) {
  switch (tone) {
    case "success":
      return {
        card: "border-emerald-400/35 bg-gradient-to-br from-emerald-500/[0.14] via-card/[0.97] to-card/[0.92] shadow-[0_12px_40px_-8px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/15",
        iconWrap: "bg-emerald-400/20 text-emerald-300 shadow-inner shadow-emerald-900/20",
        title: "text-emerald-50",
        body: "text-emerald-50/80",
        dismiss:
          "text-emerald-100/70 hover:text-emerald-50 hover:bg-emerald-500/20 border-emerald-400/25",
      };
    case "warning":
      return {
        card: "border-amber-400/40 bg-gradient-to-br from-amber-500/[0.16] via-card/[0.97] to-card/[0.92] shadow-[0_12px_40px_-8px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/15",
        iconWrap: "bg-amber-400/20 text-amber-200 shadow-inner shadow-amber-900/20",
        title: "text-amber-50",
        body: "text-amber-50/85",
        dismiss:
          "text-amber-100/70 hover:text-amber-50 hover:bg-amber-500/20 border-amber-400/25",
      };
    default:
      return {
        card: "border-sky-400/30 bg-gradient-to-br from-sky-500/[0.12] via-card/[0.97] to-card/[0.92] shadow-[0_12px_40px_-8px_rgba(14,165,233,0.22)] ring-1 ring-sky-400/10",
        iconWrap: "bg-sky-400/15 text-sky-200 shadow-inner shadow-sky-900/20",
        title: "text-sky-50",
        body: "text-sky-50/80",
        dismiss: "text-sky-100/65 hover:text-sky-50 hover:bg-sky-500/20 border-sky-400/20",
      };
  }
}

const SmartNotifications = () => {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await api<NotificationsApi>("/api/notifications");
      setItems(res.items ?? []);
    } catch {
      /* silent — user may be offline */
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = window.setInterval(fetchNotifs, POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchNotifs]);

  const visible = useMemo(
    () => items.filter((n) => !dismissed.has(n.id)),
    [items, dismissed]
  );

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  };

  if (visible.length === 0) return null;

  return (
    <div className="fixed inset-x-0 z-[58] flex flex-col gap-3 items-center pointer-events-none px-4 sm:px-5 top-[calc(5.25rem+max(0px,env(safe-area-inset-top,0px)))]">
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((n) => {
          const s = toneStyles(n.tone);
          const Icon =
            n.tone === "success" ? Banknote : n.tone === "warning" ? AlertTriangle : CheckCircle2;

          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="pointer-events-auto w-full max-w-lg backdrop-blur-xl"
            >
              <div
                className={cn(
                  "rounded-2xl border p-4 pr-3 flex gap-3.5 items-start",
                  s.card
                )}
                role="status"
              >
                <div
                  className={cn(
                    "shrink-0 flex h-11 w-11 items-center justify-center rounded-xl",
                    s.iconWrap
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p
                    className={cn(
                      "font-semibold text-[0.8125rem] sm:text-sm tracking-tight leading-tight",
                      s.title
                    )}
                  >
                    {n.title}
                  </p>
                  <p
                    className={cn(
                      "mt-1.5 text-[13px] sm:text-sm leading-relaxed font-normal",
                      s.body
                    )}
                  >
                    {n.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dismiss(n.id)}
                  className={cn(
                    "shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border bg-black/10 transition-colors",
                    s.dismiss
                  )}
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default SmartNotifications;
