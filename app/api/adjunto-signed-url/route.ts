import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const rawPath = req.nextUrl.searchParams.get('path');

let path = rawPath;

if (rawPath?.startsWith('http')) {
  try {
    const parsed = new URL(rawPath);
    const marker = '/storage/v1/object/public/whatsapp-adjuntos/';
    const idx = parsed.pathname.indexOf(marker);

    if (idx !== -1) {
      path = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
    }
  } catch {
    path = rawPath;
  }
}

  if (!path) {
  return NextResponse.json(
    { ok: false, error: 'Falta path' },
    { status: 400 }
  );
}

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: 'Faltan variables de Supabase' },
      { status: 500 }
    );
  }

  const supa = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supa.storage
    .from('whatsapp-adjuntos')
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'No se pudo firmar el adjunto' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    signedUrl: data.signedUrl
  });
}
