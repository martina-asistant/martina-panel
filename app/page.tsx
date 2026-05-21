'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#03151B]">

      <img
        src="/martina-hero-v2.png"
        alt="Martina"
        className="
          absolute
          inset-0
          w-full
          h-full
          object-cover
          object-top
        "
      />

      {/* zona clicable INVISIBLE encima del botón que YA existe */}
      <button
        onClick={() => router.push('/dashboard')}
        aria-label="Acceder"
        className="
          absolute
          left-1/2
          top-[67.2%]
          w-[24%]
          h-[7%]
          -translate-x-1/2
          bg-transparent
          rounded-full
          transition-all
          duration-300
          hover:scale-105
        "
      />

      <style jsx>{`
      
      button:hover{
        filter: drop-shadow(0 0 30px rgba(34,211,238,1));
      }

      `}</style>

    </main>
  );
};

export default Home;
