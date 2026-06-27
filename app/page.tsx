'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle, CalendarCheck, Bell, Sparkles } from 'lucide-react';

const Home = () => {
  const router = useRouter();

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#020f14] text-white">
      <img
        src="/fondo.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 bg-[#020f14]/20" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <img
          src="/martina-hero-halo.png"
          alt="Martina"
          className="w-[210px] md:w-[300px] drop-shadow-[0_0_40px_rgba(34,211,238,.65)]"
        />

        <h1 className="mt-8 text-[2.8rem] md:text-[4.4rem] font-bold leading-none">
          Hola, soy{' '}
          <span className="text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,.9)]">
            Martina
          </span>
          <span className="inline-block ml-3 animate-wave">👋</span>
        </h1>

        <p className="mt-5 text-[0.82rem] md:text-xl uppercase tracking-[0.36em] text-cyan-300">
          Tu asistente virtual inteligente
        </p>

        <p className="mt-8 max-w-[760px] text-xl md:text-3xl leading-relaxed text-white/90">
          Gestiono conversaciones, citas, recordatorios y tareas
          <br className="hidden md:block" />
          mientras tú te centras en lo importante.
        </p>

        <button
          onClick={() => router.push('/login')}
          className="
            mt-12 w-[78vw] max-w-[620px] rounded-full border-2 border-cyan-300
            bg-white py-5 text-[1.05rem] md:text-2xl font-bold tracking-[0.45em]
            text-[#071827]
            shadow-[0_0_34px_rgba(34,211,238,.75)]
            transition-all duration-300
            hover:scale-[1.025] hover:shadow-[0_0_55px_rgba(34,211,238,1)]
            active:scale-[0.965]
          "
        >
          ACCEDER
        </button>

        <div className="mt-8 flex items-center gap-3 text-lg md:text-2xl text-white/95">
          <span className="h-3 w-3 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_16px_rgba(34,211,238,1)]" />
          Martina activa
        </div>

        <div className="mt-14 grid w-full max-w-[1020px] grid-cols-2 gap-5 md:grid-cols-4">
          {[
            [MessageCircle, 'Respondiendo consultas'],
            [CalendarCheck, 'Gestionando citas'],
            [Bell, 'Preparando recordatorios'],
            [Sparkles, 'Lista para ayudarte'],
          ].map(([Icon, text]: any) => (
            <div
              key={text}
              className="
                min-h-[145px] rounded-3xl border border-cyan-400/25
                bg-[#03111A]/55 px-4 py-7 backdrop-blur-xl
                shadow-[0_0_22px_rgba(34,211,238,.10)]
              "
            >
              <Icon className="mx-auto mb-4 h-12 w-12 text-cyan-300 drop-shadow-[0_0_18px_rgba(34,211,238,.9)]" />
              <p className="text-lg md:text-xl leading-snug">{text}</p>
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
    </main>
  );
};

export default Home;
