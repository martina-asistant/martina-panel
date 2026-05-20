import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import { mockMensajes } from '@/lib/mock/data';
import type { MensajeWhatsapp } from '@/lib/types/db.types';

export async function listMensajesByConversation(conversationId: string): Promise<MensajeWhatsapp[]> {
  const supa = createBrowserSupa();
  if (!supa) return mockMensajes.filter(m => m.conversation_id === conversationId).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  const { data, error } = await supa
    .from('mensajes_whatsapp')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) { console.error(error); return []; }
  return (data || []) as MensajeWhatsapp[];
}
