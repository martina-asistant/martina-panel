import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const url = process.env.N8N_AGENDAS_URL;

    if (!url) {
      return NextResponse.json(
        { ok: false, error: 'Falta N8N_AGENDAS_URL' },
        { status: 500 }
      );
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error consultando agenda Celia:', error);

    return NextResponse.json(
      { ok: false, error: 'Error consultando agenda Celia' },
      { status: 500 }
    );
  }
}
