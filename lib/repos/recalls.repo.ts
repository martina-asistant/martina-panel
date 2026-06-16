import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import { mockRecalls } from '@/lib/mock/data';
import type { Recall } from '@/lib/types/db.types';

export async function listRecalls(): Promise<Recall[]> {
  const supa = createBrowserSupa();
  if (!supa) return [...mockRecalls] as Recall[];

  const { data, error } = await supa
    .from('recalls')
    .select('*')
    .order('fecha_recall', { ascending: true })
    .limit(500);

  if (error) {
    console.error('Error listRecalls:', error);
    return [];
  }

  return (data || []) as Recall[];
}

export async function createRecall(payload: Partial<Recall>): Promise<Recall | null> {
  const supa = createBrowserSupa();
  if (!supa) return null;

  const { data, error } = await supa
    .from('recalls')
    .insert({
      ...payload,
      estado: payload.estado || 'pendiente_envio',
      origen: payload.origen || 'manual',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error createRecall:', error);
    return null;
  }

  return data as Recall;
}

export async function updateRecall(
  id: string,
  payload: Partial<Recall>
): Promise<Recall | null> {
  const supa = createBrowserSupa();
  if (!supa) return null;

  const { data, error } = await supa
    .from('recalls')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updateRecall:', error);
    return null;
  }

  return data as Recall;
}
