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

export function tomarConversacion(id: string, email: string) {
  return updateConv(id, { modo_atencion: 'recepcion' as ModoAtencion, estado_visual: 'recepcion' as EstadoVisualConv, asignado_a: email });
}
export function devolverAMartina(id: string) {
  return updateConv(id, { modo_atencion: 'martina' as ModoAtencion, estado_visual: 'nueva' as EstadoVisualConv, asignado_a: null });
}
export function cerrarGestion(id: string) {
  return updateConv(id, { modo_atencion: 'martina' as ModoAtencion, estado_visual: 'gestionada' as EstadoVisualConv, estado_cita: 'gestionada', asignado_a: null });
}

export function actualizarNotasConversacion(id: string, notas: string) {
  return updateConv(id, { notas_internas: notas });
}
