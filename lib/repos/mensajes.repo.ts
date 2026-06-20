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

export async function enviarMensajePanelWhatsapp({
  conversationId,
  telefono,
  mensaje
}: {
  conversationId: string;
  telefono: string;
  mensaje: string;
}): Promise<{ ok: boolean; error?: string; message?: string }> {
  const telefonoLimpio = String(telefono || '').replace(/\D/g, '');
  const telefonoE164 = telefonoLimpio.startsWith('34')
    ? telefonoLimpio
    : `34${telefonoLimpio}`;

  const url =
    process.env.NEXT_PUBLIC_N8N_WHATSAPP_PANEL_SALIENTE_URL ||
    'https://sheilacg.app.n8n.cloud/webhook/whatsapp-panel-saliente';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      telefono: telefonoE164,
      mensaje,
      emisor: 'recepcion'
    })
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || 'Error enviando WhatsApp'
    };
  }

  return data;
}
