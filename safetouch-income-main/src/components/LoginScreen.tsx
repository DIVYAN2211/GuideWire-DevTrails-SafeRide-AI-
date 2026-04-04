import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Phone, ArrowRight, User, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { getDeviceCoordinates } from "@/lib/geo";

type Mode = "login" | "signup";

type LoginScreenProps = {
  onLogin: (payload: { name: string; token: string }) => void;
};

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  /** True when OTP was requested via Sign Up (affects verify body + location UI). */
  const [flowIsSignup, setFlowIsSignup] = useState(false);
  /** Captured during sign-up for weather; sent with verify. */
  const [signupGeo, setSignupGeo] = useState<{ lat: number; lon: number } | null>(null);
  const [geoHint, setGeoHint] = useState<string | null>(null);
  const [otpCells, setOtpCells] = useState(["", "", "", ""]);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otp = otpCells.join("");

  const resetFlow = (next: Mode) => {
    setMode(next);
    setOtpSent(false);
    setOtpCells(["", "", "", ""]);
    setDevOtpHint(null);
    setFlowIsSignup(false);
    setSignupGeo(null);
    setGeoHint(null);
    setError(null);
  };

  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    setLoading(true);
    setError(null);
    try {
      setFlowIsSignup(false);
      const res = await api<{ success: boolean; devOtp?: string }>("/api/auth/login/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setDevOtpHint(res.devOtp ?? null);
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const requestLocationOnly = async () => {
    setGeoHint(null);
    const coords = await getDeviceCoordinates();
    setSignupGeo(coords);
    setGeoHint(
      coords
        ? "Location saved for this sign-up. Weather will use your area after OTP."
        : "Could not read location (denied or unavailable). You can try again or continue."
    );
  };

  const handleSignupRequestOtp = async () => {
    if (!name.trim() || phone.length < 10) return;
    setLoading(true);
    setError(null);
    setGeoHint(null);
    try {
      setFlowIsSignup(true);
      let coords = signupGeo;
      if (!coords) {
        coords = await getDeviceCoordinates();
        setSignupGeo(coords);
      }
      if (coords) {
        setGeoHint("Location will be saved when you verify OTP — weather for your area.");
      } else {
        setGeoHint(
          "No location — app will use a default city for weather. You can allow location on the OTP step."
        );
      }

      const res = await api<{ success: boolean; devOtp?: string }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), phone }),
      });
      setDevOtpHint(res.devOtp ?? null);
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 4) return;
    setLoading(true);
    setError(null);
    try {
      const body: {
        phone: string;
        otp: string;
        name?: string;
        latitude?: number;
        longitude?: number;
      } = {
        phone,
        otp: otpCells.join(""),
      };
      if (flowIsSignup && name.trim()) {
        body.name = name.trim();
      }
      if (flowIsSignup && signupGeo) {
        body.latitude = signupGeo.lat;
        body.longitude = signupGeo.lon;
      }

      const res = await api<{
        success: boolean;
        token: string;
        user: { name: string };
      }>("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify(body),
      });
      onLogin({ name: res.user?.name || name.trim() || "Rider", token: res.token });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center mb-10"
      >
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-4 glow-primary">
          <Shield className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-gradient">SafeRide AI</h1>
        <p className="text-muted-foreground mt-2 text-center text-sm">
          Protect your income from rain, heat & disruptions
        </p>
      </motion.div>

      <div className="flex bg-card border border-border rounded-xl mb-6 overflow-hidden w-full max-w-sm">
        <button
          type="button"
          onClick={() => resetFlow("login")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${mode === "login" ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => resetFlow("signup")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${mode === "signup" ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Sign Up
        </button>
      </div>

      {error && (
        <p className="text-destructive text-sm mb-4 text-center max-w-sm" role="alert">
          {error}
        </p>
      )}

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="w-full max-w-sm space-y-4"
      >
        <AnimatePresence mode="wait">
          {mode === "signup" && !otpSent ? (
            <motion.div
              key="signup"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-border bg-card/80 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left space-y-1">
                    <p className="text-sm font-semibold text-foreground">Location for weather</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      We use your position only to load rain, temperature, and air quality for your area. You can
                      allow it now or when you tap Create Account.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={requestLocationOnly}
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg border border-primary/50 text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  {signupGeo ? "Location allowed ✓ — tap to update" : "Use my location"}
                </button>
                {geoHint && mode === "signup" && !otpSent && (
                  <p className="text-xs text-muted-foreground text-center">{geoHint}</p>
                )}
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl py-4 pl-12 pr-4 text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full bg-card border border-border rounded-xl py-4 pl-12 pr-4 text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={handleSignupRequestOtp}
                disabled={!name.trim() || phone.length < 10 || loading}
                className="w-full gradient-primary text-primary-foreground font-semibold py-4 rounded-xl text-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2 glow-primary"
              >
                {loading ? "Working…" : "Create Account"} <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ) : !otpSent ? (
            <motion.div key="phone" exit={{ x: -100, opacity: 0 }} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full bg-card border border-border rounded-xl py-4 pl-12 pr-4 text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={phone.length < 10 || loading}
                className="w-full gradient-primary text-primary-foreground font-semibold py-4 rounded-xl text-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2 glow-primary"
              >
                {loading ? "Sending…" : "Send OTP"} <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-muted-foreground text-center text-sm">
                OTP sent to +91 {phone}
              </p>

              {flowIsSignup && (
                <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2 space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    {signupGeo
                      ? "Your coordinates will be saved when you verify — OpenWeather will use your area."
                      : "No location yet — weather will use a default city until you share location."}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const c = await getDeviceCoordinates();
                      setSignupGeo(c);
                      setGeoHint(
                        c
                          ? "Location set. Verify OTP to save it on your account."
                          : "Still no location — check browser permissions."
                      );
                    }}
                    className="w-full py-2 text-xs font-medium text-primary hover:underline"
                  >
                    {signupGeo ? "Update location" : "Use my location for weather"}
                  </button>
                </div>
              )}

              {devOtpHint && (
                <div
                  className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-center"
                  role="status"
                >
                  <p className="text-xs text-muted-foreground">Simulated SMS code (dev)</p>
                  <p className="text-2xl font-bold tracking-widest text-primary font-mono">{devOtpHint}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Hidden in production. Use this exact code below.
                  </p>
                </div>
              )}
              {!devOtpHint && (
                <p className="text-muted-foreground text-center text-xs">
                  Check the Network tab for <code className="text-primary">devOtp</code> in the JSON response,
                  or set <code className="text-primary">NODE_ENV=development</code> on the API.
                </p>
              )}
              {geoHint && flowIsSignup && otpSent && (
                <p className="text-xs text-muted-foreground text-center">{geoHint}</p>
              )}
              <div className="flex gap-3 justify-center">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpInputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={otpCells[i]}
                    onChange={(e) => {
                      const digit = e.target.value.replace(/\D/g, "").slice(-1);
                      setOtpCells((prev) => {
                        const next = [...prev];
                        next[i] = digit;
                        return next;
                      });
                      if (digit && i < 3) {
                        otpInputRefs.current[i + 1]?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otpCells[i] && i > 0) {
                        otpInputRefs.current[i - 1]?.focus();
                      }
                    }}
                    onPaste={
                      i === 0
                        ? (e) => {
                            e.preventDefault();
                            const raw = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
                            if (!raw) return;
                            const next = ["", "", "", ""] as string[];
                            for (let j = 0; j < raw.length; j += 1) {
                              next[j] = raw[j] ?? "";
                            }
                            setOtpCells(next);
                            otpInputRefs.current[Math.min(raw.length, 3)]?.focus();
                          }
                        : undefined
                    }
                    className="w-14 h-14 bg-card border border-border rounded-xl text-center text-2xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleVerify}
                disabled={otp.length < 4 || loading}
                className="w-full gradient-primary text-primary-foreground font-semibold py-4 rounded-xl text-lg disabled:opacity-40 transition-all glow-primary"
              >
                {loading ? "Verifying…" : "Start Protecting Your Income"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="text-muted-foreground text-xs mt-8 text-center">
        By continuing, you agree to our Terms & Privacy Policy
      </p>
    </div>
  );
};

export default LoginScreen;
