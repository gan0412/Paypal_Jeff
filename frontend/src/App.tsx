import { useRef, useState } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { api } from './api';
import { ChatWidget } from './components/ChatWidget';
import { ResultCard } from './components/ResultCard';
import { ReviewStep } from './components/ReviewStep';
import { SendStep } from './components/SendStep';
import { evaluatePaymentInstant } from './riskEvaluator';
import { PRESETS } from './scenarios';
import { LANGS } from './i18n';
import type { LangCode } from './i18n';
import { usePrefs } from './prefs';
import type { AgentTurn, ChatMessage, Choice, DecisionResult, Payment } from './types';

type Step = 'send' | 'review' | 'result';

const PAYPAL_CLIENT_ID = (import.meta.env.VITE_PAYPAL_CLIENT_ID as string) || 'test';

const paypalOptions = {
  clientId: PAYPAL_CLIENT_ID,
  currency: 'USD',
  intent: 'capture',
  components: 'buttons',
};

export default function App() {
  const { t, lang, setLang } = usePrefs();
  const [payment, setPayment] = useState<Payment>({ ...PRESETS[0].payment });
  const [step, setStep] = useState<Step>('send');
  const [chatOpen, setChatOpen] = useState(false);
  const [held, setHeld] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turn, setTurn] = useState<AgentTurn | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);
  const sessionKey = useRef('');   // which payment the current chat session is about
  const sessionLang = useRef(lang); // which language it started in
  const starting = useRef(false);

  const add = (from: ChatMessage['from'], text: string) =>
    setMessages((m) => [...m, { id: nextId.current++, from, text }]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : 'Something went wrong.');

  async function startSession(p: Payment = payment): Promise<AgentTurn | null> {
    if (starting.current) return null;
    starting.current = true;
    setBusy(true); setError(null);
    sessionKey.current = JSON.stringify(p);
    sessionLang.current = lang;
    setMessages([]); setTurn(null); setSessionId(null);
    try {
      const r = await api.startSession(p, lang);
      setSessionId(r.session_id);
      setMessages([{ id: nextId.current++, from: 'jeff', text: r.message }]);
      setTurn(r);
      return r;
    } catch (e) {
      sessionKey.current = '';
      fail(e);
      return null;
    } finally {
      starting.current = false;
      setBusy(false);
    }
  }

  // A session is about one payment in one language. Switching language only restarts the session
  // while the user hasn't replied yet; after that, Jeff simply answers in the new language.
  const userReplied = messages.some((m) => m.from === 'user');
  const needsNewSession = (p: Payment) =>
    sessionKey.current !== JSON.stringify(p) || (sessionLang.current !== lang && !userReplied);

  // Opening the chat starts a fresh session if there is none yet, or if the payment changed since.
  function openChat() {
    setChatOpen(true);
    if (needsNewSession(payment)) void startSession();
  }

  function handleNext() {
    setStep('review');
    // Evaluate payment in the background without automatically opening the chatbox
    if (needsNewSession(payment)) {
      void startSession(payment);
    }
  }

  function handlePaymentChange(p: Payment) {
    setPayment(p);
    if (needsNewSession(p)) {
      setTurn(null);
      setSessionId(null);
      setHeld(false);
    }
  }

  async function sendPayment() {
    // Non-blocking: respect user agency and process payment
    if (sessionId) {
      await decide('continue');
    } else {
      setResult({ status: 'sent', message: 'Payment completed successfully.' });
      setStep('result');
    }
  }

  async function handlePayPalSuccess(orderId: string) {
    if (sessionId) {
      await decide('continue', orderId);
    } else {
      setResult({
        status: 'sent',
        message: 'Payment authorized successfully via PayPal Sandbox.',
        order_id: orderId,
      });
      setStep('result');
    }
  }

  async function send(text: string) {
    if (!sessionId) return;
    add('user', text);
    setBusy(true); setError(null);
    try {
      const r = await api.sendMessage(sessionId, text, lang);
      add('jeff', r.message);
      setTurn(r);
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  async function decide(choice: Choice, order_id?: string) {
    if (!sessionId) return;
    setBusy(true); setError(null);
    try {
      setResult(await api.decide(sessionId, choice, order_id));
      setChatOpen(false); setHeld(false); setStep('result');
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  const reset = () => {
    setStep('send'); setChatOpen(false); setHeld(false); setSessionId(null); setMessages([]);
    setTurn(null); setResult(null); setError(null); setBusy(false); sessionKey.current = '';
  };

  const isReviewStep = step === 'review';
  const instantRisk = evaluatePaymentInstant(payment);
  const isRiskConcerned =
    payment.amount >= 100 &&
    (turn ? turn.mood === 'concerned' || turn.risk.level === 'high' : instantRisk.isConcerned);

  // Jeff only warns the user after clicking Next (on the Review step).
  // On the Send step (where user can still edit his transaction), Jeff stays normal.
  const isConcerned = isReviewStep && (isRiskConcerned || held);

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <nav className="nav" aria-label="Main">
        <div className="nav-in">
          <div className="brand">
            <svg viewBox="0 0 34 38" width="24" height="27" fill="none" aria-hidden="true">
              <path d="M25 6.5C23.8 2.5 20.1 0 14.7 0H4.1C3.1 0 2.3.7 2.1 1.7L0 27.2c-.1.7.4 1.3 1.1 1.3h6.6l1.6-10.3-.1.4c.2-.9 1-1.6 2-1.6h2.7c6.2 0 11.1-2.5 12.5-9.8.7-3.4.1-5.7-2.2-7.2v-.5z" fill="#ffffff" />
              <path d="M26.5 10.9c-.7 3.6-2.9 6.1-7.1 6.1h-3.6c-.6 0-1.1.4-1.2 1l-1.9 12-.6 3.6c-.1.5.3 1 .8 1h5.8c.8 0 1.5-.6 1.6-1.4l.1-.4 1.3-8.1.1-.5c.2-.8.8-1.4 1.6-1.4h1c4.9 0 8.8-2 9.9-7.8.5-2.6.2-4.7-1.4-6.1-.8-.8-1.9-1.4-3.4-1.7-.8 1.4-1.9 2.5-3.5 3.7z" fill="#00cfde" />
              <path d="M25 6.5c-1.4 7.3-6.3 9.8-12.5 9.8H9.8c-1 0-1.8.7-2 1.6l.1-.4-1.6 10.3h6.6l1.9-12c.1-.6.6-1 1.2-1h3.6c4.2 0 6.4-2.5 7.1-6.1 1.6-1.2 2.7-2.3 3.5-3.7-2.1-1.5-4-1.5-5.2 1.5z" fill="#0079C1" opacity=".7" />
            </svg>
            <span className="brand-text">PayPal</span>
          </div>
          <div className="nav-links">
            <span className="nav-link active">Send &amp; Request</span>
            <span className="nav-link">Wallet</span>
            <span className="nav-link">Activity</span>
          </div>
          <div className="nav-right">
            <label className="lang-pick">
              <span aria-hidden="true">🌐</span>
              <span className="sr">{t('language')}</span>
              <select value={lang} onChange={(e) => setLang(e.target.value as LangCode)} aria-label={t('language')}>
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </label>
            <span className="me" aria-label="Signed in as Maya R. (sample)">MR</span>
          </div>
        </div>
      </nav>

      <main className="app">
        <div className="stage">
          {step === 'send' && <SendStep payment={payment} onChange={handlePaymentChange} onNext={handleNext} />}

          {step === 'review' && (
            <ReviewStep
              payment={payment}
              isConcerned={isConcerned}
              chatOpen={chatOpen}
              onBack={() => setStep('send')}
              onSend={sendPayment}
              onOpenChat={openChat}
              onPayPalSuccess={handlePayPalSuccess}
            />
          )}

          {step === 'result' && result && <ResultCard result={result} onAgain={reset} />}
        </div>
        <p className="foot">Built for the PayPal AI Hackathon. Prototype, not an official PayPal product.</p>
      </main>

      {step !== 'result' && (
        <ChatWidget open={chatOpen} held={held} isConcerned={isConcerned} payment={payment} messages={messages} turn={turn} busy={busy} error={error}
          onOpen={openChat} onClose={() => setChatOpen(false)} onSend={send} onDecide={decide} onRetry={() => void startSession()} />
      )}
    </PayPalScriptProvider>
  );
}
