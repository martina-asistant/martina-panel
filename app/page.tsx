'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#020f14] flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-[1600px] aspect-[16/9]">

        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Halo animado */}
        <div className="absolute left-1/2 top-[22%] w-[22%] aspect-square -translate-x-1/2 rounded-full border-2 border-cyan-300/70 shadow-[0_0_45px_rgba(34,211,238,.8)] animate-pulse pointer-events-none" />

        {/* Brillo Martina hover */}
        <div className="absolute left-1/2 top-[22%] w-[25%] aspect-square -translate-x-1/2 rounded-full hover:shadow-[0_0_80px_rgba(34,211,238,.9)] transition-all duration-500 cursor-pointer" />

        {/* Botón real encima del botón de la imagen */}
        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Acceder al dashboard"
          className="absolute left-1/2 top-[58%] w-[31%] h-[8%] -translate-x-1/2 rounded-full transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_0_45px_rgba(34,211,238,1)]"
        />
      </div>
    </main>
  );
};

export default Home;
