import { useState } from 'react';
import { Avatar } from './Avatar';
import { LANGS } from '../i18n';
import type { LangCode } from '../i18n';
import {
  DEFAULT_LOOK, DEFAULT_VOICE, HAIR_COLORS, SKIN_TONES, hasSpeech, pickVoice, speak, usePrefs, useVoices, voicesFor,
} from '../prefs';
import type { Gender, HairColor, SkinTone } from '../prefs';

// "Customize Jeff": appearance, voice and language. Changes apply live and are saved in the browser.
export function JeffSettings() {
  const prefs = usePrefs();
  const { t, look, voice, lang } = prefs;
  const voices = useVoices();
  const [previewing, setPreviewing] = useState(false);
  const [demoAlert, setDemoAlert] = useState(false);
  const available = voicesFor(voices, lang);
  const auto = pickVoice(voices, { ...prefs, voice: { ...voice, voiceURI: null } });

  const preview = () => speak(t('previewLine'), prefs, voices, {
    onstart: () => setPreviewing(true),
    onend: () => setPreviewing(false),
  });

  const genders: Gender[] = ['masculine', 'feminine'];

  return (
    <div className="settings">
      <div className="settings-preview">
        <button type="button" onClick={() => setDemoAlert((a) => !a)} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer' }}
          title="Click to preview the red-alert face" aria-label="Preview Jeff's red-alert face">
          <Avatar mood={demoAlert ? 'concerned' : 'calm'} alert={demoAlert} speaking={previewing} look={look} size={112} />
        </button>
      </div>

      <section>
        <h3>{t('appearance')}</h3>
        <div className="setting">
          <span>{t('style')}</span>
          <div className="seg">
            {genders.map((g) => (
              <button key={g} type="button" aria-pressed={look.gender === g} onClick={() => prefs.setLook({ gender: g })}>{t(g)}</button>
            ))}
          </div>
        </div>
        <div className="setting">
          <span>{t('skinTone')}</span>
          <div className="swatches">
            {(Object.keys(SKIN_TONES) as SkinTone[]).map((s) => (
              <button key={s} type="button" className="swatch" aria-label={s} aria-pressed={look.skin === s}
                style={{ background: SKIN_TONES[s].base }} onClick={() => prefs.setLook({ skin: s })} />
            ))}
          </div>
        </div>
        <div className="setting">
          <span>{t('hairColor')}</span>
          <div className="swatches">
            {(Object.keys(HAIR_COLORS) as HairColor[]).map((h) => (
              <button key={h} type="button" className="swatch" aria-label={h} aria-pressed={look.hair === h}
                style={{ background: HAIR_COLORS[h] }} onClick={() => prefs.setLook({ hair: h })} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3>{t('voice')}</h3>
        {hasSpeech ? (
          <>
            <label className="toggle setting">
              <input type="checkbox" checked={voice.enabled} onChange={(e) => prefs.setVoice({ enabled: e.target.checked })} />
              {t('readAloud')}
            </label>
            <label className="setting">
              <span>{t('voice')}</span>
              {available.length ? (
                <select value={available.some((v) => v.voiceURI === voice.voiceURI) ? voice.voiceURI ?? '' : ''}
                  onChange={(e) => prefs.setVoice({ voiceURI: e.target.value || null })}>
                  <option value="">{t('voiceAuto')}{auto ? ` (${auto.name})` : ''}</option>
                  {available.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
                </select>
              ) : <p className="note">{t('noVoices')}</p>}
            </label>
            <label className="setting">
              <span>{t('pitch')} · {voice.pitch.toFixed(1)}</span>
              <input type="range" min="0.5" max="1.8" step="0.1" value={voice.pitch} onChange={(e) => prefs.setVoice({ pitch: Number(e.target.value) })} />
            </label>
            <label className="setting">
              <span>{t('speed')} · {voice.rate.toFixed(1)}×</span>
              <input type="range" min="0.6" max="1.6" step="0.1" value={voice.rate} onChange={(e) => prefs.setVoice({ rate: Number(e.target.value) })} />
            </label>
            <div className="settings-actions">
              <button type="button" className="ghost" onClick={preview}>{t('preview')}</button>
            </div>
          </>
        ) : <p className="note">{t('noVoices')}</p>}
      </section>

      <section>
        <h3>{t('language')}</h3>
        <select value={lang} onChange={(e) => prefs.setLang(e.target.value as LangCode)} aria-label={t('language')}>
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </section>

      <div className="settings-actions">
        <button type="button" className="linkbtn" onClick={() => { prefs.setLook(DEFAULT_LOOK); prefs.setVoice({ ...DEFAULT_VOICE, enabled: voice.enabled }); }}>
          {t('reset')}
        </button>
      </div>
    </div>
  );
}
