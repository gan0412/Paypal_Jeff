import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, calls to /api are forwarded to the backend (FastAPI on :8000).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
});
