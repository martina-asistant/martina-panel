
import { createClient } from '@/lib/supabase/client';
import type {
  HistorialCita,
  HistorialCitaCambio,
} from '@/lib/types/db.types';

/**
 * Repositorio exclusivo de lectura.
 *
 * Tablas:
 * - public.historial_citas
 * - public.historial_citas_cambios
 *
 * No escribe en Supabase.
 * No modifica Google Calendar ni n8n.
 * Reutilizable en Pacientes y Dashboard.
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

    if (citas.length < tamanoPagina) break;

    desde += tamanoPagina;
  }

  return historial;
}

/**
 * Resumen de citas de un paciente.
 *
 * Los criterios coinciden con los utilizados
 * para recalcular los datos en Supabase.
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

/**
 * Obtiene los movimientos registrados
 * de las citas de un paciente.
 *
 * Utiliza los identificadores reales
 * de historial_citas, nunca el teléfono.
 *
 * No modifica ningún dato.
 */

export async function listarCambiosHistorialPaciente(
  historial: HistorialCita[]
): Promise<HistorialCitaCambio[]> {
  if (historial.length === 0) return [];

  const supa = createClient();

  if (!supa) {
    throw new Error('Supabase no está configurado.');
  }

  const ids = [...new Set(historial.map((cita) => cita.id))];

  const cambios: HistorialCitaCambio[] = [];

  // Lotes pequeños para evitar consultas con demasiados IDs.
  const tamanoLote = 100;
  const tamanoPagina = 500;

  for (let i = 0; i < ids.length; i += tamanoLote) {
    const lote = ids.slice(i, i + tamanoLote);
    let desde = 0;

    while (true) {
      const { data, error } = await supa
        .from('historial_citas_cambios')
        .select('*')
        .in('historial_cita_id', lote)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(desde, desde + tamanoPagina - 1);

      if (error) {
        console.error(
          'Error consultando cambios del historial:',
          error
        );
        throw error;
      }

      const pagina = (data ?? []) as HistorialCitaCambio[];

      cambios.push(...pagina);

      if (pagina.length < tamanoPagina) break;

      desde += tamanoPagina;
    }
  }

  return cambios.sort((a, b) => {
    const diferencia =
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime();

    return diferencia || b.id.localeCompare(a.id);
  });
}
