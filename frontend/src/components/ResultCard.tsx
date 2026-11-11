import type { CSSProperties } from 'react';
import type { DecisionResult } from '../types';
import { usePrefs } from '../prefs';

export function ResultCard({ result, onAgain }: { result: DecisionResult; onAgain: () => void }) {
  const { t, lang } = usePrefs();
  const s = result.status;

  return (
    <div className="flow">
      <div className={`screen result ${s}`} role="status">
        {s === 'protected' && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => (
              <i key={i} style={{ ['--i' as string]: i } as CSSProperties} />
            ))}
          </div>
        )}
        <svg className="badge-ico" viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r="36" className="ring" />
          {s === 'cancelled' ? (
            <path className="tickmark" d="m28 28 24 24M52 28 28 52" />
          ) : (
            <path className="tickmark" d="m24 42 12 12 22-26" />
          )}
        </svg>
        <h1 className="title">{t(`result_${s}`)}</h1>
        <p>{lang === 'en' ? result.message : t(`resultMsg_${s}`)}</p>
        {result.order_id && (
          <p className="mute">
            {t('paypalRef')}: {result.order_id}
          </p>
        )}
        {result.approve_url && (
          <p>
            <a href={result.approve_url} target="_blank" rel="noopener noreferrer">
              {t('openProtected')}
            </a>
          </p>
        )}
        <button type="button" className="primary wide" onClick={onAgain}>
          {t('tryAnother')}
        </button>
      </div>
    </div>
  );
}
