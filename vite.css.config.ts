import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Storybook serves `/assets/admin/**` via staticDirs (stable names).
 * PHP AssetMapper only serves *digested* public paths and rewrites relative
 * `url(...)` in CSS — absolute `/assets/admin/...` would 404 there.
 * Convert absolute Admin URLs to relative before writing dist/index.css.
 */
function adminAssetsRelativeForPhp(): Plugin {
  return {
    name: 'admin-assets-relative-for-php',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type !== 'asset' || !item.fileName.endsWith('.css')) {
          continue;
        }
        const source = typeof item.source === 'string' ? item.source : item.source.toString();
        item.source = source.replaceAll('/assets/admin/', './');
      }
    },
  };
}

/**
 * CSS-only build for @webhemi/ui → dist/index.css
 * - Sass compiles admin chrome/product
 * - Tailwind v4 via Vite plugin (theme + utilities, no Preflight)
 * - cssMinify: false — owned chrome uses `@media (not (hover))`
 * - assetsInlineLimit: 0 — never base64-inline images/fonts
 * - Source SCSS keeps `/assets/admin/...` for Storybook; build rewrites to `./` for PHP
 */
export default defineConfig({
  plugins: [tailwindcss(), adminAssetsRelativeForPhp()],
  build: {
    cssMinify: false,
    assetsInlineLimit: 0,
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
