'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle, CalendarCheck, Bell, Sparkles } from 'lucide-react';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#020f14] overflow-y-auto relative w-full">
      {/* DESKTOP - NO TOCAR */}
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
            absolute left-1/2 top-[63.2%] w-[26.5%] h-[5.8%]
            -translate-x-1/2 rounded-full bg-transparent cursor-pointer
            transition-transform duration-500 ease-out
            hover:scale-[1.018]
            hover:shadow-[0_0_28px_rgba(36,244,234,0.85)]
            active:scale-[0.965] active:translate-y-[2px]
          "
        />
      </div>

      {/* MOBILE NUEVO */}
      <div className="relative block min-h-screen w-full md:hidden overflow-y-auto bg-[#020f14] text-white">
        <img
          src="/fondo.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_12%]"
        />

        <div className="absolute inset-0 bg-[#020f14]/20" />

        <section className="relative z-10 flex min-h-screen flex-col items-center px-6 pt-10 pb-10 text-center">
          <img
            src="/martina-avatarpanel.png"
            alt="Martina"
            className="w-[255px] rounded-full drop-shadow-[0_0_38px_rgba(34,211,238,.75)]"
          />

          <h1 className="mt-6 flex items-center justify-center gap-2 whitespace-nowrap text-[2.18rem] font-bold leading-tight">
  <span>
    Hola, soy{' '}
    <span className="text-cyan-300 drop-shadow-[0_0_18px_rgba(34,211,238,.9)]">
      Martina
    </span>
  </span>
  <span className="inline-block shrink-0 text-[2rem] animate-wave">👋</span>
</h1>

          <p className="mt-3 text-[0.82rem] uppercase tracking-[0.28em] text-cyan-300">
            Tu asistente virtual inteligente
          </p>

          <p className="mt-5 text-[1.05rem] leading-relaxed text-white/85">
            Gestiono conversaciones, citas, recordatorios y tareas mientras tú te centras en lo importante.
          </p>

          <button
            onClick={() => router.push('/login')}
            className="
              mt-8 w-full max-w-[330px] rounded-full border-2 border-cyan-300
              bg-white py-4 text-[1rem] font-bold tracking-[0.42em]
              text-[#071827] shadow-[0_0_34px_rgba(34,211,238,.75)]
              transition-all duration-300 active:scale-[0.965] active:translate-y-[2px]
            "
          >
            ACCEDER
          </button>

          <div className="mt-5 flex items-center justify-center gap-2.5 text-[1rem] text-white/95">
  <span className="h-3 w-3 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_16px_rgba(34,211,238,1)]" />
  <span>Martina activa</span>
</div>

          <div className="mt-8 grid w-full grid-cols-2 gap-3.5">
            {[
              [MessageCircle, 'Respondiendo consultas'],
              [CalendarCheck, 'Gestionando citas'],
              [Bell, 'Preparando recordatorios'],
              [Sparkles, 'Lista para ayudarte'],
            ].map(([Icon, text]: any) => (
              <div
                key={text}
                className="
  min-h-[108px] rounded-2xl border border-cyan-400/25
  bg-[#03111A]/55 px-3 py-4 backdrop-blur-xl
  shadow-[0_0_18px_rgba(34,211,238,.09)]
"
              >
                <Icon className="mx-auto mb-2.5 h-8 w-8 text-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,.85)]" />
                <p className="text-[0.88rem] leading-snug">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <style jsx>{`
          @keyframes wave {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(18deg); }
            40% { transform: rotate(-10deg); }
            60% { transform: rotate(14deg); }
            80% { transform: rotate(-6deg); }
          }

          .animate-wave {
            animation: wave 1.8s ease-in-out infinite;
            transform-origin: 70% 70%;
          }
        `}</style>
      </div>
    </main>
  );
};

export default Home;
