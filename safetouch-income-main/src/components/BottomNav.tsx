import { Home, CreditCard, Activity, BarChart3, ShieldAlert, PiggyBank } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { id: "dashboard", icon: Home, label: "Home" },
  { id: "plans", icon: CreditCard, label: "Plans" },
  { id: "monitoring", icon: Activity, label: "Live" },
  { id: "account", icon: PiggyBank, label: "Account" },
  { id: "analytics", icon: BarChart3, label: "Stats" },
  { id: "fraud", icon: ShieldAlert, label: "Security" },
];

const BottomNav = ({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (screen: string) => void;
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 w-6 h-1 gradient-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                className={`w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[9px] sm:text-[10px] font-medium transition-colors truncate max-w-full ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area padding */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
};

export default BottomNav;
