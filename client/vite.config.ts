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
      // Pointe vers le shared/ copié dans le container
      '../../../shared': path.resolve(__dirname, './shared'),
      '../../shared': path.resolve(__dirname, './shared'),
    },
  },
});
