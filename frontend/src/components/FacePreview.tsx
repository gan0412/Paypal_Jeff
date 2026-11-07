import { Avatar } from './Avatar';
import type { Mood } from '../types';

// Developer view: open the app with ?faces to see every expression side by side.
const MOODS: Mood[] = ['calm', 'listening', 'thinking', 'concerned', 'relieved'];

export function FacePreview() {
  return (
    <div className="app" style={{ padding: 24 }}>
      <h1>Jeff's expressions</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {MOODS.map((m) => (
          <figure key={m} style={{ margin: 0, textAlign: 'center' }}>
            <Avatar mood={m} size={170} />
            <figcaption>{m}</figcaption>
          </figure>
        ))}
        <figure style={{ margin: 0, textAlign: 'center' }}>
          <Avatar mood="calm" speaking size={170} />
          <figcaption>speaking</figcaption>
        </figure>
      </div>
    </div>
  );
}
