'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen w-screen bg-[#020f14] overflow-hidden flex items-center justify-center">
      <div className="relative w-[min(100vw,177.78vh)] h-[min(56.25vw,100vh)]">

        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="absolute inset-0 w-full h-full object-contain"
        />

        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Acceder al dashboard"
          className="
            absolute
            left-1/2
            top-[61.5%]
            w-[30%]
            h-[7.5%]
            -translate-x-1/2
            rounded-full
            bg-[#FAF9F4]/95
            text-[#061B22]
            font-bold
            tracking-[0.35em]
            text-[clamp(12px,1.4vw,22px)]
            border
            border-cyan-300
            shadow-[0_0_25px_rgba(34,211,238,.75)]
            transition-all
            duration-300
            hover:-translate-y-2
            hover:scale-105
            hover:shadow-[0_0_55px_rgba(34,211,238,1)]
          "
        >
          ACCEDER
        </button>

      </div>
    </main>
  );
};

export default Home;
