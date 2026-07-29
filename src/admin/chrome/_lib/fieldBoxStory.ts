/** Shared Storybook argTypes for field-box atoms (Controls + Docs). */

export const fieldAccessKeyArgType = {
  control: 'text' as const,
  description:
    'Native access key on the control. When set and `label` is a plain string, underlines the first case-insensitive match.',
  table: {
    category: 'Accessibility',
    type: { summary: 'string' },
    defaultValue: { summary: 'undefined' },
  },
};

export const boxClassNameArgType = {
  control: 'text' as const,
  description: 'Extra class(es) on the `.field-box` wrapper (not the control).',
  table: {
    type: { summary: 'string' },
    defaultValue: { summary: 'undefined' },
  },
};

export const labelPositionArgType = {
  control: 'select' as const,
  options: ['before', 'above'] as const,
  description: 'Caption placement when `label` is set. Default `before`.',
  table: {
    type: { summary: "'before' | 'above'" },
    defaultValue: { summary: 'before' },
  },
};

export const fieldLabelArgType = {
  control: 'text' as const,
  description: 'When set, wraps control + caption in `.field-box` (requires `id`).',
  table: {
    type: { summary: 'ReactNode' },
    defaultValue: { summary: 'undefined' },
  },
};
