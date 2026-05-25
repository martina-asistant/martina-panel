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

{/* Destellos tipo estrella mejorados */}

<div className="absolute top-[31%] left-[32%] text-[#8EFDF4] text-[12px] opacity-90 animate-pulse
drop-shadow-[0_0_3px_rgba(36,244,234,0.95)]
[filter:drop-shadow(0_0_8px_rgba(36,244,234,0.75))_drop-shadow(0_0_18px_rgba(36,244,234,0.35))]
select-none">✦</div>

<div className="absolute top-[34%] left-[40%] text-[#8EFDF4] text-[10px] opacity-80 animate-pulse
drop-shadow-[0_0_2px_rgba(36,244,234,0.9)]
[filter:drop-shadow(0_0_6px_rgba(36,244,234,0.65))_drop-shadow(0_0_14px_rgba(36,244,234,0.25))]
select-none">✦</div>

<div className="absolute top-[36%] left-[66%] text-[#8EFDF4] text-[14px] opacity-100 animate-pulse
drop-shadow-[0_0_4px_rgba(36,244,234,1)]
[filter:drop-shadow(0_0_10px_rgba(36,244,234,0.8))_drop-shadow(0_0_22px_rgba(36,244,234,0.4))]
select-none">✦</div>

<div className="absolute top-[43%] left-[24%] text-[#8EFDF4] text-[10px] opacity-75 animate-pulse
drop-shadow-[0_0_2px_rgba(36,244,234,0.9)]
[filter:drop-shadow(0_0_6px_rgba(36,244,234,0.65))_drop-shadow(0_0_14px_rgba(36,244,234,0.25))]
select-none">✦</div>

<div className="absolute top-[44%] left-[74%] text-[#8EFDF4] text-[12px] opacity-90 animate-pulse
drop-shadow-[0_0_3px_rgba(36,244,234,0.95)]
[filter:drop-shadow(0_0_8px_rgba(36,244,234,0.75))_drop-shadow(0_0_18px_rgba(36,244,234,0.35))]
select-none">✦</div>
        
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
