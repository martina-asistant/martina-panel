'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, PhoneCall, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/conversaciones', label: 'Conversaciones', icon: MessageSquare },
  { href: '/recalls', label: 'Recalls', icon: PhoneCall },
  { href: '/recordatorios', label: 'Recordatorios', icon: BellRing },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-cyan-500/10 bg-[#03111A] text-white flex flex-col overflow-hidden">
      <div className="px-4 pt-5 pb-4">
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-4 flex items-center gap-3">
          <img
  src="/martina-circle.png"
  alt="Martina"
  className="w-14 h-14 rounded-2xl object-cover shadow-[0_0_25px_rgba(34,211,238,.25)]"
/>

          <div>
            <div className="text-[11px] tracking-[0.35em] text-cyan-300 font-semibold">
              MARTINA
            </div>
            <div className="text-sm font-semibold text-white leading-tight">
              Panel clínico IA
            </div>
          </div>
        </div>
      </div>

      <nav className="px-4 pt-4 space-y-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300',
                active
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-5 py-4 border-t border-cyan-500/10 text-xs text-gray-500">
        Martina IA · v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
