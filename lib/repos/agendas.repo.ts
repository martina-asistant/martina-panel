export interface EventoAgenda {
  event_id: string;
  calendar_id: string;
  profesional: string;
  titulo: string;
  nombre_paciente: string;
  motivo: string;
  detalle_motivo: string;
  telefono: string;
  origen: string;
  estado: string;
  cambios: number;
  fecha_inicio: string;
  fecha_fin: string;
  color_id?: string | null;
}

const getAgenda = async (
  agenda: 'fede' | 'celia' | 'ana',
  fecha_inicio: string,
  fecha_fin: string
): Promise<EventoAgenda[]> => {
  try {
    const response = await fetch(`/agendas/${agenda}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agenda
        fecha_inicio,
        fecha_fin,
      }),
    });

    const data = await response.json();

    if (!data?.ok) {
      return [];
    }

    return data.eventos || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getAgendaFede = (fecha_inicio: string, fecha_fin: string) =>
  getAgenda('fede', fecha_inicio, fecha_fin);

export const getAgendaCelia = (fecha_inicio: string, fecha_fin: string) =>
  getAgenda('celia', fecha_inicio, fecha_fin);

export const getAgendaAna = (fecha_inicio: string, fecha_fin: string) =>
  getAgenda('ana', fecha_inicio, fecha_fin);
