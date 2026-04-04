/** Plan catalog — prices/coverage per product spec */
export const PLAN_CATALOG = [
  {
    key: "basic",
    name: "Basic",
    weeklyPrice: 20,
    coverage: 500,
    features: [
      "Rain disruption cover",
      "Auto-triggered claims",
      "Basic support",
    ],
  },
  {
    key: "standard",
    name: "Standard",
    weeklyPrice: 40,
    coverage: 1000,
    features: [
      "Rain + Heat + AQI cover",
      "Auto-triggered claims",
      "Priority payouts",
      "24/7 support",
    ],
    popular: true,
  },
  {
    key: "pro",
    name: "Pro",
    weeklyPrice: 60,
    coverage: 2000,
    features: [
      "All disruptions covered",
      "Instant payouts",
      "Family coverage",
      "Dedicated support",
    ],
  },
];

export const PLAN_BY_KEY = Object.fromEntries(
  PLAN_CATALOG.map((p) => [p.key, p])
);

/** Payout amounts when thresholds breach (INR) */
export const PAYOUT_AMOUNTS = {
  rainfall: 300,
  temperature: 200,
  aqi: 250,
  curfew: 400,
};

/** Thresholds for auto-claims */
export const THRESHOLDS = {
  rainfallMm: 50,
  temperatureC: 40,
  aqi: 300,
};

export const DUPLICATE_CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000;
