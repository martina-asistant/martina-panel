'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#083D49] relative overflow-hidden">

      {/* Halo fondo */}
      <div className="absolute w-[700px] h-[700px] rounded-full bg-cyan-400 opacity-10 blur-3xl"></div>

      <div className="relative z-10 text-center max-w-2xl px-6">

        {/* Avatar Martina */}
        <div className="relative flex justify-center mb-8">

          <div className="absolute w-[350px] h-[350px] rounded-full border border-cyan-300/30 animate-pulse"></div>

          <img
            src="/martina.png"
            alt="Martina"
            className="w-[320px] relative drop-shadow-2xl hover:scale-105 transition-all duration-500"
          />

        </div>

        <h1 className="text-5xl font-bold text-white mb-4">
          Hola, soy Martina 👋
        </h1>

        <p className="text-cyan-50 text-lg mb-8">
          Tu asistente virtual inteligente.
        </p>

        <p className="text-cyan-100/80 mb-10">
          Gestiono conversaciones, citas, recordatorios
          y tareas mientras tú te centras en lo importante.
        </p>

        <button
          onClick={() => router.push('/dashboard')}
          className="px-10 py-4 rounded-full bg-gradient-to-b from-[#F8EAD9] to-[#EFD9BE] text-black font-semibold shadow-xl hover:scale-105 transition"
        >
          ACCEDER
        </button>

        <div className="mt-10 text-cyan-100 text-sm">
          ● Martina activa
        </div>

      </div>

    </main>
  );
};

export default Home;
