import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import type { CanalMartina, ConfiguracionMartina } from '@/lib/types/db.types';

export async function getConfiguracionMartina(): Promise<ConfiguracionMartina[]> {
  const supa = createBrowserSupa();

  if (!supa) {
    return [
      {
        id: 'mock-whatsapp',
        canal: 'whatsapp',
        activo: true,
        updated_at: new Date().toISOString(),
        updated_by: 'demo@martina.local'
      },
      {
        id: 'mock-llamadas',
        canal: 'llamadas',
        activo: true,
        updated_at: new Date().toISOString(),
        updated_by: 'demo@martina.local'
      }
    ];
  }

  const { data, error } = await supa
    .from('configuracion_martina')
    .select('*')
    .order('canal', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data as ConfiguracionMartina[];
}

export async function updateCanalMartina(
  canal: CanalMartina,
  activo: boolean,
  updated_by: string | null
): Promise<ConfiguracionMartina | null> {
  const supa = createBrowserSupa();

  if (!supa) {
    return {
      id: `mock-${canal}`,
      canal,
      activo,
      updated_at: new Date().toISOString(),
      updated_by
    };
  }

  const { data, error } = await supa
    .from('configuracion_martina')
    .update({
      activo,
      updated_at: new Date().toISOString(),
      updated_by
    })
    .eq('canal', canal)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data as ConfiguracionMartina | null;
}
