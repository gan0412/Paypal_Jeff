import type { Payment } from './types';

export interface InstantRiskResult {
  isConcerned: boolean;
  score: number;
  level: 'low' | 'elevated' | 'high';
  nudge: string;
}

/**
 * Instant client-side heuristic evaluation of payment draft (0ms).
 * Ensures proactive alerts appear immediately without waiting for network LLM round-trips.
 */
export function evaluatePaymentInstant(p: Payment): InstantRiskResult {
  // Hardcoded threshold: for any transaction lower than 100, allow Jeff to pass it
  if (p.amount < 100) {
    return {
      isConcerned: false,
      score: 15,
      level: 'low',
      nudge: `Transfer of $${p.amount.toFixed(2)} is under the alert threshold. Looks good to proceed.`,
    };
  }

  if (!p.recipient_is_new) {
    return {
      isConcerned: false,
      score: 15,
      level: 'low',
      nudge: `Looks like your routine payment to ${p.recipient_name}.`,
    };
  }

  const note = (p.note || '').toLowerCase();
  const recipient = (p.recipient_name || '').toLowerCase();
  const isRomance = /flight|love|come see me|partner|boyfriend|girlfriend|meet|dating/i.test(note);
  const isUrgent = /urgent|hurry|emergency|asap|fast|today|immediately|now|hospital|bail/i.test(note);
  const isCharity = /donat|relief|charit|fund|children|foundation/i.test(recipient + ' ' + note);
  const isLarge = p.amount >= 1000;
  const isFF = p.payment_type === 'friends_family';

  if (isRomance || isUrgent || (isLarge && isFF) || isCharity) {
    let nudge = "Caution: high-risk scam pattern detected. Pause and verify before sending.";
    if (isRomance) {
      nudge = "Caution: first-time payment for travel/flight to someone met online is a common romance scam pattern.";
    } else if (isCharity) {
      nudge = "Caution: unverified charity requests are a frequent target for scams. Verify credentials first.";
    } else if (isUrgent) {
      nudge = "Caution: manufactured urgency and pressure to pay quickly are telltale scam indicators.";
    }

    return {
      isConcerned: true,
      score: 75,
      level: 'high',
      nudge,
    };
  }

  if (isFF || isLarge) {
    return {
      isConcerned: true,
      score: 60,
      level: 'elevated',
      nudge: "Notice: first payment sent as Friends & Family has no purchase protection. Review carefully.",
    };
  }

  return {
    isConcerned: false,
    score: 25,
    level: 'low',
    nudge: "Looks routine, but always verify unfamiliar recipients.",
  };
}
