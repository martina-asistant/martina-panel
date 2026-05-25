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
          <div className="martina-halo" />

{/* Destellos fondo */}
<div className="absolute top-[18%] left-[30%] w-[4px] h-[4px] rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(36,244,234,0.9)] animate-pulse"></div>

<div className="absolute top-[23%] left-[42%] w-[3px] h-[3px] rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(36,244,234,0.8)] animate-pulse"></div>

<div className="absolute top-[28%] left-[68%] w-[5px] h-[5px] rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(36,244,234,0.9)] animate-pulse"></div>

<div className="absolute top-[39%] left-[21%] w-[3px] h-[3px] rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(36,244,234,0.8)] animate-pulse"></div>

<div className="absolute top-[46%] left-[74%] w-[4px] h-[4px] rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(36,244,234,0.9)] animate-pulse"></div>

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
    </main>
  );
};

export default Home;
