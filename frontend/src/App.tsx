import { useRef, useState } from 'react';
import { api, usingMock } from './api';
import { ChatPanel } from './components/ChatPanel';
import { SendMoney } from './components/SendMoney';
import { PRESETS } from './scenarios';
import type { AgentTurn, ChatMessage, Choice, DecisionResult, Payment } from './types';

type Phase = 'form' | 'chat' | 'result';

export default function App() {
  const [payment, setPayment] = useState<Payment>({ ...PRESETS[0].payment });
  const [phase, setPhase] = useState<Phase>('form');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turn, setTurn] = useState<AgentTurn | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);

  const add = (from: ChatMessage['from'], text: string) =>
    setMessages((m) => [...m, { id: nextId.current++, from, text }]);

  const reset = () => {
    setPhase('form'); setSessionId(null); setMessages([]); setTurn(null);
    setResult(null); setError(null); setBusy(false);
  };

  async function start() {
    setBusy(true); setError(null);
    try {
      const r = await api.startSession(payment);
      setSessionId(r.session_id);
      setMessages([{ id: nextId.current++, from: 'jeff', text: r.message }]);
      setTurn(r);
      setPhase('chat');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function decide(choice: Choice) {
    if (!sessionId) return;
    setBusy(true); setError(null);
    try {
      setResult(await api.decide(sessionId, choice));
      setPhase('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <nav className="nav" aria-label="Main">
        <div className="nav-in">
          <div className="brand"><span className="mark" aria-hidden="true"><i /><i /></span><span>Jeff</span></div>
          <ul className="nav-links">
            <li>Summary</li><li>Activity</li><li className="on" aria-current="page">Send &amp; Request</li><li>Wallet</li><li>Help</li>
          </ul>
          <div className="nav-right">
            <span className="demo-badge">{usingMock ? 'Demo · sample data' : 'Connected to backend'}</span>
            <span className="me" aria-label="Signed in as Maya R. (sample)">MR</span>
          </div>
        </div>
      </nav>
    <div className="app">
      <main className={phase === 'chat' ? 'split' : ''}>
        {phase === 'form' && (
          <SendMoney payment={payment} onChange={setPayment} onSubmit={start} busy={busy} error={error} />
        )}

        {phase === 'chat' && turn && (
          <>
            <aside className="summary card" aria-label="Payment on hold">
              <h2>Payment on hold</h2>
              <p className="amount">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency }).format(payment.amount)}
              </p>
              <dl>
                <dt>To</dt><dd>{payment.recipient_name}</dd>
                <dt>Email</dt><dd>{payment.recipient_email}</dd>
                <dt>Note</dt><dd>{payment.note || '(none)'}</dd>
                <dt>History</dt><dd>{payment.recipient_is_new ? 'First payment to them' : 'Paid before'}</dd>
              </dl>
              <p className="mute">Nothing has been sent. Money only moves when you choose below.</p>
            </aside>
            <ChatPanel payment={payment} messages={messages} turn={turn} busy={busy} error={error}
              onSend={send} onDecide={decide} />
          </>
        )}

        {phase === 'result' && result && (
          <div className={`card result ${result.status}`} role="status">
            <h2>{result.status === 'sent' ? 'Payment sent' : result.status === 'protected' ? 'Protected payment set up' : 'Payment cancelled'}</h2>
            <p>{result.message}</p>
            {result.order_id && <p className="mute">Reference: {result.order_id}</p>}
            {result.approve_url && <p><a href={result.approve_url} target="_blank" rel="noopener noreferrer">Open protected checkout</a></p>}
            <button type="button" className="primary" onClick={reset}>Try another scenario</button>
          </div>
        )}
      </main>

      <footer className="foot">
        Hackathon prototype with a PayPal-inspired look. Not an official PayPal product. Sample people and amounts; no real payments.
        Jeff is an AI and advises only; you always decide.
      </footer>
    </div>
    </>
  );
}
