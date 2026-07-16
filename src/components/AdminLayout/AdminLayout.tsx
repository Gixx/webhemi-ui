import type { ReactNode } from 'react';
import { Sidebar, type NavItem } from '../Sidebar/Sidebar';
import { TopBar } from '../TopBar/TopBar';
import { cn } from '../../lib/cn';

export interface AdminLayoutProps {
  brand?: string;
  navItems: NavItem[];
  userLabel?: string;
  topBarTitle?: string;
  topBarActions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AdminLayout({
  brand,
  navItems,
  userLabel,
  topBarTitle,
  topBarActions,
  children,
  className,
}: AdminLayoutProps) {
  return (
    <div className={cn('wh-ui flex min-h-screen bg-[var(--wh-color-canvas)]', className)}>
      <Sidebar brand={brand} items={navItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={topBarTitle} userLabel={userLabel} actions={topBarActions} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
