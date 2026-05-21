'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="fixed inset-0 bg-[#020f14] overflow-hidden flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="w-full h-full object-contain"
        />

        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Acceder"
          className="
            absolute
            left-1/2
            top-[61.7%]
            w-[25%]
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
