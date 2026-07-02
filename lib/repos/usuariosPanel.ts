import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import type { UsuarioPanel } from '@/lib/types/db.types';

export async function getUsuarioPanelByEmail(
  email: string
): Promise<UsuarioPanel | null> {
  const supa = createBrowserSupa();

  if (!supa || !email) return null;

  const { data, error } = await supa
    .from('usuarios_panel')
    .select('*')
    .eq('email', email)
    .eq('activo', true)
    .maybeSingle();

  if (error) {
    console.error('Error cargando usuario panel:', error);
    return null;
  }

  return data as UsuarioPanel | null;
}
