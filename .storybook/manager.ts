import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

/**
 * Storybook manager chrome (sidebar, toolbar) — not the preview canvas.
 * Brand image is served via staticDirs → /brand/webhemi.svg
 */
addons.setConfig({
  theme: create({
    base: 'light',

    // Accent from WebHemi pixel logo (#88171d)
    colorPrimary: '#88171d',
    colorSecondary: '#88171d',

    appBg: '#f4f4f4',
    appContentBg: '#ffffff',
    appPreviewBg: '#ffffff',
    appBorderColor: 'rgba(27, 27, 27, 0.12)',
    appBorderRadius: 2,

    // Prefer system UI for manager; product fonts stay in the canvas
    fontBase: 'system-ui, sans-serif',
    fontCode: 'ui-monospace, monospace',

    textColor: '#1b1b1b',
    textInverseColor: '#ffffff',
    textMutedColor: '#6b6a6f',

    barTextColor: '#1b1b1b',
    barSelectedColor: '#88171d',
    barHoverColor: '#88171d',
    barBg: '#ececec',

    buttonBg: '#ffffff',
    buttonBorder: 'rgba(27, 27, 27, 0.2)',
    booleanBg: '#e8e8e8',
    booleanSelectedBg: '#88171d',

    inputBg: '#ffffff',
    inputBorder: 'rgba(27, 27, 27, 0.25)',
    inputTextColor: '#1b1b1b',
    inputBorderRadius: 2,

    brandTitle: 'WebHemi UI',
    brandUrl: './',
    brandImage: '/brand/webhemi.svg',
    brandTarget: '_self',
  }),
});
