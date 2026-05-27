import type { Patient, ConversacionWhatsapp, MensajeWhatsapp, Recall, RecordatorioCita } from '@/lib/types/db.types';

const now = new Date();
const minsAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
const daysAhead = (d: number) => new Date(now.getTime() + d * 86_400_000).toISOString();

export const mockPatients: Patient[] = [
  { id: 'p1', created_at: daysAgo(180), telefono: '+34611111111', nombre: 'María', apellidos: 'García López', nombre_completo: 'María García López', notas_internas: 'Tiene ansiedad dental, prefiere citas por la tarde.', ultima_cita_fecha: daysAgo(45), ultima_cita_motivo: 'Limpieza', proxima_cita_fecha: daysAhead(7), proxima_cita_motivo: 'Revisión', total_citas: 6, alerta_urgencia: false, etiquetas: ['ansiedad','prefiere tardes'] },
  { id: 'p2', created_at: daysAgo(90),  telefono: '+34622222222', nombre: 'Javier', apellidos: 'Ruiz Pérez', nombre_completo: 'Javier Ruiz Pérez', notas_internas: '', ultima_cita_fecha: daysAgo(15), ultima_cita_motivo: 'Endodoncia', proxima_cita_fecha: null, proxima_cita_motivo: null, total_citas: 3, alerta_urgencia: true, etiquetas: ['posible urgencia'] },
  { id: 'p3', created_at: daysAgo(365), telefono: '+34633333333', nombre: 'Lucía', apellidos: 'Fernández', nombre_completo: 'Lucía Fernández', notas_internas: 'Paciente de ortodoncia invisible.', ultima_cita_fecha: daysAgo(5), ultima_cita_motivo: 'Control ortodoncia', proxima_cita_fecha: daysAhead(28), proxima_cita_motivo: 'Cambio de alineadores', total_citas: 14, alerta_urgencia: false, etiquetas: ['ortodoncia'] },
  { id: 'p4', created_at: daysAgo(60),  telefono: '+34644444444', nombre: 'Pedro', apellidos: 'Sánchez Moreno', nombre_completo: 'Pedro Sánchez Moreno', notas_internas: '', ultima_cita_fecha: daysAgo(120), ultima_cita_motivo: 'Empaste', proxima_cita_fecha: null, proxima_cita_motivo: null, total_citas: 1, alerta_urgencia: false, etiquetas: [] },
  { id: 'p5', created_at: daysAgo(800), telefono: '+34655555555', nombre: 'Carmen', apellidos: 'Vidal', nombre_completo: 'Carmen Vidal', notas_internas: 'Implantes 2024. Seguimiento semestral.', ultima_cita_fecha: daysAgo(180), ultima_cita_motivo: 'Revisión implantes', proxima_cita_fecha: daysAhead(2), proxima_cita_motivo: 'Revisión implantes', total_citas: 22, alerta_urgencia: false, etiquetas: ['implantes'] },
];

