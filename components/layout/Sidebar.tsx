'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  PhoneCall,
  BellRing,
  LogOut
} from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/conversaciones', label: 'Conversaciones', icon: MessageSquare },
  { href: '/recordatorios', label: 'Recordatorios', icon: BellRing },
  { href: '/recalls', label: 'Recalls', icon: PhoneCall },
];

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const avatarKey = pathname;

  const cerrarSesion = async () => {
    const supa = createClient();

    if (!supa) return;

    await supa.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="w-full bg-[#03111A] border-b border-cyan-500/10 px-8 py-4">
      <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-8">
        <div className="rounded-3xl border border-cyan-400/25 bg-cyan-500/10 px-9 py-3 flex items-center gap-8 shadow-[0_0_30px_rgba(34,211,238,.10)]">
          <div
            key={avatarKey}
            className="
              w-[108px]
              h-[108px]
              rounded-full
              bg-white
              ring-2
              ring-cyan-400
              shadow-[0_0_25px_rgba(34,211,238,.5)]
              overflow-hidden
              flex-shrink-0
              animate-martina-spin
            "
          >
            <Image
              src="/martina-logo.png"
              alt="Martina"
              width={90}
              height={90}
              className="w-full h-full object-cover object-center scale-[1.50] translate-x-[4px] translate-y-[6px]"
            />
          </div>

          <div>
            <div className="text-[12px] tracking-[0.38em] text-cyan-300 font-semibold">
              MARTINA
            </div>

            <div className="text-[19px] font-semibold scale-y-[1.08] scale-x-[0.96] translate-x-[-5px] text-white leading-tight mt-1">
              Rambla Vilar Dental
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button
            onClick={cerrarSesion}
            className="
              flex items-center gap-2 px-4 py-2 rounded-xl text-xs
              border border-cyan-500/20
              bg-white/5
              text-cyan-100
              hover:bg-cyan-500/10
              hover:border-cyan-300/50
              hover:shadow-[0_0_20px_rgba(34,211,238,.18)]
              transition-all duration-300
            "
          >
            <LogOut className="w-4 h-4 text-cyan-300" />
            <span>Cerrar sesión</span>
          </button>

          <nav className="flex items-center gap-3 mt-12">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3 rounded-2xl text-sm transition-all duration-300 border',
                    active
                      ? 'bg-cyan-500/15 border-cyan-400/25 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,.10)]'
                      : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Sidebar;
