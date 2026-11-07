import { PRESETS } from '../scenarios';
import type { Payment, ScenarioPreset } from '../types';

interface Props {
  payment: Payment;
  onChange: (p: Payment) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

export function SendMoney({ payment, onChange, onSubmit, busy, error }: Props) {
  const set = <K extends keyof Payment>(k: K, v: Payment[K]) => onChange({ ...payment, [k]: v });
  const valid = payment.amount > 0 && payment.recipient_name.trim() !== '' && payment.recipient_email.trim() !== '';
  const apply = (p: ScenarioPreset) => onChange({ ...p.payment });

  return (
    <div className="send">
      <div className="presets" role="group" aria-label="Demo scenarios">
        <span className="presets-label">Demo scenarios</span>
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className="preset" onClick={() => apply(p)} title={p.blurb}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="card send-card">
        <h1 className="page-title">Send money</h1>

        <form onSubmit={(e) => { e.preventDefault(); if (valid && !busy) onSubmit(); }}>
          <div className="recipient">
            <span className="ava" aria-hidden="true">{initials(payment.recipient_name)}</span>
            <div className="recipient-fields">
              <label className="field">
                <span>Name</span>
                <input value={payment.recipient_name} onChange={(e) => set('recipient_name', e.target.value)} />
              </label>
              <label className="field">
                <span>Email</span>
                <input type="email" value={payment.recipient_email} onChange={(e) => set('recipient_email', e.target.value)} />
              </label>
            </div>
          </div>

          <label className="amount-field">
            <span className="sr">Amount in US dollars</span>
            <span className="cur" aria-hidden="true">$</span>
            <input
              type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00"
              value={Number.isNaN(payment.amount) ? '' : payment.amount}
              onChange={(e) => set('amount', parseFloat(e.target.value))}
            />
            <span className="cur-code" aria-hidden="true">USD</span>
          </label>

          <label className="field">
            <span>Add a note</span>
            <input value={payment.note} onChange={(e) => set('note', e.target.value)} />
          </label>

          <div className="method">
            <span className="method-dot" aria-hidden="true" />
            <div><strong>Paying with balance</strong><div className="mute">Sample balance $4,210.55</div></div>
          </div>

          <label className="check">
            <input type="checkbox" checked={payment.recipient_is_new} onChange={(e) => set('recipient_is_new', e.target.checked)} />
            <span>First time paying this person <em>(demo setting)</em></span>
          </label>

          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="primary wide" disabled={!valid || busy}>
            {busy ? 'Checking…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
