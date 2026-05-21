'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#03151B] flex items-center justify-center overflow-hidden">
      <button
        onClick={() => router.push('/dashboard')}
        className="relative w-full h-screen flex items-center justify-center"
        aria-label="Acceder al dashboard"
      >
        <img
          src="/martina-hero.png"
          alt="Martina"
          className="w-full h-full object-cover"
        />
      </button>
    </main>
  );
};

export default Home;
