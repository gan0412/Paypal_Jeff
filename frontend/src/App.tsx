import { useRef, useState } from 'react';
import { api, usingMock } from './api';
import { ChatWidget } from './components/ChatWidget';
import { Hero } from './components/Hero';
import { ResultCard } from './components/ResultCard';
import { ReviewStep } from './components/ReviewStep';
import { SendStep } from './components/SendStep';
import { PRESETS } from './scenarios';
import type { AgentTurn, ChatMessage, Choice, DecisionResult, Payment } from './types';

type Step = 'send' | 'review' | 'result';

export default function App() {
  const [payment, setPayment] = useState<Payment>({ ...PRESETS[0].payment });
  const [step, setStep] = useState<Step>('send');
  const [chatOpen, setChatOpen] = useState(false);
  const [held, setHeld] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turn, setTurn] = useState<AgentTurn | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [strong, setStrong] = useState(false);   // high-risk hold: dim the page and flash the shield
  const [checking, setChecking] = useState(false);
  const [burst, setBurst] = useState(false);   // brief shield flash when a payment is put on hold
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);
  const sessionKey = useRef('');   // which payment the current chat session is about
  const starting = useRef(false);

  const add = (from: ChatMessage['from'], text: string) =>
    setMessages((m) => [...m, { id: nextId.current++, from, text }]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : 'Something went wrong.');

  async function startSession(p: Payment = payment) {
    if (starting.current) return;
    starting.current = true;
    setBusy(true); setError(null);
    sessionKey.current = JSON.stringify(p);
    setMessages([]); setTurn(null); setSessionId(null);
    try {
      const r = await api.startSession(p);
      setSessionId(r.session_id);
      setMessages([{ id: nextId.current++, from: 'jeff', text: r.message }]);
      setTurn(r);
    } catch (e) {
      sessionKey.current = '';
      fail(e);
    } finally {
      starting.current = false;
      setBusy(false);
    }
  }

  // Opening the chat starts a fresh session if there is none yet, or if the payment changed since.
  function openChat() {
    setChatOpen(true);
    if (sessionKey.current !== JSON.stringify(payment)) void startSession();
  }

  // First ask how risky the payment is. Small, ordinary payments go straight through without Jeff.
  async function sendPayment() {
    if (checking) return;
    setChecking(true); setError(null);
    try {
      const pre = await api.precheck(payment);
      if (pre.action === 'allow') {
        setResult({ status: 'sent', message: `${new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency }).format(payment.amount)} sent to ${payment.recipient_name}.` });
        setStep('result');
        return;
      }
      setHeld(true);
      const hard = pre.action === 'hold';
      setStrong(hard);
      if (hard) { setBurst(true); window.setTimeout(() => setBurst(false), 1500); }
      openChat();
    } catch (e) { fail(e); } finally { setChecking(false); }
  }

  async function send(text: string) {
    if (!sessionId) return;
    add('user', text);
    setBusy(true); setError(null);
    try {
      const r = await api.sendMessage(sessionId, text);
      add('jeff', r.message);
      setTurn(r);
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  async function decide(choice: Choice) {
    if (!sessionId) return;
    setBusy(true); setError(null);
    try {
      setResult(await api.decide(sessionId, choice));
      setChatOpen(false); setHeld(false); setStrong(false); setStep('result');
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  const reset = () => {
    setStep('send'); setChatOpen(false); setHeld(false); setStrong(false); setSessionId(null); setMessages([]);
    setTurn(null); setResult(null); setError(null); setBusy(false); sessionKey.current = '';
  };

  return (
    <>
      <div className="bg" aria-hidden="true"><i /><i /><i /></div>
      <nav className="nav" aria-label="Main">
        <div className="nav-in">
          <div className="brand"><span className="mark" aria-hidden="true"><i /><i /></span><span>Jeff Pal</span></div>
          <div className="nav-right">
            <span className="me" aria-label="Signed in as Maya R.">MR</span>
          </div>
        </div>
      </nav>

      <main className={`app ${step === 'result' ? 'solo' : ''}`}>
        {step !== 'result' && <Hero held={held} />}
        <div className="stage">
          {step === 'send' && <SendStep payment={payment} onChange={setPayment} onNext={() => setStep('review')} />}
          {step === 'review' && (
            <ReviewStep payment={payment} held={held} chatOpen={chatOpen}
              onBack={() => { if (!held) setStep('send'); }} onSend={sendPayment} onOpenChat={openChat} />
          )}
          {step === 'result' && result && <ResultCard result={result} onAgain={reset} />}
        </div>
        <p className="foot">Built for the PayPal AI Hackathon. Prototype, not an official PayPal product.</p>
      </main>

      {held && strong && chatOpen && <div className="scrim" aria-hidden="true" />}
      {burst && (
        <div className="burst" aria-hidden="true">
          <svg viewBox="0 0 120 140"><path d="M60 6 12 24v42c0 33 21 58 48 68 27-10 48-35 48-68V24L60 6Z" /></svg>
        </div>
      )}

      {step !== 'result' && (
        <ChatWidget open={chatOpen} held={held} delay={burst} payment={payment} messages={messages} turn={turn} busy={busy} error={error}
          onOpen={openChat} onClose={() => setChatOpen(false)} onSend={send} onDecide={decide} onRetry={() => void startSession()} />
      )}
    </>
  );
}
