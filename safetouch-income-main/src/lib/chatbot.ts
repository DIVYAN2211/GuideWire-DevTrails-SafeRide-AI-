/**
 * Rule-based help bot — no external AI. All copy lives here for reuse and tests.
 */

/** Long replies skip the typewriter in the UI for readability */
export const CHAT_TYPEWRITER_MAX_LEN = 380;

export const CHAT_DEFAULT_REPLY = `I'm not sure I understood that one.

You can ask things like:
• How does the app work?
• What should I do first?
• How do claims work?
• Why didn't I get a payout?
• Wallet, plans, stats, or security

Try rephrasing, or tap a quick question below.`;

export const CHAT_WELCOME = `Hi — I'm here to explain SafeRide and walk you through what to do.

This app protects riders when the weather gets rough: it watches live conditions and can pay you automatically when rules you're covered for are triggered — but only if you have an active plan.

Ask how the app works, what to do first, or anything about claims, wallet, plans, stats, or security. You can also use the quick buttons below.`;

export const CHAT_HOW_APP_WORKS = `Here's the big picture:

What SafeRide does
It combines live weather and air quality with an insurance-style plan. When real-world conditions cross certain limits (heavy rain, heat, pollution, and similar rules), the system can create a claim and credit your wallet — you don't file paperwork for those automatic events.

What happens in the background
1. Your location (saved at signup) drives which weather data we use.
2. Monitoring / Live refreshes conditions and compares them to thresholds.
3. If a rule fires and you're eligible, a claim is created and money shows in Wallet / Account as claim payouts.

What you don't have to do
You don't manually submit every payout for automatic weather claims — the app evaluates conditions while you use Monitoring and the Home dashboard.

If you tell me "plans" or "claims" I can go deeper on either part.`;

export const CHAT_WHAT_TO_DO = `Here's a simple path that works for most riders:

1. Sign in
Complete login so your profile and history stay tied to you.

2. Turn on location (when asked)
We use it for weather and for Security checks. You can still use the app if you deny it, but some features work best with location allowed.

3. Pick and activate a plan
Open Plans, choose coverage that fits you, and subscribe. Without an active plan, automatic claim payouts won't credit — you may see data in Monitoring but no wallet credit.

4. Keep an eye on Monitoring / Live
That's where conditions are evaluated. Use Home for your overview and shortcuts.

5. Check Wallet / Account
See claim money versus what you've paid for the plan. Stats shows trends; Security shows trust and fraud signals.

6. Stay consistent
Regular use and honest patterns help your trust score and keep alerts quiet.

Start with Plans if you haven't subscribed yet — that's the usual blocker for payouts.`;

export const CHAT_CLAIM = `How claims work here

Automatic (zero-touch) claims
When you have an active subscription, the app watches weather and related signals. If a threshold is crossed (for example heavy rain, high AQI, extreme temperature — depending on what the product supports), the system can create a claim and credit your wallet automatically.

What you need for a payout
• An active plan that hasn't expired
• Conditions that actually meet the rule (not just "bad weather" in general)
• No duplicate of the same claim type inside the cooldown window (duplicates are blocked on purpose)

Where you see it
New activity usually shows under Claims, Wallet / Account, and sometimes Home.

If you got no money even though it looked stormy, ask me "why no payout" — I'll walk through the usual reasons.`;

export const CHAT_WALLET = `What "Wallet" means in this app

Wallet balance = money from claim payouts
The total you see from claim-type transactions — automatic payouts when you're covered and a rule fires. That's your protection earnings, not random bonuses.

Premium / plan payments are separate
What you pay for the subscription is tracked differently. Account often shows wallet, premium paid, and net benefit (claims minus premium) so you can see if you're ahead.

What you should do
• After a claim, open Account or Wallet to confirm the credit
• If balance looks wrong, check that you were on an active plan when the event happened

I can also explain plans or why no payout if that's what you're stuck on.`;

