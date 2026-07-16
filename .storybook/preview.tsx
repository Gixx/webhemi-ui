import type { Preview } from '@storybook/react-vite';
import '../src/styles/tokens.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'padded',
    backgrounds: {
      options: {
        canvas: { name: 'Canvas', value: 'var(--wh-color-canvas)' },
        ink: { name: 'Ink', value: 'var(--wh-color-ink)' },
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
