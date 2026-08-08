import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      // Allows: import { api } from '@/lib/axios'
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true, // Optional: if 5174 is taken, it fails instead of trying 5175
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
