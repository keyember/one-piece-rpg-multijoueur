import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['rpg.oudinallan.dev'],
  },
  resolve: {
    alias: {
      // shared/ est copié à la racine du container (/app/shared)
      '../../../shared': path.resolve(__dirname, './shared'),
    },
  },
});