export const mockConversaciones: ConversacionWhatsapp[] = [
  { id: 'c1', created_at: daysAgo(1), updated_at: minsAgo(3),  telefono_e164: '+34611111111', paciente_id: 'p1', modo_atencion: 'martina',  estado_conversacion: 'activa', ultimo_mensaje_entrante_at: minsAgo(3),  ultimo_mensaje_saliente_at: minsAgo(5),  asignado_a: null,                  notas_internas: null, estado_cita: null, opcion_1_inicio: null, opcion_1_fin: null, opcion_2_inicio: null, opcion_2_fin: null, opcion_3_inicio: null, opcion_3_fin: null, opcion_elegida: null, nombre_paciente: 'María García López', motivo: 'Cita revisión', detalle_motivo: 'Solicita revisión general', profesional: 'Dra. Sanz', preferencia_horaria: 'tarde', preferencia_fecha: null, duracion_minutos: 30, event_id: null, calendar_id: null, numero_cambios: 0, fecha_inicio: null, fecha_fin: null, estado_visual: 'nueva' },
  { id: 'c2', created_at: daysAgo(2), updated_at: minsAgo(25), telefono_e164: '+34622222222', paciente_id: 'p2', modo_atencion: 'martina',  estado_conversacion: 'activa', ultimo_mensaje_entrante_at: minsAgo(30), ultimo_mensaje_saliente_at: minsAgo(25), asignado_a: null,                  notas_internas: null, estado_cita: null, opcion_1_inicio: null, opcion_1_fin: null, opcion_2_inicio: null, opcion_2_fin: null, opcion_3_inicio: null, opcion_3_fin: null, opcion_elegida: null, nombre_paciente: 'Javier Ruiz Pérez',   motivo: 'Dolor muela',    detalle_motivo: 'Dolor agudo en muela inferior derecha', profesional: null, preferencia_horaria: 'mañana', preferencia_fecha: null, duracion_minutos: null, event_id: null, calendar_id: null, numero_cambios: 0, fecha_inicio: null, fecha_fin: null, estado_visual: 'en_curso' },
  { id: 'c3', created_at: daysAgo(3), updated_at: minsAgo(120),telefono_e164: '+34633333333', paciente_id: 'p3', modo_atencion: 'recepcion',estado_conversacion: 'activa', ultimo_mensaje_entrante_at: minsAgo(150),ultimo_mensaje_saliente_at: minsAgo(120),asignado_a: 'recepcion@clinica.com', notas_internas: 'Quiere cambio alineadores antes del 30', estado_cita: null, opcion_1_inicio: null, opcion_1_fin: null, opcion_2_inicio: null, opcion_2_fin: null, opcion_3_inicio: null, opcion_3_fin: null, opcion_elegida: null, nombre_paciente: 'Lucía Fernández', motivo: 'Cambio alineadores', detalle_motivo: '', profesional: 'Dr. Lara', preferencia_horaria: null, preferencia_fecha: null, duracion_minutos: 20, event_id: null, calendar_id: null, numero_cambios: 1, fecha_inicio: null, fecha_fin: null, estado_visual: 'recepcion' },
  { id: 'c4', created_at: daysAgo(5), updated_at: daysAgo(1),  telefono_e164: '+34644444444', paciente_id: 'p4', modo_atencion: 'martina',  estado_conversacion: 'cerrada', ultimo_mensaje_entrante_at: daysAgo(1), ultimo_mensaje_saliente_at: daysAgo(1),  asignado_a: null,                  notas_internas: null, estado_cita: null, opcion_1_inicio: null, opcion_1_fin: null, opcion_2_inicio: null, opcion_2_fin: null, opcion_3_inicio: null, opcion_3_fin: null, opcion_elegida: null, nombre_paciente: 'Pedro Sánchez Moreno', motivo: 'Presupuesto blanqueamiento', detalle_motivo: '', profesional: null, preferencia_horaria: null, preferencia_fecha: null, duracion_minutos: null, event_id: null, calendar_id: null, numero_cambios: 0, fecha_inicio: null, fecha_fin: null, estado_visual: 'gestionada' },
  { id: 'c5', created_at: daysAgo(0.5),updated_at: minsAgo(10),telefono_e164: '+34655555555', paciente_id: 'p5', modo_atencion: 'martina',  estado_conversacion: 'activa', ultimo_mensaje_entrante_at: minsAgo(10), ultimo_mensaje_saliente_at: minsAgo(12), asignado_a: null,                  notas_internas: null, estado_cita: null, opcion_1_inicio: null, opcion_1_fin: null, opcion_2_inicio: null, opcion_2_fin: null, opcion_3_inicio: null, opcion_3_fin: null, opcion_elegida: null, nombre_paciente: 'Carmen Vidal',        motivo: 'Confirmar cita',  detalle_motivo: 'Pasado mañana implantes', profesional: 'Dra. Sanz', preferencia_horaria: null, preferencia_fecha: null, duracion_minutos: 45, event_id: null, calendar_id: null, numero_cambios: 0, fecha_inicio: null, fecha_fin: null, estado_visual: 'nueva' },
];

