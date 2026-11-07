import { useEffect, useId, useState } from 'react';
import type { CSSProperties, SVGProps } from 'react';
import type { Mood } from '../types';

// An illustrated, human-looking face. It blinks, glances around, tilts its head, raises one brow when
// thinking, smiles with its eyes when relieved, and moves its lips while "speaking".
// Expressions are deliberately gentle: the goal is trust, never alarm.

type Brow = [number, number, number]; // outer y, control y, inner y

interface Look {
  browL: Brow; browR: Brow;
  smile: number;      // -1 (frown) .. 1 (big smile)
  mouthW: number;     // half-width of the mouth
  lid: number;        // upper eyelid droop 0..1 (relaxed / smiling eyes)
  lower: number;      // lower lid raise (cheek lift when smiling)
  gaze: [number, number];
  blush: number;
  tilt: number;       // head tilt in degrees
}

const LOOKS: Record<Mood, Look> = {
  calm:      { browL: [82, 75, 79], browR: [82, 75, 79], smile: 0.35, mouthW: 20, lid: 0.06, lower: 0.05, gaze: [0, 0],  blush: 0.12, tilt: 0 },
  listening: { browL: [80, 72, 76], browR: [80, 72, 76], smile: 0.45, mouthW: 21, lid: 0,    lower: 0.06, gaze: [0, 0],  blush: 0.15, tilt: -2 },
  thinking:  { browL: [83, 76, 80], browR: [75, 66, 72], smile: -0.05, mouthW: 16, lid: 0.12, lower: 0,    gaze: [6, -5], blush: 0.1,  tilt: 3 },
  concerned: { browL: [85, 78, 72], browR: [85, 78, 72], smile: -0.3, mouthW: 19, lid: 0.1,  lower: 0,    gaze: [0, 1],  blush: 0.1,  tilt: -3 },
  relieved:  { browL: [85, 79, 82], browR: [85, 79, 82], smile: 1,    mouthW: 23, lid: 0.22, lower: 0.2,  gaze: [0, 0],  blush: 0.38, tilt: 1 },
};

const SKIN = '#e8b794';
const SKIN_SHADE = '#d6a07e';
const HAIR = '#3a2a20';
const LIP = '#c0686b';

const ALMOND = (cx: number) => `M${cx - 16} 100 Q${cx} 87 ${cx + 16} 100 Q${cx} 112 ${cx - 16} 100 Z`;

function browPath(side: 'l' | 'r', [o, c, i]: Brow) {
  return side === 'l' ? `M52 ${o} Q72 ${c} 92 ${i}` : `M148 ${o} Q128 ${c} 108 ${i}`;
}

function mouthShapes(smile: number, w: number, open: number) {
  const y0 = 146;
  const cy = y0 - smile * 6;
  const upC = y0 - 2;
  const lowC = y0 + 5 + open * 15;
  const upCtrl = 2 * upC - cy;
  const lowCtrl = 2 * lowC - cy;
  const L = 100 - w, R = 100 + w;
  const outline = `M${L} ${cy} Q100 ${upCtrl} ${R} ${cy} Q100 ${lowCtrl} ${L} ${cy} Z`;
  const upper = `M${L} ${cy} Q100 ${upCtrl} ${R} ${cy}`;
  const lower = `M${L + 2} ${cy + 1} Q100 ${lowCtrl + 1} ${R - 2} ${cy + 1}`;
  const ic = cy + 0.6;
  const inner = `M${L + 4} ${ic} Q100 ${2 * (y0 - 1) - ic} ${R - 4} ${ic} Q100 ${2 * (lowC - 3) - ic} ${L + 4} ${ic} Z`;
  return { outline, upper, lower, inner };
}

function Morph({ d, ...rest }: { d: string } & SVGProps<SVGPathElement>) {
  // `d` in CSS lets supporting browsers animate smoothly between shapes.
  const style = { d: `path("${d}")`, transition: 'd .35s ease' } as unknown as CSSProperties;
  return <path d={d} style={style} {...rest} />;
}

