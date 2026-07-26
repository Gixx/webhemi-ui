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

/**
 * In-window atoms sit on silver chrome surface (`--surface`), not the teal desktop.
 * Window stories keep the desktop so the full `.window` chrome is visible.
 * Use block layout (not a row flex) so sibling FieldRows stack vertically.
 */
const withAdminAtomSurface: Decorator = (Story, context) => {
  const { title } = context;
  const isInWindowAtom =
    title.startsWith('Admin/Atoms/') && !title.startsWith('Admin/Atoms/Window');

  if (!isInWindowAtom) {
    return <Story />;
  }

  return (
    <div
      style={{
        boxSizing: 'border-box',
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface, #c0c0c0)',
        color: 'var(--text-color, #222)',
        fontFamily: 'var(--font-chrome)',
        fontSize: 'var(--font-size-chrome)',
      }}
    >
      {/* Block wrapper: story roots (e.g. multiple FieldRows) stay in normal flow */}
      <div style={{ width: 'max-content', maxWidth: '100%' }}>
        <Story />
      </div>
    </div>
  );
};

/**
 * Chrome markup uses real `<a href>` (98 contract). In Storybook those would
 * navigate the iframe — block that for Admin atom / foundation demos.
 */
const withPreventStorybookLinkNavigation: Decorator = (Story, context) => {
  const { title } = context;
  if (!title.startsWith('Admin/Atoms/') && !title.startsWith('Admin/Foundations/')) {
    return <Story />;
  }

  return (
    <div
      onClickCapture={(event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
          return;
        }
        const anchor = target.closest('a[href]');
        if (anchor) {
          event.preventDefault();
        }
      }}
    >
      <Story />
    </div>
  );
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
  decorators: [withTheme, withPreventStorybookLinkNavigation, withAdminAtomSurface],
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
        surface: { name: 'Window surface', value: 'var(--surface, #c0c0c0)' },
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
