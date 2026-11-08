import { useRef, useState } from 'react';
import { api, usingMock } from './api';
import { ChatWidget } from './components/ChatWidget';
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
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);
  const sessionKey = useRef('');   // which payment the current chat session is about
  const starting = useRef(false);

  const add = (from: ChatMessage['from'], text: string) =>
    setMessages((m) => [...m, { id: nextId.current++, from, text }]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : 'Something went wrong.');

  async function startSession(p: Payment = payment): Promise<AgentTurn | null> {
    if (starting.current) return null;
    starting.current = true;
    setBusy(true); setError(null);
    sessionKey.current = JSON.stringify(p);
    setMessages([]); setTurn(null); setSessionId(null);
    try {
      const r = await api.startSession(p);
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

  // Opening the chat starts a fresh session if there is none yet, or if the payment changed since.
  function openChat() {
    setChatOpen(true);
    if (sessionKey.current !== JSON.stringify(payment)) void startSession();
  }

  function handleNext() {
    setStep('review');
    // Evaluate payment in the background without automatically opening the chatbox
    if (sessionKey.current !== JSON.stringify(payment)) {
      void startSession(payment);
    }
  }

  function handlePaymentChange(p: Payment) {
    setPayment(p);
    if (sessionKey.current !== JSON.stringify(p)) {
      setTurn(null);
      setSessionId(null);
      setHeld(false);
    }
  }

  async function sendPayment() {
    let currentTurn = turn;
    if (sessionKey.current !== JSON.stringify(payment) || !currentTurn) {
      currentTurn = await startSession(payment);
    }

    const isRisk = currentTurn?.mood === 'concerned' || currentTurn?.risk?.level === 'high';

    if (isRisk) {
      // High-risk transaction: hold the payment, but DO NOT force-open the chat
      setHeld(true);
    } else {
      // Low-risk / verified transaction: proceed with sending
      if (sessionId) {
        await decide('continue');
      } else {
        setResult({ status: 'sent', message: 'No real money moved. (Demo)' });
        setStep('result');
      }
    }
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
      setChatOpen(false); setHeld(false); setStep('result');
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  const reset = () => {
    setStep('send'); setChatOpen(false); setHeld(false); setSessionId(null); setMessages([]);
    setTurn(null); setResult(null); setError(null); setBusy(false); sessionKey.current = '';
  };

  return (
    <>
      <nav className="nav" aria-label="Main">
        <div className="nav-in">
          <div className="brand"><span className="mark" aria-hidden="true"><i /><i /></span><span>SamplePay</span></div>
          <div className="nav-right">
            <span className="demo-badge">{usingMock ? 'Demo · sample data' : 'Connected to backend'}</span>
            <span className="me" aria-label="Signed in as Maya R. (sample)">MR</span>
          </div>
        </div>
      </nav>

      <main className="app">
        {step === 'send' && <SendStep payment={payment} onChange={handlePaymentChange} onNext={handleNext} />}

        {step === 'review' && (
          <ReviewStep payment={payment} held={held} chatOpen={chatOpen}
            onBack={() => { if (!held) setStep('send'); }} onSend={sendPayment} onOpenChat={openChat} />
        )}

        {step === 'result' && result && (
          <div className="flow">
            <div className={`screen result ${result.status}`} role="status">
              <h1 className="title">{result.status === 'sent' ? 'Payment sent' : result.status === 'protected' ? 'Protected payment set up' : 'Payment cancelled'}</h1>
              <p>{result.message}</p>
              {result.order_id && <p className="mute">Reference: {result.order_id}</p>}
              {result.approve_url && <p><a href={result.approve_url} target="_blank" rel="noopener noreferrer">Open protected checkout</a></p>}
              <button type="button" className="primary wide" onClick={reset}>Try another scenario</button>
            </div>
          </div>
        )}

        <p className="foot">Prototype with a PayPal-inspired look. Not an official PayPal product. Sample data only.</p>
      </main>

      {step !== 'result' && (
        <ChatWidget open={chatOpen} held={held} payment={payment} messages={messages} turn={turn} busy={busy} error={error}
          onOpen={openChat} onClose={() => setChatOpen(false)} onSend={send} onDecide={decide} onRetry={() => void startSession()} />
      )}
    </>
  );
}
