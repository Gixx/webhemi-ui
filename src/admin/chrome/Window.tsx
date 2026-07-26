import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type WindowProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/** Shell / dialog window chrome (not a tab panel — use {@link TabPanel}). */
export function Window({ className, children, ...rest }: WindowProps) {
  return (
    <div className={cn('window', className)} {...rest}>
      {children}
    </div>
  );
}

export type TitleBarProps = HTMLAttributes<HTMLDivElement> & {
  inactive?: boolean;
  children: ReactNode;
};

export function TitleBar({ inactive = false, className, children, ...rest }: TitleBarProps) {
  return (
    <div className={cn('title-bar', inactive && 'inactive', className)} {...rest}>
      {children}
    </div>
  );
}

export function TitleBarText({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('title-bar-text', className)} {...rest}>
      {children}
    </div>
  );
}

export function TitleBarControls({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('title-bar-controls', className)} {...rest}>
      {children}
    </div>
  );
}

export type TitleBarAction = 'Minimize' | 'Maximize' | 'Restore' | 'Help' | 'Close';

export type TitleBarControlProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  action: TitleBarAction;
};

export function TitleBarControl({ action, className, type = 'button', ...rest }: TitleBarControlProps) {
  return <button type={type} aria-label={action} className={cn(className)} {...rest} />;
}

export function WindowBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('window-body', className)} {...rest}>
      {children}
    </div>
  );
}

export function StatusBar({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('status-bar', className)} {...rest}>
      {children}
    </div>
  );
}

export function StatusBarField({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('status-bar-field', className)} {...rest}>
      {children}
    </p>
  );
}
