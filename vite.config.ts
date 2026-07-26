import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@webhemi/ui': path.resolve(__dirname, 'src/index.ts'),
    },
  },
  build: {
    // Owned chrome uses `@media (not (hover))`; lightningcss minify can reject it.
    cssMinify: false,
  },
});
