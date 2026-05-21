'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="fixed inset-0 bg-[#020f14] overflow-hidden">
      <img
        src="/martina-hero-v2.png"
        alt="Martina"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <button
        onClick={() => router.push('/dashboard')}
        aria-label="Acceder"
        className="
          absolute
          left-1/2
          top-[56.8%]
          w-[22%]
          h-[6.5%]
          -translate-x-1/2
          rounded-full
          bg-transparent
          cursor-pointer
        "
      />
    </main>
  );
};

export default Home;
