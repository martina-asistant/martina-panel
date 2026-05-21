'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#020f14] overflow-hidden">
      <div className="relative w-screen h-screen">

        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Zona hover sobre Martina: solo brillo, sin halo extra */}
        <div
          className="
            absolute 
            left-1/2 
            top-[19%] 
            w-[23%] 
            aspect-square 
            -translate-x-1/2 
            rounded-full 
            transition-all 
            duration-500 
            hover:shadow-[0_0_80px_rgba(34,211,238,.9)]
            cursor-pointer
          "
        />

        {/* Botón real encima del botón de la imagen */}
        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Acceder al dashboard"
          className="
            absolute 
            left-1/2 
            top-[54.5%] 
            w-[28%] 
            h-[7%] 
            -translate-x-1/2 
            rounded-full 
            transition-all 
            duration-300 
            hover:-translate-y-2 
            hover:scale-105 
            hover:shadow-[0_0_45px_rgba(34,211,238,1)]
          "
        />

      </div>
    </main>
  );
};

export default Home;
