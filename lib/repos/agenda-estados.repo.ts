
import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import type { AgendaEstadoVisita, EstadoVisita } from '@/lib/types/db.types';

const mockEstadosVisita: AgendaEstadoVisita[] = [];

type UpsertEstadoVisitaInput = {
  event_id: string;
  calendar_id: string;
  paciente_id?: string | null;
  nombre_paciente?: string | null;
  telefono?: string | null;
  estado_visita: EstadoVisita;
  observaciones?: string | null;
  updated_by?: string | null;

  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  motivo?: string | null;

  siguiente_cita_fecha?: string | null;
  siguiente_cita_fin?: string | null;
  siguiente_cita_motivo?: string | null;
};

/**
 * Consulta los estados de recepción.
 *
 * No modifica citas ni datos de pacientes.
 */
export async function listEstadosVisita(): Promise<AgendaEstadoVisita[]> {
  const supa = createBrowserSupa();

  if (!supa) {
    return mockEstadosVisita;
  }

  const { data, error } = await supa
    .from('agenda_estados_visita')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error cargando estados visita:', error);
    return [];
  }

  return (data || []) as AgendaEstadoVisita[];
}

/**
 * Elimina un estado de recepción.
 *
 * Conserva el funcionamiento existente.
 */
export async function deleteEstadoVisita(
  eventId: string,
  calendarId: string
): Promise<boolean> {
  const supa = createBrowserSupa();

  if (!supa) {
    const idx = mockEstadosVisita.findIndex(
      (e) => e.event_id === eventId && e.calendar_id === calendarId
    );

    if (idx >= 0) {
      mockEstadosVisita.splice(idx, 1);
    }

    return true;
  }

  const { error } = await supa
    .from('agenda_estados_visita')
    .delete()
    .eq('event_id', eventId)
    .eq('calendar_id', calendarId);

  if (error) {
    console.error('Error borrando estado visita:', error);
    return false;
  }

  return true;
}

/**
 * Guarda el estado de una visita en recepción.
 *
 * Mantiene la escritura original en agenda_estados_visita.
 *
 * No sobrescribe los resúmenes de patients.
 * Los resúmenes se calculan desde historial_citas.
 */
export async function upsertEstadoVisita(
  input: UpsertEstadoVisitaInput
): Promise<AgendaEstadoVisita | null> {
  const supa = createBrowserSupa();

  const payload = {
    event_id: input.event_id,
    calendar_id: input.calendar_id,
    paciente_id: input.paciente_id || null,
    nombre_paciente: input.nombre_paciente || null,
    telefono: input.telefono || null,
    estado_visita: input.estado_visita,
    observaciones: input.observaciones || null,
    updated_at: new Date().toISOString(),
    updated_by: input.updated_by || null,
  };

  if (!supa) {
    const idx = mockEstadosVisita.findIndex(
      (e) =>
        e.event_id === input.event_id &&
        e.calendar_id === input.calendar_id
    );

    const item = {
      id: idx >= 0 ? mockEstadosVisita[idx].id : crypto.randomUUID(),
      ...payload,
    } as AgendaEstadoVisita;

    if (idx >= 0) {
      mockEstadosVisita[idx] = item;
    } else {
      mockEstadosVisita.unshift(item);
    }

    return item;
  }

  const { data, error } = await supa
    .from('agenda_estados_visita')
    .upsert(payload, {
      onConflict: 'event_id,calendar_id',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error guardando estado visita:', error);
    return null;
  }

  return data as AgendaEstadoVisita;
}
