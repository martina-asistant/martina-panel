// Tipos exactos de las tablas existentes en Supabase.
// NO modificar nombres ni añadir columnas sin acuerdo previo.

export type ModoAtencion = 'ia' | 'recepcion';
export type EstadoVisualConv = 'nueva' | 'en_curso' | 'recepcion' | 'gestionada';
export type EstadoRecordatorio = 'sin_respuesta' | 'confirmada' | 'no_podra_asistir' | 'cita_modificada' | 'cancelada_recado';
export type EstadoRecall = 'enviado' | 'quiere_cita' | 'cita_agendada' | 'pospuesto' | 'sin_respuesta';
export type RolMensaje = 'paciente' | 'martina' | 'recepcion' | 'sistema';

export type CanalMartina = 'whatsapp' | 'llamadas';

export interface ConfiguracionMartina {
  id: string;
  canal: CanalMartina;
  activo: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface Patient {
  id: string;
  created_at: string;
  telefono: string | null;
  nombre: string | null;
  apellidos: string | null;
  nombre_completo: string | null;
  notas_internas: string | null;
  ultima_cita_fecha: string | null;
  ultima_cita_motivo: string | null;
  proxima_cita_fecha: string | null;
  proxima_cita_motivo: string | null;
  total_citas: number | null;
  alerta_urgencia: boolean | null;
  etiquetas: string[] | null;
}

export interface ConversacionWhatsapp {
  id: string;
  created_at: string;
  updated_at: string;
  telefono_e164: string | null;
  paciente_id: string | null;
  modo_atencion: ModoAtencion | null;
  estado_conversacion: string | null;
  ultimo_mensaje_entrante_at: string | null;
  ultimo_mensaje_saliente_at: string | null;
  asignado_a: string | null;
  notas_internas: string | null;
  estado_cita: string | null;
  opcion_1_inicio: string | null;
  opcion_1_fin: string | null;
  opcion_2_inicio: string | null;
  opcion_2_fin: string | null;
  opcion_3_inicio: string | null;
  opcion_3_fin: string | null;
  opcion_elegida: number | null;
  nombre_paciente: string | null;
  motivo: string | null;
  detalle_motivo: string | null;
  profesional: string | null;
  preferencia_horaria: string | null;
  preferencia_fecha: string | null;
  duracion_minutos: number | null;
  event_id: string | null;
  calendar_id: string | null;
  numero_cambios: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado_visual: EstadoVisualConv | null;
}

export interface MensajeWhatsapp {
  id: string;
  created_at: string;
  conversation_id: string;
  telefono: string | null;
  tipo_emisor?: 'paciente' | 'bot' | 'recepcion' | 'sistema' | null;
  direccion?: 'entrante' | 'saliente' | null;
  tipo_mensaje?: string | null;
  contenido_texto?: string | null;

  // Compatibilidad con mocks antiguos
  rol?: RolMensaje | string;
  contenido?: string;
  fecha?: string | null;
}

export interface Recall {
  id: string;
  created_at: string;
  paciente_id: string | null;
  telefono: string | null;
  nombre_completo: string | null;
  tipo: string | null;
  fecha_envio: string | null;
  estado: EstadoRecall;
}

export interface RecordatorioCita {
  id: string;
  created_at: string;
  paciente_id?: string | null;
  nombre_completo?: string | null;
  telefono?: string | null;
  fecha_cita: string | null;
  estado: EstadoRecordatorio;
}
