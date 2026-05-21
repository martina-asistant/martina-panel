'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center overflow-hidden relative bg-gradient-to-b from-[#02161B] via-[#06313B] to-[#041C22]">

      {/* Partículas */}
      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute top-[15%] left-[20%] w-2 h-2 rounded-full bg-cyan-300 opacity-70 animate-pulse"></div>

        <div className="absolute top-[30%] right-[15%] w-1 h-1 rounded-full bg-cyan-200 opacity-70 animate-pulse"></div>

        <div className="absolute bottom-[20%] left-[25%] w-2 h-2 rounded-full bg-cyan-200 opacity-70 animate-pulse"></div>

      </div>


      <div className="relative z-10 max-w-2xl text-center px-6">

        {/* Avatar */}
        <div className="relative flex justify-center mb-6">

          {/* Halo */}
          <div className="absolute w-[420px] h-[420px] rounded-full border-2 border-cyan-300/70 animate-pulse"></div>

          {/* Glow */}
          <div className="absolute w-[380px] h-[380px] rounded-full bg-cyan-400 opacity-10 blur-3xl"></div>

          <img
            src="/martina.png"
            alt="Martina"
            className="
            relative
            w-[330px]
            drop-shadow-2xl
            transition-all
            duration-500
            hover:scale-110
            hover:-translate-y-2
            cursor-pointer
            "
          />

        </div>


        <h1 className="text-5xl font-bold text-white mb-3">
          Hola, soy <span className="text-cyan-300">Martina</span> 👋
        </h1>

        <p className="text-cyan-300 text-xl mb-5">
          Tu asistente virtual inteligente.
        </p>

        <p className="text-cyan-100/80 mb-10 leading-8">
          Gestiono conversaciones, citas, recordatorios y tareas
          mientras tú te centras en lo importante.
        </p>


        <button
          onClick={() => router.push('/dashboard')}
          className="
          px-16
          py-5
          rounded-full
          bg-[#FAF8F3]
          text-black
          font-semibold
          tracking-[0.2em]
          border
          border-cyan-300
          shadow-[0_0_35px_rgba(0,255,255,.45)]
          hover:scale-105
          transition-all
          duration-500
          "
        >
          ACCEDER
        </button>


        <div className="mt-6 text-cyan-100">
          ● Martina activa
        </div>

      </div>

    </main>
  );
};

export default Home;
