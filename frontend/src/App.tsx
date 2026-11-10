import { useRef, useState } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { api } from './api';
import { ChatWidget } from './components/ChatWidget';
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

  const instantRisk = evaluatePaymentInstant(payment);
  const isConcerned = (turn ? turn.mood === 'concerned' || turn.risk.level === 'high' : instantRisk.isConcerned) || held;

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <nav className="nav" aria-label="Main">
        <div className="nav-in">
          <div className="brand"><span className="mark" aria-hidden="true"><i /><i /></span><span>SamplePay</span></div>
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

        {step === 'result' && result && (
          <div className="flow">
            <div className={`screen result ${result.status}`} role="status">
              <h1 className="title">{t(`result_${result.status}`)}</h1>
              <p>{lang === 'en' ? result.message : t(`resultMsg_${result.status}`)}</p>
              {result.order_id && <p className="mute">{t('paypalRef')}: {result.order_id}</p>}
              {result.approve_url && <p><a href={result.approve_url} target="_blank" rel="noopener noreferrer">{t('openProtected')}</a></p>}
              <button type="button" className="primary wide" onClick={reset}>{t('tryAnother')}</button>
            </div>
          </div>
        )}
      </main>

      {step !== 'result' && (
        <ChatWidget open={chatOpen} held={held} payment={payment} messages={messages} turn={turn} busy={busy} error={error}
          onOpen={openChat} onClose={() => setChatOpen(false)} onSend={send} onDecide={decide} onRetry={() => void startSession()} />
      )}
    </PayPalScriptProvider>
  );
}
