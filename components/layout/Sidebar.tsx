'use client';

import Link from 'next/link';
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
  { href: '/recalls', label: 'Recalls', icon: PhoneCall },
  { href: '/recordatorios', label: 'Recordatorios', icon: BellRing },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="
      w-64
      border-r
      border-cyan-500/10
      bg-[#03111A]
      text-white
      flex
      flex-col
      relative
      overflow-hidden
    ">

      {/* halo fondo */}
      <div className="
        absolute
        top-[-100px]
        left-[-60px]
        w-[220px]
        h-[220px]
        rounded-full
        bg-cyan-400/10
        blur-3xl
      " />

      {/* cabecera Martina */}
      <div className="
        px-5
        py-6
        border-b
        border-cyan-500/10
        relative
        z-10
      ">

        <div className="flex items-center gap-3">

          <img
            src="/martina-circle.png"
            alt="Martina"
            className="
              w-12
              h-12
              rounded-full
              object-cover
              ring-2
              ring-cyan-400/50
            "
          />

          <div>

            <div className="
              font-semibold
              text-white
              tracking-tight
            ">
              Martina
            </div>

            <div className="
              text-xs
              text-cyan-300
            ">
              Panel clínico IA
            </div>

          </div>

        </div>

      </div>

      {/* menú */}
      <nav className="
        flex-1
        px-3
        py-4
        space-y-2
        relative
        z-10
      ">

        {nav.map(({ href, label, icon: Icon }) => {

          const active = pathname?.startsWith(href);

          return (

            <Link
              key={href}
              href={href}
              className={cn(
                `
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-xl
                text-sm
                transition-all
                duration-300
                `,
                active
                  ? `
                  bg-cyan-500/15
                  text-cyan-300
                  border
                  border-cyan-400/20
                  `
                  : `
                  text-gray-400
                  hover:bg-white/5
                  hover:text-white
                  `
              )}
            >

              <Icon className="w-4 h-4" />

              <span>{label}</span>

            </Link>

          );

        })}

      </nav>

      {/* pie */}
      <div className="
        px-5
        py-4
        border-t
        border-cyan-500/10
        text-xs
        text-gray-500
      ">

        Martina IA · v1.0

      </div>

    </aside>
  );
};

export default Sidebar;
