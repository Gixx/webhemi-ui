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
  /** Manager logo / favicon — src/admin/assets/logo/webhemi.svg */
  staticDirs: [{ from: '../src/admin/assets/logo', to: '/brand' }],
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      build: {
        cssMinify: false,
      },
    });
  },
};

export default config;
