import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path');

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
    .from('whatsapp-audios')
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'No se pudo firmar el audio' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    signedUrl: data.signedUrl
  });
}
