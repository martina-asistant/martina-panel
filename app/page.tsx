'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle, CalendarCheck, Bell, Sparkles } from 'lucide-react';

const Home = () => {
  const router = useRouter();

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#020f14] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-100"
        style={{ backgroundImage: "url('/fondo.png')" }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.13),transparent_42%)]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center">
        <img
          src="/martina-hero-halo.png"
          alt="Martina"
          className="mb-5 w-[190px] md:w-[260px] drop-shadow-[0_0_35px_rgba(34,211,238,.55)]"
        />

        <h1 className="text-[2.7rem] md:text-6xl font-bold leading-tight tracking-tight">
          Hola, soy <span className="text-cyan-300 drop-shadow-[0_0_18px_rgba(34,211,238,.8)]">Martina</span>
          <span className="inline-block animate-wave ml-2">👋</span>
        </h1>

        <p className="mt-4 text-[0.78rem] md:text-lg uppercase tracking-[0.32em] text-cyan-300">
          Tu asistente virtual inteligente
        </p>

        <p className="mt-6 max-w-[680px] text-lg md:text-2xl leading-relaxed text-white/85">
          Gestiono conversaciones, citas, recordatorios y tareas
          <br className="hidden md:block" /> mientras tú te centras en lo importante.
        </p>

        <button
          onClick={() => router.push('/login')}
          className="
            mt-10 w-full max-w-[520px] rounded-full border border-cyan-300
            bg-white px-10 py-4 text-lg md:text-2xl font-bold tracking-[0.42em]
            text-[#061824] shadow-[0_0_28px_rgba(34,211,238,.65)]
            transition-all duration-300 hover:scale-[1.025] hover:shadow-[0_0_42px_rgba(34,211,238,.95)]
            active:scale-[0.97]
          "
        >
          ACCEDER
        </button>

        <div className="mt-7 flex items-center gap-3 text-lg md:text-xl text-white/90">
          <span className="h-3 w-3 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_14px_rgba(34,211,238,.95)]" />
          Martina activa
        </div>

        <div className="mt-12 grid w-full max-w-[900px] grid-cols-2 md:grid-cols-4 gap-4">
          {[
            [MessageCircle, 'Respondiendo consultas'],
            [CalendarCheck, 'Gestionando citas'],
            [Bell, 'Preparando recordatorios'],
            [Sparkles, 'Lista para ayudarte'],
          ].map(([Icon, text]: any) => (
            <div
              key={text}
              className="
                rounded-2xl border border-cyan-400/25 bg-[#03111A]/65
                px-4 py-6 backdrop-blur-xl shadow-[0_0_22px_rgba(34,211,238,.10)]
              "
            >
              <Icon className="mx-auto mb-4 h-10 w-10 text-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,.85)]" />
              <p className="text-base md:text-lg leading-snug">{text}</p>
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
