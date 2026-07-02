// Tipos exactos de las tablas existentes en Supabase.
// NO modificar nombres ni añadir columnas sin acuerdo previo.

export type ModoAtencion = 'ia' | 'martina' | 'recepcion';
export type EstadoVisualConv = 'nueva' | 'en_curso' | 'recepcion' | 'gestionada';
export type EstadoRecordatorio = 'sin_respuesta' | 'confirmada' | 'no_podra_asistir' | 'cita_modificada' | 'cancelada_recado';
export type EstadoRecall = 'pendiente_envio' | 'enviado' | 'quiere_cita' | 'confirmada' | 'pospuesta';
export type EstadoLaboratorio = 'pte_gestionar' | 'disenado' | 'impreso' | 'fresado' | 'horneado' | 'en_clinica' | 'finalizado';
export type LaboratorioNombre = 'Julio' | 'Alex' | 'Juanjo' | 'Claudia' | 'Otro';
export type TipoTrabajoLaboratorio = 'Incrustación' | 'Corona' | 'Puente' | 'Implante' | 'Férula' | 'Otro';
export type RolMensaje = 'paciente' | 'martina' | 'recepcion' | 'sistema';
export type RolUsuarioPanel = 'admin' | 'doctora' | 'recepcion';

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
  paciente_id: string | null;
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
  telefono: string | null;
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
  proxima_cita_fecha?: string | null;
  proxima_cita_motivo?: string | null;
  ultima_cita_fecha?: string | null;
  ultima_cita_motivo?: string | null;
  total_citas?: number | null;
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
  url_archivo?: string | null;
  mime_type?: string | null;

  // Compatibilidad con mocks antiguos
  rol?: RolMensaje | string;
  contenido?: string;
  fecha?: string | null;
}

export interface Recall {
  id: string;
  created_at: string;
  updated_at?: string | null;

  paciente_id: string | null;
  telefono: string | null;

  nombre_paciente?: string | null;
  nombre_completo?: string | null;

  motivo_recall?: string | null;
  tipo?: string | null;
  detalle_recall?: string | null;
  profesional?: string | null;

  fecha_recall?: string | null;
  fecha_registro?: string | null;
  fecha_envio: string | null;
  duracion_minutos?: number | null;

  mensaje?: string | null;
  estado: EstadoRecall;

  estado_cita?: string | null;
  respuesta_usuario?: string | null;
  respondido_at?: string | null;

  proxima_cita_fecha?: string | null;
  proxima_cita_motivo?: string | null;

  conversacion_id?: string | null;
  origen?: string | null;
numero_cambios?: number | null;
  tipo_recall?: string | null;
}

export interface RecordatorioCita {
  id: string | number;
  created_at: string;

  updated_at?: string | null;
  event_id?: string | null;
  calendar_id?: string | null;
  telefono?: string | null;

  nombre_paciente?: string | null;
  nombre_completo?: string | null;

  proxima_cita_fecha?: string | null;
  proxima_cita_motivo?: string | null;
  fecha_cita?: string | null;

  mensaje?: string | null;
  tipo_recordatorio?: string | null;
  estado: EstadoRecordatorio;

  enviado_at?: string | null;
  respondido_at?: string | null;
  respuesta_usuario?: string | null;

  paciente_id?: string | null;
  conversation_id?: string | null;
  profesional?: string | null;

  estado_cita?: string | null;
  detalle_motivo?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  duracion_minutos?: string | number | null;
}

export interface LaboratorioTrabajo {
  id: string;
  created_at: string;
  updated_at?: string | null;

  paciente_id?: string | null;
  nombre_paciente?: string | null;
  telefono?: string | null;

  laboratorio?: LaboratorioNombre | string | null;
  trabajo?: TipoTrabajoLaboratorio | string | null;
  estado: EstadoLaboratorio;

  anotaciones?: string | null;
  fecha_cita?: string | null;

  event_id_origen?: string | null;
  calendar_id_origen?: string | null;

  ultimo_cambio?: string | null;

  historial?: Array<{
    fecha: string;
    tipo: string;
    texto: string;
    usuario?: string | null;
  }> | null;
}

export interface UsuarioPanel {
  id: string;
  email: string;
  nombre: string | null;
  rol: RolUsuarioPanel | null;
  agenda_permitida: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
