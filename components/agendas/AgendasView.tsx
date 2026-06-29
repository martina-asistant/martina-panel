'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { getAgendaFede, getAgendaCelia, getAgendaAna, type EventoAgenda } from '@/lib/repos/agendas.repo';
import { createClient } from '@/lib/supabase/client';
import { createRecall } from '@/lib/repos/recalls.repo';

const agendas = [
  { key: 'fede', nombre: 'Agenda Fede' },
  { key: 'celia', nombre: 'Agenda Celia' },
  { key: 'ana', nombre: 'Agenda Ana' },
];

const acciones = ['INSERTAR CITA', 'MODIFICAR CITA', 'CANCELAR CITA', 'INSERTAR RECALL'];

const TRATAMIENTOS = [
  'Primera visita',
  'Revisión',
  'Revisión general',
  'Limpieza',
  'Obturación',
  'Endodoncia',
  'Rec+Post',
  'Implante',
  'Cirugía',
  'Quitar puntos',
  'Impresiones',
  'Prueba-colocar',
  'Raspados',
  'Tallados',
  'Prótesis',
  'Férula Michigan',
  'Fotos',
];

type PatientOption = {
  id: string;
  nombre: string | null;
  apellidos: string | null;
  nombre_completo: string | null;
  telefono: string | null;
};

const TIPOS_RECALL = [
  { label: 'MTO Periodontal 4 meses', value: 'Limpieza', meses: 4 },
  { label: 'MTO Periodontal 6 meses', value: 'Limpieza', meses: 6 },
  { label: 'MTO Periodontal 1 año', value: 'Limpieza', meses: 12 },
  { label: 'Revisión', value: 'Revisión', meses: null },
  { label: 'Revisión general', value: 'Revisión general', meses: null },
];

const tipoRecallLabel = (tipo?: string | null) => {
  if (!tipo) return '—';

  if (tipo === 'Limpieza') return 'MTO Periodontal';
  if (tipo === 'Revisión') return 'Revisión';
  if (tipo === 'Revisión general') return 'Revisión general';

  return tipo;
};

const normalizarTexto = (texto: string) =>
  texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getTratamientoValue = (motivo: string) => {
  const normalizado = normalizarTexto(motivo || '');

  return (
    TRATAMIENTOS.find(
      (tratamiento) => normalizarTexto(tratamiento) === normalizado
    ) || ''
  );
};

const SLOT_HEIGHT = 22;
const START_HOUR = 9;
const END_HOUR = 19.5;

const pad = (n: number) => String(n).padStart(2, '0');

const toInputDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toInputTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const buildISOFromDateTime = (date: string, time: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
};

const sumarMesesISO = (meses: number) => {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() + meses);
  fecha.setHours(10, 0, 0, 0);
  return fecha.toISOString();
};

const getDuracionPorMotivo = (motivo: string) => {
  const m = motivo.trim().toLowerCase();

  if (m === 'revisión general' || m === 'revision general') return 30;
  if (m === 'revisión' || m === 'revision') return 5;

  if (m === 'limpieza') return 30;

  if (m === 'obturación' || m === 'obturacion') return 30;

  if (m === 'primera visita') return 45;

  if (m === 'endodoncia') return 45;

  if (m === 'rec+post') return 45;

  if (m === 'implante') return 45;

  if (m === 'cirugía' || m === 'cirugia') return 60;

  if (m === 'quitar puntos' ) return 5;

  if (m === 'impresiones') return 30;

  if (m === 'prueba-colocar') return 30;

  if (m === 'raspados') return 45;

  if (m === 'tallados') return 60;

  if (m === 'prótesis' || m === 'protesis') return 30;

  if (m === 'férula michigan' || m === 'ferula michigan') return 30;

  if (m === 'fotos' ) return 5;

  return 30;
};

const sumarMinutosISO = (iso: string, minutos: number) => {
  const fecha = new Date(iso);
  fecha.setMinutes(fecha.getMinutes() + minutos);
  return fecha.toISOString();
};

const getMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const addWeeks = (date: Date, weeks: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
};

const toISO = (date: Date) => date.toISOString();

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatSemana = (inicio: Date) => {
  const fin = addDays(inicio, 4);
  return `${inicio.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })} - ${fin.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })}`;
};

const formatMes = (date: Date) =>
  date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();

const getDiasMes = (fecha: Date) => {
  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

  const dias = [];

  for (let i = 1; i <= fin.getDate(); i++) {
    dias.push(new Date(fecha.getFullYear(), fecha.getMonth(), i));
  }

  return dias;
};

const formatDia = (date: Date) =>
  date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });

const sameDay = (iso: string, date: Date) => {
  const d = new Date(iso);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
};

const isHorarioNoDisponible = (hora: string, dia: Date, agenda: string) => {
  const diaSemana = dia.getDay();
  const mes = dia.getMonth(); // agosto = 7

  // Sábado y domingo siempre bloqueados
  if (diaSemana === 0 || diaSemana === 6) {
    return true;
  }

  // Horario verano: agosto abierto solo hasta las 15:00
  if (mes === 7) {
    return hora >= '15:00';
  }

  if (agenda === 'celia') {
    if (diaSemana !== 3) return true;

    const manana = hora >= '09:30' && hora < '13:30';
    const tarde = hora >= '15:00' && hora < '19:00';

    return !(manana || tarde);
  }

  if (diaSemana === 1) return hora >= '17:00';
  if (diaSemana === 2) return hora >= '14:00' && hora < '15:00';
  if (diaSemana === 3) return hora >= '17:00';
  if (diaSemana === 4) return hora >= '14:00' && hora < '15:00';
  if (diaSemana === 5) return hora >= '14:00';

  return false;
};

const slots = Array.from({ length: ((END_HOUR - START_HOUR) * 60) / 15 }, (_, i) => {
  const total = START_HOUR * 60 + i * 15;
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
});

const esBloqueoAgenda = (evento?: EventoAgenda | null) =>
  Boolean(evento?.titulo?.toUpperCase().includes('BLOQUEO AGENDA'));

const getColorTratamiento = (evento: EventoAgenda) => {
  const motivo = (evento.motivo || '').trim().toLowerCase();

  if (motivo === 'primera visita') {
    return { bg: 'rgba(250,204,21,.90)', text: 'text-white' };
  }

  if (motivo === 'férula michigan' || motivo === 'ferula michigan') {
    return { bg: 'rgba(202,138,4,.90)', text: 'text-white' };
  }

  if (motivo === 'endodoncia') {
    return { bg: 'rgba(244,114,182,.90)', text: 'text-white' };
  }

  if (motivo === 'rec+post') {
    return { bg: 'rgba(236,72,153,.90)', text: 'text-white' };
  }

  if (motivo === 'limpieza') {
    return { bg: 'rgba(148,163,184,.90)', text: 'text-white' };
  }

  if (motivo === 'obturación' || motivo === 'obturacion') {
    return { bg: 'rgba(168,85,247,.90)', text: 'text-white' };
  }

  if (motivo === 'revisión' || motivo === 'revision') {
    return { bg: 'rgba(125,211,252,.90)', text: 'text-white' };
  }

  if (motivo === 'revisión general' || motivo === 'revision general') {
    return { bg: 'rgba(125,211,252,.90)', text: 'text-white' };
  }

  if (
    motivo === 'prótesis' ||
    motivo === 'protesis' ||
    motivo === 'impresiones' ||
    motivo === 'prueba-colocar'
  ) {
    return { bg: 'rgba(249,115,22,.90)', text: 'text-white' };
  }

  if (motivo === 'raspados') {
    return { bg: 'rgba(153,27,27,.85)', text: 'text-white' };
  }

  if (motivo === 'tallados') {
    return { bg: 'rgba(220,38,38,.85)', text: 'text-white' };
  }

  if (motivo === 'implante') {
    return { bg: 'rgba(14,165,233,.90)', text: 'text-white' };
  }

  if (motivo === 'quitar puntos') {
  return { bg: 'rgba(34,197,94,.90)', text: 'text-white' };
}

if (motivo === 'fotos') {
  return { bg: 'rgba(161,98,7,.90)', text: 'text-white' };
}

  if (motivo === 'cirugía' || motivo === 'cirugia') {
    return { bg: 'rgba(255,255,255,.95)', text: 'text-[#03111A]' };
  }

  return { bg: 'rgba(59,130,246,.85)', text: 'text-white' };
};

export default function AgendasView() {
  const [agendaActiva, setAgendaActiva] = useState('fede');
  const [semanaInicio, setSemanaInicio] = useState(() => getMonday(new Date()));
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotInicio, setSlotInicio] = useState<string | null>(null);
  const [slotFin, setSlotFin] = useState<string | null>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoAgenda | null>(null);
  const [eventoActivo, setEventoActivo] = useState<EventoAgenda | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mostrarCancelar, setMostrarCancelar] = useState(false);
  const [modalCitaAbierto, setModalCitaAbierto] = useState(false);
  const [usuarioPanel, setUsuarioPanel] = useState('panel');
  const [mostrarInsertar, setMostrarInsertar] = useState(false);
  const [nuevaCita, setNuevaCita] = useState({
  nombre_paciente: '',
  telefono: '',
  motivo: 'Primera visita',
  detalle_motivo: '',
  fecha_inicio: '',
  fecha_fin: '',
});
  const [patients, setPatients] = useState<PatientOption[]>([]);
