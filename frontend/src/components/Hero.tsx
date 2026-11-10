import { usePrefs } from '../prefs';

// Left-hand headline area: a short promise plus an animated shield that reacts when a payment is held or concerned.
export function Hero({ held }: { held: boolean }) {
  const { t } = usePrefs();

  return (
    <section className={`hero ${held ? 'held' : ''}`} aria-label="About Jeff">
      <span className="eyebrow">{t('heroEyebrow')}</span>
      <h1>{t('heroTitle')}</h1>
      <p>{t('heroSub')}</p>

      <div className="shield-art" aria-hidden="true">
        <div className="orbit o1"><i /></div>
        <div className="orbit o2"><i /></div>
        <div className="orbit o3"><i /></div>
        <svg viewBox="0 0 120 140" className="shield">
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4db8ff" /><stop offset="1" stopColor="#0049b7" />
            </linearGradient>
          </defs>
          <path d="M60 6 12 24v42c0 33 21 58 48 68 27-10 48-35 48-68V24L60 6Z" fill="url(#sg)" />
          <path d="M60 6 12 24v42c0 33 21 58 48 68 27-10 48-35 48-68V24L60 6Z" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="3" />
          <path className="tick" d="m38 70 15 15 30-33" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
