import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import { mockPatients } from '@/lib/mock/data';
import type { Patient } from '@/lib/types/db.types';

export async function getPatientById(id: string | null | undefined): Promise<Patient | null> {
  if (!id) return null;
  const supa = createBrowserSupa();
  if (!supa) return mockPatients.find(p => p.id === id) || null;
  const { data, error } = await supa.from('patients').select('*').eq('id', id).single();
  if (error) { console.error(error); return null; }
  return data as Patient;
}

export async function updatePatientNotas(id: string, notas: string): Promise<Patient | null> {
  const supa = createBrowserSupa();
  if (!supa) {
    const idx = mockPatients.findIndex(p => p.id === id);
    if (idx >= 0) { mockPatients[idx] = { ...mockPatients[idx], notas_internas: notas }; return mockPatients[idx]; }
    return null;
  }
  const { data, error } = await supa.from('patients').update({ notas_internas: notas }).eq('id', id).select('*').single();
  if (error) { console.error(error); return null; }
  return data as Patient;
}
