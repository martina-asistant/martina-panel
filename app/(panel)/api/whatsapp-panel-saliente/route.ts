import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const conversationId = body.conversation_id || body.conversationId;
    const telefono = body.telefono;
    const mensaje = body.mensaje;

    if (!conversationId || !telefono || !mensaje) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Faltan datos obligatorios: conversation_id, telefono o mensaje'
        },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.N8N_WHATSAPP_PANEL_SALIENTE_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Falta configurar N8N_WHATSAPP_PANEL_SALIENTE_URL'
        },
        { status: 500 }
      );
    }

    const telefonoLimpio = String(telefono).replace(/\D/g, '');
    const telefonoE164 = telefonoLimpio.startsWith('34')
      ? telefonoLimpio
      : `34${telefonoLimpio}`;

    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        telefono: telefonoE164,
        mensaje,
        emisor: 'recepcion',
        origen: 'martina_panel'
      })
    });

    const data = await n8nRes.json().catch(() => null);

    if (!n8nRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.error || 'Error enviando mensaje a n8n'
        },
        { status: n8nRes.status }
      );
    }

    return NextResponse.json(
      data || {
        ok: true,
        message: 'Mensaje enviado'
      }
    );
  } catch (error) {
    console.error('Error en /api/whatsapp-panel-saliente:', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Error interno enviando WhatsApp desde panel'
      },
      { status: 500 }
    );
  }
}
