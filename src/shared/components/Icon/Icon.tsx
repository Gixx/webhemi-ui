import type { SVGProps } from 'react';
import { cn } from '../../../lib/cn';

export type IconName =
  | 'dashboard'
  | 'users'
  | 'sites'
  | 'hosts'
  | 'roles'
  | 'settings'
  | 'logout'
  | 'check'
  | 'alert'
  | 'chevron';

const paths: Record<IconName, string> = {
  dashboard: 'M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h5v8H3v-8zm7 0h11v8H10v-8z',
  users:
    'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z',
  sites: 'M4 4h16v4H4V4zm0 6h10v10H4V10zm12 0h4v10h-4V10z',
  hosts: 'M12 2L2 7l10 5 10-5-10-5zm0 9L2 7v10l10 5 10-5V7l-10 4z',
  roles: 'M12 1l3 6h7l-5.5 4.5L18 19l-6-3.5L6 19l1.5-7.5L2 7h7l3-6z',
  settings:
    'M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm9 4a7.9 7.9 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a8.2 8.2 0 0 0-2.1-1.2L16 2h-4l-.4 2.6a8.2 8.2 0 0 0-2.1 1.2l-2.4-1-2 3.4 2 1.6A7.9 7.9 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a8.2 8.2 0 0 0 2.1 1.2L12 22h4l.4-2.6a8.2 8.2 0 0 0 2.1-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  logout: 'M10 4H4v16h6v-2H6V6h4V4zm3.5 4l-1.4 1.4L15.7 12l-3.6 2.6L13.5 16 20 12l-6.5-4z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  alert: 'M12 2 1 21h22L12 2zm0 6h.01v6H12V8zm0 8h.01v2H12v-2z',
  chevron: 'M9 6l6 6-6 6',
};

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  title?: string;
}

export function Icon({ name, title, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className={cn('wh-ui inline-block shrink-0 fill-current', className)}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d={paths[name]} />
    </svg>
  );
}
