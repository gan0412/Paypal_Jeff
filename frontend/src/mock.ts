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
    baseScore: 55,
    signals: [
      { code: 'new_recipient', label: 'First payment to this person' },
      { code: 'large_amount', label: 'Much larger than your usual payments', detail: '$2,400 vs a typical $60' },
      { code: 'emotional_note', label: 'Note mentions travel and a relationship' },
    ],
    opening:
      "Hi, I'm Jeff, an AI assistant that takes a second look at bigger payments. This one is larger than you usually send, and it's to someone new. I'm not here to stop you. Can I ask who Daniel is?",
    openingMood: 'listening',
    openingQuick: ['We met online', "He's my partner", "It's for a flight"],
    rules: [
      {
        test: /never met|haven'?t met|not met|only online|met online|dating|app/i,
        reply:
          "Thanks for telling me. That's very common, and plenty of online relationships are real. Have the two of you been able to talk on a live video call?",
        mood: 'listening',
        delta: 8,
        quick: ["Yes, many times", "No, his camera is always broken", "We only text"],
        signal: { code: 'met_online', label: 'Relationship started online' },
      },
      {
        test: /camera|can'?t video|no video|only text|deployed|military|oil rig|offshore|abroad|overseas/i,
        reply:
          "I want to be gentle here. When someone asks for money for travel and can never video call, it's a pattern that's often seen in romance scams. I'm not saying that's what's happening with Daniel. Has he asked you to keep this payment private, or sent it with any pressure to hurry?",
        mood: 'concerned',
        delta: 17,
        quick: ["Yes, he said it's urgent", "No pressure at all"],
        signal: { code: 'no_video', label: 'Has not been seen on live video' },
      },
      {
        test: /don'?t tell|secret|keep it|private|urgent|hurry|asap|today|right now/i,
        reply:
          "Thank you for being open about that. Urgency and secrecy are the two things scammers rely on, because they stop you from talking it over with someone you trust. A real partner usually doesn't mind you taking a day. Would you be open to a protected payment, or to talking it over with a friend first?",
        mood: 'concerned',
        delta: 15,
        quick: ["I'll think about it", "I trust him"],
        signal: { code: 'pressure', label: 'Pressure to act quickly or keep it quiet' },
      },
      {
        test: /gift card|crypto|bitcoin|wire|zelle|friends and family/i,
        reply:
          "That's a payment method that can't easily be reversed, which is why it's often requested in scams. A protected payment would keep your buyer protections.",
        mood: 'concerned',
        delta: 18,
        signal: { code: 'unsafe_method', label: 'Asked to pay in a hard-to-reverse way' },
      },
      {
        test: /trust|love|sure|know him|partner|boyfriend|girlfriend|fianc/i,
        reply:
          "I understand, and trust matters. I just want to be sure the decision is fully yours. Can you tell me how you first got in touch, and how long ago that was?",
        mood: 'listening',
        delta: 3,
      },
    ],
    followups: [
      {
        reply: "That helps me understand. Have you met him in person, even once?",
        mood: 'listening',
        quick: ['Never', 'Yes, in person'],
      },
      {
        reply: "Would it be possible to ask him for a quick live video call before you send this? A real person usually says yes.",
        mood: 'thinking',
      },
    ],
    closing: {
      high:
        "I can't tell you what to do, and you know your situation better than I do. But there are several warning signs here, so I'd suggest a protected payment, or waiting a day and talking it over with someone you trust. Whatever you choose is up to you.",
      low:
        "That all sounds reasonable. I don't see anything worrying, so it's your call.",
    },
  },

  charity: {
    baseScore: 48,
    signals: [
      { code: 'new_recipient', label: 'First payment to this organization' },
      { code: 'urgent_wording', label: "Note says 'urgent'" },
      { code: 'unverified_org', label: "Couldn't confirm the organization's registration" },
    ],
    opening:
      "Hi, I'm Jeff, an AI assistant that takes a second look at payments. This is a donation to an organization you haven't paid before. How did you hear about Hope4Children Relief?",
    openingMood: 'listening',
    openingQuick: ['A text message', 'A social media post', "A friend told me", 'I searched for it'],
    rules: [
      {
        test: /text|sms|dm|message|call|phone|email|facebook|instagram|tiktok|social|post|ad\b|link/i,
        reply:
          "Thanks. Donation requests that arrive out of the blue are one of the most common ways charity scams reach people. Real charities are usually happy to be checked. Do you know if they're registered?",
        mood: 'concerned',
        delta: 17,
        quick: ["I didn't check", "They say they're registered"],
        signal: { code: 'unsolicited', label: 'Donation request came out of the blue' },
      },
      {
        test: /friend|family|coworker|colleague|searched|google|website|known|always/i,
        reply:
          "That's a better sign. Did you find it through their own website, and have you donated to them before?",
        mood: 'listening',
        delta: -8,
        quick: ["First time", "I've given before"],
      },
      {
        test: /urgent|today|deadline|right now|hurry|emergency/i,
        reply:
          "Urgency is a tactic. Real causes will still be there tomorrow. In the U.S., the IRS Tax Exempt Organization Search can confirm a charity in about a minute. Would you like to check before sending?",
        mood: 'concerned',
        delta: 12,
        signal: { code: 'pressure', label: 'Pressure to give immediately' },
      },
      {
        test: /registered|verified|tax|501|checked|looked it up/i,
        reply: "Good, checking is exactly the right instinct. If it shows up as registered under that exact name, that's reassuring.",
        mood: 'relieved',
        delta: -12,
      },
    ],
    followups: [
      { reply: "Are you able to give through the charity's official website instead of a direct transfer?", mood: 'thinking' },
    ],
    closing: {
      high:
        "I can't confirm this organization, and the request had some pressure behind it. A protected payment, or giving through a charity you've verified, would be safer. It's your decision.",
      low:
        "That sounds fine. Checking first was a good move. It's your call.",
    },
  },

  legit: {
    baseScore: 12,
    signals: [{ code: 'known_recipient', label: 'You have paid Priya 11 times before' }],
    opening:
      "Hi, I'm Jeff, an AI assistant that takes a second look at payments. This looks like a regular one: $850 to Priya Shah, someone you've paid before. Is this your usual monthly rent?",
    openingMood: 'calm',
    openingQuick: ['Yes, rent', "It's something else"],
    rules: [
      {
        test: /yes|rent|usual|monthly|roommate|same/i,
        reply: "That matches your history, so I don't see anything to worry about. You're all set whenever you're ready.",
        mood: 'relieved',
        delta: -6,
      },
      {
        test: /else|different|new|loan|borrow|asked me/i,
        reply: "Thanks for letting me know. Can you tell me a bit more about what it's for?",
        mood: 'listening',
        delta: 18,
        quick: ['A deposit', "She asked for extra"],
      },
    ],
    followups: [{ reply: 'Thanks, that helps.', mood: 'calm' }],
    closing: {
      high: "I'd suggest a quick check with Priya through a number you already have before sending. It's your call.",
      low: "Everything looks consistent with your usual payments. You're all set.",
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
  const suggest = done || risk.level === 'high';
  return { message, mood, risk, quick_replies: quick, recommended: suggest ? recommend(risk.level) : null, done };
}

export const mockApi = {
  async startSession(payment: Payment): Promise<StartResponse> {
    await sleep(thinkTime());
    const scenario = inferScenario(payment);
    const sc = SCENARIOS[scenario];
    const id = `mock-${++counter}`;
    const s: Session = {
      scenario, payment, score: sc.baseScore, signals: [...sc.signals],
      usedRules: new Set(), followupIdx: 0, turns: 0,
    };
    sessions.set(id, s);
    return { session_id: id, ...turn(s, sc.opening, sc.openingMood, sc.openingQuick) };
  },

  async sendMessage(sessionId: string, text: string): Promise<AgentTurn> {
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

  async decide(sessionId: string, choice: Choice): Promise<DecisionResult> {
    await sleep(500);
    if (!sessions.has(sessionId)) throw new Error('This session has expired. Please start again.');
    if (choice === 'cancel')
      return { status: 'cancelled', message: "Payment cancelled. Nothing was sent. You can always come back to it." };
    if (choice === 'protected')
      return {
        status: 'protected',
        message: 'We set up a protected payment instead. The money is only released once you confirm you are happy. (Demo: no real order was created.)',
        order_id: 'DEMO-ORDER-1042',
      };
    return { status: 'sent', message: 'Payment sent. (Demo: no real money moved.)' };
  },
};
