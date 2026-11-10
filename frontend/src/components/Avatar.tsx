import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, SVGProps } from 'react';
import type { Mood } from '../types';
import { DEFAULT_LOOK, HAIR_COLORS, SKIN_TONES } from '../prefs';
import type { JeffLook } from '../prefs';

// An illustrated, human-looking face. It blinks, glances around, tilts its head, raises one brow when
// thinking, smiles with its eyes when relieved, and moves its lips while "speaking".
// When a red alert starts, Jeff does a quick startle (head jolt, wide eyes, raised brows), then
// settles into a worried look: furrowed brows, darting eyes, a sweat drop and a soft red pulse.

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
  pupil?: number;     // pupil size multiplier
  open?: number;      // resting mouth opening 0..1
}

const LOOKS: Record<Mood, Look> = {
  calm:      { browL: [82, 75, 79], browR: [82, 75, 79], smile: 0.35, mouthW: 20, lid: 0.06, lower: 0.05, gaze: [0, 0],  blush: 0.12, tilt: 0 },
  listening: { browL: [80, 72, 76], browR: [80, 72, 76], smile: 0.45, mouthW: 21, lid: 0,    lower: 0.06, gaze: [0, 0],  blush: 0.15, tilt: -2 },
  thinking:  { browL: [83, 76, 80], browR: [75, 66, 72], smile: -0.05, mouthW: 16, lid: 0.12, lower: 0,    gaze: [6, -5], blush: 0.1,  tilt: 3 },
  concerned: { browL: [85, 78, 72], browR: [85, 78, 72], smile: -0.3, mouthW: 19, lid: 0.1,  lower: 0,    gaze: [0, 1],  blush: 0.1,  tilt: -3 },
  relieved:  { browL: [85, 79, 82], browR: [85, 79, 82], smile: 1,    mouthW: 23, lid: 0.22, lower: 0.2,  gaze: [0, 0],  blush: 0.38, tilt: 1 },
};

// The first ~1s of an alert: eyebrows shoot up, eyes go wide, mouth makes a small "o".
const STARTLE: Look = { browL: [71, 61, 67], browR: [71, 61, 67], smile: -0.1, mouthW: 9, lid: 0, lower: 0, gaze: [0, -1], blush: 0, tilt: 0, pupil: 0.7, open: 0.55 };
// Held while the alert stays on: more furrowed than plain "concerned".
const ALERT: Look = { ...LOOKS.concerned, browL: [86, 80, 70], browR: [86, 80, 70], smile: -0.4, mouthW: 17, pupil: 0.85 };

const LIP = { masculine: '#c0686b', feminine: '#c4506a' };
const LIP_LINE = { masculine: '#a24f55', feminine: '#a33a52' };

const ALMOND = (cx: number) => `M${cx - 16} 100 Q${cx} 87 ${cx + 16} 100 Q${cx} 112 ${cx - 16} 100 Z`;

function darken(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(c * (1 - amount)).toString(16).padStart(2, '0');
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
}

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

interface EyeProps { cx: number; lid: number; lower: number; gaze: [number, number]; pupil: number; uid: string; skin: string; shade: string; lashes: boolean }

