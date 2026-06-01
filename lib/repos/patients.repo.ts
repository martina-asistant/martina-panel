import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import { mockPatients } from '@/lib/mock/data';
import type { Patient } from '@/lib/types/db.types';

const normalizePhone = (phone?: string | null) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

export async function getPatientById(id: string | null | undefined): Promise<Patient | null> {
  if (!id) return null;

  const supa = createBrowserSupa();

  if (!supa) {
    return mockPatients.find(p => p.id === id) || null;
  }

  const { data, error } = await supa
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data as Patient;
}

export async function getPatientByTelefono(telefono: string | null | undefined): Promise<Patient | null> {
  const clean = normalizePhone(telefono);

  if (!clean) return null;

  const sinPrefijo =
    clean.startsWith('34') && clean.length >= 11
      ? clean.slice(2)
      : clean;

  const supa = createBrowserSupa();

  if (!supa) {
    return (
      mockPatients.find(p => {
        const patientPhone = normalizePhone(p.telefono);
        return (
          patientPhone === clean ||
          patientPhone === sinPrefijo ||
          patientPhone.endsWith(sinPrefijo)
        );
      }) || null
    );
  }


  const found = (data || []).find(p => {
    const patientPhone = normalizePhone(p.telefono);

    return (
      patientPhone === clean ||
      patientPhone === sinPrefijo ||
      patientPhone.endsWith(sinPrefijo) ||
      clean.endsWith(patientPhone)
    );
  });

  return (found as Patient) || null;
}

  const { data, error } = await supa
    .from('patients')
    .select('*')
    .or(`telefono.eq.${clean},telefono.eq.${sinPrefijo},telefono.ilike.%${sinPrefijo}`)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error(error);
    return null;
  }

  return ((data || [])[0] as Patient) || null;
}

export async function updatePatientNotas(id: string, notas: string): Promise<Patient | null> {
  const supa = createBrowserSupa();

  if (!supa) {
    const idx = mockPatients.findIndex(p => p.id === id);

    if (idx >= 0) {
      mockPatients[idx] = {
        ...mockPatients[idx],
        notas_internas: notas
      };

      return mockPatients[idx];
    }

    return null;
  }

  const { data, error } = await supa
    .from('patients')
    .update({ notas_internas: notas })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data as Patient;
}
