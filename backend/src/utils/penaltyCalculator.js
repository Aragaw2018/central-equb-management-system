'use strict';

/**
 * penaltyCalculator.js
 *
 * Determines the current penalty tier for an Equb group member based on
 * the plan category (DAILY / WEEKLY / MONTHLY) and how late their payment is
 * relative to the group's draw deadline.
 *
 * Penalty schedules (EAT = UTC+3):
 *
 * DAILY
 *   ─────────────────────────────────────────────────────────────
 *   Tier 0 (On-time)   : Before 10:00 same day
 *   Tier 1 (Light)     : 10:00 – 12:00
 *   Tier 2 (Medium)    : 12:00 – 02:00 next day
 *   Tier 3 (Severe)    : 02:00 – 06:00 next day
 *   DEFAULTED          : After 06:00 next day
 *
 * WEEKLY  (draw on Sunday 10:00 EAT)
 *   ─────────────────────────────────────────────────────────────
 *   Tier 0 (On-time)   : Before Sunday 10:00
 *   Tier 1 (Light)     : Sunday 10:00 – Tuesday 10:00
 *   Tier 2 (Medium)    : Tuesday 10:00 – Thursday 10:00
 *   Tier 3 (Severe)    : Thursday 10:00 – Saturday 10:00
 *   DEFAULTED          : After Saturday 10:00
 *
 * MONTHLY (draw in Week 1 of each month)
 *   ─────────────────────────────────────────────────────────────
 *   Tier 0 (On-time)   : Week 1 (days 1–7)
 *   Tier 1 (Light)     : Week 2 (days 8–14)
 *   Tier 2 (Medium)    : Week 3 (days 15–21)
 *   Tier 3 (Severe)    : Week 4 (days 22–28)
 *   DEFAULTED          : After day 28
 */

// EAT offset in milliseconds (UTC+3)
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * Returns the current time as a Date adjusted to EAT (UTC+3).
 * We do NOT mutate getTimezoneOffset here — we just work in UTC arithmetic.
 */
function nowEAT() {
    return new Date(Date.now() + EAT_OFFSET_MS);
}

/**
 * Builds an EAT Date from individual components.
 * @param {number} year
 * @param {number} month  - 1-based
 * @param {number} day
 * @param {number} hour
 * @param {number} minute
 */
function eatDate(year, month, day, hour = 0, minute = 0) {
    // Construct as UTC then subtract EAT offset so the resulting UTC ts
    // represents the correct EAT wall-clock time.
    return new Date(Date.UTC(year, month - 1, day, hour, minute) - EAT_OFFSET_MS);
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER RESULT SHAPE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} TierResult
 * @property {0|1|2|3}  tier           - Penalty tier number (0 = no penalty)
 * @property {number}   penaltyAmount  - ETB penalty to add to base amount
 * @property {boolean}  isDefaulted    - True → block payment
 * @property {string}   label          - Human-readable tier label
 * @property {string}   labelAmharic   - Amharic tier label
 * @property {string}   badgeColor     - Tailwind CSS colour classes for UI badge
 * @property {string}   window         - Descriptive deadline window string
 */

