import { useLayoutEffect } from 'react';
import type { Preview, Decorator } from '@storybook/react-vite';
import '../src/styles/platform.css';
import '../src/admin/styles/fonts.css';
import '../src/admin/styles/tokens.css';
import '../src/admin/styles/entry.scss';
import '../src/themes/default/styles/tokens.css';

/**
 * Theme scope follows the story tree.
 *
 * Admin chrome styles nest under [data-wh-theme="admin"] and restyle raw
 * `button` / `input`. A sticky toolbar default of `admin` made Shared and
 * Default stories look Win98 even though CSS scoping was correct.
 *
 * - Admin/** → admin
 * - Shared/**, Themes/**, … → default
 */
function themeFromStoryTitle(title: string): 'admin' | 'default' {
  return title.startsWith('Admin/') ? 'admin' : 'default';
}

const withTheme: Decorator = (Story, context) => {
  const theme = themeFromStoryTitle(context.title);

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-wh-theme', theme);
  }, [theme]);

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-wh-theme', theme);
  }

  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description:
        'Follows the sidebar section (Admin → admin, otherwise default). Toolbar mirrors intent; section wins on navigation.',
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
    theme: 'default',
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
        desktop: { name: 'Desktop', value: 'var(--desktop, #008284)' },
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
