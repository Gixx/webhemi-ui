import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import {
  TitleBar,
  TitleBarControl,
  TitleBarControls,
  TitleBarText,
  Window,
  WindowBody,
} from '../../chrome';
import { cn } from '../../../lib/cn';
import type { TitleBarIconKind } from './titleBarIcon';

export type PaneWindowShellProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  /** Optional 16px glyph before the title (admin98 `.title-bar-text.*`). */
  titleIcon?: TitleBarIconKind;
  /** When omitted, a Close control is rendered. Pass `null` for no controls. */
  titleBarControls?: ReactNode | null;
  inactive?: boolean;
  statusBar?: ReactNode;
  children: ReactNode;
  /**
   * When true, adds `.resizable` (default false for dialogs).
   * Maximize / Restore title-bar controls are only valid when this is true —
   * callers must not offer them on fixed-size windows.
   */
  resizable?: boolean;
  bodyClassName?: string;
  width?: number | string;
};

/**
 * Shared Window + TitleBar + WindowBody shell for product pane bricks.
 * Not a Storybook brick by itself — used by Dialog/Icon/Wizard/Heading windows.
 */
export function PaneWindowShell({
  title,
  titleIcon,
  titleBarControls,
  inactive = false,
  statusBar,
  children,
  resizable = false,
  className,
  bodyClassName,
  width,
  style,
  ...rest
}: PaneWindowShellProps) {
  const mergedStyle: CSSProperties | undefined =
    width !== undefined ? { ...style, width } : style;

  const controls =
    titleBarControls === null
      ? null
      : (titleBarControls ?? (
          <TitleBarControls>
            <TitleBarControl action="Close" />
          </TitleBarControls>
        ));

  return (
    <Window className={cn(resizable && 'resizable', className)} style={mergedStyle} {...rest}>
      <TitleBar inactive={inactive}>
        <TitleBarText className={titleIcon}>{title}</TitleBarText>
        {controls}
      </TitleBar>
      <WindowBody className={bodyClassName}>{children}</WindowBody>
      {statusBar}
    </Window>
  );
}