function Eye({ cx, lid, lower, gaze, pupil, uid, skin, shade, lashes }: EyeProps) {
  const clip = `${uid}-clip-${cx}`;
  const upperScale = (7.5 + 12.5 * lid) / 20;
  const outer = cx < 100 ? -1 : 1; // which side is the outer corner
  return (
    <g>
      <clipPath id={clip}><path d={ALMOND(cx)} /></clipPath>
      <path d={ALMOND(cx)} fill="#fbf8f4" />
      <g clipPath={`url(#${clip})`}>
        <g style={{ transform: `translate(${gaze[0]}px, ${gaze[1]}px)`, transition: 'transform .45s ease' }}>
          <g className="iris">
            <circle cx={cx} cy="100" r="8.6" fill="#6b4630" />
            <circle cx={cx} cy="100" r="6" fill="#4a2f20" />
            <circle cx={cx} cy="100" r={3.6 * pupil} fill="#17100c" style={{ transition: 'r .25s ease' }} />
            <circle cx={cx + 2.8} cy="97.2" r="1.7" fill="#fff" />
            <circle cx={cx - 2.4} cy="102.6" r="0.9" fill="#fff" opacity=".7" />
          </g>
        </g>
        <rect x={cx - 18} y="86" width="36" height="20" fill={skin}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 0%', transform: `scaleY(${upperScale})`, transition: 'transform .1s ease-out' }} />
        <rect x={cx - 18} y="100" width="36" height="12" fill={skin}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', transform: `scaleY(${0.5 + lower})`, transition: 'transform .4s ease' }} />
      </g>
      <path d={ALMOND(cx)} fill="none" stroke="#2a1d16" strokeWidth={lashes ? 2 : 1.5} />
      {lashes && (
        <g stroke="#2a1d16" strokeWidth="1.6" strokeLinecap="round">
          <path d={`M${cx + outer * 15} 98.5 l${outer * 4.5} -4`} />
          <path d={`M${cx + outer * 12} 95 l${outer * 3.5} -5`} />
          <path d={`M${cx + outer * 8} 92.5 l${outer * 2} -5`} />
        </g>
      )}
      <path d={`M${cx - 15} ${92 + lid * 5} Q${cx} ${84 + lid * 4} ${cx + 15} ${92 + lid * 5}`} fill="none" stroke={shade} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

interface Props {
  mood: Mood;
  speaking?: boolean;
  busy?: boolean;
  size?: number;
  look?: JeffLook;
  /** Red alert: plays a startle once when it turns on, then holds a worried, animated look. */
  alert?: boolean;
}

export function Avatar({ mood, speaking = false, busy = false, size = 120, look: appearance = DEFAULT_LOOK, alert = false }: Props) {
  const uid = useId().replace(/:/g, '');
  const [blink, setBlink] = useState(false);
  const [drift, setDrift] = useState<[number, number]>([0, 0]);
  const [talk, setTalk] = useState(0);
  const [startle, setStartle] = useState(false);
  const wasAlert = useRef(false);

  // Startle only on the moment the alert turns on, not on every re-render while it stays on.
  useEffect(() => {
    if (alert && !wasAlert.current) setStartle(true);
    wasAlert.current = alert;
  }, [alert]);

  useEffect(() => {
    if (!startle) return;
    const id = window.setTimeout(() => setStartle(false), 950);
    return () => window.clearTimeout(id);
  }, [startle]);

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
    if (!speaking) { setTalk(0); return; }
    const shapes = [0.12, 0.45, 0.75, 0.25, 0.6, 0.05, 0.38];
    const id = window.setInterval(() => setTalk(shapes[Math.floor(Math.random() * shapes.length)]), 125);
    return () => window.clearInterval(id);
  }, [speaking]);

  const alerting = alert && !startle;
  const face = startle ? STARTLE : alert && (mood === 'concerned' || mood === 'thinking') ? ALERT : LOOKS[mood];
  const lid = blink && !startle ? 1 : face.lid;
  const gaze: [number, number] = [face.gaze[0] + drift[0], face.gaze[1] + drift[1]];
  const m = mouthShapes(face.smile, face.mouthW, Math.max(talk, face.open ?? 0));
  const label = busy ? 'typing' : speaking ? 'speaking' : alert ? 'alert' : mood;

  const fem = appearance.gender === 'feminine';
  const { base: skin, shade } = SKIN_TONES[appearance.skin];
  const hair = HAIR_COLORS[appearance.hair];
  const brow = darken(hair, appearance.hair === 'blonde' || appearance.hair === 'gray' ? 0.3 : 0.05);

  const classes = ['avatar', mood === 'concerned' || alert ? 'concerned' : '', busy ? 'busy' : '', speaking ? 'speaking' : '',
    startle ? 'startle' : '', alerting ? 'alerting' : ''].filter(Boolean).join(' ');

  return (
    <div className={classes} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" role="img" aria-label={`Jeff, an AI assistant, ${label}`}>
        <defs>
          <radialGradient id={`${uid}-bg`} cx="50%" cy="40%" r="75%">
            <stop offset="0" stopColor="#eaf3ff" /><stop offset="1" stopColor="#c9defa" />
          </radialGradient>
          <radialGradient id={`${uid}-alert`} cx="50%" cy="45%" r="70%">
            <stop offset="0.35" stopColor="#ff4d4d" stopOpacity="0" /><stop offset="1" stopColor="#ff1f1f" stopOpacity="1" />
          </radialGradient>
          <linearGradient id={`${uid}-drop`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e8f6ff" /><stop offset="1" stopColor="#8fd0ff" />
          </linearGradient>
          <filter id={`${uid}-blur`}><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        <rect width="200" height="200" fill={`url(#${uid}-bg)`} />
        <rect width="200" height="200" fill={`url(#${uid}-alert)`} className="alert-glow" />

        {/* Long hair sits behind the neck and shoulders. */}
        {fem && <path d="M30 104 C22 46 60 12 100 12 C140 12 178 46 170 104 C172 136 176 160 182 186 Q100 204 18 186 C24 160 28 136 30 104Z" fill={hair} />}

        <path d="M16 200 C20 176 56 168 100 168 C144 168 180 176 184 200 Z" fill="#0b3a8c" />
        <path d="M84 150 L84 172 Q100 183 116 172 L116 150 Z" fill={shade} />
        {fem
          ? <path d="M84 170 Q100 186 116 170" fill="none" stroke="#f4f7fb" strokeWidth="3" strokeLinecap="round" />
          : <path d="M86 169 L100 190 L114 169 Z" fill="#f4f7fb" />}

        <g style={{ transform: `rotate(${face.tilt}deg)`, transformOrigin: '100px 160px', transition: 'transform .7s ease' }} className="head">
          {!fem && <path d="M34 108 C26 50 62 14 102 14 C146 14 176 50 166 108 C160 84 150 70 138 64 C120 50 80 50 62 64 C50 72 40 88 34 108Z" fill={hair} />}
          <ellipse cx="38" cy="108" rx="5.5" ry="10" fill={shade} />
          <ellipse cx="162" cy="108" rx="5.5" ry="10" fill={shade} />
          {fem && <g fill="#f2c94c"><circle cx="38" cy="120" r="2.6" /><circle cx="162" cy="120" r="2.6" /></g>}
          <path d="M100 28 C140 28 162 62 162 104 C162 140 138 172 100 172 C62 172 38 140 38 104 C38 62 60 28 100 28Z" fill={skin} />
          <path d="M44 120 C46 150 70 170 100 172 C84 160 58 150 52 118Z" fill={shade} opacity=".35" />
          <g filter={`url(#${uid}-blur)`} fill="#e07a6b" style={{ opacity: face.blush, transition: 'opacity .6s' }}>
            <circle cx="62" cy="128" r="11" /><circle cx="138" cy="128" r="11" />
          </g>
          {fem
            ? <path d="M40 104 C34 46 64 20 100 20 C138 20 166 46 160 104 C156 78 146 62 128 54 C112 64 86 62 70 56 C56 66 46 82 40 104Z" fill={hair} />
            : <path d="M42 92 C38 44 64 22 100 22 C136 22 162 44 158 92 C150 70 138 58 118 54 C100 62 74 60 56 70 C48 76 44 84 42 92Z" fill={hair} />}
          <g fill="none" stroke={brow} strokeWidth={fem ? 3.6 : 5} strokeLinecap="round" className="brows">
            <Morph d={browPath('l', face.browL)} />
            <Morph d={browPath('r', face.browR)} />
          </g>
          <g className="eyes">
            <Eye cx={74} lid={lid} lower={face.lower} gaze={gaze} pupil={face.pupil ?? 1} uid={uid} skin={skin} shade={shade} lashes={fem} />
            <Eye cx={126} lid={lid} lower={face.lower} gaze={gaze} pupil={face.pupil ?? 1} uid={uid} skin={skin} shade={shade} lashes={fem} />
          </g>
          <path d="M98 106 Q94 123 90 127 Q100 132 110 127" fill="none" stroke={darken(shade, 0.12)} strokeWidth="2.2" strokeLinecap="round" opacity=".75" />
          <Morph d={m.outline} fill={LIP[appearance.gender]} />
          {Math.max(talk, face.open ?? 0) > 0.1 && <Morph d={m.inner} fill="#5a1f27" />}
          <Morph d={m.upper} fill="none" stroke={LIP_LINE[appearance.gender]} strokeWidth="1.8" strokeLinecap="round" />
          <Morph d={m.lower} fill="none" stroke="#d98a8c" strokeWidth="1.4" strokeLinecap="round" opacity=".6" />
          <path className="sweat" d="M152 66 C148 74 146 78 146 81 a6 6 0 0 0 12 0 C158 78 156 74 152 66Z" fill={`url(#${uid}-drop)`} stroke="#5fb4ee" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
