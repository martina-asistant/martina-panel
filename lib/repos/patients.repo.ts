import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import { mockPatients } from '@/lib/mock/data';
import type { Patient } from '@/lib/types/db.types';

const normalizePhone = (phone?: string | number | null) => {
  if (phone === null || phone === undefined) return '';
  return String(phone).replace(/\D/g, '');
};

export async function getPatientByPacienteId(
  paciente_id: string | null | undefined
): Promise<Patient | null> {
  if (!paciente_id) return null;

  const supa = createBrowserSupa();

  if (!supa) {
    return mockPatients.find(p => p.paciente_id === paciente_id) || null;
  }

  const { data, error } = await supa
    .from('patients')
    .select('*')
    .eq('paciente_id', paciente_id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data as Patient | null;
}

export async function getPatientByTelefono(
  telefono: string | null | undefined
): Promise<Patient | null> {
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
          patientPhone.endsWith(sinPrefijo) ||
          clean.endsWith(patientPhone)
        );
      }) || null
    );
  }

  const { data, error } = await supa
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return null;
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

export async function getPatientByNombre(
  nombre: string | null | undefined
): Promise<Patient | null> {
  if (!nombre) return null;

  const clean = nombre.trim().toLowerCase();

  if (!clean) return null;

  const supa = createBrowserSupa();

  if (!supa) {
    return (
      mockPatients.find(p => {
        const nombreCompleto = (
          p.nombre_completo ||
          `${p.nombre || ''} ${p.apellidos || ''}`
        )
          .trim()
          .toLowerCase();

        return (
          nombreCompleto === clean ||
          nombreCompleto.includes(clean)
        );
      }) || null
    );
  }

  const { data, error } = await supa
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return null;
  }

  const found = (data || []).find(p => {
    const nombreCompleto = (
      p.nombre_completo ||
      `${p.nombre || ''} ${p.apellidos || ''}`
    )
      .trim()
      .toLowerCase();

    return (
      nombreCompleto === clean ||
      nombreCompleto.includes(clean)
    );
  });

  return (found as Patient) || null;
}

export async function updatePatientNotas(
  id: string,
  notas: string
): Promise<Patient | null> {
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

export async function listPatients(): Promise<Patient[]> {
  const supa = createBrowserSupa();

  if (!supa) {
    return mockPatients as Patient[];
  }

  const { data, error } = await supa
    .from('patients')
    .select('*')
    .order('nombre_completo', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return (data || []) as Patient[];
}

export async function crearPatientDesdeConversacion({
  nombre_completo,
  telefono,
}: {
  nombre_completo: string;
  telefono: string;
}): Promise<Patient | null> {
  const supa = createBrowserSupa();

  const limpio = normalizePhone(telefono);
  const partes = nombre_completo.trim().split(/\s+/);
  const nombre = partes[0] || '';
  const apellidos = partes.slice(1).join(' ');

  const nuevo = {
    nombre,
    apellidos,
    nombre_completo: nombre_completo.trim(),
    telefono: limpio,
  };

  if (!supa) {
    const mock = {
      ...nuevo,
      id: crypto.randomUUID(),
      paciente_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as Patient;

    mockPatients.push(mock);
    return mock;
  }

  const { data, error } = await supa
    .from('patients')
    .insert(nuevo)
    .select('*')
    .single();

  if (error) {
    console.error('Error creando patient desde conversación:', error);
    return null;
  }

  return data as Patient;
}

export async function crearPatientDesdeConversacion({
  nombre_completo,
  telefono,
}: {
  nombre_completo: string;
  telefono: string;
}): Promise<Patient | null> {
  const supa = createBrowserSupa();

  const limpio = telefono.replace(/\D/g, '');

  const partes = nombre_completo.trim().split(/\s+/);

  const nombre = partes.shift() || '';
  const apellidos = partes.join(' ');

  const nuevo = {
    nombre,
    apellidos,
    nombre_completo,
    telefono: limpio,
  };

  if (!supa) {
    const mock = {
      ...nuevo,
      id: crypto.randomUUID(),
      paciente_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      notas_internas: null,
      ultima_cita_fecha: null,
      ultima_cita_motivo: null,
      proxima_cita_fecha: null,
      proxima_cita_motivo: null,
      total_citas: 0,
      alerta_urgencia: false,
      etiquetas: null,
    } as unknown as Patient;

    mockPatients.push(mock);

    return mock;
  }

  const { data, error } = await supa
    .from('patients')
    .insert(nuevo)
    .select('*')
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data as Patient;
}
