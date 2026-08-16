import { defineConfig } from 'tsup';

/**
 * AssetMapper / browser importmap only provides React peers.
 * Package deps (clsx, Lexical, …) must be bundled — bare npm specifiers
 * are not resolvable in the browser.
 *
 * Do NOT use noExternal: [/(.*)/]: that also inlines React and causes
 * "Invalid hook call" (two Reacts).
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'browser',
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'scheduler',
    /^react\//,
    /^react-dom\//,
  ],
  noExternal: [
    'clsx',
    'lexical',
    'react-image-crop',
    /^@lexical\//,
    /^@floating-ui\//,
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
    options.conditions = ['import', 'module', 'browser', 'default'];
    options.mainFields = ['browser', 'module', 'main'];
  },
});
