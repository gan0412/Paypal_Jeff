import { useState } from 'react';
import { Avatar } from './Avatar';
import type { Mood } from '../types';
import type { JeffLook } from '../prefs';

// Developer view: open the app with ?faces to see every expression side by side.
const MOODS: Mood[] = ['calm', 'listening', 'thinking', 'concerned', 'relieved'];

const LOOKS: { label: string; look: JeffLook }[] = [
  { label: 'masculine · medium · brown', look: { gender: 'masculine', skin: 'medium', hair: 'brown' } },
  { label: 'feminine · light · auburn', look: { gender: 'feminine', skin: 'light', hair: 'auburn' } },
  { label: 'feminine · deep · black', look: { gender: 'feminine', skin: 'deep', hair: 'black' } },
  { label: 'masculine · tan · gray', look: { gender: 'masculine', skin: 'tan', hair: 'gray' } },
];

export function FacePreview() {
  const [alertKey, setAlertKey] = useState(0);
  return (
    <div className="app" style={{ padding: 24 }}>
      <h1>Jeff's expressions</h1>
      {LOOKS.map(({ label, look }) => (
        <section key={label} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16 }}>{label}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {MOODS.map((m) => (
              <figure key={m} style={{ margin: 0, textAlign: 'center' }}>
                <Avatar mood={m} size={130} look={look} />
                <figcaption>{m}</figcaption>
              </figure>
            ))}
            <figure style={{ margin: 0, textAlign: 'center' }}>
              <Avatar mood="calm" speaking size={130} look={look} />
              <figcaption>speaking</figcaption>
            </figure>
            <figure style={{ margin: 0, textAlign: 'center' }}>
              <Avatar key={alertKey} mood="concerned" alert size={130} look={look} />
              <figcaption>red alert</figcaption>
            </figure>
          </div>
        </section>
      ))}
      <button type="button" className="primary" onClick={() => setAlertKey((k) => k + 1)}>Replay alert startle</button>
    </div>
  );
}
