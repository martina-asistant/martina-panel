import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const conversationId = String(formData.get('conversation_id') || '');
    const telefono = String(formData.get('telefono') || '');
    const emisor = String(formData.get('emisor') || 'recepcion');
    const file = formData.get('file');

    if (!conversationId || !telefono || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: 'Faltan datos obligatorios o archivo' },
        { status: 400 }
      );
    }

    const n8nUrl = process.env.N8N_WHATSAPP_PANEL_ADJUNTOS_URL;

if (!n8nUrl) {
  return NextResponse.json(
    { ok: false, error: 'Falta configurar N8N_WHATSAPP_PANEL_ADJUNTOS_URL' },
    { status: 500 }
  );
}

    const payload = new FormData();
    payload.append('conversation_id', conversationId);
    payload.append('telefono', telefono);
    payload.append('emisor', emisor);
    payload.append('file', file);

    const res = await fetch(n8nUrl, {
      method: 'POST',
      body: payload
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.error || 'Error enviando adjunto al workflow'
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data || { ok: true });
  } catch (error) {
    console.error('Error en route whatsapp-panel-adjuntos:', error);

    return NextResponse.json(
      { ok: false, error: 'Error interno en route de adjuntos' },
      { status: 500 }
    );
  }
}
