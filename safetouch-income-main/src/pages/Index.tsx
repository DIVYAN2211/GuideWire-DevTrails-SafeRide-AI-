import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";
import PlansScreen from "@/components/PlansScreen";
import MonitoringScreen from "@/components/MonitoringScreen";
import ClaimsScreen from "@/components/ClaimsScreen";
import AnalyticsScreen from "@/components/AnalyticsScreen";
import FraudScreen from "@/components/FraudScreen";
import ConsistencyRewardsScreen from "@/components/ConsistencyRewardsScreen";
import AccountScreen from "@/components/AccountScreen";
import BottomNav from "@/components/BottomNav";
import HelpChatbot from "@/components/HelpChatbot";
import SmartNotifications from "@/components/SmartNotifications";
import { clearSession, getStoredName, getToken, setSession } from "@/lib/api";

const Index = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [screen, setScreen] = useState("dashboard");

  useEffect(() => {
    const token = getToken();
    if (token) {
      setLoggedIn(true);
      setUserName(getStoredName() || "Rider");
    }
  }, []);

  if (!loggedIn) {
    return (
      <LoginScreen
        onLogin={({ name, token }) => {
          setSession(token, name);
          setUserName(name);
          setLoggedIn(true);
        }}
      />
    );
  }

  const handleLogout = () => {
    clearSession();
    setLoggedIn(false);
    setUserName("");
    setScreen("dashboard");
  };

  const renderScreen = () => {
    switch (screen) {
      case "dashboard":
        return <Dashboard onNavigate={setScreen} userName={userName} onLogout={handleLogout} />;
      case "plans":
        return <PlansScreen />;
      case "monitoring":
        return <MonitoringScreen />;
      case "account":
        return <AccountScreen onNavigate={setScreen} />;
      case "claims":
        return <ClaimsScreen />;
      case "analytics":
        return <AnalyticsScreen />;
      case "fraud":
        return <FraudScreen />;
      case "rewards":
        return <ConsistencyRewardsScreen onBack={() => setScreen("dashboard")} />;
      default:
        return <Dashboard onNavigate={setScreen} userName={userName} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto relative">
      <SmartNotifications />
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      <BottomNav active={screen} onNavigate={setScreen} />
      <HelpChatbot />
    </div>
  );
};

export default Index;
