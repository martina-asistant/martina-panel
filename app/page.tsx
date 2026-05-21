'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#020f14] flex justify-center overflow-x-hidden">
      <div className="relative w-screen min-h-screen">
        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="w-screen min-h-screen object-cover object-top"
        />

        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Acceder al dashboard"
          className="
            absolute
            left-1/2
            top-[52.5%]
            w-[27%]
            h-[7%]
            -translate-x-1/2
            rounded-full
            bg-transparent
            transition-all
            duration-300
            hover:-translate-y-2
            hover:scale-105
            hover:shadow-[0_0_55px_rgba(34,211,238,1)]
          "
        />
      </div>
    </main>
  );
};

export default Home;
