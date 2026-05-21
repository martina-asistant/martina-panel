'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="fixed inset-0 bg-[#020f14] overflow-hidden">
      <img
        src="/martina-hero-v2.png"
        alt="Martina"
        className="absolute inset-0 w-full h-full object-cover object-center scale-[1.08] -translate-y-[3vh]"
      />

      <button
        onClick={() => router.push('/dashboard')}
        aria-label="Acceder al dashboard"
        className="
          absolute
          left-1/2
          top-[60.8%]
          w-[27.5%]
          h-[7.2%]
          -translate-x-1/2
          rounded-full
          bg-[#FAF9F4]
          border
          border-cyan-300
          text-[#061B22]
          font-bold
          tracking-[0.35em]
          text-[clamp(12px,1.3vw,22px)]
          shadow-[0_0_35px_rgba(34,211,238,.85)]
          transition-all
          duration-300
          hover:-translate-y-2
          hover:scale-105
          hover:shadow-[0_0_65px_rgba(34,211,238,1)]
        "
      >
        ACCEDER
      </button>
    </main>
  );
};

export default Home;
