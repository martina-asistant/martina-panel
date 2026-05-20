'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { toast } from 'sonner';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!configured) {
      toast.success('Modo demo: acceso sin Supabase');
      router.push('/dashboard');
      return;
    }

    setLoading(true);

    const supa = createClient();

    const { error } = await supa.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-martina-bg">
      <Card className="w-full max-w-md border-martina-border shadow-sm">

        <CardHeader className="text-center space-y-2">

          <div className="mx-auto w-12 h-12 rounded-full bg-martina-beige flex items-center justify-center text-xl">
            🦷
          </div>

          <CardTitle className="text-2xl font-semibold tracking-tight">
            Martina Panel
          </CardTitle>

          <CardDescription className="text-martina-muted">
            Accede con tu cuenta
          </CardDescription>

        </CardHeader>

        <CardContent className="">

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@clinica.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña
              </Label>

              <Input
                id="password"
                type="password"
                required={configured}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-martina-text hover:bg-black text-white"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>

            {!configured && (
              <p className="text-xs text-center text-martina-muted pt-2">
                🔍 Supabase no configurado · modo demo con datos mock
              </p>
            )}

          </form>

        </CardContent>

      </Card>
    </div>
  );
};

export default LoginPage;
