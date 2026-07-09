import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        // Ignore server-side data files so that saving brand_config.json,
        // submissions_db.json, uploads, etc. does NOT trigger a full page reload.
        ignored: [
          '**/brand_config.json',
          '**/submissions_db.json',
          '**/consultants_db.json',
          '**/comments_db.json',
          '**/questions_db.json',
          '**/uploads/**',
          '**/*.log',
        ],
      },
    },
  };
});
