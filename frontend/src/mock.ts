// A scripted stand-in for the real backend. Same shapes as docs/API_CONTRACT.md.
// It exists so the UI can be built and demoed without a server. Delete nothing here when the
// backend arrives: set VITE_USE_MOCK=false and the real API is used instead.
import type { AgentTurn, Precheck, Choice, DecisionResult, Mood, Payment, Risk, RiskSignal, StartResponse } from './types';

type ScenarioId = 'romance' | 'charity' | 'legit' | 'coached' | 'influenced' | 'worried';

interface Rule {
  test: RegExp;
  when?: (p: Payment) => boolean;   // extra condition, e.g. the claim must contradict the account
  reply: string;
  mood: Mood;
  delta: number;
  quick?: string[];
  signal?: RiskSignal;
}

interface Scenario {
  baseScore: number;
  signals: RiskSignal[];
  opening: string;
  openingMood: Mood;
  openingQuick: string[];
  rules: Rule[];
  followups: { reply: string; mood: Mood; quick?: string[] }[];
  closing: { high: string; low: string };
  recommendHigh?: Choice;   // what Jeff suggests when risk stays high (default: protected payment)
}

const SCENARIOS: Record<ScenarioId, Scenario> = {
  romance: {
    baseScore: 48,
    signals: [
      { code: 'new_recipient', label: 'First payment to this person' },
      { code: 'large_amount', label: 'Much larger than your usual payments', detail: '$2,400 vs a typical $60' },
      { code: 'emotional_note', label: 'Note mentions travel and a relationship' },
    ],
    opening: "Hi, I'm Jeff, an AI assistant. This is a big payment to someone new. Who is Daniel to you?",
    openingMood: 'listening',
    openingQuick: ['We met online', "He's my partner", "It's for a flight"],
    rules: [
      {
        test: /never met|haven'?t met|not met|only online|met online|dating|app/i,
        reply: 'Thanks. Have you been able to video call him live?',
        mood: 'listening',
        delta: 8,
        quick: ['Yes, many times', 'No, his camera is broken', 'We only text'],
        signal: { code: 'met_online', label: 'Relationship started online' },
      },
      {
        test: /camera|can'?t video|no video|only text|deployed|military|oil rig|offshore|abroad|overseas/i,
        reply: "That's a common pattern in romance scams. I'm not saying that's what this is. Has he asked you to hurry or keep it private?",
        mood: 'concerned',
        delta: 17,
        quick: ["Yes, it's urgent", 'No pressure'],
        signal: { code: 'no_video', label: 'Has not been seen on live video' },
      },
      {
        test: /don'?t tell|secret|keep it|private|urgent|hurry|asap|today|right now/i,
        reply: "Urgency and secrecy are what scammers rely on. A real partner won't mind you waiting a day. Want to use a protected payment?",
        mood: 'concerned',
        delta: 15,
        quick: ["I'll think about it", 'I trust him'],
        signal: { code: 'pressure', label: 'Pressure to act quickly or keep it quiet' },
      },
      {
        test: /gift card|crypto|bitcoin|wire|zelle|friends and family/i,
        reply: "Those can't easily be reversed. A protected payment keeps your protections.",
        mood: 'concerned',
        delta: 18,
        signal: { code: 'unsafe_method', label: 'Asked to pay in a hard-to-reverse way' },
      },
      {
        test: /trust|love|sure|know him|partner|boyfriend|girlfriend|fianc/i,
        reply: 'I understand. How did you two first meet, and when?',
        mood: 'listening',
        delta: 3,
      },
    ],
    followups: [
      { reply: 'Have you met him in person?', mood: 'listening', quick: ['Never', 'Yes'] },
      { reply: 'Could you ask him for a live video call first?', mood: 'thinking' },
    ],
    closing: {
      high: "I can't decide for you, but there are several warning signs. A protected payment, or waiting a day, would be safer.",
      low: "That sounds reasonable. It's your call.",
    },
  },

  charity: {
    baseScore: 40,
    signals: [
      { code: 'new_recipient', label: 'First payment to this organization' },
      { code: 'urgent_wording', label: "Note says 'urgent'" },
      { code: 'unverified_org', label: "Couldn't confirm the organization's registration" },
    ],
    opening: "Hi, I'm Jeff, an AI assistant. This is a donation to a new organization. How did you hear about them?",
    openingMood: 'listening',
    openingQuick: ['A text message', 'A social media post', 'A friend', 'I searched'],
    rules: [
      {
        test: /text|sms|dm|message|call|phone|email|facebook|instagram|tiktok|social|post|ad\b|link/i,
        reply: "Unexpected donation requests are a common scam. Do you know if they're registered?",
        mood: 'concerned',
        delta: 17,
        quick: ["I didn't check", 'They say they are'],
        signal: { code: 'unsolicited', label: 'Donation request came out of the blue' },
      },
      {
        test: /friend|family|coworker|colleague|searched|google|website|known|always/i,
        reply: "That's a good sign. Is this your first time giving to them?",
        mood: 'listening',
        delta: -8,
        quick: ['First time', "I've given before"],
      },
      {
        test: /urgent|today|deadline|right now|hurry|emergency/i,
        reply: 'Urgency is a tactic. Real causes will still be there tomorrow. Want to check their registration first?',
        mood: 'concerned',
        delta: 12,
        signal: { code: 'pressure', label: 'Pressure to give immediately' },
      },
      {
        test: /registered|verified|tax|501|checked|looked it up/i,
        reply: "Good instinct. If it's registered under that exact name, that's reassuring.",
        mood: 'relieved',
        delta: -12,
      },
    ],
    followups: [{ reply: "Could you give through their official website instead?", mood: 'thinking' }],
    closing: {
      high: "I can't confirm this organization. A protected payment, or giving through a charity you've verified, is safer.",
      low: 'Sounds fine. Checking first was smart.',
    },
  },

  legit: {
    baseScore: 12,
    signals: [{ code: 'known_recipient', label: 'You have paid Priya 11 times before' }],
    opening: "Hi, I'm Jeff, an AI assistant. This looks like your usual payment to Priya. Is it November rent?",
    openingMood: 'calm',
    openingQuick: ['Yes, rent', "It's something else"],
    rules: [
      {
        test: /yes|rent|usual|monthly|roommate|same/i,
        reply: "That matches your history. You're all set.",
        mood: 'relieved',
        delta: -6,
      },
      {
        test: /else|different|new|loan|borrow|asked me/i,
        reply: "Thanks. What's it for?",
        mood: 'listening',
        delta: 18,
        quick: ['A deposit', 'She asked for extra'],
      },
    ],
    followups: [{ reply: 'Thanks, that helps.', mood: 'calm' }],
    closing: {
      high: "Maybe check with Priya using a number you already have. It's your call.",
      low: "All consistent with your usual payments. You're all set.",
    },
  },
  // The sender repeats a story that does not match the account, or is being told what to say.
  coached: {
    baseScore: 42,
    signals: [
      { code: 'new_recipient', label: 'First payment to this person' },
      { code: 'large_amount', label: 'Much larger than your usual payments', detail: '$3,000 vs a typical $60' },
      { code: 'emergency_note', label: 'Note describes an emergency' },
    ],
    opening: "Hi, I'm Jeff, an AI assistant. This is $3,000 to someone new, marked as an emergency. Who is Marcus?",
    openingMood: 'listening',
    openingQuick: ['My cousin', 'A friend', 'Someone I met online'],
    rules: [
      {
        test: /paid him before|sent .*before|always|every month|known him for years|many times/i,
        when: (p) => p.recipient_is_new,
        reply: "Thanks. I only see this as your first payment to Marcus, so something may be off. Could it be another account?",
        mood: 'concerned', delta: 18, quick: ['Different account', 'Okay, first time'],
        signal: { code: 'story_mismatch', label: "Answer doesn't match your account history" },
      },
      {
        test: /told me (what )?to say|told me to say|said to say|tell (the )?(bank|you) (it'?s|that)|say it'?s (a )?(gift|family)|script|coach/i,
        reply: "Thank you for telling me. If anyone gives you words to say, that's a serious warning sign by itself. You're not in trouble. Want to pause?",
        mood: 'concerned', delta: 26, quick: ['Pause it', 'I still want to send'],
        signal: { code: 'coached', label: 'Someone may be telling you what to say' },
      },
      {
        test: /don'?t tell|secret|nobody|no one knows|private|family doesn'?t know/i,
        reply: "Secrecy around money is a red flag, even with family. Could you call a relative on a number you already have?",
        mood: 'concerned', delta: 14, quick: ['I will call', 'He said not to'],
        signal: { code: 'pressure', label: 'Asked to keep this quiet' },
      },
      {
        test: /texted|messaged|called me|new number|lost (my|his) phone|new phone/i,
        reply: "A new number or phone is a classic sign. Calling his old number would settle it.",
        mood: 'concerned', delta: 14, quick: ['I called him', "I can't reach him"],
        signal: { code: 'new_contact', label: 'Contact came from a new number' },
      },
      {
        test: /i called|called his old|confirmed|verified|spoke to|talked to him/i,
        reply: "Good, that's the best check. If his old number confirms it, you can feel better about this.",
        mood: 'relieved', delta: -16,
      },
      {
        test: /cousin|family|relative|brother|nephew|emergency|hospital|jail|bail|accident|friend/i,
        reply: "I'm sorry, that sounds stressful. Emergencies are the requests scammers copy most. Did he contact you, or you him?",
        mood: 'listening', delta: 6, quick: ['He texted me', 'I called him'],
      },
    ],
    followups: [{ reply: 'Could you call him on the number you already have?', mood: 'thinking' }],
    closing: {
      high: "I can't be sure, and I'm not accusing anyone. But the signs add up. A protected payment, or a call to a known number first, is safer.",
      low: "That checks out. It's your call.",
    },
  },

  // The sender is convinced and gets defensive. Jeff stays warm, stays honest, and asks for a pause.
  influenced: {
    baseScore: 46,
    signals: [
      { code: 'new_recipient', label: 'First payment to this company' },
      { code: 'large_amount', label: 'Much larger than your usual payments', detail: '$5,000 vs a typical $60' },
      { code: 'investment', label: 'Investment with a company you have not used before' },
    ],
    opening: "Hi, I'm Jeff, an AI assistant. This is $5,000 to a new trading company. How did you find them?",
    openingMood: 'listening',
    openingQuick: ['A friend online', 'An ad', 'I trust them'],
    rules: [
      {
        test: /stop|leave me alone|don'?t tell me|mind your|none of your|not a child|i know what i'?m doing|annoy|just let me/i,
        reply: "You're right, it's your money and your decision. I only advise and can't block it. One question, then I'll step back: would waiting 24 hours cost you anything?",
        mood: 'calm', delta: 4, quick: ['Yes, it expires', 'No, I can wait'],
      },
      {
        test: /expires|limited|today|last chance|deadline|closing|spots|window|only .*left/i,
        reply: "That's the pressure scammers use. A real investment won't vanish in a day. Could they put the offer in writing for tomorrow?",
        mood: 'concerned', delta: 18,
        signal: { code: 'pressure', label: 'Pressure to act before a deadline' },
      },
      {
        test: /guarantee|double|profit|returns|%|risk[- ]?free|can'?t lose|made money|dashboard|app showed|balance/i,
        reply: "Guaranteed returns don't exist in real investing. Many scams show fake profits to get bigger deposits. Have you actually withdrawn money?",
        mood: 'concerned', delta: 20, quick: ['Not yet', 'Yes, a small amount'],
        signal: { code: 'too_good', label: 'Promises of guaranteed or high returns' },
      },
      {
        test: /not yet|haven'?t withdrawn|fee to withdraw|tax to withdraw|unlock|release/i,
        reply: "A fee to get your own money out is a major red flag. I'd pause here, and I'd talk to someone you trust first.",
        mood: 'concerned', delta: 18,
        signal: { code: 'withdraw_fee', label: 'Cannot withdraw without paying more' },
      },
      {
        test: /friend|online|telegram|whatsapp|instagram|coach|mentor|advisor|broker|ad\b|facebook|dm\b/i,
        reply: "Thanks for telling me. Have you met this person in real life?",
        mood: 'listening', delta: 8, quick: ['No', 'Yes'],
        signal: { code: 'online_advisor', label: 'Advisor found online and never met' },
      },
      {
        test: /trust|safe|legit|licensed|regulated|registered|sure/i,
        reply: "I hear you. A quick check can help: is the firm listed with a regulator such as the SEC? Want to look together?",
        mood: 'thinking', delta: 3,
      },
    ],
    followups: [{ reply: 'Would you try waiting a day, or a very small test first?', mood: 'thinking' }],
    closing: {
      high: "I can't stop you, and I won't judge. But several signs match investment scams. A protected payment gives you a way back if something is wrong.",
      low: "That sounds reasonable. It's your call.",
    },
  },

  // The sender is not the target. They are trying to protect someone else.
  worried: {
    baseScore: 52,
    signals: [
      { code: 'known_recipient', label: 'You have paid Ray 6 times before' },
      { code: 'prize_fee', label: "Note mentions a 'prize fee'" },
    ],
    opening: "Hi, I'm Jeff, an AI assistant. This payment mentions a prize fee. Are you worried about Ray?",
    openingMood: 'listening',
    openingQuick: ["Yes, I think he's being scammed", 'He asked me to pay it'],
    recommendHigh: 'cancel',
    rules: [
      {
        test: /scam|scammed|worried|suspect|tricked|won something|prize|lottery|sweepstakes/i,
        reply: "You're right to worry. A fee to claim a prize is a classic scam. Please don't send it. How is Ray doing, does he seem pressured?",
        mood: 'concerned', delta: 14, quick: ['He is very excited', "He's stressed"],
        signal: { code: 'advance_fee', label: 'Fee required to claim a prize' },
      },
      {
        test: /excited|obsess|only talks|defend|angry|won'?t listen|insists|believes|trusts them/i,
        reply: "That's common. People in a scam often defend it, and arguing can push them closer. Try asking, 'who contacted you?' instead of saying it's a scam.",
        mood: 'listening', delta: 4, quick: ['What else can I do?'],
      },
      {
        test: /stressed|scared|threat|afraid|arrest|owe|debt|ashamed/i,
        reply: "Thank you for caring. He may be ashamed or afraid, so staying kind matters. Could you sit down with him in person, or call?",
        mood: 'concerned', delta: 6, quick: ['What else can I do?'],
      },
      {
        test: /asked me|he asked|wants me to pay|sent me|for him/i,
        reply: "Thanks. I'd hold off. If you pay, the scammer will likely ask for more. Could you talk to Ray first?",
        mood: 'concerned', delta: 12,
      },
      {
        test: /what else|what can i do|help|how do i|next|report/i,
        reply: "Three steps: pause any payments, ask him to stop replying to them, and call his bank together. You can report it at reportfraud.ftc.gov. Want to cancel this payment?",
        mood: 'calm', delta: 4,
      },
    ],
    followups: [{ reply: 'Has Ray sent money to them already?', mood: 'listening', quick: ['Yes', 'Not sure'] }],
    closing: {
      high: 'Cancelling is the kind choice here. Talking to Ray calmly, in person if you can, is the best next step.',
      low: "Okay. It's your call.",
    },
  },
};

interface Session {
  scenario: ScenarioId;
  payment: Payment;
  score: number;
  signals: RiskSignal[];
  usedRules: Set<number>;
  followupIdx: number;
  turns: number;
}

// Gentle probes for answers the script does not recognise. Jeff acknowledges, then asks something open.
const FALLBACKS: { reply: string; mood: Mood }[] = [
  { reply: 'Thanks for sharing that. Could you tell me a bit more about how this started?', mood: 'listening' },
  { reply: "I appreciate you being open with me. Is there anything about this that feels rushed or uncomfortable?", mood: 'listening' },
  { reply: 'That helps. If a friend were in your place, what would you tell them to do?', mood: 'thinking' },
];

const MAX_TURNS = 4; // Jeff wraps up after this many user replies, to keep demos short
const sessions = new Map<string, Session>();
let counter = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const thinkTime = () => 600 + Math.random() * 500;

function levelOf(score: number): Risk['level'] {
  return score < 35 ? 'low' : score < 65 ? 'elevated' : 'high';
}

function riskOf(s: Session): Risk {
  const score = Math.max(0, Math.min(100, s.score));
  return { score, level: levelOf(score), signals: s.signals };
}

function recommend(level: Risk['level'], high: Choice = 'protected'): Choice {
  return level === 'low' ? 'continue' : high;
}

function inferScenario(p: Payment): ScenarioId {
  const t = `${p.recipient_name} ${p.note}`;
  if (/prize/i.test(t)) return 'worried';
  if (/invest|trading|crypto/i.test(t)) return 'influenced';
  if (!p.recipient_is_new) return 'legit';
  if (/emergency|bail|hospital/i.test(t)) return 'coached';
  if (/donat|charit|relief|fund|foundation/i.test(p.recipient_name + ' ' + p.note)) return 'charity';
  return 'romance';
}

function turn(s: Session, message: string, mood: Mood, quick?: string[], done = false): AgentTurn {
  const risk = riskOf(s);
  const suggest = done || risk.level === 'high' || (risk.level === 'low' && mood === 'relieved');
  return { message, mood, risk, quick_replies: quick, recommended: suggest ? recommend(risk.level, SCENARIOS[s.scenario].recommendHigh) : null, done };
}

// Decides how much attention a payment needs, before any chat. Amount, newness of the recipient and
// scam-like wording all count. The real backend replaces this with its own risk engine.
const SCAMMY = /prize|invest|trading|crypto|emergency|bail|hospital|gift ?card|urgent|donat|wire/i;
export function precheckLocal(p: Payment): Precheck {
  const scammy = SCAMMY.test(`${p.recipient_name} ${p.note}`);
  const a = p.amount;
  if (scammy && a >= 100) return { action: 'hold', reason: 'Scam-like wording on a notable amount' };
  if (p.recipient_is_new && a >= 1000) return { action: 'hold', reason: 'Large first payment to a new recipient' };
  if (!p.recipient_is_new && a >= 3000) return { action: 'hold', reason: 'Much larger than usual' };
  if (!p.recipient_is_new && a < 250) return { action: 'allow', reason: 'Small payment to a known recipient' };
  if (p.recipient_is_new && a < 100) return { action: 'allow', reason: 'Small amount' };
  return { action: 'check', reason: 'Moderate amount' };
}

export const mockApi = {
  async precheck(payment: Payment): Promise<Precheck> {
    await sleep(250);
    return precheckLocal(payment);
  },

  async startSession(payment: Payment): Promise<StartResponse> {
    await sleep(thinkTime());
    const scenario = inferScenario(payment);
    const sc = SCENARIOS[scenario];
    const id = `mock-${++counter}`;
    const s: Session = {
      scenario, payment, score: sc.baseScore, signals: [...sc.signals],
      usedRules: new Set(), followupIdx: 0, turns: 0,
    };
    if (payment.payment_type === 'friends_family' && payment.recipient_is_new) {
      s.score += 10;
      s.signals.push({ code: 'friends_family', label: 'Sent as Friends & Family (no purchase protection)' });
    }
    sessions.set(id, s);
    return { session_id: id, ...turn(s, sc.opening, sc.openingMood, sc.openingQuick) };
  },

  async sendMessage(sessionId: string, text: string): Promise<AgentTurn> {
    await sleep(thinkTime());
    const s = sessions.get(sessionId);
    if (!s) throw new Error('This session has expired. Please start again.');
    const sc = SCENARIOS[s.scenario];
    s.turns += 1;

    const idx = sc.rules.findIndex((r, i) => !s.usedRules.has(i) && r.test.test(text) && (!r.when || r.when(s.payment)));
    if (idx >= 0 && s.turns < MAX_TURNS) {
      const r = sc.rules[idx];
      s.usedRules.add(idx);
      s.score += r.delta;
      if (r.signal && !s.signals.some((x) => x.code === r.signal!.code)) s.signals.push(r.signal);
      return turn(s, r.reply, r.mood, r.quick);
    }
    if (s.turns < MAX_TURNS) {
      const f: { reply: string; mood: Mood; quick?: string[] } = s.followupIdx < sc.followups.length
        ? sc.followups[s.followupIdx]
        : FALLBACKS[(s.followupIdx - sc.followups.length) % FALLBACKS.length];
      s.followupIdx += 1;
      return turn(s, f.reply, f.mood, f.quick);
    }
    const high = levelOf(s.score) !== 'low';
    return turn(s, high ? sc.closing.high : sc.closing.low, high ? 'concerned' : 'relieved', undefined, true);
  },

  async decide(sessionId: string, choice: Choice): Promise<DecisionResult> {
    await sleep(500);
    if (!sessions.has(sessionId)) throw new Error('This session has expired. Please start again.');
    if (choice === 'cancel')
      return { status: 'cancelled', message: 'Nothing was sent.' };
    if (choice === 'protected')
      return {
        status: 'protected',
        message: 'The money is released when you confirm.',
        order_id: 'ORD-1042',
      };
    return { status: 'sent', message: 'No real money moved. ' };
  },
};
