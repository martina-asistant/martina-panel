import { createClient } from '@/lib/supabase/client';

export type AgendaAnotacion = {
  id: string;
  agenda: 'fede' | 'celia' | 'ana';
  titulo: string;
  telefono: string | null;
  detalle: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  origen: string | null;
  created_at: string;
  updated_at: string;
};

export type CrearAgendaAnotacionInput = {
  agenda: 'fede' | 'celia' | 'ana';
  titulo: string;
  telefono?: string | null;
  detalle?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  origen?: string | null;
};

export const listAgendaAnotaciones = async (
  agenda: 'fede' | 'celia' | 'ana',
  fechaInicio: string,
  fechaFin: string
): Promise<AgendaAnotacion[]> => {
  const supabase = createClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('agenda_anotaciones')
    .select('*')
    .eq('agenda', agenda)
    .gte('fecha_inicio', fechaInicio)
    .lte('fecha_inicio', fechaFin)
    .order('fecha_inicio', { ascending: true });

  if (error) {
    console.error('Error cargando anotaciones de agenda:', error);
    return [];
  }

  return (data || []) as AgendaAnotacion[];
};

export const crearAgendaAnotacion = async (
  input: CrearAgendaAnotacionInput
): Promise<AgendaAnotacion | null> => {
  const supabase = createClient();

  if (!supabase) {
    return null;
  }

  const titulo = input.titulo.trim();

  if (!titulo) {
    console.error('Falta el título de la anotación');
    return null;
  }

  const { data, error } = await supabase
    .from('agenda_anotaciones')
    .insert({
      agenda: input.agenda,
      titulo,
      telefono: input.telefono?.trim() || null,
      detalle: input.detalle?.trim() || null,
      fecha_inicio: input.fecha_inicio,
      fecha_fin: input.fecha_fin,
      origen: input.origen?.trim() || null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creando anotación de agenda:', error);
    return null;
  }

  return data as AgendaAnotacion;
};

export const actualizarAgendaAnotacion = async (
  id: string,
  input: Partial<CrearAgendaAnotacionInput>
): Promise<AgendaAnotacion | null> => {
  const supabase = createClient();

  if (!supabase) {
    return null;
  }

  const cambios: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.agenda !== undefined) {
    cambios.agenda = input.agenda;
  }

  if (input.titulo !== undefined) {
    cambios.titulo = input.titulo.trim();
  }

  if (input.telefono !== undefined) {
    cambios.telefono = input.telefono?.trim() || null;
  }

  if (input.detalle !== undefined) {
    cambios.detalle = input.detalle?.trim() || null;
  }

  if (input.fecha_inicio !== undefined) {
    cambios.fecha_inicio = input.fecha_inicio;
  }

  if (input.fecha_fin !== undefined) {
    cambios.fecha_fin = input.fecha_fin;
  }

  if (input.origen !== undefined) {
    cambios.origen = input.origen?.trim() || null;
  }

  const { data, error } = await supabase
    .from('agenda_anotaciones')
    .update(cambios)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error actualizando anotación de agenda:', error);
    return null;
  }

  return data as AgendaAnotacion;
};

export const eliminarAgendaAnotacion = async (
  id: string
): Promise<boolean> => {
  const supabase = createClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('agenda_anotaciones')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando anotación de agenda:', error);
    return false;
  }

  return true;
};

export const listTitulosAgendaAnotaciones = async (): Promise<
  Array<{
    titulo: string;
    telefono: string | null;
  }>
> => {
  const supabase = createClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('agenda_anotaciones')
    .select('titulo, telefono, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error cargando títulos de anotaciones:', error);
    return [];
  }

  const vistos = new Set<string>();
  const resultados: Array<{
    titulo: string;
    telefono: string | null;
  }> = [];

  for (const item of data || []) {
    const titulo = String(item.titulo || '').trim();
    const clave = titulo.toLocaleLowerCase('es-ES');

    if (!titulo || vistos.has(clave)) {
      continue;
    }

    vistos.add(clave);

    resultados.push({
      titulo,
      telefono: item.telefono || null,
    });
  }

  return resultados;
};
