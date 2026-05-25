'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#020f14] overflow-y-auto">
      <section className="relative w-full overflow-hidden bg-[#020f14]">
        <img
          src="/fondo%20completo%20sin%20letras.png"
          alt="Fondo Martina"
          className="block w-full h-auto select-none"
        />

        <img
          src="/Martina%20sin%20fondo%202.png"
          alt="Martina"
          className="
            martina-float
            absolute
            left-1/2
            top-[6.5%]
            w-[27%]
            -translate-x-1/2
            select-none
            pointer-events-none
            drop-shadow-[0_0_28px_rgba(45,245,235,0.22)]
          "
        />

        <div className="absolute left-1/2 top-[49.5%] -translate-x-1/2 text-center w-full px-4">
          <h1 className="text-[clamp(34px,4.8vw,72px)] font-bold tracking-[-0.04em] text-white leading-none">
            Hola, soy <span className="text-[#24F4EA]">Martina</span> 👋
          </h1>

          <p className="mt-[1.2vw] text-[clamp(16px,1.8vw,28px)] font-medium text-[#24F4EA]">
            Tu asistente virtual inteligente.
          </p>

          <p className="mt-[1vw] text-[clamp(13px,1.25vw,20px)] text-white/80">
            Gestiono conversaciones, citas, recordatorios y tareas mientras tú te centras en lo importante.
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Acceder"
          className="
            martina-button-glow
            absolute
            left-1/2
            top-[66.2%]
            w-[31.2%]
            h-[7.2%]
            -translate-x-1/2
            rounded-full
            text-[clamp(13px,1.5vw,26px)]
            font-bold
            tracking-[0.42em]
            text-[#102331]
            bg-transparent
          "
        >
          ACCEDER
        </button>

        <div className="absolute left-1/2 top-[76.1%] -translate-x-1/2 flex items-center gap-3 text-white text-[clamp(13px,1.4vw,22px)]">
          <span className="w-[0.85em] h-[0.85em] rounded-full bg-[#24F4EA] shadow-[0_0_18px_rgba(36,244,234,0.95)]" />
          <span>Martina activa</span>
        </div>

        <div className="absolute left-[6.5%] right-[6.5%] bottom-[5.4%] grid grid-cols-4 text-center text-white text-[clamp(12px,1.35vw,22px)] leading-tight">
          <div className="pt-[5.2vw]">Respondiendo<br />consultas</div>
          <div className="pt-[5.2vw]">Gestionando<br />citas</div>
          <div className="pt-[5.2vw]">Preparando<br />recordatorios</div>
          <div className="pt-[5.2vw]">Lista para<br />ayudarte</div>
        </div>
      </section>
    </main>
  );
};

export default Home;
