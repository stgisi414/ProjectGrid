
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
        'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        host: true,
        port: 5173,
        allowedHosts: ['7969c1a0-c7c4-41f7-8580-eaa5fd43fba8-00-2x5wqrm6ysjf4.picard.replit.dev', 'projectgrid.tech', 'project-grid-stefdgisi.replit.app']
      },
      preview: {
        host: '0.0.0.0',
        port: 5173
      }
    };
});
