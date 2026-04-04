import { motion } from "framer-motion";
import { Check, Star, Sparkles, Loader2, CheckCircle, CreditCard, ArrowLeft, Smartphone } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";

/** Must match server `planKey` order: basic, standard, pro */
const PLAN_KEYS = ["basic", "standard", "pro"] as const;

const plans = [
  {
    name: "Basic",
    price: "₹20",
    period: "/week",
    coverage: "₹500",
    features: ["Rain disruption cover", "Auto-triggered claims", "Basic support"],
    popular: false,
  },
  {
    name: "Standard",
    price: "₹40",
    period: "/week",
    coverage: "₹1,000",
    features: ["Rain + Heat + AQI cover", "Auto-triggered claims", "Priority payouts", "24/7 support"],
    popular: true,
  },
  {
    name: "Pro",
    price: "₹60",
    period: "/week",
    coverage: "₹2,000",
    features: ["All disruptions covered", "Instant payouts", "Family coverage", "Dedicated support"],
    popular: false,
  },
];

const PlansScreen = () => {
  const [selected, setSelected] = useState(1);
  const [viewState, setViewState] = useState<'plans' | 'payment' | 'processingPayment' | 'paymentSuccess' | 'processingFree' | 'freeSuccess'>('plans');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  /** Persists to MongoDB: Subscription, Transaction (premium), User.totalPremiumPaid — see server/src/routes/plans.js */
  const handleFreePlan = async () => {
    setSubscribeError(null);
    setViewState("processingFree");
    try {
      await api("/api/plans/subscribe", {
        method: "POST",
        body: JSON.stringify({
          planKey: PLAN_KEYS[selected],
          paymentMethod: "upi",
          freeFirstWeek: true,
        }),
      });
      setViewState("freeSuccess");
    } catch (e) {
      setSubscribeError(e instanceof Error ? e.message : "Could not activate free plan");
      setViewState("plans");
    }
  };

  const handlePayNow = async () => {
    setSubscribeError(null);
    setViewState("processingPayment");
    try {
      await api("/api/plans/subscribe", {
        method: "POST",
        body: JSON.stringify({
          planKey: PLAN_KEYS[selected],
          paymentMethod,
          freeFirstWeek: false,
        }),
      });
      setViewState("paymentSuccess");
    } catch (e) {
      setSubscribeError(e instanceof Error ? e.message : "Payment failed");
      setViewState("payment");
    }
  };

  const handlePlanClick = (index: number) => {
    setSelected(index);
    setViewState('payment');
  };

  if (viewState === 'paymentSuccess') {
    return (
      <div className="px-4 pb-24 pt-12 space-y-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="bg-green-500/20 p-6 rounded-full"
        >
          <CheckCircle className="w-20 h-20 text-green-500" />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-bold text-foreground">Payment Successful!</h2>
          <p className="text-muted-foreground">Your {plans[selected].name} Plan is now active.</p>
        </motion.div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => setViewState('plans')}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-xs mt-8 gradient-primary text-primary-foreground font-bold py-4 rounded-2xl text-lg glow-primary"
        >
          Done
        </motion.button>
      </div>
    );
  }

  if (viewState === 'freeSuccess') {
    return (
      <div className="px-4 pb-24 pt-12 space-y-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="bg-primary/20 p-6 rounded-full"
        >
          <Sparkles className="w-20 h-20 text-primary" />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-bold text-foreground">Free Plan Activated!</h2>
          <p className="text-muted-foreground">Your {plans[selected].name} Free Plan is now active. Enjoy your free access!</p>
        </motion.div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => setViewState('plans')}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-xs mt-8 gradient-primary text-primary-foreground font-bold py-4 rounded-2xl text-lg glow-primary"
        >
          Done
        </motion.button>
      </div>
    );
  }

  if (viewState === 'payment' || viewState === 'processingPayment') {
    return (
      <div className="px-4 pb-24 pt-6 space-y-5">
        <button 
          onClick={() => setViewState('plans')} 
          disabled={viewState === 'processingPayment'}
          className="flex items-center text-muted-foreground mb-4 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Back to Plans
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Payment Details</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your payment information for the {plans[selected].name} Plan</p>
          {subscribeError && (
            <p className="text-destructive text-sm mt-2" role="alert">
              {subscribeError}
            </p>
          )}
        </div>
        
        <div className="bg-card border-2 border-border rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <span className="text-foreground font-medium">Amount to Pay</span>
            <span className="text-xl font-bold text-gradient">{plans[selected].price}</span>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="flex bg-secondary p-1 rounded-xl">
              <button 
                onClick={() => setPaymentMethod('upi')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${paymentMethod === 'upi' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                UPI
              </button>
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${paymentMethod === 'card' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                Card
              </button>
            </div>

            {paymentMethod === 'upi' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="text-sm font-medium text-foreground mb-1.5 block">UPI ID</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="name@upi" 
                    className="w-full bg-background border-2 border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-primary transition-colors" 
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="text-sm font-medium text-foreground mb-1.5 block">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000" 
                    className="w-full bg-background border-2 border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-primary transition-colors" 
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: viewState === 'processingPayment' ? 1 : 0.97 }}
          onClick={handlePayNow}
          disabled={viewState === 'processingPayment'}
          className={`w-full mt-6 text-primary-foreground font-bold py-4 rounded-2xl text-lg flex items-center justify-center gap-2 transition-all ${
            viewState === 'processingPayment' ? "bg-muted text-muted-foreground opacity-70" : "gradient-primary glow-primary"
          }`}
        >
          {viewState === 'processingPayment' ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Processing Payment...
            </>
          ) : (
            `Pay ${plans[selected].price}`
          )}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Choose Your Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">Protect your earnings from disruptions</p>
        {subscribeError && viewState === "plans" && (
          <p className="text-destructive text-sm mt-2" role="alert">
            {subscribeError}
          </p>
        )}
      </div>

      {/* Free Week Badge */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="gradient-primary rounded-2xl p-4 flex items-center gap-3"
      >
        <Sparkles className="w-8 h-8 text-primary-foreground" />
        <div>
          <p className="text-primary-foreground font-bold text-sm">🎉 1st Week FREE!</p>
          <p className="text-primary-foreground/80 text-xs">Try any plan risk-free. Pay after your first claim.</p>
        </div>
      </motion.div>

      {/* Plans */}
      <div className="space-y-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handlePlanClick(i)}
            className={`relative bg-card border-2 rounded-2xl p-5 cursor-pointer transition-all ${
              selected === i ? "border-primary glow-primary" : "border-border"
            } hover:border-primary/50`}
          >
            {plan.popular && (
              <div className="absolute -top-3 right-4 gradient-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> Popular
              </div>
            )}

            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h3 className="text-foreground font-bold text-lg">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gradient">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs">Coverage</p>
                <p className="text-foreground font-bold text-lg">{plan.coverage}</p>
              </div>
            </div>

            <div className="space-y-2">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-muted-foreground text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Pay After Claim Badge */}
            <div className="mt-4 bg-secondary rounded-lg px-3 py-1.5 inline-flex items-center gap-1">
              <span className="text-xs font-medium text-accent">💰 Pay After Claim</span>
            </div>
            
            <div className="mt-4 w-full bg-primary/10 text-primary font-semibold py-2.5 rounded-xl text-center text-sm transition-colors group-hover:bg-primary/20">
              Tap to Buy {plan.name} Plan
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: viewState === 'processingFree' ? 1 : 0.97 }}
        onClick={handleFreePlan}
        disabled={viewState === 'processingFree'}
        className={`w-full text-primary-foreground font-bold py-4 rounded-2xl text-lg flex items-center justify-center gap-2 transition-all mt-4 ${
          viewState === 'processingFree' ? "bg-muted text-muted-foreground opacity-70" : "gradient-primary glow-primary"
        }`}
      >
        {viewState === 'processingFree' ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Activating...
          </>
        ) : (
          `Activate ${plans[selected].name} Plan — Free`
        )}
      </motion.button>
    </div>
  );
};

export default PlansScreen;
