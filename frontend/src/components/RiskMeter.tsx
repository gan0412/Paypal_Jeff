import type { Risk } from '../types';

const TEXT = {
  low: 'Looks routine',
  elevated: 'Worth a closer look',
  high: 'Several warning signs',
} as const;

export function RiskMeter({ risk }: { risk: Risk }) {
  const idx = risk.level === 'low' ? 0 : risk.level === 'elevated' ? 1 : 2;
  return (
    <section className="risk" aria-label="Payment check">
      <div className="risk-head">
        <span className="risk-title">Payment check</span>
        <span className={`risk-level ${risk.level}`}>{TEXT[risk.level]}</span>
      </div>
      <div className="risk-bar" role="img" aria-label={`${TEXT[risk.level]}`}>
        {[0, 1, 2].map((i) => (
          <i key={i} className={i <= idx ? `on ${risk.level}` : ''} />
        ))}
      </div>
      {risk.signals.length > 0 && (
        <ul className="signals">
          {risk.signals.map((s) => (
            <li key={s.code} title={s.detail}>
              {s.label}
              {s.detail && <span className="detail"> {s.detail}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
