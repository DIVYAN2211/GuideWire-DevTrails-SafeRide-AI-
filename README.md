# SafeRide AI — Income Protection for Delivery Partners

**When rain stops work, income shouldn’t stop.**

---

## The reality we’re solving

Food delivery partners working with platforms like **Swiggy** and **Zomato** power India’s on-demand economy—but their income has a hidden problem:

- If they don’t work → they don’t earn  
- If it rains → fewer or no deliveries  
- If pollution rises → unsafe to work  
- If curfew happens → zero income  

A single disruption can cut **20–30%** of weekly earnings. Today, there is **no real financial safety net** for this gap.

---

## Our vision

We built **SafeRide AI** — a smart, **automated income protection** layer built for delivery partners.

- Not health insurance  
- Not vehicle insurance  

**Pure income protection** — when they need it most.

---

## What makes this different?

Unlike traditional insurance:

| Traditional | SafeRide AI |
|-------------|-------------|
| Claim forms | No forms |
| Long waits | No manual approval queue |
| Manual approval | **Automated** when rules are met |

**100% automated payout path** when predefined conditions are satisfied.

---

## How it works (simple flow)

1. Rider signs up in seconds  
2. Chooses a **weekly protection plan**  
3. The system **monitors real-world conditions** (weather, AQI, heat, etc.)  
4. A **disruption threshold** is crossed  
5. **Payout is credited automatically** to the in-app wallet  

**Zero effort. Zero paperwork** for the auto-trigger path.

---

## Real-time intelligence (core engine)

Claims can trigger automatically from **live data** against fixed rules (configurable in product):

| Trigger | Example condition | Why it matters |
|--------|-------------------|----------------|
| Rain | Rainfall above threshold (e.g. **> 50 mm / 1h**) | Hard to ride / deliver |
| Heat | Temperature above threshold (e.g. **> 40 °C**) | Unsafe working conditions |
| Pollution | **AQI** above threshold (e.g. **> 300**) | Health risk |
| Curfew / disruption | Simulated or real flag | No movement |

*Exact numbers depend on plan configuration in the app.*

---

## Smart weekly pricing (example)

Built for gig workers’ cash flow:

| Plan | Weekly (example) | Coverage cap (example) |
|------|------------------|-------------------------|
| Basic | ₹20 | Up to ₹500 |
| Standard | ₹40 | Up to ₹1000 |
| Pro | ₹60 | Up to ₹2000 |

---

## Freemium & trust

- **First week free** (where enabled)  
- **Experience value before full commitment**  
- Room for **platform-supported** onboarding in a scaled rollout  

---

## AI-powered intelligence

- **Risk context** — AI-assisted summaries and suggestions from current conditions (e.g. Gemini in this codebase)  
- **Fraud & trust** — GPS / zone checks, activity signals, duplicate-claim prevention  
- **Dynamic UX** — Live monitoring, stats, and alerts  

*Hyper-local dynamic pricing can be layered on as you scale.*

---

## Gamified engagement

Beyond “insurance as a box”:

- **Daily streaks** and activity logging  
- **Badges** (starter, consistency, claims milestones, etc.)  
- **Rewards** (e.g. free week, discounts, bonus payouts)  
- **Celebrations** when milestones hit  

Encourages retention and healthy engagement with the product.

---

## Live monitoring & dashboard

Users see:

- Current **risk / weather** snapshot  
- **Active plan** and coverage context  
- **Wallet** (claim credits vs premium)  
- **Stats** and **security / trust** views  
- Simple **bars and cards** for quick reading  

---

## Zero-touch claims

**Traditional:** Apply → wait → approve → get paid  

**SafeRide AI (auto path):** **Detect → evaluate rules → credit** when eligible  

No human step required for the automated pipeline.

---

## Integrations (this repo)

- **OpenWeather** — weather + air pollution  
- **Google Gemini** — AI copy / risk flavour  
- **MongoDB** — users, plans, claims, transactions  
- **JWT auth** — phone + OTP flow  
- **Simulated delivery / activity** hooks where useful for demos  

Payment rails can be wired as **sandbox / production** UPI or PG when you go live.

---

## Tech stack (this repository)

| Layer | Stack |
|--------|--------|
| Frontend | **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Framer Motion** |
| Backend | **Node.js**, **Express** |
| Database | **MongoDB** (Mongoose) |
| APIs | OpenWeather, Google Generative AI (Gemini) |

---

## Why this matters

- Financial cushion during **weather and disruption** shocks  
- Less stress when **conditions are bad**  
- Incentives for **consistent, honest** usage  
- Architecture that can scale to **many riders**  

---

## What makes us stand out

- Real problem, **immediate** user story  
- **Automated** rule-based payouts + wallet ledger  
- **AI** layered on monitoring and UX  
- **Gamification** for retention  
- **Practical** pricing and flows for gig work  

---

## Future scope

- Deeper integration with **delivery platforms**  
- **Hyper-local** prediction and pricing  
- Expansion to **all gig** verticals  
- Tighter **real-time earnings** protection  

---

## Links

- **Demo video (2 min):** [Google Drive](https://drive.google.com/file/d/16PkY8k2zDllSeuCTobxCOMW4tfk1pxqy/view?usp=sharing)  
- **Repository:** [GitHub — GuideWire-DevTrails-SafeRide-AI](https://github.com/DIVYAN2211/GuideWire-DevTrails-SafeRide-AI-)  

---

## Team — Techno Freaks

- **DIVYA N**  
- **SOWMIYA S**  
- **AFRA FATHIMA M**  
- **VASANTH R**  

---

## Final thought

> We are not just building an app.  
> We are building **financial security** for those who keep our cities running.

---

## Local development (quick)

Application code lives in the `safetouch-income-main/` folder.

1. **Backend:** `cd safetouch-income-main/server` → copy `.env.example` to `.env` → `npm install` → `npm run dev` (default port **3001**).  
2. **Frontend:** `cd safetouch-income-main` → `npm install` → set `VITE_API_BASE` if needed → `npm run dev`.  

Configure MongoDB, `JWT_SECRET`, and API keys in `server/.env` (see `server/.env.example`).
