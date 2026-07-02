import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import type { AgendaEstadoVisita, EstadoVisita } from '@/lib/types/db.types';

const mockEstadosVisita: AgendaEstadoVisita[] = [];

const normalizarTelefono = (telefono?: string | null) =>
  String(telefono || '').replace(/\D/g, '');

type UpsertEstadoVisitaInput = {
  event_id: string;
  calendar_id: string;
  paciente_id?: string | null;
  nombre_paciente?: string | null;
  telefono?: string | null;
  estado_visita: EstadoVisita;
  observaciones?: string | null;
  updated_by?: string | null;
};

async function aplicarEfectoEstadoVisita(input: UpsertEstadoVisitaInput) {
  const supa = createBrowserSupa();
  if (!supa) return;

  if (input.estado_visita !== 'finalizada' && input.estado_visita !== 'no_ha_venido') {
    return;
  }

  const telefono = normalizarTelefono(input.telefono);

  let query = supa.from('patients');

  if (input.paciente_id) {
    const { data: patient } = await supa
      .from('patients')
      .select('*')
      .or(`id.eq.${input.paciente_id},paciente_id.eq.${input.paciente_id}`)
      .maybeSingle();

    if (!patient) return;

    if (input.estado_visita === 'finalizada') {
      await supa
        .from('patients')
        .update({
          ultima_cita_fecha: patient.proxima_cita_fecha,
          ultima_cita_motivo: patient.proxima_cita_motivo,
          proxima_cita_fecha: null,
          proxima_cita_fin: null,
          proxima_cita_motivo: null,
        })
        .eq('id', patient.id);
    }

    if (input.estado_visita === 'no_ha_venido') {
      await supa
        .from('patients')
        .update({
          proxima_cita_fecha: null,
          proxima_cita_fin: null,
          proxima_cita_motivo: null,
        })
        .eq('id', patient.id);
    }

    return;
  }

  if (!telefono) return;

  const { data: patients } = await query
    .select('*')
    .order('created_at', { ascending: false });

  const patient = (patients || []).find((p) => {
    const t = normalizarTelefono(p.telefono);
    return t === telefono || t.endsWith(telefono) || telefono.endsWith(t);
  });

  if (!patient) return;

  if (input.estado_visita === 'finalizada') {
    await supa
      .from('patients')
      .update({
        ultima_cita_fecha: patient.proxima_cita_fecha,
        ultima_cita_motivo: patient.proxima_cita_motivo,
        proxima_cita_fecha: null,
        proxima_cita_fin: null,
        proxima_cita_motivo: null,
      })
      .eq('id', patient.id);
  }

  if (input.estado_visita === 'no_ha_venido') {
    await supa
      .from('patients')
      .update({
        proxima_cita_fecha: null,
        proxima_cita_fin: null,
        proxima_cita_motivo: null,
      })
      .eq('id', patient.id);
  }
}

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
      (e) => e.event_id === input.event_id && e.calendar_id === input.calendar_id
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

  await aplicarEfectoEstadoVisita(input);

  return data as AgendaEstadoVisita;
}
