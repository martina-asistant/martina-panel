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

{/* Destellos fondo integrados */}

<div className="absolute top-[31%] left-[32%] w-[4px] h-[4px] rounded-full bg-cyan-200 opacity-80 animate-pulse
shadow-[0_0_4px_rgba(36,244,234,0.4),0_0_10px_rgba(36,244,234,0.25),0_0_18px_rgba(36,244,234,0.12)]"></div>

<div className="absolute top-[34%] left-[40%] w-[3px] h-[3px] rounded-full bg-cyan-200 opacity-70 animate-pulse
shadow-[0_0_3px_rgba(36,244,234,0.35),0_0_8px_rgba(36,244,234,0.2)]"></div>

<div className="absolute top-[36%] left-[66%] w-[5px] h-[5px] rounded-full bg-cyan-200 opacity-85 animate-pulse
shadow-[0_0_5px_rgba(36,244,234,0.45),0_0_12px_rgba(36,244,234,0.28),0_0_22px_rgba(36,244,234,0.15)]"></div>

<div className="absolute top-[43%] left-[24%] w-[3px] h-[3px] rounded-full bg-cyan-200 opacity-65 animate-pulse
shadow-[0_0_3px_rgba(36,244,234,0.35),0_0_8px_rgba(36,244,234,0.2)]"></div>

<div className="absolute top-[44%] left-[74%] w-[4px] h-[4px] rounded-full bg-cyan-200 opacity-80 animate-pulse
shadow-[0_0_4px_rgba(36,244,234,0.4),0_0_10px_rgba(36,244,234,0.25),0_0_18px_rgba(36,244,234,0.12)]"></div>
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