// ─────────────────────────────────────────────────────────────────────────────
// DAILY LOGIC
// ─────────────────────────────────────────────────────────────────────────────
function calcDailyTier(plan) {
    const now = nowEAT();
    // Use today's date in EAT
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + 1;
    const d = now.getUTCDate();

    const deadline_t0 = eatDate(y, m, d, 10, 0);   // 10:00 today
    const deadline_t1 = eatDate(y, m, d, 12, 0);   // 12:00 today
    // 02:00 "next day" in EAT = 26:00 same day = day+1 at 02:00
    const deadline_t2 = eatDate(y, m, d + 1, 2, 0);  // 02:00 tomorrow
    const deadline_t3 = eatDate(y, m, d + 1, 6, 0);  // 06:00 tomorrow

    const nowTs = now.getTime();

    if (nowTs < deadline_t0.getTime()) {
        return makeTier(0, 0, false, 'On-time', 'በጊዜ', 'bg-emerald-100 text-emerald-700', 'Before 10:00 EAT');
    }
    if (nowTs < deadline_t1.getTime()) {
        return makeTier(1, parseFloat(plan.tier1Penalty), false, 'Light Penalty', 'ቀላል ቅጣት', 'bg-yellow-100 text-yellow-700', '10:00 – 12:00 EAT');
    }
    if (nowTs < deadline_t2.getTime()) {
        return makeTier(2, parseFloat(plan.tier2Penalty), false, 'Medium Penalty', 'መካከለኛ ቅጣት', 'bg-orange-100 text-orange-700', '12:00 EAT – 02:00 next day');
    }
    if (nowTs < deadline_t3.getTime()) {
        return makeTier(3, parseFloat(plan.tier3Penalty), false, 'Severe Penalty', 'ከባድ ቅጣት', 'bg-red-100 text-red-700', '02:00 – 06:00 next day');
    }
    return makeDefaulted('Beyond 06:00 EAT — payment window closed');
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY LOGIC  (draw: Sunday 10:00 EAT)
// ─────────────────────────────────────────────────────────────────────────────
function calcWeeklyTier(plan, group) {
    const now = nowEAT();

    // Find the most recent Sunday (draw day) at or before now
    // getUTCDay(): 0=Sun, 1=Mon, ... 6=Sat
    const dayOfWeek = now.getUTCDay(); // 0 (Sun) … 6 (Sat)
    const daysBackToSunday = dayOfWeek; // 0 if Sunday, 1 if Monday …
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + 1;
    const d = now.getUTCDate();

    // Sunday 10:00 EAT = last Sunday's draw deadline
    const drawSunday = eatDate(y, m, d - daysBackToSunday, 10, 0);
    const t1End = eatDate(y, m, d - daysBackToSunday + 2, 10, 0);  // Tue 10:00
    const t2End = eatDate(y, m, d - daysBackToSunday + 4, 10, 0);  // Thu 10:00
    const t3End = eatDate(y, m, d - daysBackToSunday + 6, 10, 0);  // Sat 10:00

    const nowTs = now.getTime();

    if (nowTs < drawSunday.getTime()) {
        return makeTier(0, 0, false, 'On-time', 'በጊዜ', 'bg-emerald-100 text-emerald-700', 'Before Sunday 10:00 EAT');
    }
    if (nowTs < t1End.getTime()) {
        return makeTier(1, parseFloat(plan.tier1Penalty), false, 'Light Penalty', 'ቀላል ቅጣት', 'bg-yellow-100 text-yellow-700', 'Sun 10:00 – Tue 10:00 EAT');
    }
    if (nowTs < t2End.getTime()) {
        return makeTier(2, parseFloat(plan.tier2Penalty), false, 'Medium Penalty', 'መካከለኛ ቅጣት', 'bg-orange-100 text-orange-700', 'Tue 10:00 – Thu 10:00 EAT');
    }
    if (nowTs < t3End.getTime()) {
        return makeTier(3, parseFloat(plan.tier3Penalty), false, 'Severe Penalty', 'ከባድ ቅጣት', 'bg-red-100 text-red-700', 'Thu 10:00 – Sat 10:00 EAT');
    }
    return makeDefaulted('Beyond Saturday 10:00 EAT — payment window closed');
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY LOGIC  (draw: Week 1 of each month)
// ─────────────────────────────────────────────────────────────────────────────
function calcMonthlyTier(plan, group) {
    const now = nowEAT();
    const dayOfMonth = now.getUTCDate(); // 1 … 31

    if (dayOfMonth <= 7) {
        return makeTier(0, 0, false, 'On-time', 'በጊዜ', 'bg-emerald-100 text-emerald-700', 'Week 1 — regular payment window');
    }
    if (dayOfMonth <= 14) {
        return makeTier(1, parseFloat(plan.tier1Penalty), false, 'Light Penalty', 'ቀላል ቅጣት', 'bg-yellow-100 text-yellow-700', 'Week 2 (days 8–14)');
    }
    if (dayOfMonth <= 21) {
        return makeTier(2, parseFloat(plan.tier2Penalty), false, 'Medium Penalty', 'መካከለኛ ቅጣት', 'bg-orange-100 text-orange-700', 'Week 3 (days 15–21)');
    }
    if (dayOfMonth <= 28) {
        return makeTier(3, parseFloat(plan.tier3Penalty), false, 'Severe Penalty', 'ከባድ ቅጣት', 'bg-red-100 text-red-700', 'Week 4 (days 22–28)');
    }
    return makeDefaulted('Beyond day 28 — monthly payment window closed');
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function makeTier(tier, penaltyAmount, isDefaulted, label, labelAmharic, badgeColor, window) {
    return { tier, penaltyAmount: penaltyAmount || 0, isDefaulted, label, labelAmharic, badgeColor, window };
}

function makeDefaulted(window) {
    return {
        tier: 'DEFAULTED',
        penaltyAmount: 0,
        isDefaulted: true,
        label: 'Defaulted',
        labelAmharic: 'ቅጣት ብቻ',
        badgeColor: 'bg-red-600 text-white',
        window,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Calculates the applicable penalty tier for a member attempting payment now.
 *
 * @param {Object} group  - EqubGroup record (must include .plan and .startDate)
 * @param {Object} plan   - EqubPlan record with tier1Penalty, tier2Penalty, tier3Penalty
 * @returns {TierResult}
 */
function calculatePenaltyTier(group, plan) {
    // Normalise plan — fall back to zeros if tier fields missing (old plans)
    const safePlan = {
        tier1Penalty: plan.tier1Penalty ?? 0,
        tier2Penalty: plan.tier2Penalty ?? 0,
        tier3Penalty: plan.tier3Penalty ?? 0,
    };

    switch (plan.category) {
        case 'DAILY':   return calcDailyTier(safePlan);
        case 'WEEKLY':  return calcWeeklyTier(safePlan, group);
        case 'MONTHLY': return calcMonthlyTier(safePlan, group);
        default:
            // Unknown category — treat as on-time, no penalty
            return makeTier(0, 0, false, 'On-time', 'በጊዜ', 'bg-emerald-100 text-emerald-700', 'Unknown schedule');
    }
}

/**
 * Convenience: returns a compact status object suitable for an API response
 * or frontend badge rendering.
 *
 * @param {Object} group
 * @param {Object} plan
 * @returns {{ tier, penaltyAmount, isDefaulted, label, labelAmharic, badgeColor, window }}
 */
function getPenaltyStatus(group, plan) {
    return calculatePenaltyTier(group, plan);
}

module.exports = { calculatePenaltyTier, getPenaltyStatus };
