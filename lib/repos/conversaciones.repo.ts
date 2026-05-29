import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import { mockConversaciones } from '@/lib/mock/data';
import type { ConversacionWhatsapp, EstadoVisualConv, ModoAtencion } from '@/lib/types/db.types';
import { lastActivity } from '@/lib/utils/formatDate';

export async function listConversaciones(): Promise<ConversacionWhatsapp[]> {
  const supa = createBrowserSupa();
  if (!supa) {
    return [...mockConversaciones].sort((a, b) => new Date(lastActivity(b)).getTime() - new Date(lastActivity(a)).getTime());
  }
  const { data, error } = await supa
    .from('conversaciones_whatsapp')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) { console.error(error); return []; }
  return ((data || []) as ConversacionWhatsapp[]).sort(
    (a, b) => new Date(lastActivity(b)).getTime() - new Date(lastActivity(a)).getTime()
  );
}

async function updateConv(id: string, patch: Partial<ConversacionWhatsapp>): Promise<ConversacionWhatsapp | null> {
  const supa = createBrowserSupa();
  if (!supa) {
    const idx = mockConversaciones.findIndex(c => c.id === id);
    if (idx >= 0) {
      mockConversaciones[idx] = { ...mockConversaciones[idx], ...patch, updated_at: new Date().toISOString() } as ConversacionWhatsapp;
      return mockConversaciones[idx];
    }
    return null;
  }
  const { data, error } = await supa.from('conversaciones_whatsapp').update(patch).eq('id', id).select('*').single();
  if (error) { console.error(error); return null; }
  return data as ConversacionWhatsapp;
}

export function tomarConversacion(id: string, email: string) { return updateConv(id, { modo_atencion: 'recepcion' as ModoAtencion, estado_visual: 'recepcion' as EstadoVisualConv, asignado_a: email }); }

export function devolverAMartina(id: string) { return updateConv(id, { modo_atencion: 'ia' as ModoAtencion, estado_visual: 'nueva' as EstadoVisualConv, asignado_a: null }); }

export function cerrarGestion(id: string) { return updateConv(id, { modo_atencion: 'ia' as ModoAtencion, estado_cita: 'gestionada', asignado_a: null }); }

export function actualizarNotasConversacion(id: string, notas: string) {
  return updateConv(id, { notas_internas: notas });
}

export type CanalMartina = 'whatsapp' | 'llamadas';

export type ConfiguracionMartina = {
  id: string;
  canal: CanalMartina;
  activo: boolean;
  updated_at: string;
  updated_by: string | null;
};

export async function getConfiguracionMartina(): Promise<ConfiguracionMartina[]> {
  const supa = createBrowserSupa();

  if (!supa) {
    return [
      {
        id: 'mock-whatsapp',
        canal: 'whatsapp',
        activo: false,
        updated_at: new Date().toISOString(),
        updated_by: null
      },
      {
        id: 'mock-llamadas',
        canal: 'llamadas',
        activo: false,
        updated_at: new Date().toISOString(),
        updated_by: null
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

  return (data || []) as ConfiguracionMartina[];
}

export async function actualizarEstadoCanalMartina(
  canal: CanalMartina,
  activo: boolean,
  email?: string
): Promise<ConfiguracionMartina | null> {
  const supa = createBrowserSupa();

  if (!supa) {
    return {
      id: `mock-${canal}`,
      canal,
      activo,
      updated_at: new Date().toISOString(),
      updated_by: email || null
    };
  }

  const { data, error } = await supa
    .from('configuracion_martina')
    .update({
      activo,
      updated_at: new Date().toISOString(),
      updated_by: email || null
    })
    .eq('canal', canal)
    .select('*')
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data as ConfiguracionMartina;
}

export function activarCanalMartina(canal: CanalMartina, email?: string) {
  return actualizarEstadoCanalMartina(canal, true, email);
}

export function pausarCanalMartina(canal: CanalMartina, email?: string) {
  return actualizarEstadoCanalMartina(canal, false, email);
}
