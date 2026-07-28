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

/** Shared Controls / Docs args for every product window brick. */
export type WindowBrickShellArgs = {
  title: string;
  titleIcon: TitleBarIconOption;
  inactive: boolean;
  /** HTML `draggable` only — shell owns real drag behavior (Phase 5). */
  draggable: boolean;
  /** `.resizable` class only — shell owns resize handles (Phase 5). */
  resizable: boolean;
  /** Empty = no title-bar controls. */
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
    description: 'Adds .resizable layout class (no resize handles until Phase 5 shell)',
  },
  titleBarControls: {
    control: 'check',
    options: TITLE_BAR_CONTROL_OPTIONS,
    description: 'Which title-bar buttons to show (empty = none)',
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
  return {
    title: args.title,
    titleIcon: resolveTitleBarIcon(args.titleIcon),
    inactive: args.inactive,
    draggable: args.draggable,
    resizable: args.resizable,
    titleBarControls: renderTitleBarControls(args.titleBarControls),
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
