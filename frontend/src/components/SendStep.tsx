import { PRESETS } from '../scenarios';
import type { Payment, PaymentType, ScenarioPreset } from '../types';

interface Props {
  payment: Payment;
  onChange: (p: Payment) => void;
  onNext: () => void;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

const ICONS: Record<ScenarioPreset['id'], string> = {
  romance: 'M12 21s-7-4.4-9.5-9C.9 8.9 2.6 5.5 6 5.5c2 0 3.4 1 4 2.2.6-1.2 2-2.2 4-2.2 3.4 0 5.1 3.4 3.5 6.5C19 16.6 12 21 12 21Z',
  charity: 'M3 9h18v4H3V9Zm2 4h14v8H5v-8Zm7-4v12M12 9c-2.5 0-4.5-1-4.5-2.8S9 3.5 10.4 4.4C11.4 5 12 7 12 9Zm0 0c2.5 0 4.5-1 4.5-2.8S15 3.5 13.6 4.4C12.6 5 12 7 12 9Z',
  coached: 'M4 5h16v11H9l-5 4V5Z',
  influenced: 'M3 17l6-6 4 4 8-9M15 6h6v6',
  worried: 'M12 3 4 6v6c0 4.5 3.4 7.7 8 9 4.6-1.3 8-4.5 8-9V6l-8-3ZM12 8v5M12 16v.5',
  legit: 'M3 11.5 12 3l9 8.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z',
};

export function SendStep({ payment, onChange, onNext }: Props) {
  const set = <K extends keyof Payment>(k: K, v: Payment[K]) => onChange({ ...payment, [k]: v });
  const valid = payment.amount > 0 && payment.recipient_name.trim() !== '' && payment.recipient_email.trim() !== '';
  const apply = (p: ScenarioPreset) => onChange({ ...p.payment });
  const types: { id: PaymentType; title: string; sub: string }[] = [
    { id: 'friends_family', title: 'Friends and family', sub: 'No purchase protection' },
    { id: 'goods_services', title: 'Goods and services', sub: 'Purchase protection may apply' },
  ];

  return (
    <div className="flow">
      <div className="scenarios" role="group" aria-label="Scenarios">
        <span className="scenarios-label">Scenarios</span>
        <div className="scenario-grid">
          {PRESETS.map((p) => {
            const on = payment.recipient_email === p.payment.recipient_email;
            return (
              <button key={p.id} type="button" className={`scenario ${p.id} ${on ? 'on' : ''}`} onClick={() => apply(p)} aria-pressed={on}>
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path d={ICONS[p.id]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <strong>{p.label}</strong>
                <span>{p.blurb}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form className="screen" onSubmit={(e) => { e.preventDefault(); if (valid) onNext(); }}>
        <h1 className="title">Send money</h1>

        <div className="to-row">
          <span className="ava" aria-hidden="true">{initials(payment.recipient_name)}</span>
          <div className="to-fields">
            <label className="field"><span>Name</span>
              <input value={payment.recipient_name} onChange={(e) => set('recipient_name', e.target.value)} /></label>
            <label className="field"><span>Email</span>
              <input type="email" value={payment.recipient_email} onChange={(e) => set('recipient_email', e.target.value)} /></label>
          </div>
        </div>

        <label className="amount-field">
          <span className="sr">Amount in US dollars</span>
          <span className="cur" aria-hidden="true">$</span>
          <input type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00"
            value={Number.isNaN(payment.amount) ? '' : payment.amount}
            onChange={(e) => set('amount', parseFloat(e.target.value))} />
          <span className="cur-code" aria-hidden="true">USD</span>
        </label>

        <fieldset className="types">
          <legend className="sr">What is this payment for?</legend>
          {types.map((t) => (
            <label key={t.id} className={`type ${payment.payment_type === t.id ? 'on' : ''}`}>
              <input type="radio" name="ptype" checked={payment.payment_type === t.id} onChange={() => set('payment_type', t.id)} />
              <span><strong>{t.title}</strong><span className="mute">{t.sub}</span></span>
            </label>
          ))}
        </fieldset>

        <label className="field"><span>Note</span>
          <input value={payment.note} onChange={(e) => set('note', e.target.value)} /></label>

        <label className="check">
          <input type="checkbox" checked={payment.recipient_is_new} onChange={(e) => set('recipient_is_new', e.target.checked)} />
          <span>New recipient</span>
        </label>

        <button type="submit" className="primary wide" disabled={!valid}>Next</button>
      </form>
    </div>
  );
}
