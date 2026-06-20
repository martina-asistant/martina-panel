'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#020f14] overflow-y-auto relative w-full flex flex-col justify-between md:block">
      
      {/* 💻 VERSIÓN PC: Tu configuración exacta original e intocable */}
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

      {/* 📱 VERSIÓN MÓVIL: Mismo fondo con glow, botón táctil y las 4 cajas inferiores adaptadas */}
      <div className="relative flex flex-col min-h-screen w-full md:hidden justify-between p-5 pb-8">
        {/* Capa de fondo fija para preservar el arte original */}
        <div className="absolute inset-0 z-0">
          <img
            src="/martina-hero-v2.png" 
            alt="Martina Fondo"
            className="w-full h-full object-cover object-top opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020f14] via-[#020f14]/50 to-transparent" />
        </div>

        {/* 1. Zona Superior: Espaciador dinámico para dejar ver la cara de Martina */}
        <div className="relative z-10 h-[22vh]" />

        {/* 2. Zona Central: Textos principales y botón de acceso */}
        <div className="relative z-10 space-y-5 w-full backdrop-blur-sm bg-[#020f14]/40 p-5 rounded-3xl border border-cyan-500/10 shadow-[0_0_30px_rgba(2,15,20,0.8)]">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Hola, soy <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">Martina</span> 👋
            </h1>
            <p className="text-cyan-300/90 text-[11px] font-semibold uppercase tracking-[0.15em]">
              Tu asistente virtual inteligente
            </p>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto pt-1">
              Gestiono conversaciones, citas, recordatorios y tareas mientras tú te centras en lo importante.
            </p>
          </div>

          <div className="w-full space-y-3.5">
            <button
              onClick={() => router.push('/login')}
              className="
                w-full py-3.5 rounded-full text-center font-bold tracking-[0.15em] uppercase text-slate-900
                bg-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.6)]
                transition-all duration-300 active:scale-[0.965] touch-manipulation
              "
            >
              Acceder
            </button>
            
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              Martina activa
            </div>
          </div>
        </div>

        {/* 3. Zona Inferior: Las 4 cajas de estado organizadas en formato cuadrícula 2x2 */}
        <div className="relative z-10 grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-cyan-500/10">
          
          {/* Caja 1 */}
          <div className="flex flex-col items-center text-center p-3 rounded-xl bg-[#03161d]/60 border border-cyan-500/5 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            <svg className="w-5 h-5 text-cyan-400 mb-1.5 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[11px] text-slate-300 font-medium leading-tight">Respondiendo<br/>consultas</span>
          </div>

          {/* Caja 2 */}
          <div className="flex flex-col items-center text-center p-3 rounded-xl bg-[#03161d]/60 border border-cyan-500/5 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            <svg className="w-5 h-5 text-cyan-400 mb-1.5 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[11px] text-slate-300 font-medium leading-tight">Gestionando<br/>citas</span>
          </div>

          {/* Caja 3 */}
          <div className="flex flex-col items-center text-center p-3 rounded-xl bg-[#03161d]/60 border border-cyan-500/5 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            <svg className="w-5 h-5 text-cyan-400 mb-1.5 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-[11px] text-slate-300 font-medium leading-tight">Preparando<br/>recordatorios</span>
          </div>

          {/* Caja 4 */}
          <div className="flex flex-col items-center text-center p-3 rounded-xl bg-[#03161d]/60 border border-cyan-500/5 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            <svg className="w-5 h-5 text-cyan-400 mb-1.5 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="text-[11px] text-slate-300 font-medium leading-tight">Lista para<br/>ayudarte</span>
          </div>

        </div>
      </div>

    </main>
  );
};

export default Home;