export const mockMensajes: MensajeWhatsapp[] = [
  { id: 'm1', created_at: minsAgo(8), conversation_id: 'c1', telefono: '+34611111111', rol: 'paciente', contenido: 'Hola, querría pedir cita para una revisión', fecha: minsAgo(8) },
  { id: 'm2', created_at: minsAgo(7), conversation_id: 'c1', telefono: null, rol: 'martina', contenido: '¡Hola María! Encantada de saludarte 😊 ¿Te viene mejor mañana o el viernes?', fecha: minsAgo(7) },
  { id: 'm3', created_at: minsAgo(5), conversation_id: 'c1', telefono: '+34611111111', rol: 'paciente', contenido: 'El viernes por la tarde si puede ser', fecha: minsAgo(5) },
  { id: 'm4', created_at: minsAgo(3), conversation_id: 'c1', telefono: null, rol: 'martina', contenido: 'Perfecto, te propongo: viernes 18:00, 18:30 o 19:00. ¿Cuál prefieres?', fecha: minsAgo(3) },

  { id: 'm5', created_at: minsAgo(40), conversation_id: 'c2', telefono: '+34622222222', rol: 'paciente', contenido: 'Tengo un dolor fuerte en una muela desde anoche', fecha: minsAgo(40) },
  { id: 'm6', created_at: minsAgo(38), conversation_id: 'c2', telefono: null, rol: 'martina', contenido: 'Lo siento mucho Javier 🙏 Voy a buscarte hueco hoy mismo.', fecha: minsAgo(38) },
  { id: 'm7', created_at: minsAgo(30), conversation_id: 'c2', telefono: '+34622222222', rol: 'paciente', contenido: '¿Tenéis algo esta mañana?', fecha: minsAgo(30) },
  { id: 'm8', created_at: minsAgo(25), conversation_id: 'c2', telefono: null, rol: 'martina', contenido: 'Sí, tengo hueco a las 11:30 con el Dr. Lara. ¿Te encaja?', fecha: minsAgo(25) },

  { id: 'm9',  created_at: minsAgo(160), conversation_id: 'c3', telefono: '+34633333333', rol: 'paciente', contenido: 'Necesito adelantar el cambio de alineadores', fecha: minsAgo(160) },
  { id: 'm10', created_at: minsAgo(150), conversation_id: 'c3', telefono: null, rol: 'martina', contenido: 'Te paso con recepción para gestionarlo.', fecha: minsAgo(150) },
  { id: 'm11', created_at: minsAgo(120), conversation_id: 'c3', telefono: null, rol: 'recepcion', contenido: 'Hola Lucía, vemos que podemos pasarte al miércoles 17h. ¿Te va?', fecha: minsAgo(120) },

  { id: 'm12', created_at: daysAgo(1.2), conversation_id: 'c4', telefono: '+34644444444', rol: 'paciente', contenido: 'Cuánto costaría un blanqueamiento?', fecha: daysAgo(1.2) },
  { id: 'm13', created_at: daysAgo(1.1), conversation_id: 'c4', telefono: null, rol: 'martina', contenido: 'El blanqueamiento en clínica son 320€. ¿Quieres que te reserve una valoración?', fecha: daysAgo(1.1) },
  { id: 'm14', created_at: daysAgo(1),   conversation_id: 'c4', telefono: '+34644444444', rol: 'paciente', contenido: 'Lo pienso y te digo, gracias', fecha: daysAgo(1) },

  { id: 'm15', created_at: minsAgo(12), conversation_id: 'c5', telefono: null, rol: 'martina', contenido: 'Hola Carmen, te recordamos tu cita pasado mañana a las 10:00 con la Dra. Sanz. ¿Confirmas?', fecha: minsAgo(12) },
  { id: 'm16', created_at: minsAgo(10), conversation_id: 'c5', telefono: '+34655555555', rol: 'paciente', contenido: 'Sí, allí estaré 🙌', fecha: minsAgo(10) },
];

export const mockRecalls: Recall[] = [
  { id: 'r1', created_at: daysAgo(2),  paciente_id: 'p1', telefono: '+34611111111', nombre_completo: 'María García López', tipo: 'Revisión anual',     fecha_envio: daysAgo(2),  estado: 'enviado' },
  { id: 'r2', created_at: daysAgo(5),  paciente_id: 'p3', telefono: '+34633333333', nombre_completo: 'Lucía Fernández',    tipo: 'Limpieza',           fecha_envio: daysAgo(5),  estado: 'quiere_cita' },
  { id: 'r3', created_at: daysAgo(7),  paciente_id: 'p5', telefono: '+34655555555', nombre_completo: 'Carmen Vidal',       tipo: 'Revisión implantes', fecha_envio: daysAgo(7),  estado: 'cita_agendada' },
  { id: 'r4', created_at: daysAgo(10), paciente_id: 'p4', telefono: '+34644444444', nombre_completo: 'Pedro Sánchez Moreno',tipo: 'Revisión anual',    fecha_envio: daysAgo(10), estado: 'pospuesto' },
  { id: 'r5', created_at: daysAgo(1),  paciente_id: 'p2', telefono: '+34622222222', nombre_completo: 'Javier Ruiz Pérez',  tipo: 'Endodoncia',         fecha_envio: daysAgo(1),  estado: 'enviado' },
];

export const mockRecordatorios: RecordatorioCita[] = [
  { id: 'rec1', created_at: daysAgo(1), paciente_id: 'p1', nombre_completo: 'María García López',    telefono: '+34611111111', fecha_cita: daysAhead(7), estado: 'confirmada' },
  { id: 'rec2', created_at: daysAgo(1), paciente_id: 'p5', nombre_completo: 'Carmen Vidal',          telefono: '+34655555555', fecha_cita: daysAhead(2), estado: 'sin_respuesta' },
  { id: 'rec3', created_at: daysAgo(2), paciente_id: 'p4', nombre_completo: 'Pedro Sánchez Moreno', telefono: '+34644444444', fecha_cita: daysAhead(3), estado: 'no_podra_asistir' },
  { id: 'rec4', created_at: daysAgo(2), paciente_id: 'p3', nombre_completo: 'Lucía Fernández',      telefono: '+34633333333', fecha_cita: daysAhead(5), estado: 'cita_modificada' },
  { id: 'rec5', created_at: daysAgo(3), paciente_id: 'p2', nombre_completo: 'Javier Ruiz Pérez',    telefono: '+34622222222', fecha_cita: daysAhead(1), estado: 'cancelada_recado' },
];
