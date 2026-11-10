import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { FacePreview } from './components/FacePreview';
import { PrefsProvider } from './prefs';
import './styles.css';

const faces = new URLSearchParams(window.location.search).has('faces');

createRoot(document.getElementById('root')!).render(
  <StrictMode><PrefsProvider>{faces ? <FacePreview /> : <App />}</PrefsProvider></StrictMode>,
);
