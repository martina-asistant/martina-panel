import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import { mockMensajes } from '@/lib/mock/data';
import type { MensajeWhatsapp } from '@/lib/types/db.types';

const ATTACHMENTS_BUCKET = 'whatsapp-adjuntos';

function getStoragePathFromUrl(url?: string | null): string | null {
  if (!url) return null;

  const raw = String(url).trim();
  if (!raw) return null;

  if (!raw.startsWith('http')) {
    return raw.replace(/^\/+/, '');
  }

  try {
    const parsed = new URL(raw);
    const marker = '/storage/v1/object/public/';
    const idx = parsed.pathname.indexOf(marker);

    if (idx === -1) return null;

    const after = parsed.pathname.slice(idx + marker.length);
    const parts = after.split('/').filter(Boolean);

    if (parts.length < 2) return null;

    return parts.slice(1).join('/');
  } catch {
    return null;
  }
}

async function signAdjuntoUrl(
  supa: ReturnType<typeof createBrowserSupa>,
  mensaje: MensajeWhatsapp
): Promise<MensajeWhatsapp> {
  if (!supa || !mensaje.url_archivo) return mensaje;

  const tipo = String(mensaje.tipo_mensaje || '').toLowerCase();
  const mime = String((mensaje as any).mime_type || '').toLowerCase();
  const contenido = String(mensaje.contenido_texto || '').toLowerCase();

  const esAudio =
    tipo === 'audio' ||
    mime.startsWith('audio/') ||
    contenido.endsWith('.webm') ||
    contenido.endsWith('.ogg') ||
    contenido.endsWith('.mp3') ||
    contenido.endsWith('.m4a') ||
    contenido.endsWith('.wav');

  if (esAudio) return mensaje;

  const esAdjunto =
  tipo === 'archivo' ||
  tipo === 'imagen' ||
  tipo === 'documento' ||
  mime.startsWith('image/') ||
  mime.includes('pdf') ||
  mime.includes('word') ||
  contenido.endsWith('.pdf') ||
  contenido.endsWith('.doc') ||
  contenido.endsWith('.docx') ||
  contenido.endsWith('.jpg') ||
  contenido.endsWith('.jpeg') ||
  contenido.endsWith('.png') ||
  contenido.endsWith('.webp');

if (!esAdjunto) return mensaje;

  const path = getStoragePathFromUrl(mensaje.url_archivo);
  if (!path) return mensaje;

  const { data, error } = await supa.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24);

  if (error || !data?.signedUrl) {
    console.error('Error firmando adjunto:', error);
    return mensaje;
  }

  return {
    ...mensaje,
    url_archivo: data.signedUrl
  };
}

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

 const mensajes = (data || []) as MensajeWhatsapp[];

const mensajesConAdjuntosFirmados = await Promise.all(
  mensajes.map(m => signAdjuntoUrl(supa, m))
);

return mensajesConAdjuntosFirmados;
}

export async function crearMensajeSaliente(
  conversationId: string,
  contenido: string
): Promise<MensajeWhatsapp | null> {
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

  const res = await fetch('/api/whatsapp-panel-saliente', {
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

  return data || { ok: true, message: 'Mensaje enviado' };
}

export async function enviarAdjuntoPanelWhatsapp({
  conversationId,
  telefono,
  file
}: {
  conversationId: string;
  telefono: string;
  file: File;
}): Promise<{ ok: boolean; error?: string; message?: string }> {
  const telefonoLimpio = String(telefono || '').replace(/\D/g, '');
  const telefonoE164 = telefonoLimpio.startsWith('34')
    ? telefonoLimpio
    : `34${telefonoLimpio}`;

  const formData = new FormData();
  formData.append('conversation_id', conversationId);
  formData.append('telefono', telefonoE164);
  formData.append('emisor', 'recepcion');
  formData.append('file', file);

  const res = await fetch('/api/whatsapp-panel-adjuntos', {
    method: 'POST',
    body: formData
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || 'Error enviando adjunto'
    };
  }

  return data || { ok: true, message: 'Adjunto enviado' };
}

export async function enviarAudioPanelWhatsapp({
  conversationId,
  telefono,
  audio
}: {
  conversationId: string;
  telefono: string;
  audio: File;
}): Promise<{ ok: boolean; error?: string; message?: string }> {
  const telefonoLimpio = String(telefono || '').replace(/\D/g, '');
  const telefonoE164 = telefonoLimpio.startsWith('34')
    ? telefonoLimpio
    : `34${telefonoLimpio}`;

  const formData = new FormData();
  formData.append('conversation_id', conversationId);
  formData.append('telefono', telefonoE164);
  formData.append('emisor', 'recepcion');
  formData.append('audio', audio);

  const res = await fetch('/api/whatsapp-panel-audio', {
    method: 'POST',
    body: formData
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || 'Error enviando audio'
    };
  }

  return data || { ok: true, message: 'Audio enviado' };
}
