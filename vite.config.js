import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API is served over plain http and may not send CORS headers,
// so requests go through a same-origin /api proxy.
const proxy = {
  '/api': {
    target: 'http://hyeumine.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
