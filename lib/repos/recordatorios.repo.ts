import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import { mockRecordatorios } from '@/lib/mock/data';
import type { RecordatorioCita } from '@/lib/types/db.types';

export async function listRecordatorios(): Promise<RecordatorioCita[]> {
  const supa = createBrowserSupa();

  if (!supa) return [...mockRecordatorios];

  const { data, error } = await supa
    .from('recordatorios_cita')
    .select('*')
    .order('proxima_cita_fecha', { ascending: true })
    .limit(500);

  if (error) {
    console.error(error);
    return [];
  }

  return (data || []) as RecordatorioCita[];
}
