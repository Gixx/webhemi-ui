/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@webhemi/ui': path.resolve(__dirname, 'src/index.ts')
    }
  },
  build: {
    // Owned chrome uses `@media (not (hover))`; lightningcss minify can reject it.
    cssMinify: false
  },
  test: {
    // Coverage via `npm run test-storybook:coverage` or the Storybook testing widget.
    // Provider package: @vitest/coverage-v8 (already in devDependencies).
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.mdx',
        'src/**/index.ts',
      ],
    },
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      // Preview annotations (decorators, parameters, a11y) are applied automatically since SB 10.3 —
      // no `.storybook/vitest.setup.ts` with setProjectAnnotations needed.
      storybookTest({
        configDir: path.join(dirname, '.storybook'),
        storybookScript: 'npm run storybook -- --no-open',
      })],
      // Vitest browser mode uses optimizeDeps.noDiscovery; without pinning storybook/test,
      // its CJS-only deps (aria-query via @testing-library/dom) are served raw and fail
      // named ESM imports on npm's hoisted layout. Fixed upstream in SB 10.6+; keep until then.
      // See: https://github.com/vitejs/vite/issues/23030
      optimizeDeps: {
        include: ['storybook/test', '@testing-library/dom'],
      },
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});