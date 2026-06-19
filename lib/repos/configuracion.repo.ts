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

  const ahora = new Date().toISOString();

  const { data: estadoActual, error: errorEstado } = await supa
    .from('configuracion_martina')
    .select('*')
    .eq('canal', canal)
    .maybeSingle();

  if (errorEstado) {
    console.error('Error leyendo estado actual Martina:', errorEstado);
    return null;
  }

  const activoAnterior = estadoActual?.activo ?? null;

  const { data, error } = await supa
    .from('configuracion_martina')
    .update({
      activo,
      updated_at: ahora,
      updated_by
    })
    .eq('canal', canal)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Error actualizando configuración Martina:', error);
    return null;
  }

  let minutosDesactivado: number | null = null;

  if (activoAnterior === false && activo === true) {
    const { data: ultimoApagado, error: errorUltimoApagado } = await supa
      .from('configuracion_martina_log')
      .select('created_at')
      .eq('canal', canal)
      .eq('activo_nuevo', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errorUltimoApagado) {
      console.error('Error buscando último apagado Martina:', errorUltimoApagado);
    }

    if (ultimoApagado?.created_at) {
      minutosDesactivado = Math.round(
        (new Date(ahora).getTime() -
          new Date(ultimoApagado.created_at).getTime()) /
          60000
      );
    }
  }

  const { error: errorLog } = await supa
  .from('configuracion_martina_log')
  .insert({
    canal,
    activo_anterior: activoAnterior,
    activo_nuevo: activo,
    accion: activo ? 'activado' : 'desactivado',
    updated_by,
    minutos_desactivado: minutosDesactivado,

    fecha_hora: new Date().toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  });

  if (errorLog) {
    console.error('Error insertando log Martina:', errorLog);
  }

  return data as ConfiguracionMartina | null;
}
