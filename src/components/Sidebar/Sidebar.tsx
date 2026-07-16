import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../Icon/Icon';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: IconName;
  active?: boolean;
}

export interface SidebarProps {
  brand?: string;
  items: NavItem[];
  className?: string;
}

export function Sidebar({ brand = 'WebHemi', items, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'wh-ui flex min-h-full w-60 flex-col border-r border-[var(--wh-color-line)] bg-[var(--wh-color-ink)] text-white',
        className,
      )}
    >
      <div className="border-b border-white/10 px-5 py-5">
        <p className="font-[family-name:var(--wh-font-display)] text-2xl tracking-tight">{brand}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Admin</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-[var(--wh-radius-sm)] px-3 py-2 text-sm transition',
              item.active
                ? 'bg-[var(--wh-color-accent)] text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white',
            )}
            aria-current={item.active ? 'page' : undefined}
          >
            {item.icon ? <Icon name={item.icon} /> : null}
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
