import { useEffect, useRef, useState } from 'react';
import type { AgentTurn, ChatMessage, Choice, Mood, Payment } from '../types';
import { evaluatePaymentInstant } from '../riskEvaluator';
import { Avatar } from './Avatar';
import { JeffSettings } from './JeffSettings';
import { hasSpeech, speak, usePrefs, useVoices } from '../prefs';

interface Props {
  open: boolean;
  held: boolean;
  isConcerned: boolean;
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

export function ChatWidget(p: Props) {
  const { open, held, messages, turn, busy, error } = p;
  const prefs = usePrefs();
  const { t, look } = prefs;
  const voice = prefs.voice.enabled;
  const voices = useVoices();
  const [text, setText] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSpoken = useRef(0);
  const timer = useRef<number>(0);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, busy, open]);

  useEffect(() => { if (open && !busy && !settingsOpen) inputRef.current?.focus(); }, [open, busy, settingsOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (settingsOpen) setSettingsOpen(false); else p.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, p.onClose, settingsOpen]);

  // Lips move whenever Jeff says something: read aloud if voice is on, otherwise timed to the text.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!open || !last || last.from !== 'jeff' || last.id === lastSpoken.current) return;
    lastSpoken.current = last.id;
    window.clearTimeout(timer.current);
    if (voice && hasSpeech) {
      speak(last.text, prefs, voices, { onstart: () => setSpeaking(true), onend: () => setSpeaking(false) });
    } else {
      setSpeaking(true);
      timer.current = window.setTimeout(() => setSpeaking(false), Math.min(7000, 600 + last.text.length * 45));
    }
    // Only react to new messages; voice settings changes shouldn't replay the last one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const isConcerned = p.isConcerned;
  const faceMood: Mood = busy || !turn ? 'thinking' : text.trim() && !speaking ? 'listening' : (isConcerned ? turn.mood : (turn.mood === 'concerned' ? 'calm' : turn.mood));
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
        <button type="button" className={`launcher ${isConcerned || held ? 'has-alert' : ''}`} onClick={p.onOpen} aria-label={t('openChat')}>
          <span className="launcher-label">{held ? `⚠️ ${t('continueWithJeff')}` : isConcerned ? `⚠️ ${t('jeffWarning')}` : t('askJeff')}</span>
          <span className="launcher-face">
            <Avatar mood={launcherMood} size={64} look={look} alert={isConcerned || held} />
            {isConcerned || held ? (
              <span className="glaring-alert-badge" style={{ width: 26, height: 26 }} title={t('highRisk')} role="status" aria-label={t('highRisk')}>
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
        <section className="widget" role="dialog" aria-label={t('chatWithJeff')}>
          <header className="w-head">
            <div className="w-avatar-container">
              <Avatar mood={faceMood} speaking={speaking} busy={busy} size={72} look={look} alert={isConcerned} />
              {isConcerned && (
                <span className="glaring-alert-badge" style={{ width: 28, height: 28 }} title={t('highRisk')} role="status" aria-label={t('highRisk')}>
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
                    {t('riskWarning')}
                  </span>
                )}
              </div>
              <span className="ai-badge">{t('aiAssistant')}</span>
            </div>
            {hasSpeech && !settingsOpen && (
              <button type="button" className="gear" aria-pressed={voice} aria-label={voice ? t('voiceOn') : t('voiceOff')} title={voice ? t('voiceOn') : t('voiceOff')}
                onClick={() => { prefs.setVoice({ enabled: !voice }); window.speechSynthesis.cancel(); setSpeaking(false); }}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
                  {voice ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6m0-6-5 6" />}
                </svg>
              </button>
            )}
            <button type="button" className="gear" aria-pressed={settingsOpen} onClick={() => setSettingsOpen((o) => !o)}
              aria-label={settingsOpen ? t('back') : t('customize')} title={settingsOpen ? t('back') : t('customize')}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
            </button>
            <button type="button" className="x" onClick={p.onClose} aria-label={t('minimize')}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </header>

          {settingsOpen ? (
            <>
              <JeffSettings />
              <button type="button" className="primary" onClick={() => setSettingsOpen(false)}>{t('back')}</button>
            </>
          ) : (<>
          <div className="log" ref={logRef} role="log" aria-live="polite" aria-label={t('chatWithJeff')}>
            {!turn && !error && <p className="mute pad">{t('oneMoment')}</p>}
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.from}`}>
                <span className="who">{m.from === 'jeff' ? t('jeffAi') : t('you')}</span>
                <p>{m.text}</p>
              </div>
            ))}
            {busy && turn && (
              <div className="msg jeff typing" aria-label={t('jeffTyping')}>
                <span className="who">{t('jeffAi')}</span><p><i /><i /><i /></p>
              </div>
            )}
          </div>

          {error && (
            <p className="error" role="alert">{error} {!turn && <button type="button" className="linkbtn" onClick={p.onRetry}>{t('tryAgain')}</button>}</p>
          )}

          {turn && !turn.done && turn.quick_replies && turn.quick_replies.length > 0 && !busy && (
            <div className="quick" aria-label={t('suggestedReplies')}>
              {turn.quick_replies.map((q) => <button key={q} type="button" onClick={() => submit(q)}>{q}</button>)}
            </div>
          )}

          <form className="composer" onSubmit={(e) => { e.preventDefault(); submit(text); }}>
            <label htmlFor="reply" className="sr">{t('yourReply')}</label>
            <input id="reply" ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
              placeholder={t('typeAnswer')} autoComplete="off" disabled={busy || !turn} maxLength={500} />
            <button type="submit" className="primary" disabled={busy || !turn || !text.trim()}>{t('send')}</button>
          </form>

          <footer className="decide">
            <div className="decide-row">
              {btn('cancel', t('cancel'))}
            </div>
          </footer>
          </>)}
        </section>
      )}
    </>
  );
}
