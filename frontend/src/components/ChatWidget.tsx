import { useEffect, useRef, useState } from 'react';
import type { AgentTurn, ChatMessage, Choice, Mood, Payment } from '../types';
import { evaluatePaymentInstant } from '../riskEvaluator';
import { Avatar } from './Avatar';

interface Props {
  open: boolean;
  held: boolean;
  payment: Payment;
  messages: ChatMessage[];
  turn: AgentTurn | null;
  busy: boolean;
  error: string | null;
  onOpen: () => void;
  onClose: () => void;
  onSend: (text: string) => void;
  onDecide: (c: Choice) => void;
  onRetry: () => void;
}

const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function ChatWidget(p: Props) {
  const { open, held, messages, turn, busy, error } = p;
  const [text, setText] = useState('');
  const [voice, setVoice] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSpoken = useRef(0);
  const timer = useRef<number>(0);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, busy, open]);

  useEffect(() => { if (open && !busy) inputRef.current?.focus(); }, [open, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') p.onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, p.onClose]);

  // Lips move whenever Jeff says something: read aloud if voice is on, otherwise timed to the text.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!open || !last || last.from !== 'jeff' || last.id === lastSpoken.current) return;
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
  }, [messages, voice, open]);

  useEffect(() => {
    if (!open && hasSpeech) window.speechSynthesis.cancel();
  }, [open]);

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
    p.onSend(v);
  };

  const instantRisk = evaluatePaymentInstant(p.payment);

  const faceMood: Mood = busy || !turn ? 'thinking' : text.trim() && !speaking ? 'listening' : turn.mood;
  const isConcerned = (turn ? turn.mood === 'concerned' || turn.risk.level === 'high' : instantRisk.isConcerned) || faceMood === 'concerned' || held;
  const launcherMood: Mood = isConcerned || held ? 'concerned' : (busy ? 'thinking' : 'calm');
  const rec = turn?.recommended;
  const btn = (c: Choice, label: string) => (
    <button type="button" className={`ghost ${c} ${rec === c ? 'rec' : ''}`} onClick={() => p.onDecide(c)} disabled={busy || !turn}>
      {label}
    </button>
  );

  return (
    <>
      {!open && (
        <button type="button" className={`launcher ${isConcerned || held ? 'has-alert' : ''}`} onClick={p.onOpen} aria-label="Open chat with Jeff, an AI assistant">
          <span className="launcher-label">{held ? '⚠️ Continue with Jeff' : isConcerned ? '⚠️ Jeff has a warning' : 'Ask Jeff'}</span>
          <span className="launcher-face">
            <Avatar mood={launcherMood} size={64} />
            {isConcerned || held ? (
              <span className="glaring-alert-badge" style={{ width: 26, height: 26 }} title="High risk alert" role="status" aria-label="High risk alert">
                <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
                  <path d="M12 2.5L1.5 21h21L12 2.5z" fill="#ffffff" />
                  <line x1="12" y1="9" x2="12" y2="14" stroke="#ff1f1f" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="12" cy="17.5" r="1.3" fill="#ff1f1f" />
                </svg>
              </span>
            ) : null}
          </span>
        </button>
      )}

      {open && (
        <section className="widget" role="dialog" aria-label="Chat with Jeff, AI assistant">
          <header className="w-head">
            <div className="w-avatar-container">
              <Avatar mood={faceMood} speaking={speaking} busy={busy} size={72} />
              {isConcerned && (
                <span className="glaring-alert-badge" style={{ width: 28, height: 28 }} title="High risk warning" role="status" aria-label="High risk warning">
                  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
                    <path d="M12 2.5L1.5 21h21L12 2.5z" fill="#ffffff" />
                    <line x1="12" y1="9" x2="12" y2="14" stroke="#ff1f1f" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="12" cy="17.5" r="1.3" fill="#ff1f1f" />
                  </svg>
                </span>
              )}
            </div>
            <div className="w-title">
              <div className="w-name-row">
                <h2>Jeff</h2>
                {isConcerned && (
                  <span className="glaring-alert-tag" role="alert">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="#ffffff" aria-hidden="true">
                      <path d="M12 2.5L1.5 21h21L12 2.5z" />
                      <line x1="12" y1="9" x2="12" y2="14" stroke="#ff1f1f" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="12" cy="17.5" r="1.3" fill="#ff1f1f" />
                    </svg>
                    Risk Warning
                  </span>
                )}
              </div>
              <span className="ai-badge">AI assistant</span>
            </div>
            {hasSpeech && (
              <button type="button" className="voice" aria-pressed={voice}
                onClick={() => { setVoice((v) => !v); window.speechSynthesis.cancel(); setSpeaking(false); }}>
                {voice ? 'Voice on' : 'Voice off'}
              </button>
            )}
            <button type="button" className="x" onClick={p.onClose} aria-label="Minimize chat">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </header>

          <div className="log" ref={logRef} role="log" aria-live="polite" aria-label="Conversation with Jeff">
            {!turn && !error && <p className="mute pad">One moment…</p>}
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.from}`}>
                <span className="who">{m.from === 'jeff' ? 'Jeff (AI)' : 'You'}</span>
                <p>{m.text}</p>
              </div>
            ))}
            {busy && turn && (
              <div className="msg jeff typing" aria-label="Jeff is typing">
                <span className="who">Jeff (AI)</span><p><i /><i /><i /></p>
              </div>
            )}
          </div>

          {error && (
            <p className="error" role="alert">{error} {!turn && <button type="button" className="linkbtn" onClick={p.onRetry}>Try again</button>}</p>
          )}

          {turn && !turn.done && turn.quick_replies && turn.quick_replies.length > 0 && !busy && (
            <div className="quick" aria-label="Suggested replies">
              {turn.quick_replies.map((q) => <button key={q} type="button" onClick={() => submit(q)}>{q}</button>)}
            </div>
          )}

          <form className="composer" onSubmit={(e) => { e.preventDefault(); submit(text); }}>
            <label htmlFor="reply" className="sr">Your reply to Jeff</label>
            <input id="reply" ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Type your answer…" autoComplete="off" disabled={busy || !turn} maxLength={500} />
            <button type="submit" className="primary" disabled={busy || !turn || !text.trim()}>Send</button>
          </form>

          <footer className="decide">
            <div className="decide-row">
              {btn('protected', 'Pay with protection')}
              {btn('continue', rec === 'continue' ? 'Send payment' : 'Send anyway')}
              {btn('cancel', 'Cancel')}
            </div>
          </footer>
        </section>
      )}
    </>
  );
}
