import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Peer deps only — bundle everything else (e.g. clsx) for AssetMapper consumers.
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  noExternal: ['clsx'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
});
