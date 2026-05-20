'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, PhoneCall, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const nav = [
  { href: '/dashboard',       label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/conversaciones',  label: 'Conversaciones',icon: MessageSquare },
  { href: '/recalls',         label: 'Recalls',       icon: PhoneCall },
  { href: '/recordatorios',   label: 'Recordatorios', icon: BellRing },
];

const Sidebar = () => {
  const pathname = usePathname();
  return (
    <aside className="w-60 border-r border-martina-border bg-white flex flex-col">
      <div className="px-5 py-6 border-b border-martina-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-martina-beige flex items-center justify-center text-sm">🦷</div>
          <div>
            <div className="font-semibold tracking-tight text-martina-text">Martina</div>
            <div className="text-[11px] text-martina-muted -mt-0.5">Panel clínico</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active ? 'bg-martina-beige text-martina-text font-medium' : 'text-martina-muted hover:bg-martina-bg hover:text-martina-text'
              )}>
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-martina-border text-[11px] text-martina-muted">
        v1.0 · Clínica dental
      </div>
    </aside>
  );
};

export default Sidebar;
