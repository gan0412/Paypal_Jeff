import { useEffect, useRef, useState } from 'react';
import type { AgentTurn, Choice, ChatMessage, Mood, Payment } from '../types';
import { Avatar } from './Avatar';
import { RiskMeter } from './RiskMeter';

interface Props {
  payment: Payment;
  messages: ChatMessage[];
  turn: AgentTurn;
  busy: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onDecide: (c: Choice) => void;
}

const money = (n: number, c: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n);

const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function ChatPanel({ payment, messages, turn, busy, error, onSend, onDecide }: Props) {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSpoken = useRef(0);
  const timer = useRef<number>(0);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, busy]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  // When Jeff says something, his lips move. With voice on, the browser reads it aloud and the
  // lips follow the speech; otherwise the movement is timed to the message length.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.from !== 'jeff' || last.id === lastSpoken.current) return;
    lastSpoken.current = last.id;
    window.clearTimeout(timer.current);
    if (voice && hasSpeech) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(last.text);
      u.rate = 0.98;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    } else {
      setSpeaking(true);
      timer.current = window.setTimeout(() => setSpeaking(false), Math.min(7000, 600 + last.text.length * 45));
    }
  }, [messages, voice]);

  useEffect(() => () => {
    window.clearTimeout(timer.current);
    if (hasSpeech) window.speechSynthesis.cancel();
  }, []);

  const submit = (t: string) => {
    const v = t.trim();
    if (!v || busy) return;
    setText('');
    if (hasSpeech) window.speechSynthesis.cancel();
    setSpeaking(false);
    onSend(v);
  };

  // Jeff looks like he's thinking while waiting, and attentive while the user types.
  const faceMood: Mood = busy ? 'thinking' : text.trim() && !speaking ? 'listening' : turn.mood;

  const rec = turn.recommended;
  const btn = (c: Choice, label: string) => (
    <button type="button" className={`ghost ${c} ${rec === c ? 'rec' : ''}`} onClick={() => onDecide(c)} disabled={busy}>
      {label}
      {rec === c && <span className="tag">Suggested</span>}
    </button>
  );

  return (
    <div className="chat">
      <div className="banner">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6Z" fill="currentColor" /></svg>
        <span>We're holding this payment for a quick check. Nothing has been sent.</span>
      </div>

      <header className="chat-head">
        <Avatar mood={faceMood} speaking={speaking} busy={busy} size={116} />
        <div className="who-wrap">
          <h2>Jeff <span className="ai-badge">AI assistant</span></h2>
          <p>A second look before {money(payment.amount, payment.currency)} goes to {payment.recipient_name}.</p>
          {hasSpeech && (
            <button type="button" className="voice" aria-pressed={voice}
              onClick={() => { setVoice((v) => !v); if (hasSpeech) window.speechSynthesis.cancel(); setSpeaking(false); }}>
              {voice ? 'Voice on' : 'Voice off'}
            </button>
          )}
        </div>
      </header>

      <RiskMeter risk={turn.risk} />

      <div className="log" ref={logRef} role="log" aria-live="polite" aria-label="Conversation with Jeff">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.from}`}>
            <span className="who">{m.from === 'jeff' ? 'Jeff (AI)' : 'You'}</span>
            <p>{m.text}</p>
          </div>
        ))}
        {busy && (
          <div className="msg jeff typing" aria-label="Jeff is typing">
            <span className="who">Jeff (AI)</span>
            <p><i /><i /><i /></p>
          </div>
        )}
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {!turn.done && turn.quick_replies && turn.quick_replies.length > 0 && !busy && (
        <div className="quick" aria-label="Suggested replies">
          {turn.quick_replies.map((q) => (
            <button key={q} type="button" onClick={() => submit(q)}>{q}</button>
          ))}
        </div>
      )}

      <form className="composer" onSubmit={(e) => { e.preventDefault(); submit(text); }}>
        <label htmlFor="reply" className="sr">Your reply to Jeff</label>
        <input
          id="reply" ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Type your answer…" autoComplete="off" disabled={busy} maxLength={500}
        />
        <button type="submit" className="primary" disabled={busy || !text.trim()}>Send</button>
      </form>

      <footer className="decide">
        <p className="decide-note">You decide. Jeff can advise, but can't block or approve anything.</p>
        <div className="decide-row">
          {btn('protected', 'Use protected payment')}
          {btn('continue', 'Send anyway')}
          {btn('cancel', 'Cancel payment')}
        </div>
      </footer>
    </div>
  );
}