const [busquedaPaciente, setBusquedaPaciente] = useState('');
const [mostrarNuevoPaciente, setMostrarNuevoPaciente] = useState(false);
const [nuevoPaciente, setNuevoPaciente] = useState({
  nombre: '',
  apellidos: '',
  telefono: '',
});
  const [mostrarResultadosPaciente, setMostrarResultadosPaciente] = useState(false);
  const [mostrarMotivos, setMostrarMotivos] = useState(false);
  const [mostrarMotivosEditar, setMostrarMotivosEditar] = useState(false);
  const [mostrarAgendas, setMostrarAgendas] = useState(false);
  const [mostrarInsertarRecall, setMostrarInsertarRecall] = useState(false);

const [nuevoRecall, setNuevoRecall] = useState({
  paciente_id: '',
  nombre_paciente: '',
  telefono: '',
  motivo_recall: 'Limpieza',
  tipo_recall: 'MTO Periodontal',
  detalle_recall: '',
  fecha_recall: '',
  profesional: '',
});
  const [mostrarTiposRecall, setMostrarTiposRecall] = useState(false);
const [mostrarAgendaRecall, setMostrarAgendaRecall] = useState(false);
  
  const [diaMovilSeleccionado, setDiaMovilSeleccionado] = useState(() => new Date());
const [mostrarCalendarioMovil, setMostrarCalendarioMovil] = useState(false);
  const [mostrarCalendarioDesktop, setMostrarCalendarioDesktop] = useState(false);
    

  const agenda = agendas.find(a => a.key === agendaActiva);

  const diasSemana = useMemo(
  () => [0, 1, 2, 3, 4].map(d => addDays(semanaInicio, d)),
  [semanaInicio]
);

  const diasMovilScroll = useMemo(() => {
  const lunes = getMonday(diaMovilSeleccionado);
  return Array.from({ length: 35 }, (_, i) => addDays(lunes, i));
}, [diaMovilSeleccionado]);
const diasMesMovil = useMemo(
  () => getDiasMes(diaMovilSeleccionado),
  [diaMovilSeleccionado]
);  

  const crearFechaDesdeSlot = (slotKey: string) => {
    const [fechaKey, hora] = slotKey.split('|');
    const [year, month, day] = fechaKey.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  };

  const getRangoSeleccionado = () => {
    if (!slotInicio) return null;

    const inicioKey = slotFin ? [slotInicio, slotFin].sort()[0] : slotInicio;
    const finKey = slotFin ? [slotInicio, slotFin].sort()[1] : slotInicio;

    const inicio = crearFechaDesdeSlot(inicioKey);
    const fin = crearFechaDesdeSlot(finKey);
    fin.setMinutes(fin.getMinutes() + 15);

    return { inicioKey, finKey, inicio, fin };
  };

  const bloqueoSeleccionado = (() => {
    const rango = getRangoSeleccionado();

    if (!rango) return null;

    return eventos.find((evento) => {
      if (!esBloqueoAgenda(evento)) return false;

      const inicioEvento = new Date(evento.fecha_inicio);
      const finEvento = new Date(evento.fecha_fin);

      return inicioEvento < rango.fin && finEvento > rango.inicio;
    }) || null;
  })();

  const slotSeleccionadoBloqueado = Boolean(bloqueoSeleccionado);

  const manejarSeleccion = (slotKey: string, eventoSlot?: EventoAgenda | null) => {
    if (slotInicio === slotKey && !slotFin) {
      setSlotInicio(null);
      setSlotFin(null);
      setEventoActivo(null);
      return;
    }

    if (slotFin === slotKey) {
      setSlotFin(null);
      setEventoActivo(null);
      return;
    }

    if (!slotInicio) {
      setSlotInicio(slotKey);
      setSlotFin(null);
      setEventoActivo(eventoSlot && !esBloqueoAgenda(eventoSlot) ? eventoSlot : null);
      return;
    }

    const diaInicio = slotInicio.split('|')[0];
    const diaNuevo = slotKey.split('|')[0];

    if (diaInicio !== diaNuevo) {
      setSlotInicio(slotKey);
      setSlotFin(null);
      setEventoActivo(eventoSlot && !esBloqueoAgenda(eventoSlot) ? eventoSlot : null);
      return;
    }

    if (!slotFin) {
      setSlotFin(slotKey);
      setEventoActivo(eventoSlot && !esBloqueoAgenda(eventoSlot) ? eventoSlot : null);
      return;
    }

    setSlotInicio(slotKey);
    setSlotFin(null);
    setEventoActivo(eventoSlot && !esBloqueoAgenda(eventoSlot) ? eventoSlot : null);
  };

  const cargarAgenda = async () => {
  setLoading(true);
    const inicioDesktop = getMonday(semanaInicio);
const inicioMovil = getMonday(diaMovilSeleccionado);

const rangoInicio = new Date(
  Math.min(inicioDesktop.getTime(), inicioMovil.getTime())
);

const rangoFin = addDays(
  new Date(Math.max(inicioDesktop.getTime(), inicioMovil.getTime())),
  42
);

  let data: EventoAgenda[] = [];

  if (agendaActiva === 'fede') {
    data = await getAgendaFede(toISO(rangoInicio), toISO(rangoFin));
  }

  if (agendaActiva === 'celia') {
    data = await getAgendaCelia(toISO(rangoInicio), toISO(rangoFin));
  }

  if (agendaActiva === 'ana') {
    data = await getAgendaAna(toISO(rangoInicio), toISO(rangoFin));
  }

  setEventos(data);
  setLoading(false);
};

  const gestionarBloqueo = async () => {
    if (!slotInicio || loading) return;

    const rango = getRangoSeleccionado();

    if (!rango) return;

    const accion = bloqueoSeleccionado ? 'desbloquear' : 'bloquear';

    const fechaInicio = bloqueoSeleccionado
      ? new Date(bloqueoSeleccionado.fecha_inicio)
      : rango.inicio;

    const fechaFin = bloqueoSeleccionado
      ? new Date(bloqueoSeleccionado.fecha_fin)
      : rango.fin;

    const response = await fetch('/agendas/gestionar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accion,
        agenda: agendaActiva,
        calendar_id: eventoActivo?.calendar_id,
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString(),
        usuario: usuarioPanel,
      }),
    });

    const data = await response.json();

    if (!data?.ok) {
      console.error('Error gestionando bloqueo:', data);
      return;
    }

    setSlotInicio(null);
    setSlotFin(null);

    await cargarAgenda();
  };

  const cerrarModalCita = () => {
  setModalCitaAbierto(false);
  setEventoSeleccionado(null);
  setEventoActivo(null);
  setModoEdicion(false);
  setSlotInicio(null);
  setSlotFin(null);
};

const guardarCambiosCita = async () => {
  if (!eventoSeleccionado || loading) return;

  const citaActualizada = eventoSeleccionado;

  setModalCitaAbierto(false);
  setEventoSeleccionado(null);
  setEventoActivo(null);
  setModoEdicion(false);
  setSlotInicio(null);
  setSlotFin(null);

  setEventos((prev) =>
  prev.map((evento) =>
    evento.event_id === citaActualizada.event_id
      ? {
          ...evento,
          ...citaActualizada,
          cambios: (citaActualizada.cambios || 0) + 1,
        }
      : evento
  )
);

  setLoading(true);

  try {
    const response = await fetch('/agendas/gestionar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accion: 'modificar_cita',
        agenda: agendaActiva,
        calendar_id: citaActualizada.calendar_id,
        event_id: citaActualizada.event_id,
        telefono: citaActualizada.telefono,
        nombre_paciente: citaActualizada.nombre_paciente,
        motivo: citaActualizada.motivo,
        detalle_motivo: citaActualizada.detalle_motivo,
        origen: citaActualizada.origen,
        estado: citaActualizada.estado,
        cambios: (citaActualizada.cambios || 0) + 1,
        fecha_inicio: citaActualizada.fecha_inicio,
        fecha_fin: citaActualizada.fecha_fin,
        usuario: usuarioPanel,
      }),
    });

    const data = await response.json();

    if (!data?.ok) {
      console.error('Error modificando cita:', data);
    }
  } catch (error) {
    console.error('Error guardando cambios cita:', error);
  } finally {
    setLoading(false);
  }
};
  
  const cancelarCita = async () => {
  if (!eventoActivo || loading) return;

  const citaCancelada = eventoActivo;

  setMostrarCancelar(false);
  setEventoSeleccionado(null);
  setEventoActivo(null);
  setModoEdicion(false);
  setSlotInicio(null);
  setSlotFin(null);

  setEventos((prev) =>
    prev.filter((evento) => evento.event_id !== citaCancelada.event_id)
  );

  setLoading(true);

  try {
    const response = await fetch('/agendas/gestionar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accion: 'cancelar_cita',
        agenda: agendaActiva,
        calendar_id: citaCancelada.calendar_id,
        event_id: citaCancelada.event_id,
        telefono: citaCancelada.telefono,
        fecha_inicio: citaCancelada.fecha_inicio,
        fecha_fin: citaCancelada.fecha_fin,
        motivo: citaCancelada.motivo,
        usuario: usuarioPanel,
      }),
    });

    const data = await response.json();

    if (!data?.ok) {
      console.error('Error cancelando cita:', data);
    }
  } catch (error) {
    console.error('Error cancelando cita:', error);
  } finally {
    setLoading(false);
  }
};

  const abrirInsertarCita = () => {
  const rango = getRangoSeleccionado();

  if (!rango || loading) return;

  const motivo = 'Primera visita';
  const fechaInicio = rango.inicio.toISOString();
  const fechaFin = sumarMinutosISO(fechaInicio, getDuracionPorMotivo(motivo));

  setNuevaCita({
    nombre_paciente: '',
    telefono: '',
    motivo,
    detalle_motivo: '',
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
  });

  setMostrarInsertar(true);
};

  const abrirInsertarRecall = () => {
  if (!eventoActivo) return;

  const motivoOriginal = (eventoActivo.motivo || '').toLowerCase();

  let motivoRecall = 'Revisión general';

  if (
    motivoOriginal.includes('limpieza') ||
    motivoOriginal.includes('higiene')
  ) {
    motivoRecall = 'Limpieza';
  }

  setNuevoRecall({
    paciente_id: '',
    nombre_paciente: eventoActivo.nombre_paciente || '',
    telefono: eventoActivo.telefono || '',
    motivo_recall: motivoRecall,
    tipo_recall: 'MTO Periodontal',
    detalle_recall: '',
    fecha_recall: '',
    profesional: eventoActivo.profesional || agendaActiva,
  });

  setMostrarInsertarRecall(true);
};