export const CHAT_PLAN = `Plans — why they matter

You need an active subscription to receive automatic claim payouts.
Monitoring might still show weather, but wallet credits from auto claims are tied to being covered under a current plan.

What to do
1. Open Plans from the bottom nav or Home.
2. Compare weekly price and coverage cap (how much a single event can pay).
3. Subscribe with the in-app flow.
4. Note expiry — when the plan lapses, new auto payouts typically stop until you renew or buy again.

Free or promo periods
If the app offers a free week or discount, it still shows as a plan — you're either covered or you aren't.

After you're active, use Monitoring so conditions are checked and Stats to see how much you've earned over time.`;

export const CHAT_STATS = `Stats (Analytics)

What it shows
Numbers come from your real claim transactions (and related coverage logic), not fake demo data:

• Total protected — sum of claim payout amounts
• Claim count — how many claim payouts you've had
• Average payout — total divided by count
• Coverage rate — how much of your recent time had protection / activity (based on subscriptions and claims)
• Weekly bars — claim money per week
• Monthly breakdown — earnings by month

Why use it
See whether the product is paying back versus your premium, and which months were strongest.

Open Stats in the app anytime; it refreshes from the server when you load the screen.`;

export const CHAT_SECURITY = `Security & fraud detection

What this screen is for
It estimates how trustworthy your usage looks: location versus your registered zone, activity (deliveries / app usage), and fraud alerts (for example too many claims too fast, odd patterns).

Trust score
It's calculated dynamically from alerts, location match, and consistent activity — not a fixed number. Green is generally safe, yellow is cautious, red needs attention.

What you should do
• Allow location on the Security page when prompted so we can verify you're in zone
• Use the app normally — heartbeats and real activity help
• Read alerts if any appear; they explain what looked unusual

This protects honest riders and keeps abuse from draining the pool.`;

export const CHAT_NO_PAYOUT = `If you didn't get a payout, check these in order:

1. Active plan
Was your subscription active when the weather event happened? If the plan had expired, auto payouts usually won't credit.

2. Threshold not met
The app uses measurable rules (rain amount, temperature, AQI, etc.). "Bad weather" in conversation isn't always above the technical threshold — Monitoring shows what the app actually sees.

3. Duplicate / cooldown
The same type of claim can't fire again inside a short cooldown. You may see a duplicate blocked in logs — that's intentional.

4. Monitoring not loaded
Evaluation often runs when you use Live / Monitoring or refresh the dashboard — keep the app open there during rough conditions if you want timely checks.

5. Security / eligibility
Rare cases: unusual patterns or verification issues can affect how payouts are treated.

What to do next
Confirm Plans shows active coverage, open Monitoring, and check Claims / Account for messages or statuses. If everything looks active and it still never pays, note the time and weather you expected — that helps support reproduce it.`;

export const CHAT_HOW_EARN = `How you earn with SafeRide

You don't "tap to earn." You get paid when covered rules trigger:

1. Subscribe so you're insured for automatic events.
2. Real conditions cross the defined thresholds (rain, heat, air quality, etc. — see Monitoring for live values).
3. The system creates a claim and credits your wallet with the payout amount (within your plan's cap).

You earn more when
• You're on a plan during more severe / qualifying events
• You're not blocked by cooldowns or duplicates

You won't earn when
• There's no active plan
• Weather didn't cross the bar
• A duplicate was prevented

Pair this with Stats to see your totals over time.`;

export const CHAT_MONITORING = `Monitoring / Live tab

Purpose
Shows current weather and environmental readings for your area (based on saved or current location, depending on setup). The app uses this data to decide whether automatic claim rules fire.

What you should do
• Open Live when conditions are rough — it refreshes data and drives evaluation.
• Read the numbers (rain, temp, AQI) rather than guessing from the sky alone.
• If something looks wrong (e.g. location), fix location / Security settings.

This is the main place where "should a payout happen?" gets its inputs.`;

export const CHAT_WALLET_AND_PLANS = `Wallet and plans — together

Plans (what you pay)
You choose a subscription with a weekly price and a coverage cap per event. While the plan is active, you're eligible for automatic claim payouts when rules fire.

Wallet (what you receive)
Your wallet is built from claim payouts — money credited when an automatic claim succeeds. It's not the same line item as premium; Account usually shows both so you can see net benefit.

What you should do
1. Activate a plan first — without it, you typically won't receive auto payouts.
2. Use Monitoring when conditions are bad.
3. Check Account / Wallet after events to see credits.
4. Use Stats to see totals over weeks and months.

Ask only about wallet or only plans if you want more detail on one side.`;

