import { createClient as createBrowserSupa } from '@/lib/supabase/client';
import type {
  LaboratorioTrabajo,
  EstadoLaboratorio,
  LaboratorioNombre,
  TipoTrabajoLaboratorio,
} from '@/lib/types/db.types';

const mockTrabajosLaboratorio: LaboratorioTrabajo[] = [];

const ahoraISO = () => new Date().toISOString();

const crearUltimoCambio = ({
  tipo,
  usuario,
}: {
  tipo: string;
  usuario?: string | null;
}) => {
  return `Modificado "${tipo}" por ${usuario || 'Panel'} a las ${new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })} del ${new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })}`;
};

const crearEntradaHistorial = ({
  tipo,
  texto,
  usuario,
}: {
  tipo: string;
  texto: string;
  usuario?: string | null;
}) => ({
  fecha: ahoraISO(),
  tipo,
  texto,
  usuario: usuario || null,
});

const getEstadoLaboratorioLabelRepo = (estado?: string | null) => {
  const mapa: Record<string, string> = {
    pte_gestionar: 'Pte gestionar',
    disenado: 'Diseñado',
    impreso: 'Impreso',
    fresado: 'Fresado',
    horneado: 'Horneado',
    en_clinica: 'En clínica',
    finalizado: 'Finalizado',
  };

  return estado ? mapa[estado] || estado : '';
};

const crearTextoCambioLaboratorio = (
  patch: Partial<LaboratorioTrabajo>,
  usuario?: string | null,
  tipoCambio = 'Trabajo'
) => {
  const autor = usuario || 'Panel';

  if (patch.anotaciones !== undefined) {
  return {
    tipo: `Anotaciones - ${patch.anotaciones}`,
    texto: `Anotaciones actualizadas por ${autor}`,
  };
}

if (patch.estado) {
  return {
    tipo: `Estado - ${getEstadoLaboratorioLabelRepo(patch.estado)}`,
    texto: `Trabajo actualizado por ${autor}`,
  };
}

  if (patch.fecha_cita !== undefined) {
    return {
      tipo: 'Fecha cita',
      texto: `Fecha de cita actualizada por ${autor}`,
    };
  }

  if (patch.trabajo) {
    return {
      tipo: `Trabajo - ${patch.trabajo}`,
      texto: `Trabajo actualizado por ${autor}`,
    };
  }

  if (patch.laboratorio) {
    return {
      tipo: `Laboratorio - ${patch.laboratorio}`,
      texto: `Laboratorio actualizado por ${autor}`,
    };
  }

  return {
    tipo: tipoCambio,
    texto: `Trabajo actualizado por ${autor}`,
  };
};

export async function listTrabajosLaboratorio(): Promise<LaboratorioTrabajo[]> {
  const supa = createBrowserSupa();

  if (!supa) {
    return [...mockTrabajosLaboratorio].sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime()
    );
  }

  const { data, error } = await supa
    .from('laboratorio_trabajos')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error cargando trabajos laboratorio:', error);
    return [];
  }

  return (data || []) as LaboratorioTrabajo[];
}

export async function crearTrabajoLaboratorio({
  paciente_id,
  nombre_paciente,
  telefono,
  laboratorio = 'Julio',
  trabajo,
  piezas,
  estado = 'pte_gestionar',
  anotaciones,
  fecha_cita = null,
  event_id_origen = null,
  calendar_id_origen = null,
  usuario,
}: {
  paciente_id?: string | null;
  nombre_paciente: string;
  telefono?: string | null;
  laboratorio?: LaboratorioNombre | string | null;
  trabajo: TipoTrabajoLaboratorio | string;
  estado?: EstadoLaboratorio;
  anotaciones?: string | null;
  fecha_cita?: string | null;
  event_id_origen?: string | null;
  calendar_id_origen?: string | null;
  usuario?: string | null;
}): Promise<LaboratorioTrabajo | null> {
  const supa = createBrowserSupa();

  const historial = [
    crearEntradaHistorial({
      tipo: 'Creación',
      texto: `Trabajo creado por ${usuario || 'Panel'}`,
      usuario,
    }),
  ];

  const nuevo = {
    paciente_id: paciente_id || null,
    nombre_paciente,
    telefono: telefono || null,
    laboratorio: laboratorio || 'Julio',
    trabajo,
    estado,
    anotaciones: anotaciones || null,
    fecha_cita,
    event_id_origen,
    calendar_id_origen,
    ultimo_cambio: crearUltimoCambio({
      tipo: 'Creación',
      usuario,
    }),
    historial,
    updated_at: ahoraISO(),
  };

  if (!supa) {
    const mock = {
      ...nuevo,
      id: crypto.randomUUID(),
      created_at: ahoraISO(),
    } as unknown as LaboratorioTrabajo;

    mockTrabajosLaboratorio.unshift(mock);
    return mock;
  }

  const { data, error } = await supa
    .from('laboratorio_trabajos')
    .insert(nuevo)
    .select('*')
    .single();

  if (error) {
    console.error('Error creando trabajo laboratorio:', error);
    return null;
  }

  return data as LaboratorioTrabajo;
}

