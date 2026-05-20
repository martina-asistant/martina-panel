'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const Topbar = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>('demo@martina.local');

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supa = createClient();
    supa.auth.getUser().then(({ data }) => { if (data.user?.email) setEmail(data.user.email); });
  }, []);

  const logout = async () => {
    if (isSupabaseConfigured()) {
      const supa = createClient();
      await supa.auth.signOut();
    }
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-14 border-b border-martina-border bg-white flex items-center justify-between px-6">
      <div className="text-sm text-martina-muted">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-martina-text">
          <User className="w-4 h-4 text-martina-muted" />
          <span>{email}</span>
        </div>
        <Button onClick={logout} variant="ghost" size="sm" className="text-martina-muted hover:text-martina-text">
          <LogOut className="w-4 h-4 mr-1.5" /> Salir
        </Button>
      </div>
    </header>
  );
};

export default Topbar;
