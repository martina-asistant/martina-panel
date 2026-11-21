
import { createClient } from '@/lib/supabase/client';
import type { HistorialCita } from '@/lib/types/db.types';

/**
 * Repositorio de lectura del historial de pacientes.
 *
 * Fuente: public.historial_citas
 *
 * - No modifica citas.
 * - No escribe en Supabase.
 * - No modifica Google Calendar.
 * - No interviene en los estados de recepción.
 *
 * Puede reutilizarse en Pacientes y Dashboard.
 */

export async function listarHistorialPaciente(
  patientId: string
): Promise<HistorialCita[]> {
  if (!patientId) return [];

  const supa = createClient();

  if (!supa) {
    throw new Error('Supabase no está configurado.');
  }

  const historial: HistorialCita[] = [];
  const tamanoPagina = 500;
  let desde = 0;

  while (true) {
    const { data, error } = await supa
      .from('historial_citas')
      .select('*')
      .eq('patient_id', patientId)
      .order('fecha_inicio', { ascending: false })
      .order('id', { ascending: false })
      .range(desde, desde + tamanoPagina - 1);

    if (error) {
      console.error(
        'Error consultando historial del paciente:',
        error
      );
      throw error;
    }

    const citas = (data ?? []) as HistorialCita[];

    historial.push(...citas);

    if (citas.length < tamanoPagina) {
      break;
    }

    desde += tamanoPagina;
  }

  return historial;
}

/**
 * Calcula el resumen a partir del historial.
 *
 * La última cita corresponde a la última finalizada.
 * La próxima cita corresponde a la primera pendiente
 * cuya fecha de inicio sea futura.
 *
 * Cada registro de historial cuenta una sola vez.
 */

export function calcularResumenHistorial(
  historial: HistorialCita[],
  fechaReferencia: Date = new Date()
) {
  const ahora = fechaReferencia.getTime();

  const finalizadas = historial
    .filter(
      (cita) =>
        cita.estado === 'finalizada' &&
        new Date(cita.fecha_inicio).getTime() <= ahora
    )
    .sort(
      (a, b) =>
        new Date(b.fecha_inicio).getTime() -
        new Date(a.fecha_inicio).getTime()
    );

  const pendientesFuturas = historial
    .filter(
      (cita) =>
        cita.estado === 'pendiente' &&
        new Date(cita.fecha_inicio).getTime() > ahora
    )
    .sort(
      (a, b) =>
        new Date(a.fecha_inicio).getTime() -
        new Date(b.fecha_inicio).getTime()
    );

  const ultima = finalizadas[0] ?? null;
  const proxima = pendientesFuturas[0] ?? null;

  return {
    ultima_cita_fecha: ultima?.fecha_inicio ?? null,
    ultima_cita_motivo: ultima?.motivo ?? null,

    proxima_cita_fecha: proxima?.fecha_inicio ?? null,
    proxima_cita_fin: proxima?.fecha_fin ?? null,
    proxima_cita_motivo: proxima?.motivo ?? null,

    total_citas: historial.length,
  };
}
