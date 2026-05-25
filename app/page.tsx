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
    cursor-pointer
    bg-cyan-300/0
    transition-all
    duration-300
    ease-out
    hover:bg-cyan-300/10
    hover:shadow-[0_0_35px_rgba(36,244,234,0.9)]
    hover:scale-[1.025]
    active:scale-[0.96]
    active:translate-y-[2px]
  "
/>
      </div>
    </main>
  );
};

export default Home;