export async function actualizarTrabajoLaboratorio(
  id: string,
  patch: Partial<LaboratorioTrabajo>,
  usuario?: string | null,
  tipoCambio = 'Trabajo'
): Promise<LaboratorioTrabajo | null> {
  const supa = createBrowserSupa();

  const cambio = crearTextoCambioLaboratorio(patch, usuario, tipoCambio);

const nuevaEntrada = crearEntradaHistorial({
  tipo: cambio.tipo,
  texto: cambio.texto,
  usuario,
});

  if (!supa) {
    const idx = mockTrabajosLaboratorio.findIndex(t => t.id === id);

    if (idx < 0) return null;

    const historialActual = mockTrabajosLaboratorio[idx].historial || [];

    mockTrabajosLaboratorio[idx] = {
      ...mockTrabajosLaboratorio[idx],
      ...patch,
      updated_at: ahoraISO(),
      ultimo_cambio: crearUltimoCambio({
  tipo: cambio.tipo,
  usuario,
}),
      historial: [...historialActual, nuevaEntrada],
    };

    return mockTrabajosLaboratorio[idx];
  }

  const { data: actual, error: errorActual } = await supa
    .from('laboratorio_trabajos')
    .select('historial')
    .eq('id', id)
    .single();

  if (errorActual) {
    console.error('Error leyendo historial laboratorio:', errorActual);
    return null;
  }

  const historialActual = Array.isArray(actual?.historial)
    ? actual.historial
    : [];

  const { data, error } = await supa
    .from('laboratorio_trabajos')
    .update({
      ...patch,
      updated_at: ahoraISO(),
      ultimo_cambio: crearUltimoCambio({
  tipo: cambio.tipo,
  usuario,
}),
      historial: [...historialActual, nuevaEntrada],
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error actualizando trabajo laboratorio:', error);
    return null;
  }

  return data as LaboratorioTrabajo;
}

export function actualizarEstadoLaboratorio(
  id: string,
  estado: EstadoLaboratorio,
  usuario?: string | null
) {
  return actualizarTrabajoLaboratorio(
    id,
    { estado },
    usuario,
    'Estado'
  );
}

export function actualizarAnotacionLaboratorio(
  id: string,
  anotaciones: string,
  usuario?: string | null
) {
  return actualizarTrabajoLaboratorio(
    id,
    { anotaciones },
    usuario,
    'Anotación'
  );
}

export function actualizarFechaCitaLaboratorio(
  id: string,
  fecha_cita: string | null,
  usuario?: string | null
) {
  return actualizarTrabajoLaboratorio(
    id,
    { fecha_cita },
    usuario,
    'Fecha cita'
  );
}

export async function obtenerTrabajosPorPaciente(
  paciente_id?: string | null,
  nombre_paciente?: string | null
): Promise<LaboratorioTrabajo[]> {
  const todos = await listTrabajosLaboratorio();

  return todos.filter(t => {
    if (paciente_id && t.paciente_id === paciente_id) return true;

    if (nombre_paciente && t.nombre_paciente) {
      return (
        t.nombre_paciente.trim().toLowerCase() ===
        nombre_paciente.trim().toLowerCase()
      );
    }

    return false;
  });
}

export async function vincularFechaPruebaColocar({
  paciente_id,
  nombre_paciente,
  fecha_cita,
  event_id_origen,
  calendar_id_origen,
  usuario,
}: {
  paciente_id?: string | null;
  nombre_paciente?: string | null;
  fecha_cita: string;
  event_id_origen?: string | null;
  calendar_id_origen?: string | null;
  usuario?: string | null;
}) {
  const trabajos = await obtenerTrabajosPorPaciente(
    paciente_id,
    nombre_paciente
  );

  const trabajoPendiente = trabajos.find(t =>
    t.estado !== 'en_clinica' &&
    t.estado !== 'finalizado'
  );

  if (!trabajoPendiente) return null;

  return actualizarTrabajoLaboratorio(
    trabajoPendiente.id,
    {
      fecha_cita,
      event_id_origen: event_id_origen || trabajoPendiente.event_id_origen || null,
      calendar_id_origen: calendar_id_origen || trabajoPendiente.calendar_id_origen || null,
    },
    usuario,
    'Fecha cita'
  );
}
