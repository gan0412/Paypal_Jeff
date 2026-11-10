import { PRESETS } from '../scenarios';
import type { Payment, PaymentType, ScenarioPreset } from '../types';
import { usePrefs } from '../prefs';

interface Props {
  payment: Payment;
  onChange: (p: Payment) => void;
  onNext: () => void;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

export function SendStep({ payment, onChange, onNext }: Props) {
  const { t } = usePrefs();
  const set = <K extends keyof Payment>(k: K, v: Payment[K]) => onChange({ ...payment, [k]: v });
  const valid = payment.amount > 0 && payment.recipient_name.trim() !== '' && payment.recipient_email.trim() !== '';
  const apply = (p: ScenarioPreset) => onChange({ ...p.payment });
  const types: { id: PaymentType; title: string; sub: string }[] = [
    { id: 'friends_family', title: t('ffTitle'), sub: t('ffSub') },
    { id: 'goods_services', title: t('gsTitle'), sub: t('gsSub') },
  ];

  return (
    <div className="flow">
      <div className="presets" role="group" aria-label={t('demoScenarios')}>
        <span className="presets-label">{t('demoScenarios')}</span>
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className="preset" onClick={() => apply(p)} title={p.blurb}>{t(`preset_${p.id}`)}</button>
        ))}
      </div>

      <form className="screen" onSubmit={(e) => { e.preventDefault(); if (valid) onNext(); }}>
        <h1 className="title">{t('sendMoney')}</h1>

        <div className="to-row">
          <span className="ava" aria-hidden="true">{initials(payment.recipient_name)}</span>
          <div className="to-fields">
            <label className="field"><span>{t('name')}</span>
              <input value={payment.recipient_name} onChange={(e) => set('recipient_name', e.target.value)} /></label>
            <label className="field"><span>{t('email')}</span>
              <input type="email" value={payment.recipient_email} onChange={(e) => set('recipient_email', e.target.value)} /></label>
          </div>
        </div>

        <label className="amount-field">
          <span className="sr">{t('amountSr')}</span>
          <span className="cur" aria-hidden="true">$</span>
          <input type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00"
            value={Number.isNaN(payment.amount) ? '' : payment.amount}
            onChange={(e) => set('amount', parseFloat(e.target.value))} />
          <span className="cur-code" aria-hidden="true">USD</span>
        </label>

        <fieldset className="types">
          <legend className="sr">{t('paymentForSr')}</legend>
          {types.map((t) => (
            <label key={t.id} className={`type ${payment.payment_type === t.id ? 'on' : ''}`}>
              <input type="radio" name="ptype" checked={payment.payment_type === t.id} onChange={() => set('payment_type', t.id)} />
              <span><strong>{t.title}</strong><span className="mute">{t.sub}</span></span>
            </label>
          ))}
        </fieldset>

        <label className="field"><span>{t('note')}</span>
          <input value={payment.note} onChange={(e) => set('note', e.target.value)} /></label>

        <button type="submit" className="primary wide" disabled={!valid}>{t('next')}</button>
      </form>
    </div>
  );
}
