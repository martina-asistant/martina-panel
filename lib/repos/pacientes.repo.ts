
import { createClient } from '@/lib/supabase/client';
import type { Patient } from '@/lib/types/db.types';

/**
 * Repositorio exclusivo de la nueva pestaña Pacientes.
 *
 * Solo escribe en public.patients (Supabase).
 * No modifica Google Calendar ni los repositorios existentes.
 */

export type PacienteFormulario = {
  nombre: string;
  apellidos: string;
  telefono: string;
  notas_internas: string;
  alerta_urgencia: boolean;
};

const prepararDatos = (form: PacienteFormulario) => {
  const nombre = form.nombre.trim().replace(/\s+/g, ' ');
  const apellidos = form.apellidos.trim().replace(/\s+/g, ' ');
  const telefono = form.telefono.replace(/\D/g, '');

  return {
    nombre,
    apellidos,
    nombre_completo: [nombre, apellidos].filter(Boolean).join(' '),
    telefono: telefono || null,
    notas_internas: form.notas_internas.trim() || null,
    alerta_urgencia: form.alerta_urgencia,
  };
};

/**
 * Crear paciente manualmente desde Pacientes.
 */
export async function crearPacienteManual(
  form: PacienteFormulario
): Promise<Patient | null> {
  const supa = createClient();

  if (!supa) {
    console.error('Supabase no está configurado.');
    return null;
  }

  const datos = prepararDatos(form);

  if (!datos.nombre_completo) {
    console.error('El nombre del paciente es obligatorio.');
    return null;
  }

  const { data, error } = await supa
    .from('patients')
    .insert(datos)
    .select('*')
    .single();

  if (error) {
    console.error('Error creando paciente:', error);
    return null;
  }

  return data as Patient;
}

/**
 * Actualizar exclusivamente la ficha en Supabase.
 */
export async function actualizarPaciente(
  id: string,
  form: PacienteFormulario
): Promise<Patient | null> {
  if (!id) return null;

  const supa = createClient();

  if (!supa) {
    console.error('Supabase no está configurado.');
    return null;
  }

  const datos = prepararDatos(form);

  if (!datos.nombre_completo) {
    console.error('El nombre del paciente es obligatorio.');
    return null;
  }

  const { data, error } = await supa
    .from('patients')
    .update(datos)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error actualizando paciente:', error);
    return null;
  }

  return data as Patient;
}
