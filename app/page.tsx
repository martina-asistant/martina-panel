'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#02161B] text-white overflow-hidden flex items-center justify-center px-6 py-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#083D49_0%,#02161B_60%,#010A0D_100%)]" />

      <div className="absolute w-[900px] h-[900px] rounded-full bg-cyan-400/10 blur-3xl" />

      <section className="relative z-10 w-full max-w-6xl flex flex-col items-center justify-center text-center">

        <div className="relative w-[280px] h-[280px] md:w-[330px] md:h-[330px] mb-6 avatar-wrap">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-300 shadow-[0_0_45px_rgba(34,211,238,.75)] halo" />

          <img
            src="/martina-avatar.png"
            alt="Martina"
            className="absolute inset-0 w-full h-full object-cover rounded-full avatar-img"
          />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
          Hola, soy <span className="text-cyan-300">Martina</span> 👋
        </h1>

        <p className="text-cyan-300 text-xl md:text-2xl mb-4">
          Tu asistente virtual inteligente.
        </p>

        <p className="text-white/75 text-base md:text-xl max-w-4xl mb-8">
          Gestiono conversaciones, citas, recordatorios y tareas mientras tú te centras en lo importante.
        </p>

        <button
          onClick={() => router.push('/dashboard')}
          className="bg-[#FAF9F4] text-[#061B22] px-20 py-5 rounded-full text-xl font-bold tracking-[0.35em] border border-cyan-300 shadow-[0_0_35px_rgba(34,211,238,.75)] transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_0_60px_rgba(34,211,238,1)]"
        >
          ACCEDER
        </button>

        <div className="mt-6 flex items-center gap-3 text-lg text-white/85">
          <span className="w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,1)] animate-pulse" />
          Martina activa
        </div>

        <div className="mt-10 w-full max-w-5xl rounded-3xl border border-cyan-300/25 bg-cyan-950/20 backdrop-blur-md grid grid-cols-2 md:grid-cols-4 overflow-hidden">
          {[
            ['💬', 'Respondiendo', 'consultas'],
            ['📅', 'Gestionando', 'citas'],
            ['🔔', 'Preparando', 'recordatorios'],
            ['✨', 'Lista para', 'ayudarte'],
          ].map(([icon, line1, line2], index) => (
            <div key={index} className="py-7 px-4 border-cyan-300/20 md:border-r last:border-r-0">
              <div className="text-4xl mb-3">{icon}</div>
              <div className="text-lg">{line1}</div>
              <div className="text-lg">{line2}</div>
            </div>
          ))}
        </div>

      </section>

      <style jsx>{`
        .halo {
          animation: haloPulse 4s ease-in-out infinite;
        }

        .avatar-wrap:hover .avatar-img {
          transform: translateY(-6px) scale(1.05) rotateY(5deg);
          filter: drop-shadow(0 0 35px rgba(34, 211, 238, 0.85));
        }

        .avatar-img {
          transition: transform 500ms ease, filter 500ms ease;
          animation: subtleLife 7s ease-in-out infinite;
        }

        @keyframes haloPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.04);
            opacity: 1;
          }
        }

        @keyframes subtleLife {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.01);
          }
        }
      `}</style>
    </main>
  );
};

export default Home;
