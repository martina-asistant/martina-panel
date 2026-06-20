'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#020f14] overflow-hidden relative w-full flex flex-col justify-between md:block">
      
      {/* 💻 VERSIÓN PC: Tu configuración exacta e intocable */}
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

      {/* 📱 VERSIÓN MÓVIL: Mismo fondo con glow plano, pero con botón elástico y accesible */}
      <div className="relative flex flex-col flex-1 justify-between min-h-screen w-full md:hidden">
        {/* Capa de fondo: Mapea la imagen completa preservando proporciones y el glow original */}
        <div className="absolute inset-0 z-0">
          <img
            src="/martina-hero-v2.png" 
            alt="Martina Fondo"
            className="w-full h-full object-cover object-top opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020f14] via-[#020f14]/40 to-transparent" />
        </div>

        {/* Capa de contenido: Flota por encima de la imagen sin romper el arte de fondo */}
        <div className="relative z-10 flex flex-col flex-1 justify-between p-6 pt-24 pb-8">
          
          {/* Espaciador invisible para que el texto baje y no tape la cara de Martina */}
          <div className="h-[25vh]" />

          {/* Bloque inferior con los textos y el acceso */}
          <div className="space-y-6 w-full backdrop-blur-sm bg-[#020f14]/40 p-4 rounded-3xl border border-cyan-500/10 shadow-[0_0_30px_rgba(2,15,20,0.8)]">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Hola, soy <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">Martina</span> 👋
              </h1>
              <p className="text-cyan-300/90 text-xs font-medium uppercase tracking-[0.18em]">
                Tu asistente virtual inteligente
              </p>
            </div>

            {/* El botón móvil ahora se estira al ancho del teléfono y es reactivo al tacto */}
            <div className="w-full space-y-4">
              <button
                onClick={() => router.push('/login')}
                className="
                  w-full py-3.5 rounded-full text-center font-bold tracking-[0.15em] uppercase text-slate-900
                  bg-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.6)]
                  transition-all duration-300 active:scale-[0.965] touch-manipulation
                "
              >
                Acceder
              </button>
              
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                Martina activa
              </div>
            </div>
          </div>

        </div>
      </div>

    </main>
  );
};

export default Home;
