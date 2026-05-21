'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen overflow-hidden relative bg-[#03151B] flex items-center justify-center">

      {/* partículas */}
      <div className="absolute inset-0">
        <div className="particle p1"></div>
        <div className="particle p2"></div>
        <div className="particle p3"></div>
        <div className="particle p4"></div>
      </div>

      {/* contenido */}
      <div className="relative animate-float">

        {/* halo respirando */}
        <div className="absolute inset-0 rounded-full animate-halo"></div>

        <img
          src="/martina-hero-v2.png"
          alt="Martina"
          className="w-[1100px] max-w-[95vw]"
        />

      </div>

      <style jsx>{`
      
      .animate-float{
        animation: float 6s ease-in-out infinite;
      }

      @keyframes float{
        0%{
          transform:translateY(0px);
        }
        50%{
          transform:translateY(-8px);
        }
        100%{
          transform:translateY(0px);
        }
      }

      .animate-halo{
        animation: halo 4s ease-in-out infinite;
      }

      @keyframes halo{
        0%{
          opacity:0.7;
          transform:scale(1);
        }

        50%{
          opacity:1;
          transform:scale(1.03);
        }

        100%{
          opacity:0.7;
          transform:scale(1);
        }
      }

      .particle{
        position:absolute;
        width:8px;
        height:8px;
        border-radius:50%;
        background:#58F0FF;
        opacity:.6;
      }

      .p1{
        top:20%;
        left:10%;
        animation:move1 10s infinite alternate;
      }

      .p2{
        top:70%;
        left:20%;
        animation:move2 12s infinite alternate;
      }

      .p3{
        top:30%;
        right:15%;
        animation:move3 9s infinite alternate;
      }

      .p4{
        bottom:15%;
        right:25%;
        animation:move4 14s infinite alternate;
      }

      @keyframes move1{
        to{transform:translate(80px,-40px);}
      }

      @keyframes move2{
        to{transform:translate(-50px,40px);}
      }

      @keyframes move3{
        to{transform:translate(40px,70px);}
      }

      @keyframes move4{
        to{transform:translate(-80px,-20px);}
      }

      `}</style>

    </main>
  );
};

export default Home;
