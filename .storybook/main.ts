import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
  ],
  framework: '@storybook/react-vite',
  staticDirs: [
    /** Manager logo / favicon */
    { from: '../src/admin/assets/logo', to: '/brand' },
    /** Same URL space as PHP AssetMapper (`assets/admin/` → `/assets/admin/`) */
    { from: '../src/admin/assets', to: '/assets/admin' },
  ],
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      build: {
        cssMinify: false,
        assetsInlineLimit: 0,
      },
    });
  },
};

export default config;
