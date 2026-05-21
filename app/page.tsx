'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="fixed inset-0 bg-[#020f14] overflow-hidden flex items-center justify-center">
      <div className="relative w-[min(100vw,150vh)] h-[min(100vh,66.666vw)]">
        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="absolute inset-0 w-full h-full object-contain"
        />

        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Acceder"
          className="
            absolute
            left-1/2
            top-[61.7%]
            w-[28%]
            h-[7%]
            -translate-x-1/2
            rounded-full
            bg-transparent
            cursor-pointer
          "
        />
      </div>
    </main>
  );
};

export default Home;