const guardarInsertarCita = async () => {
  if (loading) return;

  if (!nuevaCita.nombre_paciente.trim() || !nuevaCita.telefono.trim()) {
    console.error('Falta nombre o teléfono');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch('/agendas/gestionar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accion: 'insertar_cita',
        agenda: agendaActiva,
        nombre_paciente: nuevaCita.nombre_paciente,
        telefono: nuevaCita.telefono,
        motivo: nuevaCita.motivo,
        detalle_motivo: nuevaCita.detalle_motivo,
        fecha_inicio: nuevaCita.fecha_inicio,
        fecha_fin: nuevaCita.fecha_fin,
        usuario: usuarioPanel,
      }),
    });

    const data = await response.json();

    if (!data?.ok) {
      console.error('Error insertando cita:', data);
      await cargarAgenda();
      return;
    }

    setMostrarInsertar(false);
    setSlotInicio(null);
    setSlotFin(null);
    await cargarAgenda();
  } catch (error) {
    console.error('Error insertando cita:', error);
  } finally {
    setLoading(false);
  }
};

  const guardarInsertarRecall = async () => {
  if (loading) return;

  if (!nuevoRecall.nombre_paciente.trim() || !nuevoRecall.telefono.trim()) {
    console.error('Falta nombre o teléfono en recall');
    return;
  }

  if (!nuevoRecall.fecha_recall) {
    console.error('Falta fecha recall');
    return;
  }

  setLoading(true);

  try {
    const telefonoOriginal = eventoActivo?.telefono || '';
    const telefonoNuevo = nuevoRecall.telefono.trim();

    if (telefonoOriginal && telefonoNuevo && telefonoOriginal !== telefonoNuevo) {
      const supabase = createClient();

      if (supabase) {
        const { error } = await supabase
          .from('patients')
          .update({ telefono: telefonoNuevo })
          .eq('telefono', telefonoOriginal);

        if (error) {
          console.error('Error actualizando teléfono paciente:', error);
        }
      }
    }

    const recallCreado = await createRecall({
      paciente_id: nuevoRecall.paciente_id || null,
      nombre_paciente: nuevoRecall.nombre_paciente,
      telefono: telefonoNuevo,
      motivo_recall: nuevoRecall.motivo_recall,
      detalle_recall: nuevoRecall.detalle_recall,
      tipo_recall: nuevoRecall.tipo_recall,
      duracion_minutos: getDuracionPorMotivo(nuevoRecall.motivo_recall),
      fecha_recall: nuevoRecall.fecha_recall,
      fecha_registro: new Date().toISOString(),
      fecha_envio: null,
      profesional: nuevoRecall.profesional,
      origen: usuarioPanel,
      numero_cambios: 0,
      estado: 'pendiente_envio',
    });

    if (!recallCreado) {
      console.error('Error creando recall');
      return;
    }

    setMostrarInsertarRecall(false);
    setEventoActivo(null);
    setSlotInicio(null);
    setSlotFin(null);
  } catch (error) {
    console.error('Error guardando recall:', error);
  } finally {
    setLoading(false);
  }
};
  
  useEffect(() => {
  cargarAgenda();
}, [agendaActiva, semanaInicio, diaMovilSeleccionado]);

  useEffect(() => {
  const cargarUsuarioPanel = async () => {
    const supabase = createClient();

    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) return;

    const { data } = await supabase
      .from('usuarios_panel')
      .select('nombre')
      .eq('email', user.email)
      .single();

    setUsuarioPanel(data?.nombre || user.email);
  };

  cargarUsuarioPanel();
}, []);

  useEffect(() => {
  const cargarPatients = async () => {
    const supabase = createClient();

    if (!supabase) return;

    const { data, error } = await supabase
      .from('patients')
      .select('id, nombre, apellidos, nombre_completo, telefono')
      .order('nombre_completo', { ascending: true });

    if (error) {
      console.error('Error cargando pacientes:', error);
      return;
    }

    setPatients(data || []);
  };

  cargarPatients();
}, []);

  const pacientesFiltrados = patients.filter((patient) => {
  const texto = `${patient.nombre_completo || ''} ${patient.telefono || ''}`.toLowerCase();
  return texto.includes(busquedaPaciente.toLowerCase());
});

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden px-2 py-4 lg:p-8 bg-[#02141B] text-white pb-20">
      <div className="hidden lg:flex items-start justify-between gap-6 mb-8">
          <h1 className="inline-block text-2xl font-semibold tracking-[-0.015em] bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent mb-1">
            Agendas
          </h1>
          <p className="text-sm text-cyan-100/55">Gestión de citas</p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 min-w-[230px]">
          <CalendarDays className="w-5 h-5 text-cyan-300" />

          <div className="relative">
  <button
    type="button"
    onClick={() => setMostrarAgendas(!mostrarAgendas)}
    className="flex items-center gap-2 bg-transparent text-white text-sm font-medium outline-none"
  >
    <span>{agenda?.nombre}</span>

    <svg
      className={`w-4 h-4 text-cyan-200 transition-transform ${
        mostrarAgendas ? 'rotate-180' : ''
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>

  {mostrarAgendas && (
    <div className="absolute right-0 top-[calc(100%+8px)] z-[120] min-w-[190px] max-h-56 overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
      {agendas.map((a) => (
        <button
          key={a.key}
          type="button"
          onClick={() => {
            const hoy = new Date();

setAgendaActiva(a.key);
setDiaMovilSeleccionado(hoy);
setSemanaInicio(getMonday(hoy));
setMostrarAgendas(false);
          }}
          className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-cyan-500/15 ${
            agendaActiva === a.key
              ? 'bg-cyan-500/20 text-cyan-100'
              : 'text-white'
          }`}
        >
          {a.nombre}
        </button>
      ))}
    </div>
  )}
</div>
        </div>
      </div>

      {/* MOBILE */}
