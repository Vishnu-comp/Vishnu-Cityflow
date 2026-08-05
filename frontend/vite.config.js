import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Styling: Tailwind v3 via postcss.config.js (picked up automatically by Vite).
// The browser only ever talks to this dev server (relative URLs);
// /api is proxied to Django in-process, so no CORS and no localhost leaks.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: false },
    },
  },
})
