'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#020f14] overflow-y-auto flex flex-col justify-between md:block">
      
      {/* 💻 VERSIÓN PC: Intacta, no se toca ni un solo píxel */}
      <div className="hidden md:relative md:block md:w-full">
        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="block w-full h-auto"
        />
        <div className="martina-halo" />
        
        <button
          onClick={() => router.push('/login')}
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

      {/* 📱 VERSIÓN MÓVIL: Optimizada para pantallas táctiles verticales */}
      <div className="flex flex-col flex-1 justify-between p-6 md:hidden">
        {/* Contenedor superior para la imagen y los textos */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 pt-8">
          <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            <img
              src="/martina-hero-v2.png" 
              alt="Martina Móvil"
              className="w-full h-full object-cover scale-[1.3] object-top mt-[-10px]" 
            />
          </div>
          
          <div className="space-y-3 px-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Hola, soy <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">Martina</span> 👋
            </h1>
            <p className="text-cyan-300/90 text-sm font-medium">
              Tu asistente virtual inteligente.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
              Gestiono conversaciones, citas, recordatorios y tareas mientras tú te centras en lo importante.
            </p>
          </div>
        </div>

        {/* Contenedor inferior para el botón táctil y el estado */}
        <div className="w-full space-y-5 pb-6">
          <button
            onClick={() => router.push('/login')}
            className="
              w-full py-4 rounded-full text-center font-bold tracking-[0.15em] uppercase text-slate-900
              bg-white shadow-[0_0_20px_rgba(36,244,234,0.4)]
              transition-all duration-300 active:scale-[0.965] touch-manipulation
            "
          >
            Acceder
          </button>
          
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            Martina activa
          </div>
        </div>
      </div>

    </main>
  );
};

export default Home;
