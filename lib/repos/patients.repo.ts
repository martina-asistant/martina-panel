import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import { mockPatients } from '@/lib/mock/data';
import type { Patient } from '@/lib/types/db.types';

const normalizePhone = (phone?: string | number | null) => {
  if (phone === null || phone === undefined) return '';
  return String(phone).replace(/\D/g, '');
};

const normalizarTexto = (texto: string) =>
  texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const separarNombreYApellidos = (nombreCompleto: string) => {
  const limpio = nombreCompleto.trim().replace(/\s+/g, ' ');
  const partes = limpio.split(' ');

  const nombresCompuestos = [
    'maria pilar',
    'maria jose',
    'maria del mar',
    'maria dolores',
    'maria angeles',
    'maria carmen',
    'maria luisa',
    'maria teresa',
    'maria isabel',
    'maria jesus',
    'maria cristina',
    'maria victoria',
    'maria concepcion',
    'maria soledad',
    'maria rosario',
    'ana maria',
    'ana belen',
    'ana isabel',
    'ana cristina',
    'ana maria',
    'jose luis',
    'jose antonio',
    'jose alberto',
    'jose manuel',
    'jose maria',
    'jose miguel',
    'jose ramon',
    'jose carlos',
    'jose angel',
    'jose ignacio',
    'jose francisco',
    'juan carlos',
    'juan jose',
    'juan antonio',
    'juan manuel',
    'juan francisco',
    'juan alberto',
    'juan miguel',
    'juan luis',
    'juan ramon',
    'francisco jose',
    'francisco javier',
    'francisco manuel',
    'miguel angel',
    'miguel jose',
    'angel luis',
    'angel manuel',
    'luis miguel',
    'luis alberto',
    'luis manuel',
    'luis angel',
    'carlos alberto',
    'carlos manuel',
    'pedro antonio',
    'pedro jose',
    'jesus maria',
    'ivan juan',
    'ivan jose',
  ];

  const primerasTres = normalizarTexto(partes.slice(0, 3).join(' '));
  const primerasDos = normalizarTexto(partes.slice(0, 2).join(' '));

  const cantidadNombre = nombresCompuestos.includes(primerasTres)
    ? 3
    : nombresCompuestos.includes(primerasDos)
      ? 2
      : 1;

  return {
    nombre: partes.slice(0, cantidadNombre).join(' '),
    apellidos: partes.slice(cantidadNombre).join(' '),
    nombre_completo: limpio,
  };
};

export async function getPatientByPacienteId(
  paciente_id: string | null | undefined
): Promise<Patient | null> {
  if (!paciente_id) return null;

  const supa = createBrowserSupa();

  if (!supa) {
    return (
      mockPatients.find(
        p => p.paciente_id === paciente_id || p.id === paciente_id
      ) || null
    );
  }

  const { data, error } = await supa
    .from('patients')
    .select('*')
    .or(`paciente_id.eq.${paciente_id},id.eq.${paciente_id}`)
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

  const clean = normalizarTexto(nombre);

  if (!clean) return null;

  const supa = createBrowserSupa();

  if (!supa) {
    return (
      mockPatients.find(p => {
        const nombreCompleto = normalizarTexto(
          p.nombre_completo ||
          `${p.nombre || ''} ${p.apellidos || ''}`
        );

        return nombreCompleto === clean || nombreCompleto.includes(clean);
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
    const nombreCompleto = normalizarTexto(
      p.nombre_completo ||
      `${p.nombre || ''} ${p.apellidos || ''}`
    );

    return nombreCompleto === clean || nombreCompleto.includes(clean);
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
        notas_internas: notas,
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

  const nombreSeparado = separarNombreYApellidos(nombre_completo);

  const nuevo = {
    nombre: nombreSeparado.nombre,
    apellidos: nombreSeparado.apellidos,
    nombre_completo: nombreSeparado.nombre_completo,
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