function Eye({ cx, lid, lower, gaze, uid }: { cx: number; lid: number; lower: number; gaze: [number, number]; uid: string }) {
  const clip = `${uid}-clip-${cx}`;
  const upperScale = (7.5 + 12.5 * lid) / 20;
  return (
    <g>
      <clipPath id={clip}><path d={ALMOND(cx)} /></clipPath>
      <path d={ALMOND(cx)} fill="#fbf8f4" />
      <g clipPath={`url(#${clip})`}>
        <g style={{ transform: `translate(${gaze[0]}px, ${gaze[1]}px)`, transition: 'transform .45s ease' }}>
          <circle cx={cx} cy="100" r="8.6" fill="#6b4630" />
          <circle cx={cx} cy="100" r="6" fill="#4a2f20" />
          <circle cx={cx} cy="100" r="3.6" fill="#17100c" />
          <circle cx={cx + 2.8} cy="97.2" r="1.7" fill="#fff" />
          <circle cx={cx - 2.4} cy="102.6" r="0.9" fill="#fff" opacity=".7" />
        </g>
        <rect x={cx - 18} y="86" width="36" height="20" fill={SKIN}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 0%', transform: `scaleY(${upperScale})`, transition: 'transform .1s ease-out' }} />
        <rect x={cx - 18} y="100" width="36" height="12" fill={SKIN}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', transform: `scaleY(${0.5 + lower})`, transition: 'transform .4s ease' }} />
      </g>
      <path d={ALMOND(cx)} fill="none" stroke="#2a1d16" strokeWidth="1.5" />
      <path d={`M${cx - 15} ${92 + lid * 5} Q${cx} ${84 + lid * 4} ${cx + 15} ${92 + lid * 5}`} fill="none" stroke={SKIN_SHADE} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

interface Props { mood: Mood; speaking?: boolean; busy?: boolean; size?: number }

export function Avatar({ mood, speaking = false, busy = false, size = 120 }: Props) {
  const uid = useId().replace(/:/g, '');
  const look = LOOKS[mood];
  const [blink, setBlink] = useState(false);
  const [drift, setDrift] = useState<[number, number]>([0, 0]);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    let t: number;
    const loop = () => {
      t = window.setTimeout(() => {
        setBlink(true);
        t = window.setTimeout(() => { setBlink(false); loop(); }, 120);
      }, 2200 + Math.random() * 3200);
    };
    loop();
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setDrift([(Math.random() - 0.5) * 2.6, (Math.random() - 0.5) * 2]);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!speaking) { setOpen(0); return; }
    const shapes = [0.12, 0.45, 0.75, 0.25, 0.6, 0.05, 0.38];
    const id = window.setInterval(() => setOpen(shapes[Math.floor(Math.random() * shapes.length)]), 125);
    return () => window.clearInterval(id);
  }, [speaking]);

  const lid = blink ? 1 : look.lid;
  const gaze: [number, number] = [look.gaze[0] + drift[0], look.gaze[1] + drift[1]];
  const m = mouthShapes(look.smile, look.mouthW, open);
  const label = busy ? 'typing' : speaking ? 'speaking' : mood;

  return (
    <div className={`avatar ${busy ? 'busy' : ''} ${speaking ? 'speaking' : ''}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" role="img" aria-label={`Jeff, an AI assistant, ${label}`}>
        <defs>
          <radialGradient id={`${uid}-bg`} cx="50%" cy="40%" r="75%">
            <stop offset="0" stopColor="#eaf3ff" /><stop offset="1" stopColor="#c9defa" />
          </radialGradient>
          <filter id={`${uid}-blur`}><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        <rect width="200" height="200" fill={`url(#${uid}-bg)`} />
        <path d="M16 200 C20 176 56 168 100 168 C144 168 180 176 184 200 Z" fill="#0b3a8c" />
        <path d="M84 150 L84 172 Q100 183 116 172 L116 150 Z" fill={SKIN_SHADE} />
        <path d="M86 169 L100 190 L114 169 Z" fill="#f4f7fb" />
        <g style={{ transform: `rotate(${look.tilt}deg)`, transformOrigin: '100px 160px', transition: 'transform .7s ease' }} className="head">
          <path d="M34 108 C26 50 62 14 102 14 C146 14 176 50 166 108 C160 84 150 70 138 64 C120 50 80 50 62 64 C50 72 40 88 34 108Z" fill={HAIR} />
          <ellipse cx="38" cy="108" rx="5.5" ry="10" fill={SKIN_SHADE} />
          <ellipse cx="162" cy="108" rx="5.5" ry="10" fill={SKIN_SHADE} />
          <path d="M100 28 C140 28 162 62 162 104 C162 140 138 172 100 172 C62 172 38 140 38 104 C38 62 60 28 100 28Z" fill={SKIN} />
          <path d="M44 120 C46 150 70 170 100 172 C84 160 58 150 52 118Z" fill={SKIN_SHADE} opacity=".35" />
          <g filter={`url(#${uid}-blur)`} fill="#e07a6b" style={{ opacity: look.blush, transition: 'opacity .6s' }}>
            <circle cx="62" cy="128" r="11" /><circle cx="138" cy="128" r="11" />
          </g>
          <path d="M42 92 C38 44 64 22 100 22 C136 22 162 44 158 92 C150 70 138 58 118 54 C100 62 74 60 56 70 C48 76 44 84 42 92Z" fill={HAIR} />
          <g fill="none" stroke={HAIR} strokeWidth="5" strokeLinecap="round">
            <Morph d={browPath('l', look.browL)} />
            <Morph d={browPath('r', look.browR)} />
          </g>
          <Eye cx={74} lid={lid} lower={look.lower} gaze={gaze} uid={uid} />
          <Eye cx={126} lid={lid} lower={look.lower} gaze={gaze} uid={uid} />
          <path d="M98 106 Q94 123 90 127 Q100 132 110 127" fill="none" stroke="#b9805f" strokeWidth="2.2" strokeLinecap="round" opacity=".75" />
          <Morph d={m.outline} fill={LIP} />
          {open > 0.1 && <Morph d={m.inner} fill="#5a1f27" />}
          <Morph d={m.upper} fill="none" stroke="#a24f55" strokeWidth="1.8" strokeLinecap="round" />
          <Morph d={m.lower} fill="none" stroke="#d98a8c" strokeWidth="1.4" strokeLinecap="round" opacity=".6" />
        </g>
      </svg>
    </div>
  );
}
