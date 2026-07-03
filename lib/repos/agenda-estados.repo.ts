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
  
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  motivo?: string | null;
  
  siguiente_cita_fecha?: string | null;
  siguiente_cita_fin?: string | null;
  siguiente_cita_motivo?: string | null;
};

async function aplicarEfectoEstadoVisita(input: UpsertEstadoVisitaInput) {
  const supa = createBrowserSupa();
  if (!supa) return;

  if (input.estado_visita !== 'finalizada' && input.estado_visita !== 'no_ha_venido') {
    return;
  }

  const telefono = normalizarTelefono(input.telefono);

  const buscarPaciente = async () => {
    if (input.paciente_id) {
      const { data } = await supa
        .from('patients')
        .select('*')
        .or(`id.eq.${input.paciente_id},paciente_id.eq.${input.paciente_id}`)
        .maybeSingle();

      if (data) return data;
    }

    if (!telefono) return null;

    const { data } = await supa
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    return (data || []).find((p) => {
      const t = normalizarTelefono(p.telefono);
      return t === telefono || t.endsWith(telefono) || telefono.endsWith(t);
    }) || null;
  };

  const patient = await buscarPaciente();
  if (!patient) return;

  if (input.estado_visita === 'finalizada') {
    await supa
      .from('patients')
      .update({
        ultima_cita_fecha: input.fecha_inicio || patient.proxima_cita_fecha || null,
        ultima_cita_motivo: input.motivo || patient.proxima_cita_motivo || null,

        proxima_cita_fecha: input.siguiente_cita_fecha || null,
        proxima_cita_fin: input.siguiente_cita_fin || null,
        proxima_cita_motivo: input.siguiente_cita_motivo || null,

        updated_at: new Date().toISOString(),
      })
      .eq('id', patient.id);

    return;
  }

  if (input.estado_visita === 'no_ha_venido') {
    await supa
      .from('patients')
      .update({
        proxima_cita_fecha: input.siguiente_cita_fecha || null,
        proxima_cita_fin: input.siguiente_cita_fin || null,
        proxima_cita_motivo: input.siguiente_cita_motivo || null,

        updated_at: new Date().toISOString(),
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
