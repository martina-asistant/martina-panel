import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import { mockRecalls } from '@/lib/mock/data';
import type { Recall } from '@/lib/types/db.types';

export async function listRecalls(): Promise<Recall[]> {
  const supa = createBrowserSupa();
  if (!supa) return [...mockRecalls];
  const { data, error } = await supa.from('recalls').select('*').order('fecha_envio', { ascending: false }).limit(500);
  if (error) { console.error(error); return []; }
  return (data || []) as Recall[];
}
