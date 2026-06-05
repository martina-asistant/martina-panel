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

export async function getAgendaFede(
  fecha_inicio: string,
  fecha_fin: string
): Promise<EventoAgenda[]> {
  try {
    const response = await fetch('/agendas/fede', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
}
