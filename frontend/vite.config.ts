import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// PWA (manifest, service worker, offline caching) is wired in Step 9.
// This config intentionally stays minimal until then.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
});
