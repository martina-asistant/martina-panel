'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="fixed inset-0 bg-[#020f14] overflow-hidden flex items-center justify-center">
      <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden">
        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="w-full h-full object-contain scale-[1.14]"
        />

        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Acceder"
          className="
            absolute
            left-1/2
            top-[61%]
            w-[25%]
            h-[7%]
            -translate-x-1/2
            rounded-full
            bg-transparent
            cursor-pointer
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
