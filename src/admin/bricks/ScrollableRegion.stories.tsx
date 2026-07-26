import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollableRegion } from './ScrollableRegion';

const meta = {
  title: 'Admin/Bricks/ScrollableRegion',
  parameters: { layout: 'centered' },
  render: () => (
    <div className="window" style={{ width: 320 }}>
      <div className="title-bar">
        <div className="title-bar-text">Scrollable region</div>
      </div>
      <div className="window-body">
        <ScrollableRegion className="sunken-panel" style={{ height: 160, width: '100%' }}>
          <p>Lorem ipsum dolor sit amet.</p>
          <p>
            Extra lines so the custom scrollbar can be exercised when the panel is short. Windows
            98 scrollbars used arrow buttons, a checkerboard track, and a raised thumb.
          </p>
          <p>
            The native browser scrollbar is hidden; useCustomScrollbar paints the Win98 chrome and
            keeps it in sync with scrollTop / scrollLeft.
          </p>
          <p>
            Resize the window or add more content — MutationObserver and ResizeObserver refresh the
            thumb size automatically.
          </p>
          <p>More content to force overflow on the vertical axis.</p>
          <p>Still more content for a usable thumb.</p>
        </ScrollableRegion>
      </div>
    </div>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {};
