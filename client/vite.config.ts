import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  // VITE_SERVER_URL injecté au build via docker-compose args
  // Ne jamais hardcoder d'URL ici
});