export const CHAT_ACCOUNT = `Account tab

Typical contents
• Wallet balance from claims
• Premium you've paid for plans
• Net benefit (claims minus premium)
• Transactions or ledger-style history
• Profile / logout

What you should do
Use it as your financial truth for the app: after storms, open Account and confirm new claim credits. Compare to Stats for trends.

If numbers confuse you, ask about wallet or plans and I'll break those down.`;

type Rule = {
  match: (normalized: string) => boolean;
  response: string;
};

const RULES: Rule[] = [
  {
    match: (s) =>
      s.includes("no payout") ||
      s.includes("didn't get") ||
      s.includes("didnt get") ||
      s.includes("no money") ||
      s.includes("not paid"),
    response: CHAT_NO_PAYOUT,
  },
  {
    match: (s) =>
      s.includes("how does the app work") ||
      s.includes("how the app works") ||
      s.includes("how app works") ||
      s.includes("what is this app") ||
      s.includes("what does this app do") ||
      s.includes("explain the app") ||
      (s.includes("how") && s.includes("work") && (s.includes("app") || s.includes("saferide") || s.includes("safe ride"))) ||
      (s.includes("what") && s.includes("saferide")),
    response: CHAT_HOW_APP_WORKS,
  },
  {
    match: (s) =>
      s.includes("what should i do") ||
      s.includes("what do i do") ||
      s.includes("getting started") ||
      s.includes("get started") ||
      s.includes("first time") ||
      s.includes("new user") ||
      s.includes("steps to") ||
      s.includes("how to start") ||
      s.includes("begin here") ||
      (s.includes("guide") && s.includes("me")),
    response: CHAT_WHAT_TO_DO,
  },
  {
    match: (s) =>
      s.includes("monitoring") ||
      s.includes("live tab") ||
      (s.includes("live") && (s.includes("weather") || s.includes("map"))) ||
      (s.includes("weather") && s.includes("screen")),
    response: CHAT_MONITORING,
  },
  { match: (s) => s.includes("account") || s.includes("profile") || s.includes("logout"), response: CHAT_ACCOUNT },
  {
    match: (s) =>
      s.includes("how to earn") ||
      (s.includes("how") && s.includes("earn")) ||
      (s.includes("earn") && (s.includes("money") || s.includes("income"))),
    response: CHAT_HOW_EARN,
  },
  {
    match: (s) =>
      (s.includes("wallet") && s.includes("plan")) ||
      (s.includes("wallet") && s.includes("subscription")) ||
      s.includes("wallet and plans"),
    response: CHAT_WALLET_AND_PLANS,
  },
  { match: (s) => s.includes("wallet"), response: CHAT_WALLET },
  {
    match: (s) =>
      s.includes("plan") || s.includes("subscription") || s.includes("subscribe") || s.includes("premium"),
    response: CHAT_PLAN,
  },
  { match: (s) => s.includes("stats") || s.includes("analytics"), response: CHAT_STATS },
  {
    match: (s) =>
      s.includes("security") ||
      s.includes("fraud") ||
      s.includes("trust score") ||
      (s.includes("trust") && s.includes("score")),
    response: CHAT_SECURITY,
  },
  { match: (s) => s.includes("claim"), response: CHAT_CLAIM },
];

export function getBotResponse(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return CHAT_DEFAULT_REPLY;

  for (const rule of RULES) {
    if (rule.match(normalized)) return rule.response;
  }
  return CHAT_DEFAULT_REPLY;
}

export type QuickPrompt = {
  label: string;
  message: string;
};

export const QUICK_PROMPTS: QuickPrompt[] = [
  { label: "How does the app work?", message: "How does the app work?" },
  { label: "What should I do first?", message: "What should I do as a new user?" },
  { label: "Why no payout?", message: "Why no payout?" },
  { label: "How do claims work?", message: "How do claims work?" },
  { label: "Wallet & plans", message: "Explain wallet and plans" },
];