<div className="lg:hidden">
  <div className="mb-5 px-2 flex items-start justify-between gap-3">
    <div>
      <h1 className="inline-block text-3xl font-semibold tracking-[-0.015em] bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent mb-1">
        Agendas
      </h1>
      <p className="text-sm text-cyan-100/55">Gestión de citas</p>
    </div>

    <div className="relative">
      <button
        type="button"
        onClick={() => setMostrarAgendas(!mostrarAgendas)}
        className="flex items-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-white"
      >
        <CalendarDays className="w-4 h-4 text-cyan-300" />
        <span>{agenda?.nombre}</span>
      </button>

      {mostrarAgendas && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[120] min-w-[170px] overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
          {agendas.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => {
                const hoy = new Date();

setAgendaActiva(a.key);
setDiaMovilSeleccionado(hoy);
setSemanaInicio(getMonday(hoy));
setMostrarAgendas(false);
              }}
              className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-cyan-500/15 ${
                agendaActiva === a.key ? 'bg-cyan-500/20 text-cyan-100' : 'text-white'
              }`}
            >
              {a.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>

  <div className="rounded-3xl border border-cyan-500/20 bg-[rgba(5,18,24,.78)] backdrop-blur-xl overflow-hidden shadow-[0_0_35px_rgba(34,211,238,.10)]">
  <div className="px-3 py-3 border-b border-cyan-500/10 bg-cyan-500/10">
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => {
          const nuevoDia = new Date(
            diaMovilSeleccionado.getFullYear(),
            diaMovilSeleccionado.getMonth() - 1,
            1
          );

          setDiaMovilSeleccionado(nuevoDia);
          setSemanaInicio(getMonday(nuevoDia));
        }}
        className="w-8 h-8 rounded-full border border-cyan-400/25 bg-cyan-500/10 flex items-center justify-center"
      >
        <ChevronLeft className="w-4 h-4 text-cyan-200" />
      </button>

      <button
        type="button"
        onClick={() => setMostrarCalendarioMovil(prev => !prev)}
        className="text-[13px] tracking-[0.26em] text-cyan-300 font-semibold"
      >
        {formatMes(diaMovilSeleccionado)}
      </button>

      <button
        type="button"
        onClick={() => {
          const nuevoDia = new Date(
            diaMovilSeleccionado.getFullYear(),
            diaMovilSeleccionado.getMonth() + 1,
            1
          );

          setDiaMovilSeleccionado(nuevoDia);
          setSemanaInicio(getMonday(nuevoDia));
        }}
        className="w-8 h-8 rounded-full border border-cyan-400/25 bg-cyan-500/10 flex items-center justify-center"
      >
        <ChevronRight className="w-4 h-4 text-cyan-200" />
      </button>
    </div>

      {mostrarCalendarioMovil && (
        <div className="mt-3 rounded-2xl border border-cyan-400/20 bg-[#03111A]/95 px-3 py-2">
          <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] uppercase tracking-[0.10em] text-cyan-300/70 mb-1">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({
              length: (new Date(diaMovilSeleccionado.getFullYear(), diaMovilSeleccionado.getMonth(), 1).getDay() + 6) % 7,
            }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {diasMesMovil.map((dia) => {
              const activo = toDateKey(dia) === toDateKey(diaMovilSeleccionado);

              return (
                <button
                  key={dia.toISOString()}
                  type="button"
                  onClick={() => {
                    setDiaMovilSeleccionado(dia);
                    setSemanaInicio(getMonday(dia));
                    setMostrarCalendarioMovil(false);
                  }}
                  className={`h-7 rounded-lg text-xs transition-all ${
                    activo
                      ? 'bg-cyan-400/25 text-white border border-cyan-300/50 shadow-[0_0_14px_rgba(34,211,238,.20)]'
                      : 'text-cyan-100/70 hover:bg-cyan-500/10'
                  }`}
                >
                  {dia.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>

    <div className="flex gap-1.5 overflow-x-auto px-2 py-2 border-b border-cyan-500/10 [&::-webkit-scrollbar]:hidden"
  style={{
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  }}
>
  {diasMovilScroll.map((dia) => {
    const activo = toDateKey(dia) === toDateKey(diaMovilSeleccionado);

    return (
      <button
        key={dia.toISOString()}
        type="button"
        onClick={() => {
          setDiaMovilSeleccionado(dia);
        }}
        className={`shrink-0 w-[54px] h-[50px] rounded-xl border px-1 py-1 text-center transition-all ${
          activo
            ? 'bg-cyan-500/20 border-cyan-300/50 text-white shadow-[0_0_14px_rgba(34,211,238,.16)]'
            : 'bg-white/5 border-cyan-500/20 text-cyan-100/65'
        }`}
      >
        <div className="text-[9px] uppercase tracking-[0.08em] leading-none">
          {dia.toLocaleDateString('es-ES', { weekday: 'short' })}
        </div>
        <div className="text-[15px] font-semibold leading-none mt-1">
          {dia.getDate()}
        </div>
      </button>
    );
  })}
</div>

<div className="flex gap-2 overflow-x-auto px-3 py-3 border-b border-cyan-500/10 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/35">
  {acciones.map((accion) => (
    <button
      key={accion}
      onClick={() => {
        if (accion === 'MODIFICAR CITA' && eventoActivo) {
          setEventoSeleccionado(eventoActivo);
          setModoEdicion(true);
          setModalCitaAbierto(true);
        }

        if (accion === 'CANCELAR CITA' && eventoActivo) {
          setMostrarCancelar(true);
        }

        if (accion === 'INSERTAR CITA') {
          abrirInsertarCita();
        }

        if (accion === 'INSERTAR RECALL') {
          abrirInsertarRecall();
        }
      }}
      className="shrink-0 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1.5 text-[10px] tracking-[0.12em] text-cyan-100"
    >
      {accion}
    </button>
  ))}

  <button
    onClick={gestionarBloqueo}
    disabled={!slotInicio || loading}
    className="shrink-0 w-8 h-8 rounded-full border border-cyan-400/30 bg-cyan-500/10 flex items-center justify-center disabled:opacity-45"
  >
    <Lock className="w-4 h-4 text-cyan-200" />
  </button>
</div>

<div className="p-2">
  <div className="rounded-2xl border border-cyan-400/10 bg-[#03111A]/70 overflow-hidden">
  {slots.map((hora) => {
    const slotKey = `${toDateKey(diaMovilSeleccionado)}|${hora}`;
    const slotInicioDate = crearFechaDesdeSlot(slotKey);
    const slotFinDate = new Date(slotInicioDate);
    slotFinDate.setMinutes(slotFinDate.getMinutes() + 15);

    const eventosDia = eventos.filter(e => e.fecha_inicio && sameDay(e.fecha_inicio, diaMovilSeleccionado));

    const eventoSlot = eventosDia.find((evento) => {
      const inicioEvento = new Date(evento.fecha_inicio);
      const finEvento = new Date(evento.fecha_fin);

      return inicioEvento < slotFinDate && finEvento > slotInicioDate;
    });

    const esBloqueoEvento = esBloqueoAgenda(eventoSlot);
    const esInicioEvento = eventoSlot
      ? new Date(eventoSlot.fecha_inicio).getTime() === slotInicioDate.getTime()
      : false;

    const color = eventoSlot && !esBloqueoEvento ? getColorTratamiento(eventoSlot) : null;
    const bloqueadoAutomatico = isHorarioNoDisponible(hora, diaMovilSeleccionado, agendaActiva);
    const bloqueado = bloqueadoAutomatico || esBloqueoEvento;

    return (
  <button
    key={slotKey}
    type="button"
    onClick={() => manejarSeleccion(slotKey, eventoSlot)}
    onDoubleClick={() => {
      if (eventoSlot && !esBloqueoEvento) {
        setEventoSeleccionado(eventoSlot);
        setModoEdicion(false);
        setModalCitaAbierto(true);
      }
    }}
    style={{
      height: SLOT_HEIGHT,
      backgroundColor: esBloqueoEvento
        ? 'rgba(6,182,212,.25)'
        : eventoSlot && !esBloqueoEvento
          ? color?.bg
          : undefined,
    }}
    className={`
      w-full block border-b border-cyan-400/5 text-left px-2 text-[10px] transition-all
      ${bloqueadoAutomatico ? 'bg-cyan-500/25 hover:bg-cyan-500/30' : ''}
      ${!bloqueado && !eventoSlot ? 'hover:bg-cyan-500/10' : ''}
    `}
  >
    <span
      className={
        eventoSlot && !esBloqueoEvento
          ? `${color?.text || 'text-white'} font-semibold`
          : bloqueado
            ? 'text-white/90'
            : 'text-white'
      }
    >
      {hora}
    </span>

    {eventoSlot && !esBloqueoEvento && esInicioEvento && (
      <span className={`ml-3 text-[11px] font-semibold truncate ${color?.text || 'text-white'}`}>
        {eventoSlot.titulo || eventoSlot.nombre_paciente || 'Cita'}
      </span>
    )}
  </button>
);
  })}
</div>
  </div>
</div>

      
      <div className="hidden lg:block rounded-3xl border border-cyan-500/20 bg-[rgba(5,18,24,.78)] backdrop-blur-xl overflow-hidden shadow-[0_0_35px_rgba(34,211,238,.10)]">
        <div className="bg-cyan-500/10 border-b border-cyan-500/10 px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="relative flex items-center gap-5">
              <h2 className="text-[13px] tracking-[0.32em] text-cyan-300 font-semibold">
                {agenda?.nombre.toUpperCase()}
              </h2>

              <button
                onClick={() => setSemanaInicio(prev => addWeeks(prev, -1))}
                className="w-8 h-8 rounded-full border border-cyan-400/25 bg-cyan-500/10 flex items-center justify-center hover:bg-cyan-500/20"
              >
                <ChevronLeft className="w-4 h-4 text-cyan-200" />
              </button>

              <button
  type="button"
  onClick={() => setMostrarCalendarioDesktop(prev => !prev)}
  className="text-sm text-cyan-100/70 min-w-[145px] text-center hover:text-cyan-200 transition-colors"
>
  {formatSemana(semanaInicio)}
</button>

{mostrarCalendarioDesktop && (
  <div className="absolute top-[44px] left-1/2 z-[130] w-[310px] -translate-x-1/2 rounded-2xl border border-cyan-400/20 bg-[#03111A] px-4 py-3 shadow-[0_0_28px_rgba(34,211,238,.25)]">
    <div className="mb-2 grid grid-cols-7 gap-0.5 text-center text-[10px] uppercase tracking-[0.10em] text-cyan-300/70">
      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
        <div key={d}>{d}</div>
      ))}
    </div>

    <div className="grid grid-cols-7 gap-0.5">
      {Array.from({
        length: (new Date(semanaInicio.getFullYear(), semanaInicio.getMonth(), 1).getDay() + 6) % 7,
      }).map((_, i) => (
        <div key={`empty-desktop-${i}`} />
      ))}

      {getDiasMes(semanaInicio).map((dia) => {
        const activo = toDateKey(dia) === toDateKey(semanaInicio);

        return (
          <button
            key={dia.toISOString()}
            type="button"
            onClick={() => {
              setSemanaInicio(getMonday(dia));
              setMostrarCalendarioDesktop(false);
            }}
            className={`h-7 rounded-lg text-xs transition-all ${
              activo
                ? 'bg-cyan-400/25 text-white border border-cyan-300/50 shadow-[0_0_14px_rgba(34,211,238,.20)]'
                : 'text-cyan-100/70 hover:bg-cyan-500/10'
            }`}
          >
            {dia.getDate()}
          </button>
        );
      })}
    </div>
  </div>
)}

              <button
                onClick={() => setSemanaInicio(prev => addWeeks(prev, 1))}
                className="w-8 h-8 rounded-full border border-cyan-400/25 bg-cyan-500/10 flex items-center justify-center hover:bg-cyan-500/20"
              >
                <ChevronRight className="w-4 h-4 text-cyan-200" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {acciones.map((accion) => (
                <button
                  key={accion}
                  onClick={() => {
                    if (accion === 'MODIFICAR CITA' && eventoActivo) {
                      setEventoSeleccionado(eventoActivo);
                      setModoEdicion(true);
                      setModalCitaAbierto(true);
                    }

                    if (accion === 'CANCELAR CITA' && eventoActivo) {
                      setMostrarCancelar(true);
                    }

                    if (accion === 'INSERTAR CITA') {
                    abrirInsertarCita();
                    }

                    if (accion === 'INSERTAR RECALL') {
                    abrirInsertarRecall();
                    }
                    
                  }}
                  className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1.5 text-[10px] tracking-[0.12em] text-cyan-100 hover:bg-cyan-500/20 hover:border-cyan-300/50 transition-all whitespace-nowrap"
                >
                  {accion}
                </button>
              ))}

              <button
                onClick={gestionarBloqueo}
                disabled={!slotInicio || loading}
                title={slotSeleccionadoBloqueado ? 'Desbloquear horario' : 'Bloquear horario'}
                className={`
                  w-9 h-9 rounded-full border flex items-center justify-center transition-all
                  ${
                    slotSeleccionadoBloqueado
                      ? 'border-cyan-200 bg-cyan-400/20 shadow-[0_0_22px_rgba(103,232,249,.45)]'
                      : 'border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-300/50'
                  }
                  ${!slotInicio || loading ? 'opacity-45 cursor-not-allowed' : ''}
                `}
              >
                <Lock className="w-4 h-4 text-cyan-200" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5 pb-3 text-left text-white text-sm tracking-[0.28em] font-light">
          {formatMes(semanaInicio)}
        </div>

        <div className="px-4 pb-5">
          <div className="grid grid-cols-5 gap-2">
            {diasSemana.map((dia) => (
              <div key={dia.toISOString()} className="text-cyan-200 font-medium capitalize px-2">
                {formatDia(dia)}
              </div>
            ))}

            {diasSemana.map((dia) => {
              const eventosDia = eventos.filter(e => e.fecha_inicio && sameDay(e.fecha_inicio, dia));

              return (
                <div
                  key={dia.toISOString()}
                  className="rounded-2xl border border-cyan-400/10 bg-[#03111A]/70 overflow-hidden"
                >
                  {slots.map((hora) => {
                    const slotKey = `${toDateKey(dia)}|${hora}`;
                    const slotInicioDate = crearFechaDesdeSlot(slotKey);
                    const slotFinDate = new Date(slotInicioDate);
                    slotFinDate.setMinutes(slotFinDate.getMinutes() + 15);

                    const eventoSlot = eventosDia.find((evento) => {
                      const inicioEvento = new Date(evento.fecha_inicio);
                      const finEvento = new Date(evento.fecha_fin);

                      return inicioEvento < slotFinDate && finEvento > slotInicioDate;
                    });

                    const esBloqueoEvento = esBloqueoAgenda(eventoSlot);

                    const esInicioEvento = eventoSlot
                      ? new Date(eventoSlot.fecha_inicio).getTime() === slotInicioDate.getTime()
                      : false;

                    const color = eventoSlot && !esBloqueoEvento ? getColorTratamiento(eventoSlot) : null;

                    const seleccionado = (() => {
                      if (!slotInicio) return false;

                      if (!slotFin) {
                        return slotKey === slotInicio;
                      }

                      const inicio = [slotInicio, slotFin].sort()[0];
                      const fin = [slotInicio, slotFin].sort()[1];

                      return slotKey >= inicio && slotKey <= fin;
                    })();

                    const bloqueadoAutomatico = isHorarioNoDisponible(hora, dia, agendaActiva);
                    const bloqueado = bloqueadoAutomatico || esBloqueoEvento;

                    return (
                      <button
                        key={slotKey}
                        onClick={() => manejarSeleccion(slotKey, eventoSlot)}
                        onDoubleClick={() => {
                          if (eventoSlot && !esBloqueoEvento) {
                            setEventoSeleccionado(eventoSlot);
                            setModoEdicion(false);
                            setModalCitaAbierto(true);
                          }
                        }}
                        style={{
                          height: SLOT_HEIGHT,
                          backgroundColor: esBloqueoEvento
                            ? 'rgba(6,182,212,.25)'
                            : eventoSlot && !esBloqueoEvento
                              ? color?.bg
                              : undefined,
                        }}
                        className={`
  w-full block border-b border-cyan-400/5 text-left px-2 text-[10px] transition-all
  ${bloqueadoAutomatico ? 'bg-cyan-500/25 hover:bg-cyan-500/30' : ''}
  ${!bloqueado && !eventoSlot ? 'hover:bg-cyan-500/10' : ''}
`}
                      >
                        <span
                          className={
                            eventoSlot && !esBloqueoEvento
                              ? `${color?.text || 'text-white'} font-semibold`
                              : bloqueado
                                ? 'text-white/90'
                                : 'text-white'
                          }
                        >
                          {hora}
                        </span>

                        {eventoSlot && !esBloqueoEvento && esInicioEvento && (
                          <span className={`ml-3 text-[11px] font-semibold truncate ${color?.text || 'text-white'}`}>
                            {eventoSlot.titulo || eventoSlot.nombre_paciente || 'Cita'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {modalCitaAbierto && eventoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[4vh]">
          <div
            style={{
              backgroundColor: getColorTratamiento(eventoSeleccionado).bg.replace(/\.[0-9]+\)/, '.28)'),
              boxShadow: `
                0 0 15px rgba(255,255,255,.35),
                0 0 35px rgba(255,255,255,.25),
                0 0 70px rgba(255,255,255,.15)
              `,
            }}
            className="
              w-full max-w-2xl rounded-3xl
              border border-white/50
              backdrop-blur-xl
              overflow-hidden
              bg-[#03111A]/70
            "
          >
            <div className="px-6 py-5 border-b border-white/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {eventoSeleccionado.nombre_paciente || eventoSeleccionado.titulo}
                    {eventoSeleccionado.motivo ? ` - ${eventoSeleccionado.motivo}` : ''}
                  </h2>

                  <p className="text-cyan-200 text-sm mt-1">
                    {new Date(eventoSeleccionado.fecha_inicio).toLocaleDateString('es-ES')}
                    {' · '}
                    {new Date(eventoSeleccionado.fecha_inicio).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {new Date(eventoSeleccionado.fecha_fin).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {modoEdicion && (
                    <button
                      onClick={guardarCambiosCita}
                      disabled={loading}
                      title="Guardar cambios"
                      className="text-cyan-200 hover:text-white text-2xl disabled:opacity-50"
                    >
                      ✓
                    </button>
                  )}

                  <button
                    onClick={cerrarModalCita}
                    className="text-white/80 hover:text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {modoEdicion && (
  <>
    {/* DESKTOP - fecha y horas */}
    <div className="hidden lg:grid grid-cols-3 gap-4">
  <div className="relative">
    <input
      type="date"
      value={toInputDate(eventoSeleccionado.fecha_inicio)}
      onChange={(e) => {
        const fecha = e.target.value;
        const inicio = toInputTime(eventoSeleccionado.fecha_inicio);
        const fin = toInputTime(eventoSeleccionado.fecha_fin);

        setEventoSeleccionado({
          ...eventoSeleccionado,
          fecha_inicio: buildISOFromDateTime(fecha, inicio),
          fecha_fin: buildISOFromDateTime(fecha, fin),
        });
      }}
      className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
    />
  </div>

  <div className="relative">
    <input
      type="time"
      step={300}
      value={toInputTime(eventoSeleccionado.fecha_inicio)}
      onChange={(e) => {
        const fecha = toInputDate(eventoSeleccionado.fecha_inicio);
        const nuevaHoraInicio = e.target.value;
        const nuevaFechaInicio = buildISOFromDateTime(fecha, nuevaHoraInicio);

        const duracion = getDuracionPorMotivo(
          getTratamientoValue(eventoSeleccionado.motivo) ||
          eventoSeleccionado.motivo ||
          eventoSeleccionado.titulo ||
          ''
        );

        const nuevaFechaFin = sumarMinutosISO(nuevaFechaInicio, duracion);

        setEventoSeleccionado({
          ...eventoSeleccionado,
          fecha_inicio: nuevaFechaInicio,
          fecha_fin: nuevaFechaFin,
        });
      }}
      className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
    />
    </div>

  <div className="relative">
    <input
      type="time"
      step={300}
      value={toInputTime(eventoSeleccionado.fecha_fin)}
      onChange={(e) => {
        const fecha = toInputDate(eventoSeleccionado.fecha_inicio);
        const nuevaHoraFin = e.target.value;

        setEventoSeleccionado({
          ...eventoSeleccionado,
          fecha_fin: buildISOFromDateTime(fecha, nuevaHoraFin),
        });
      }}
      className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
    />
    </div>
</div>
           
        {/* MOBILE - fecha arriba, horas debajo */}
    <div className="lg:hidden space-y-3">
      <input
        type="date"
        value={toInputDate(eventoSeleccionado.fecha_inicio)}
        onChange={(e) => {
          const fecha = e.target.value;
          const inicio = toInputTime(eventoSeleccionado.fecha_inicio);
          const fin = toInputTime(eventoSeleccionado.fecha_fin);

          setEventoSeleccionado({
            ...eventoSeleccionado,
            fecha_inicio: buildISOFromDateTime(fecha, inicio),
            fecha_fin: buildISOFromDateTime(fecha, fin),
          });
        }}
        className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          type="time"
          step={300}
          value={toInputTime(eventoSeleccionado.fecha_inicio)}
          onChange={(e) => {
            const fecha = toInputDate(eventoSeleccionado.fecha_inicio);
            const nuevaHoraInicio = e.target.value;
            const nuevaFechaInicio = buildISOFromDateTime(fecha, nuevaHoraInicio);

            const duracion = getDuracionPorMotivo(
              getTratamientoValue(eventoSeleccionado.motivo) ||
              eventoSeleccionado.motivo ||
              eventoSeleccionado.titulo ||
              ''
            );

            const nuevaFechaFin = sumarMinutosISO(nuevaFechaInicio, duracion);

            setEventoSeleccionado({
              ...eventoSeleccionado,
              fecha_inicio: nuevaFechaInicio,
              fecha_fin: nuevaFechaFin,
            });
          }}
          className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
        />

        <input
          type="time"
          step={300}
          value={toInputTime(eventoSeleccionado.fecha_fin)}
          onChange={(e) => {
            const fecha = toInputDate(eventoSeleccionado.fecha_inicio);

            setEventoSeleccionado({
              ...eventoSeleccionado,
              fecha_fin: buildISOFromDateTime(fecha, e.target.value),
            });
          }}
          className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
        />
      </div>
    </div>
  </>
)}

              <div className="grid grid-cols-[2fr_1fr] gap-5 items-start">
  <div className="min-w-0">
    <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
      Motivo
    </div>

    {modoEdicion ? (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMostrarMotivosEditar(!mostrarMotivosEditar)}
          className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
        >
          <span>{eventoSeleccionado.motivo || 'Seleccionar tratamiento'}</span>

          <svg
            className={`w-4 h-4 text-cyan-200 transition-transform ${
              mostrarMotivosEditar ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {mostrarMotivosEditar && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full max-h-56 overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
            {TRATAMIENTOS.map((tratamiento) => (
              <button
                key={tratamiento}
                type="button"
                onClick={() => {
                  const duracion = getDuracionPorMotivo(tratamiento);

                  const nuevaFechaFin = sumarMinutosISO(
                    eventoSeleccionado.fecha_inicio,
                    duracion
                  );

                  setEventoSeleccionado({
                    ...eventoSeleccionado,
                    motivo: tratamiento,
                    fecha_fin: nuevaFechaFin,
                  });

                  setMostrarMotivosEditar(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
              >
                {tratamiento}
              </button>
            ))}
          </div>
        )}
      </div>
    ) : (
      <div className="text-white">
        {eventoSeleccionado.motivo || '-'}
      </div>
    )}
  </div>

  <div>
    <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
      Teléfono
    </div>

    {modoEdicion ? (
      <input
        value={eventoSeleccionado.telefono || ''}
        onChange={(e) =>
          setEventoSeleccionado({
            ...eventoSeleccionado,
            telefono: e.target.value,
          })
        }
        className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
      />
    ) : (
      <div className="text-white text-sm font-medium">
        {eventoSeleccionado.telefono || 'No disponible'}
      </div>
    )}
  </div>
</div>

              <div>
                <div className="text-cyan-300 text-xs uppercase tracking-wider mb-2 font-bold">
                  Detalle del motivo
                </div>

                {modoEdicion ? (
                  <textarea
                    value={eventoSeleccionado.detalle_motivo || ''}
                    onChange={(e) =>
                      setEventoSeleccionado({
                        ...eventoSeleccionado,
                        detalle_motivo: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/25 bg-black/20 p-4 text-white resize-none outline-none"
                    rows={3}
                  />
                ) : (
                  <div className="rounded-2xl border border-white/25 bg-black/20 p-4 text-white/95">
                    {eventoSeleccionado.detalle_motivo || 'Sin observaciones'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-5 pt-2 border-t border-white/20">
                <div>
                  <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
                    Origen
                  </div>
                  <div className="text-white/95 text-sm">
                    {eventoSeleccionado.origen || 'No indicado'}
                  </div>
                </div>

                <div>
                  <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
                    Estado
                  </div>
                  <div className="text-white/95 text-sm">
                    {eventoSeleccionado.estado || 'Sin estado'}
                  </div>
                </div>

                <div>
                  <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
                    Cambios
                  </div>
                  <div className="text-white/95 text-sm">
                    {eventoSeleccionado.cambios ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarInsertar && (
  <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[4vh]">
    <div className="w-full max-w-2xl rounded-3xl border border-cyan-300/45 bg-[#03111A]/95 overflow-visible shadow-[0_0_46px_rgba(34,211,238,.24)]">
      <div className="px-6 py-5 border-b border-cyan-300/20 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
  {nuevaCita.nombre_paciente && nuevaCita.motivo
    ? `${nuevaCita.nombre_paciente} - ${nuevaCita.motivo}`
    : 'Insertar cita'}
</h2>
          <p className="text-cyan-200 text-sm mt-1">
            {new Date(nuevaCita.fecha_inicio).toLocaleDateString('es-ES')} · {toInputTime(nuevaCita.fecha_inicio)} - {toInputTime(nuevaCita.fecha_fin)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={guardarInsertarCita}
            disabled={loading}
            className="text-cyan-200 hover:text-white text-2xl disabled:opacity-50"
          >
            ✓
          </button>

          <button
            onClick={() => setMostrarInsertar(false)}
            className="text-white/80 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        
        {/* DESKTOP - fecha y horas */}
<div className="hidden lg:grid grid-cols-3 gap-4">
  <input
    type="date"
    value={toInputDate(nuevaCita.fecha_inicio)}
    onChange={(e) => {
      const fecha = e.target.value;
      const inicio = toInputTime(nuevaCita.fecha_inicio);
      const fin = toInputTime(nuevaCita.fecha_fin);

      setNuevaCita({
        ...nuevaCita,
        fecha_inicio: buildISOFromDateTime(fecha, inicio),
        fecha_fin: buildISOFromDateTime(fecha, fin),
      });
    }}
    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
  />

  <input
    type="time"
    step={300}
    value={toInputTime(nuevaCita.fecha_inicio)}
    onChange={(e) => {
      const fecha = toInputDate(nuevaCita.fecha_inicio);
      const nuevaFechaInicio = buildISOFromDateTime(fecha, e.target.value);
      const nuevaFechaFin = sumarMinutosISO(
        nuevaFechaInicio,
        getDuracionPorMotivo(nuevaCita.motivo)
      );

      setNuevaCita({
        ...nuevaCita,
        fecha_inicio: nuevaFechaInicio,
        fecha_fin: nuevaFechaFin,
      });
    }}
    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
  />

  <input
    type="time"
    step={300}
    value={toInputTime(nuevaCita.fecha_fin)}
    onChange={(e) => {
      const fecha = toInputDate(nuevaCita.fecha_inicio);

      setNuevaCita({
        ...nuevaCita,
        fecha_fin: buildISOFromDateTime(fecha, e.target.value),
      });
    }}
    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
  />
</div>

{/* MOBILE - fecha arriba, horas debajo */}
<div className="lg:hidden space-y-3">
  <input
    type="date"
    value={toInputDate(nuevaCita.fecha_inicio)}
    onChange={(e) => {
      const fecha = e.target.value;
      const inicio = toInputTime(nuevaCita.fecha_inicio);
      const fin = toInputTime(nuevaCita.fecha_fin);

      setNuevaCita({
        ...nuevaCita,
        fecha_inicio: buildISOFromDateTime(fecha, inicio),
        fecha_fin: buildISOFromDateTime(fecha, fin),
      });
    }}
    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
  />

  <div className="grid grid-cols-2 gap-3">
    <input
      type="time"
      step={300}
      value={toInputTime(nuevaCita.fecha_inicio)}
      onChange={(e) => {
        const fecha = toInputDate(nuevaCita.fecha_inicio);
        const nuevaFechaInicio = buildISOFromDateTime(fecha, e.target.value);
        const nuevaFechaFin = sumarMinutosISO(
          nuevaFechaInicio,
          getDuracionPorMotivo(nuevaCita.motivo)
        );

        setNuevaCita({
          ...nuevaCita,
          fecha_inicio: nuevaFechaInicio,
          fecha_fin: nuevaFechaFin,
        });
      }}
      className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
    />

    <input
      type="time"
      step={300}
      value={toInputTime(nuevaCita.fecha_fin)}
      onChange={(e) => {
        const fecha = toInputDate(nuevaCita.fecha_inicio);

        setNuevaCita({
          ...nuevaCita,
          fecha_fin: buildISOFromDateTime(fecha, e.target.value),
        });
      }}
      className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
    />
  </div>
</div>

        <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
  <div className="relative">
    <input
      placeholder="Buscar paciente"
      value={busquedaPaciente}
      onChange={(e) => {
        setBusquedaPaciente(e.target.value);
        setMostrarResultadosPaciente(true);
        setNuevaCita({
          ...nuevaCita,
          nombre_paciente: e.target.value,
        });
      }}
      className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
    />

    {mostrarResultadosPaciente && busquedaPaciente && pacientesFiltrados.length > 0 && (
      <div className="absolute left-0 top-[calc(100%+8px)] z-[100] max-h-44 w-full overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.18)]">
        {pacientesFiltrados.slice(0, 8).map((patient) => (
          <button
            key={patient.id}
            type="button"
            onClick={() => {
              const nombreCompleto = patient.nombre_completo || `${patient.nombre || ''} ${patient.apellidos || ''}`.trim();
              setMostrarResultadosPaciente(false);

              setNuevaCita({
                ...nuevaCita,
                nombre_paciente: nombreCompleto,
                telefono: patient.telefono || '',
              });

              setBusquedaPaciente(nombreCompleto);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
          >
            <div>{patient.nombre_completo}</div>
            <div className="text-xs text-cyan-100/60">{patient.telefono}</div>
          </button>
        ))}
      </div>
    )}
  </div>

  <button
  type="button"
  onClick={() => setMostrarNuevoPaciente(true)}
  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/60 bg-cyan-500/15 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,.32)] hover:bg-cyan-500/25 hover:shadow-[0_0_22px_rgba(34,211,238,.5)] transition-all"
>
  <span className="text-[18px] leading-none -translate-y-[1px]">+</span>
</button>

<input
  placeholder="Teléfono"
  value={nuevaCita.telefono}
  onChange={(e) => setNuevaCita({ ...nuevaCita, telefono: e.target.value })}
  className="rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
/>
</div>
{/* MOBILE - buscar paciente + / teléfono debajo */}
<div className="lg:hidden space-y-3">
  <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
    <div className="relative">
      <input
        placeholder="Buscar paciente"
        value={busquedaPaciente}
        onChange={(e) => {
          setBusquedaPaciente(e.target.value);
          setMostrarResultadosPaciente(true);
          setNuevaCita({
            ...nuevaCita,
            nombre_paciente: e.target.value,
          });
        }}
        className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
      />

      {mostrarResultadosPaciente && busquedaPaciente && pacientesFiltrados.length > 0 && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[100] max-h-44 w-full overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.18)]">
          {pacientesFiltrados.slice(0, 8).map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => {
                const nombreCompleto = patient.nombre_completo || `${patient.nombre || ''} ${patient.apellidos || ''}`.trim();
                setMostrarResultadosPaciente(false);
                setNuevaCita({
                  ...nuevaCita,
                  nombre_paciente: nombreCompleto,
                  telefono: patient.telefono || '',
                });
                setBusquedaPaciente(nombreCompleto);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
            >
              <div>{patient.nombre_completo}</div>
              <div className="text-xs text-cyan-100/60">{patient.telefono}</div>
            </button>
          ))}
        </div>
      )}
    </div>

    <button
      type="button"
      onClick={() => setMostrarNuevoPaciente(true)}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-300/60 bg-cyan-500/15 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,.32)] hover:bg-cyan-500/25 transition-all"
    >
      <span className="text-[20px] leading-none translate-y-[1px]">+</span>
    </button>
  </div>

  <input
    placeholder="Teléfono"
    value={nuevaCita.telefono}
    onChange={(e) => setNuevaCita({ ...nuevaCita, telefono: e.target.value })}
    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
  />
</div>
        
<div className="relative overflow-visible">
  <button
    type="button"
    onClick={() => setMostrarMotivos(!mostrarMotivos)}
    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
  >
    <span>{nuevaCita.motivo}</span>

    <svg
      className={`w-4 h-4 text-cyan-200 transition-transform ${
        mostrarMotivos ? 'rotate-180' : ''
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>

  {mostrarMotivos && (
    <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full max-h-64 overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
      {TRATAMIENTOS.map((tratamiento) => (
        <button
          key={tratamiento}
          type="button"
          onClick={() => {
            const fechaFin = sumarMinutosISO(
              nuevaCita.fecha_inicio,
              getDuracionPorMotivo(tratamiento)
            );

            setNuevaCita({
              ...nuevaCita,
              motivo: tratamiento,
              fecha_fin: fechaFin,
            });

            setMostrarMotivos(false);
          }}
          className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
        >
          {tratamiento}
        </button>
      ))}
    </div>
  )}
</div>

        <textarea
  placeholder="Detalle del motivo"
  value={nuevaCita.detalle_motivo}
  onChange={(e) => setNuevaCita({ ...nuevaCita, detalle_motivo: e.target.value })}
  rows={3}
  className="w-full rounded-2xl border border-white/25 bg-black/20 p-4 text-white resize-none outline-none"
/>

<div className="grid grid-cols-3 gap-5 pt-2 border-t border-white/20">
  <div>
    <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
      Origen
    </div>
    <div className="text-white/95 text-sm">
      {usuarioPanel}
    </div>
  </div>

  <div>
    <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
      Estado
    </div>
    <div className="text-white/95 text-sm">
      confirmada
    </div>
  </div>

  <div>
    <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
      Cambios
    </div>
    <div className="text-white/95 text-sm">
      0
    </div>
  </div>
</div>
      </div>
    </div>
  </div>
)}

      {mostrarInsertarRecall && (
  <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[4vh]">
    <div className="w-full max-w-2xl rounded-3xl border border-cyan-300/45 bg-[#03111A]/95 overflow-visible shadow-[0_0_46px_rgba(34,211,238,.24)]">
      <div className="px-6 py-5 border-b border-cyan-300/20 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {nuevoRecall.nombre_paciente && nuevoRecall.motivo_recall
              ? `${nuevoRecall.nombre_paciente} - ${nuevoRecall.tipo_recall || nuevoRecall.motivo_recall}`
              : 'Insertar recall'}
          </h2>

          <p className="text-cyan-200 text-sm mt-1">
            {nuevoRecall.fecha_recall
              ? `${new Date(nuevoRecall.fecha_recall).toLocaleDateString('es-ES')} · ${toInputTime(nuevoRecall.fecha_recall)}`
              : 'Selecciona fecha y hora de envío'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={guardarInsertarRecall}
            disabled={loading}
            className="text-cyan-200 hover:text-white text-2xl disabled:opacity-50"
          >
            ✓
          </button>

          <button
            onClick={() => setMostrarInsertarRecall(false)}
            className="text-white/80 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
              Fecha recall
            </div>

            <input
              type="date"
              value={nuevoRecall.fecha_recall ? toInputDate(nuevoRecall.fecha_recall) : ''}
              onChange={(e) => {
                const hora = nuevoRecall.fecha_recall
                  ? toInputTime(nuevoRecall.fecha_recall)
                  : '10:00';

                setNuevoRecall({
                  ...nuevoRecall,
                  fecha_recall: buildISOFromDateTime(e.target.value, hora),
                });
              }}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
            />
          </div>

          <div>
            <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
              Hora envío
            </div>

            <input
              type="time"
              step={300}
              value={nuevoRecall.fecha_recall ? toInputTime(nuevoRecall.fecha_recall) : '10:00'}
              onChange={(e) => {
                const fecha = nuevoRecall.fecha_recall
                  ? toInputDate(nuevoRecall.fecha_recall)
                  : toInputDate(new Date().toISOString());

                setNuevoRecall({
                  ...nuevoRecall,
                  fecha_recall: buildISOFromDateTime(fecha, e.target.value),
                });
              }}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
            />
          </div>
        </div>
<div className="hidden lg:block">
        <div className="grid grid-cols-2 gap-6">
          <div className="relative overflow-visible">
            <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
              Tipo
            </div>

            <button
              type="button"
              onClick={() => setMostrarTiposRecall(!mostrarTiposRecall)}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
            >
              <span>
                {nuevoRecall.tipo_recall || tipoRecallLabel(nuevoRecall.motivo_recall)}
              </span>

              <svg
                className={`w-4 h-4 text-cyan-200 transition-transform ${
                  mostrarTiposRecall ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mostrarTiposRecall && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                {TIPOS_RECALL.map((tipo) => (
                  <button
                    key={tipo.value}
                    type="button"
                    onClick={() => {
                      setNuevoRecall({
                        ...nuevoRecall,
                        motivo_recall: tipo.value,
  tipo_recall: tipo.label,
  fecha_recall: tipo.meses
    ? sumarMesesISO(tipo.meses)
    : '',
});
                      setMostrarTiposRecall(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
              Teléfono
            </div>

            <input
              value={nuevoRecall.telefono}
              onChange={(e) =>
                setNuevoRecall({
                  ...nuevoRecall,
                  telefono: e.target.value,
                })
              }
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
            />
          </div>
        </div>

        <div>
          <div className="text-cyan-300 text-xs uppercase tracking-wider mb-2 font-bold">
            Detalle recall
          </div>

          <textarea
            value={nuevoRecall.detalle_recall}
            onChange={(e) =>
              setNuevoRecall({
                ...nuevoRecall,
                detalle_recall: e.target.value,
              })
            }
            rows={3}
            className="w-full rounded-2xl border border-white/25 bg-black/20 p-4 text-white resize-none outline-none"
          />
        </div>

        <div className="grid grid-cols-[auto_auto_auto_auto_1fr] gap-x-8 gap-y-3 pt-2 border-t border-white/20">
          <div>
            <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
              Origen
            </div>
            <div className="text-white/95 text-sm">
              {usuarioPanel}
            </div>
          </div>

          <div>
  <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
    Fecha registro
  </div>
  <div className="text-white/95 text-sm">
    {new Date().toLocaleDateString('es-ES')}
  </div>
</div>

          <div>
            <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
              Estado
            </div>
            <div className="text-white/95 text-sm">
              Pendiente envío
            </div>
          </div>

          <div>
            <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
              Cambios
            </div>
            <div className="text-white/95 text-sm">
              0
            </div>
          </div>

          <div className="relative overflow-visible justify-self-end min-w-[130px] mr-6">
            <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
              Agenda
            </div>

            <button
              type="button"
              onClick={() => setMostrarAgendaRecall(!mostrarAgendaRecall)}
              className="w-full text-left text-white/95 text-sm flex items-center justify-between gap-2"
            >
              <span>
                {agendas.find(a => a.key === nuevoRecall.profesional)?.nombre ||
                  nuevoRecall.profesional ||
                  'Agenda'}
              </span>

              <svg
                className={`w-4 h-4 text-cyan-200 transition-transform ${
                  mostrarAgendaRecall ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mostrarAgendaRecall && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-[120] min-w-[160px] overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                {agendas.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => {
                      setNuevoRecall({
                        ...nuevoRecall,
                        profesional: a.key,
                      });
                      setMostrarAgendaRecall(false);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm whitespace-nowrap text-white hover:bg-cyan-500/15"
                  >
                    {a.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>

    {/* MOBILE - insertar recall */}
<div className="lg:hidden space-y-5">
  <div className="grid grid-cols-2 gap-4">
    <div>
      <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
        Fecha recall
      </div>

      <input
        type="date"
        value={nuevoRecall.fecha_recall ? toInputDate(nuevoRecall.fecha_recall) : ''}
        onChange={(e) => {
          const hora = nuevoRecall.fecha_recall
            ? toInputTime(nuevoRecall.fecha_recall)
            : '10:00';

          setNuevoRecall({
            ...nuevoRecall,
            fecha_recall: buildISOFromDateTime(e.target.value, hora),
          });
        }}
        className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
      />
    </div>

    <div>
      <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
        Hora envío
      </div>

      <input
        type="time"
        step={300}
        value={nuevoRecall.fecha_recall ? toInputTime(nuevoRecall.fecha_recall) : '10:00'}
        onChange={(e) => {
          const fecha = nuevoRecall.fecha_recall
            ? toInputDate(nuevoRecall.fecha_recall)
            : toInputDate(new Date().toISOString());

          setNuevoRecall({
            ...nuevoRecall,
            fecha_recall: buildISOFromDateTime(fecha, e.target.value),
          });
        }}
        className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
      />
    </div>
  </div>

  <div className="relative overflow-visible">
    <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
      Tipo
    </div>

    <button
      type="button"
      onClick={() => setMostrarTiposRecall(!mostrarTiposRecall)}
      className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
    >
      <span>{nuevoRecall.tipo_recall || tipoRecallLabel(nuevoRecall.motivo_recall)}</span>

      <svg
        className={`w-4 h-4 text-cyan-200 transition-transform ${
          mostrarTiposRecall ? 'rotate-180' : ''
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {mostrarTiposRecall && (
  <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full max-h-56 overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
    {TIPOS_RECALL.map((tipo) => (
      <button
        key={tipo.label}
        type="button"
        onClick={() => {
          setNuevoRecall({
            ...nuevoRecall,
            motivo_recall: tipo.value,
            tipo_recall: tipo.label,
            fecha_recall: tipo.meses
              ? sumarMesesISO(tipo.meses)
              : nuevoRecall.fecha_recall,
          });

          setMostrarTiposRecall(false);
        }}
        className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
      >
        {tipo.label}
      </button>
    ))}
  </div>
)}
</div>

<div>
  <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
    Teléfono
  </div>

  <input
    value={nuevoRecall.telefono}
    onChange={(e) =>
      setNuevoRecall({
        ...nuevoRecall,
        telefono: e.target.value,
      })
    }
    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
  />
</div>

<div>
  <div className="text-cyan-300 text-xs uppercase tracking-wider mb-2 font-bold">
    Detalle recall
  </div>

  <textarea
    value={nuevoRecall.detalle_recall}
    onChange={(e) =>
      setNuevoRecall({
        ...nuevoRecall,
        detalle_recall: e.target.value,
      })
    }
    className="w-full rounded-2xl border border-white/25 bg-black/20 p-4 text-white resize-none outline-none"
    rows={4}
  />
</div>

<div className="pt-3 border-t border-white/20 space-y-4">
  <div className="grid grid-cols-3 gap-3">
    <div>
      <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">
        Origen
      </div>
      <div className="text-white/95 text-xs">
        {usuarioPanel}
      </div>
    </div>

    <div>
      <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">
        Fecha registro
      </div>
      <div className="text-white/95 text-xs">
        {new Date().toLocaleDateString('es-ES')}
      </div>
    </div>

    <div>
      <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">
        Estado
      </div>
      <div className="text-white/95 text-xs">
        Pendiente envío
      </div>
    </div>
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">
        Cambios
      </div>
      <div className="text-white/95 text-xs">
        0
      </div>
    </div>

    <div className="relative overflow-visible">
      <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">
        Agenda
      </div>

      <button
        type="button"
        onClick={() => setMostrarAgendaRecall(!mostrarAgendaRecall)}
        className="w-full text-left text-white/95 text-xs flex items-center justify-between gap-2"
      >
        <span>
          {agendas.find((a) => a.key === nuevoRecall.profesional)?.nombre ||
            nuevoRecall.profesional ||
            'Agenda'}
        </span>

        <svg
          className={`w-4 h-4 text-cyan-200 transition-transform ${
            mostrarAgendaRecall ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {mostrarAgendaRecall && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[120] min-w-[160px] overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
          {agendas.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => {
                setNuevoRecall({
                  ...nuevoRecall,
                  profesional: a.key,
                });

                setMostrarAgendaRecall(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
            >
              {a.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
</div>
</div>
)}
      
      {mostrarNuevoPaciente && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-3xl border border-cyan-300/45 bg-[#03111A]/95 p-6 shadow-[0_0_42px_rgba(34,211,238,.28)]">
      <h3 className="text-center text-cyan-300 text-[13px] uppercase tracking-[0.24em] font-medium mb-5">
        Nuevo paciente
      </h3>

      <div className="space-y-4">
        <input
          placeholder="Nombre"
          value={nuevoPaciente.nombre}
          onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, nombre: e.target.value })}
          className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
        />

        <input
          placeholder="Apellidos"
          value={nuevoPaciente.apellidos}
          onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, apellidos: e.target.value })}
          className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
        />

        <input
          placeholder="Teléfono"
          value={nuevoPaciente.telefono}
          onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, telefono: e.target.value })}
          className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
        />
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => setMostrarNuevoPaciente(false)}
          className="rounded-full border border-white/20 px-5 py-1.5 text-sm text-white/80 hover:bg-white/10"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={() => {
            const nombreCompleto = `${nuevoPaciente.nombre} ${nuevoPaciente.apellidos}`.trim();

            setNuevaCita({
              ...nuevaCita,
              nombre_paciente: nombreCompleto,
              telefono: nuevoPaciente.telefono,
            });

            setBusquedaPaciente(nombreCompleto);
            setMostrarNuevoPaciente(false);
          }}
          className="rounded-full border border-cyan-400/50 bg-cyan-500/15 px-5 py-1.5 text-sm text-cyan-100 hover:bg-cyan-500/25"
        >
          Añadir
        </button>
      </div>
    </div>
  </div>
)}
      
      {mostrarCancelar && eventoActivo && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
    <div className="w-full max-w-[330px] rounded-3xl border border-cyan-300/45 bg-[#03111A]/95 px-6 py-5 shadow-[0_0_46px_rgba(34,211,238,.28)]">

      <div className="text-center text-cyan-300 text-[12px] uppercase tracking-[0.28em] font-medium mb-4">
        Va a cancelar esta cita
      </div>

      <div className="text-center text-cyan-100 text-sm font-medium mb-5">
        {eventoActivo.titulo || eventoActivo.nombre_paciente}
      </div>

      <div className="text-center text-white/95 text-sm mb-5">
        ¿Desea continuar?
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setMostrarCancelar(false)}
          className="rounded-full border border-cyan-400/50 bg-cyan-500/10 px-5 py-1.5 text-sm text-cyan-100 hover:bg-cyan-500/20 hover:border-cyan-300/70 transition-all"
        >
          No
        </button>

        <button
          onClick={cancelarCita}
          disabled={loading}
          style={{
            backgroundColor: getColorTratamiento(eventoActivo).bg
              .replace('.95)', '.68)')
              .replace('.90)', '.68)')
              .replace('.85)', '.68)'),
          }}
          className="rounded-full border border-white/25 px-5 py-1.5 text-sm text-white hover:brightness-110 disabled:opacity-50 transition-all"
        >
          Sí, cancelar
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
}
