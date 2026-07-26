import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * CSS-only build for @webhemi/ui → dist/index.css
 * - Sass compiles admin chrome/product
 * - Tailwind v4 via Vite plugin (theme + utilities, no Preflight)
 * - cssMinify: false — owned chrome uses `@media (not (hover))`
 * - Large assetsInlineLimit — sync-ui only copies index.css today
 */
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    cssMinify: false,
    assetsInlineLimit: 500_000,
    emptyOutDir: false,
    outDir: 'dist',
    rollupOptions: {
      input: path.resolve(root, 'src/styles/entry.js'),
      output: {
        entryFileNames: 'css-entry.js',
        assetFileNames: (info) => {
          if (info.name && info.name.endsWith('.css')) {
            return 'index.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
