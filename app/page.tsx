'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#020f14] overflow-y-auto relative w-full">
      {/* =========================
          DESKTOP - NO TOCAR
      ========================== */}
      <div className="hidden md:relative md:block md:w-full">
        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="block w-full h-auto"
        />

        <div className="martina-halo" />

        <button
          onClick={() => router.push('/login')}
          aria-label="Acceder"
          className="
            absolute
            left-1/2
            top-[63.2%]
            w-[26.5%]
            h-[5.8%]
            -translate-x-1/2
            rounded-full
            bg-transparent
            cursor-pointer
            transition-transform
            duration-500
            ease-out
            hover:scale-[1.018]
            hover:shadow-[0_0_28px_rgba(36,244,234,0.85)]
            active:scale-[0.965]
            active:translate-y-[2px]
          "
        />
      </div>

      {/* =========================
          MÓVIL - VERSIÓN HÍBRIDA
      ========================== */}
      <div className="md:hidden min-h-screen bg-[#020f14]">
        {/* CABECERA VISUAL RECORTADA */}
        <div className="relative w-full">
          <img
            src="/martina-mobile-top.png"
            alt="Martina"
            className="block w-full h-auto"
          />

          {/* pequeño degradado para unir con la parte inferior */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#020f14]" />
        </div>

        {/* BLOQUE INFERIOR REAL */}
        <div className="-mt-2 px-5 pb-8">
          {/* Botón acceder */}
          <button
            onClick={() => router.push('/login')}
            className="
              w-full
              rounded-full
              border border-cyan-300/70
              bg-white
              py-4
              text-center
              text-[15px]
              font-bold
              uppercase
              tracking-[0.32em]
              text-slate-900
              shadow-[0_0_24px_rgba(34,211,238,0.38)]
              transition-all
              duration-300
              active:scale-[0.97]
            "
          >
            Acceder
          </button>

          {/* Martina activa */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-cyan-50/90">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.95)]" />
            <span>Martina activa</span>
          </div>

          {/* Cajas 2x2 */}
          <div className="mt-7 grid grid-cols-2 gap-4">
            {/* Caja 1 */}
            <div className="rounded-2xl border border-cyan-500/15 bg-[rgba(3,22,29,.72)] px-4 py-5 text-center shadow-[0_0_20px_rgba(34,211,238,.06)]">
              <div className="mb-3 flex justify-center">
                <svg
                  className="h-8 w-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,.35)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.9"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>

              <p className="text-[13px] leading-5 text-white/92">
                Respondiendo
                <br />
                consultas
              </p>
            </div>

            {/* Caja 2 */}
            <div className="rounded-2xl border border-cyan-500/15 bg-[rgba(3,22,29,.72)] px-4 py-5 text-center shadow-[0_0_20px_rgba(34,211,238,.06)]">
              <div className="mb-3 flex justify-center">
                <svg
                  className="h-8 w-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,.35)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.9"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <p className="text-[13px] leading-5 text-white/92">
                Gestionando
                <br />
                citas
              </p>
            </div>

            {/* Caja 3 */}
            <div className="rounded-2xl border border-cyan-500/15 bg-[rgba(3,22,29,.72)] px-4 py-5 text-center shadow-[0_0_20px_rgba(34,211,238,.06)]">
              <div className="mb-3 flex justify-center">
                <svg
                  className="h-8 w-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,.35)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.9"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>

              <p className="text-[13px] leading-5 text-white/92">
                Preparando
                <br />
                recordatorios
              </p>
            </div>

            {/* Caja 4 */}
            <div className="rounded-2xl border border-cyan-500/15 bg-[rgba(3,22,29,.72)] px-4 py-5 text-center shadow-[0_0_20px_rgba(34,211,238,.06)]">
              <div className="mb-3 flex justify-center">
                <svg
                  className="h-8 w-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,.35)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.9"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>

              <p className="text-[13px] leading-5 text-white/92">
                Lista para
                <br />
                ayudarte
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
