'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#020f14] overflow-y-auto relative w-full">
      {/* PC */}
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

      {/* MÓVIL: imagen plana, sin reconstruir nada encima */}
      <div className="relative block w-full md:hidden">
        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="block w-full h-auto"
        />

        <button
          onClick={() => router.push('/login')}
          aria-label="Acceder"
          className="
            absolute
            left-1/2
            top-[63.2%]
            w-[80%]
            h-[5.8%]
            -translate-x-1/2
            rounded-full
            bg-transparent
            cursor-pointer
            active:scale-[0.965]
            touch-manipulation
          "
        />
      </div>
    </main>
  );
};

export default Home;
