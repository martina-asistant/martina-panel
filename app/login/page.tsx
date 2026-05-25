'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const LoginPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    const supabase = createClient();

    if (!supabase) {
      setError('Supabase no está configurado.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Email o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#020f14] flex items-center justify-center px-6">
      <form
        onSubmit={handleLogin}
        className="
          w-full
          max-w-md
          rounded-3xl
          border
          border-cyan-400/20
          bg-[#03111A]/90
          p-8
          shadow-[0_0_45px_rgba(34,211,238,.16)]
        "
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent">
            Acceso Martina
          </h1>

          <p className="mt-3 text-sm text-cyan-100/70">
            Inicia sesión para acceder al panel.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-cyan-100/80 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="
                w-full
                rounded-2xl
                border
                border-cyan-400/20
                bg-white/5
                px-4
                py-3
                text-white
                outline-none
                focus:border-cyan-300/60
              "
            />
          </div>

          <div>
            <label className="block text-sm text-cyan-100/80 mb-2">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="
                w-full
                rounded-2xl
                border
                border-cyan-400/20
                bg-white/5
                px-4
                py-3
                text-white
                outline-none
                focus:border-cyan-300/60
              "
            />
          </div>

          {error && (
            <p className="text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              rounded-2xl
              bg-cyan-300
              py-3
              font-semibold
              text-[#03111A]
              transition-all
              duration-300
              hover:shadow-[0_0_25px_rgba(36,244,234,.65)]
              hover:scale-[1.015]
              active:scale-[0.97]
              disabled:opacity-60
            "
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default LoginPage;
