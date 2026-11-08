import { PRESETS } from '../scenarios';
import type { Payment, PaymentType, ScenarioPreset } from '../types';

interface Props {
  payment: Payment;
  onChange: (p: Payment) => void;
  onNext: () => void;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

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
      <div className="presets" role="group" aria-label="Demo scenarios">
        <span className="presets-label">Demo scenarios</span>
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className="preset" onClick={() => apply(p)} title={p.blurb}>{p.label}</button>
        ))}
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

        <button type="submit" className="primary wide" disabled={!valid}>Next</button>
      </form>
    </div>
  );
}
