// A scripted stand-in for the real backend. Same shapes as docs/API_CONTRACT.md.
// It exists so the UI can be built and demoed without a server. Delete nothing here when the
// backend arrives: set VITE_USE_MOCK=false and the real API is used instead.
import type { AgentTurn, Choice, DecisionResult, Mood, Payment, Risk, RiskSignal, StartResponse } from './types';

type ScenarioId = 'romance' | 'charity' | 'legit';

interface Rule {
  test: RegExp;
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

function recommend(level: Risk['level']): Choice {
  return level === 'low' ? 'continue' : 'protected';
}

function inferScenario(p: Payment): ScenarioId {
  if (!p.recipient_is_new) return 'legit';
  if (/donat|charit|relief|fund|foundation/i.test(p.recipient_name + ' ' + p.note)) return 'charity';
  return 'romance';
}

function turn(s: Session, message: string, mood: Mood, quick?: string[], done = false): AgentTurn {
  const risk = riskOf(s);
  const suggest = done || risk.level === 'high' || (risk.level === 'low' && mood === 'relieved');
  return { message, mood, risk, quick_replies: quick, recommended: suggest ? recommend(risk.level) : null, done };
}

export const mockApi = {
  async startSession(payment: Payment, _language?: string): Promise<StartResponse> {
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

  async sendMessage(sessionId: string, text: string, _language?: string): Promise<AgentTurn> {
    await sleep(thinkTime());
    const s = sessions.get(sessionId);
    if (!s) throw new Error('This session has expired. Please start again.');
    const sc = SCENARIOS[s.scenario];
    s.turns += 1;

    const idx = sc.rules.findIndex((r, i) => !s.usedRules.has(i) && r.test.test(text));
    if (idx >= 0 && s.turns < MAX_TURNS) {
      const r = sc.rules[idx];
      s.usedRules.add(idx);
      s.score += r.delta;
      if (r.signal && !s.signals.some((x) => x.code === r.signal!.code)) s.signals.push(r.signal);
      return turn(s, r.reply, r.mood, r.quick);
    }
    if (s.followupIdx < sc.followups.length && s.turns < MAX_TURNS) {
      const f = sc.followups[s.followupIdx++];
      return turn(s, f.reply, f.mood, f.quick);
    }
    const high = levelOf(s.score) !== 'low';
    return turn(s, high ? sc.closing.high : sc.closing.low, high ? 'concerned' : 'relieved', undefined, true);
  },

  async decide(sessionId: string, choice: Choice, order_id?: string): Promise<DecisionResult> {
    await sleep(500);
    if (!sessions.has(sessionId)) throw new Error('This session has expired. Please start again.');
    if (choice === 'cancel')
      return { status: 'cancelled', message: 'Nothing was sent.' };
    if (choice === 'protected')
      return {
        status: 'protected',
        message: 'The money is released when you confirm delivery.',
        order_id: order_id || 'DEMO-ORDER-1042',
      };
    return {
      status: 'sent',
      message: order_id ? 'Payment authorized successfully via PayPal.' : 'Payment completed successfully.',
      order_id,
    };
  },
};
