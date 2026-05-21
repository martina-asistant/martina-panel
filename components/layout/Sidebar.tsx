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
    <aside
      className="
      w-64
      bg-[#03111A]
      border-r
      border-cyan-500/10
      text-white
      flex
      flex-col
      overflow-hidden
    "
    >

      {/* CABECERA */}

      <div className="px-4 pt-5 pb-5">

        <div
          className="
          rounded-[28px]
          border
          border-cyan-400/25
          bg-cyan-500/10
          px-5
          py-5
          flex
          items-center
          gap-4
          shadow-[0_0_30px_rgba(34,211,238,.08)]
        "
        >

          <div
            className="
            w-20
            h-20
            rounded-2xl
            overflow-hidden
            bg-[#061923]
            ring-2
            ring-cyan-400/50
            shadow-[0_0_28px_rgba(34,211,238,.35)]
            flex-shrink-0
          "
          >

            <img
              src="/martina-sidebar.png"
              alt="Martina"
              className="
                w-full
                h-full
                object-cover
                object-center
                scale-[1.18]
              "
            />

          </div>

          <div className="min-w-0">

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
              text-base
              font-semibold
              text-white
              leading-tight
              mt-1
            "
            >
              Panel clínico IA
            </div>

          </div>

        </div>

      </div>

      {/* MENÚ */}

      <nav className="px-4 pt-3 space-y-2">

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
                  border
                  border-cyan-400/20
                  text-cyan-300
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

      {/* FOOTER */}

      <div
        className="
        mt-auto
        px-5
        py-4
        border-t
        border-cyan-500/10
        text-xs
        text-gray-500
      "
      >

        Martina IA · v1.0

      </div>

    </aside>
  );
};

export default Sidebar;
