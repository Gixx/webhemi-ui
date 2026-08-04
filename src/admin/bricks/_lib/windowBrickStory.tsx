import type { ArgTypes } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { TitleBarControl, TitleBarControls, type TitleBarAction } from '../../chrome';
import {
  resolveTitleBarIcon,
  TITLE_BAR_ICON_OPTIONS,
  type TitleBarIconOption,
} from './PaneWindowShell';

/** Title-bar control checkboxes (order matches Win98 convention). */
export const TITLE_BAR_CONTROL_OPTIONS: TitleBarAction[] = [
  'Minimize',
  'Maximize',
  'Restore',
  'Help',
  'Close',
];

/**
 * Maximize / Restore are invalid when the window is not resizable.
 * Story controls and shell props both go through this filter.
 */
export function titleBarActionsForResizable(
  actions: TitleBarAction[],
  resizable: boolean,
): TitleBarAction[] {
  if (resizable) {
    return actions;
  }
  return actions.filter((action) => action !== 'Maximize' && action !== 'Restore');
}

/** Shared Controls / Docs args for every product window brick. */
export type WindowBrickShellArgs = {
  title: string;
  titleIcon: TitleBarIconOption;
  inactive: boolean;
  /** HTML `draggable` only — shell owns real drag behavior (Phase 5). */
  draggable: boolean;
  /** `.resizable` class + shell resize handles. Maximize requires this. */
  resizable: boolean;
  /** Empty = no title-bar controls. Maximize/Restore ignored when `resizable` is false. */
  titleBarControls: TitleBarAction[];
};

export const windowBrickShellArgs: WindowBrickShellArgs = {
  title: 'Window',
  titleIcon: 'none',
  inactive: false,
  draggable: false,
  resizable: false,
  titleBarControls: ['Close'],
};

export const windowBrickShellArgTypes = {
  title: { control: 'text' },
  titleIcon: { control: 'select', options: [...TITLE_BAR_ICON_OPTIONS] },
  inactive: { control: 'boolean' },
  draggable: {
    control: 'boolean',
    description: 'HTML draggable attribute (no drag logic until Phase 5 shell)',
  },
  resizable: {
    control: 'boolean',
    description:
      'Adds .resizable layout class and enables Maximize/Restore (invalid when false)',
  },
  titleBarControls: {
    control: 'check',
    options: TITLE_BAR_CONTROL_OPTIONS,
    description:
      'Which title-bar buttons to show (empty = none). Maximize/Restore need resizable',
  },
} satisfies Partial<ArgTypes<WindowBrickShellArgs>>;

export function renderTitleBarControls(actions: TitleBarAction[]): ReactNode | null {
  if (actions.length === 0) {
    return null;
  }
  return (
    <TitleBarControls>
      {actions.map((action) => (
        <TitleBarControl key={action} action={action} />
      ))}
    </TitleBarControls>
  );
}

/** Map shared story args → PaneWindowShell / brick shell props. */
export function shellPropsFromArgs(args: WindowBrickShellArgs) {
  const titleBarControls = titleBarActionsForResizable(
    args.titleBarControls,
    args.resizable,
  );
  return {
    title: args.title,
    titleIcon: resolveTitleBarIcon(args.titleIcon),
    inactive: args.inactive,
    draggable: args.draggable,
    resizable: args.resizable,
    titleBarControls: renderTitleBarControls(titleBarControls),
  };
}

/** Pick shared shell fields from a wider story args object. */
export function pickShellArgs<T extends WindowBrickShellArgs>(args: T): WindowBrickShellArgs {
  return {
    title: args.title,
    titleIcon: args.titleIcon,
    inactive: args.inactive,
    draggable: args.draggable,
    resizable: args.resizable,
    titleBarControls: args.titleBarControls,
  };
}
