import { useEffect } from 'react';
import type { Preview, Decorator } from '@storybook/react-vite';
import '../src/shared/styles/base.css';
import '../src/admin/styles/tokens.css';
import '../src/themes/default/styles/tokens.css';

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) || 'admin';

  useEffect(() => {
    document.documentElement.setAttribute('data-wh-theme', theme);
  }, [theme]);

  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Admin Theme vs frontend theme tokens',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'admin', title: 'Admin Theme', right: 'CMS' },
          { value: 'default', title: 'Default', right: 'Frontend' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'admin',
  },
  decorators: [withTheme],
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
