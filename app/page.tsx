'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#020f14] overflow-y-auto">
      <div className="relative w-full">
        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="block w-full h-auto"
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
