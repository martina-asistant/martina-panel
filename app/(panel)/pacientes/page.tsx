
import { redirect } from 'next/navigation';

import PacientesView from '@/components/pacientes/PacientesView';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PacientesPage() {
  const supabase = createClient();

  // Sin conexión configurada, no mostramos pacientes.
  if (!supabase) {
    return (
      <div className="p-8 text-white">
        No se puede conectar con Supabase.
      </div>
    );
  }

  // Comprobar la sesión actual.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Comprobar el usuario activo y su rol.
  const { data: usuario, error: usuarioError } =
    await supabase
      .from('usuarios_panel')
      .select('rol, activo')
      .eq('email', user.email ?? '')
      .eq('activo', true)
      .maybeSingle();

  if (
    usuarioError ||
    !usuario ||
    !['admin', 'recepcion'].includes(usuario.rol)
  ) {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-6 text-center text-white/70">
        No tienes permisos para acceder a Pacientes.
      </div>
    );
  }

  return <PacientesView />;
}
