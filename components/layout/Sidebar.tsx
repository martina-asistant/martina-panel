'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  PhoneCall,
  BellRing
} from 'lucide-react';

import { cn } from '@/lib/utils/cn';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/conversaciones', label: 'Conversaciones', icon: MessageSquare },
  { href: '/recordatorios', label: 'Recordatorios', icon: BellRing },
  { href: '/recalls', label: 'Recalls', icon: PhoneCall },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <header className="w-full bg-[#03111A] border-b border-cyan-500/10 px-8 py-4">

      <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-8">

        {/* TARJETA MARTINA */}

        <div className="rounded-3xl border border-cyan-400/25 bg-cyan-500/10 px-9 py-3 flex items-center gap-8 shadow-[0_0_30px_rgba(34,211,238,.10)]">

          {/* HALO AGUAMARINA CON FONDO BLANCO */}

         <div
  className="
    w-[104px]
    h-[104px]
    rounded-full
    bg-white
    ring-2
    ring-cyan-400
    shadow-[0_0_25px_rgba(34,211,238,.5)]
    overflow-hidden
    flex-shrink-0
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
          {/* TEXTO */}

          <div>

            <div
              className="
              text-[12px]
              tracking-[0.38em]
              text-cyan-300
              font-semibold
            "
            >
              MARTINA
            </div>

            <div
              className="
              text-[17px]
              font-semibold
              text-white
              leading-tight
              mt-1
            "
            >
              Rambla Vilar Dental
            </div>

          </div>

        </div>

        {/* MENÚ */}

        <nav className="flex items-center gap-3">

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

    </header>
  );
};

export default Sidebar;
