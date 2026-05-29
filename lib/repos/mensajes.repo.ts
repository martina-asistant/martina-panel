import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import { mockMensajes } from '@/lib/mock/data';
import type { MensajeWhatsapp } from '@/lib/types/db.types';

export async function listMensajesByConversation(conversationId: string): Promise<MensajeWhatsapp[]> {
  const supa = createBrowserSupa();

  if (!supa) {
    return mockMensajes
      .filter(m => m.conversation_id === conversationId)
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  }

  const { data, error } = await supa
    .from('mensajes_whatsapp')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return (data || []) as MensajeWhatsapp[];
}

export async function crearMensajeSaliente(conversationId: string, contenido: string): Promise<MensajeWhatsapp | null> {
  const supa = createBrowserSupa();

  const nuevo = {
    conversation_id: conversationId,
    direccion: 'saliente',
    tipo_emisor: 'recepcion',
    tipo_mensaje: 'texto',
    contenido_texto: contenido
  };

  if (!supa) {
    const mock = {
      ...nuevo,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    } as MensajeWhatsapp;

    mockMensajes.push(mock);
    return mock;
  }

  const { data, error } = await supa
    .from('mensajes_whatsapp')
    .insert(nuevo)
    .select('*')
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data as MensajeWhatsapp;
}
