'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="fixed inset-0 bg-[#020f14] overflow-hidden flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="
            w-full 
            h-full 
            object-contain
            scale-[1.08]
            md:scale-[1.03]
            lg:scale-100
          "
        />

        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Acceder"
          className="
            absolute
            left-1/2
            top-[61.7%]
            w-[25%]
            h-[7%]
            -translate-x-1/2
            rounded-full
            bg-transparent
            cursor-pointer
            transition-all
            duration-300
            ease-out
            hover:-translate-y-1
            hover:scale-[1.03]
            hover:shadow-[0_0_30px_rgba(34,211,238,.45)]
          "
        />
      </div>
    </main>
  );
};

export default Home;
