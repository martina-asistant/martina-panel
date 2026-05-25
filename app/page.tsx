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
    top-[63.2%]
    w-[26.5%]
    h-[5.8%]
    -translate-x-1/2
    rounded-full
    cursor-pointer

    bg-transparent

    transition-all
    duration-300
    ease-out

    hover:scale-[1.025]
    hover:drop-shadow-[0_0_18px_rgba(36,244,234,0.75)]

    active:scale-[0.96]
    active:translate-y-[2px]
  "
/>
      </div>
    </main>
  );
};

export default Home;
