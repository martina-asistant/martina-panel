'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Lock, Search, } from 'lucide-react';
import { getAgendaFede, getAgendaCelia, getAgendaAna, type EventoAgenda } from '@/lib/repos/agendas.repo';
import { createClient } from '@/lib/supabase/client';
import { createRecall } from '@/lib/repos/recalls.repo';
import { listTrabajosLaboratorio, crearTrabajoLaboratorio } from '@/lib/repos/laboratorio.repo';
import type { LaboratorioTrabajo, EstadoLaboratorio, LaboratorioNombre, TipoTrabajoLaboratorio, AgendaEstadoVisita, EstadoVisita } from '@/lib/types/db.types';
import type { UsuarioPanel } from '@/lib/types/db.types';
import {
  listEstadosVisita,
  upsertEstadoVisita,
  deleteEstadoVisita
} from '@/lib/repos/agenda-estados.repo';

const agendas = [
  { key: 'fede', nombre: 'Agenda Dr. Federico' },
  { key: 'celia', nombre: 'Agenda Dra. Celia' },
  { key: 'ana', nombre: 'Agenda Dra. Ana' },
];

const acciones = ['INSERTAR CITA', 'MODIFICAR CITA', 'CANCELAR CITA', 'INSERTAR RECALL', 'INSERTAR TRABAJO'];

const TRATAMIENTOS = [
  'Primera visita',
  'Revisión',
  'Revisión general',
  'Profilaxis',
  'Blanqueamiento',
  'Obturación',
  'Endodoncia',
  'Rec+Post',
  'Exodoncia',
  'Implante',
  'Cirugía',
  'Quitar puntos',
  'Impresiones',
  'Prueba-colocar',
  'Raspados',
  'Tallados',
  'Prótesis',
  'Férula Michigan',
  'Ver-valorar',
  'Ortodoncia',
  'Fotos',
];

type PatientOption = {
  id: string;
  nombre: string | null;
  apellidos: string | null;
  nombre_completo: string | null;
  telefono: string | null;
};

const LABORATORIOS = ['Julio', 'Alex', 'Juanjo', 'Claudia', 'Otro'];

const TIPOS_TRABAJO_LABORATORIO = [
  'Incrustación',
  'Corona',
  'Puente',
  'Implante',
  'Férula',
  'Otro',
];

const ESTADOS_LABORATORIO = [
  { value: 'pte_gestionar', label: 'Pte gestionar', dot: 'bg-red-600' },
  { value: 'disenado', label: 'Diseñado', dot: 'bg-violet-300' },
  { value: 'impreso', label: 'Impreso', dot: 'bg-pink-400' },
  { value: 'fresado', label: 'Fresado', dot: 'bg-blue-300' },
  { value: 'horneado', label: 'Horneado', dot: 'bg-orange-400' },
  { value: 'en_clinica', label: 'En clínica', dot: 'bg-emerald-400' },
  { value: 'finalizado', label: 'Finalizado', dot: 'bg-slate-300' },
];

const ESTADOS_VISITA = [
  { value: 'sala_espera', label: 'Sala de espera', dot: 'bg-yellow-300' },
  { value: 'en_gabinete', label: 'En gabinete', dot: 'bg-cyan-300' },
  { value: 'finalizada', label: 'Finalizada', dot: 'bg-emerald-400' },
  { value: 'no_ha_venido', label: 'No ha venido', dot: 'bg-red-500' },
] as const;

const getEstadoVisitaMeta = (estado?: string | null) =>
  ESTADOS_VISITA.find(e => e.value === estado) || null;

const getEventoEstadoKey = (evento?: EventoAgenda | null) => {
  if (!evento?.event_id || !evento?.calendar_id) return '';
  return `${evento.calendar_id}::${evento.event_id}`;
};

const getColorTextoCita = (color?: { text: string } | null) =>
  color?.text?.includes('#03111A') ? '#03111A' : '#ffffff';

const getEstadoLaboratorioLabel = (estado?: string | null) =>
  ESTADOS_LABORATORIO.find(e => e.value === estado)?.label || 'Pte gestionar';

const getEstadoLaboratorioDot = (estado?: string | null) =>
  ESTADOS_LABORATORIO.find(e => e.value === estado)?.dot || 'bg-red-600';

const formatFechaLaboratorioLista = (iso?: string | null) => {
  if (!iso) return '-';

  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
};

const formatFechaLaboratorioDetalle = (iso?: string | null) => {
  if (!iso) return '-';

  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
};

const TIPOS_RECALL = [
  { label: 'MTO Periodontal 4 meses', value: 'Profilaxis', meses: 4 },
  { label: 'MTO Periodontal 6 meses', value: 'Profilaxis', meses: 6 },
  { label: 'MTO Periodontal 1 año', value: 'Profilaxis', meses: 12 },
  { label: 'Revisión', value: 'Revisión', meses: null },
  { label: 'Revisión general', value: 'Revisión general', meses: null },
];

const tipoRecallLabel = (tipo?: string | null) => {
  if (!tipo) return '—';

  if (tipo === 'Profilaxis' || tipo === 'Limpieza') { return 'MTO Periodontal'; }
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

const formatTextoCitaAgenda = (texto?: string | null) =>
  String(texto || '');

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

  if (m === 'profilaxis' || m === 'limpieza') return 30;
  
  if (m === 'blanqueamiento') return 60;

  if (m === 'obturación' || m === 'obturacion') return 30;

  if (m === 'primera visita') return 45;

  if (m === 'endodoncia') return 45;

  if (m === 'rec+post') return 45;

  if (m === 'exodoncia') return 60;

  if (m === 'implante') return 45;

  if (m === 'cirugía' || m === 'cirugia') return 60;

  if (m === 'quitar puntos' ) return 5;

  if (m === 'impresiones') return 30;

  if (m === 'prueba-colocar') return 30;

  if (m === 'raspados') return 45;

  if (m === 'tallados') return 60;

  if (m === 'prótesis' || m === 'protesis') return 30;

  if (m === 'férula michigan' || m === 'ferula michigan') return 30;
  
  if (m === 'ver-valorar' || m === 'ver valorar') return 15;
  
  if (m === 'ortodoncia') return 45;

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

  if (motivo === 'profilaxis' || motivo === 'limpieza') {
  return { bg: 'rgba(148,163,184,.90)', text: 'text-white' };
}

if (motivo === 'exodoncia') {
  return {
    bg: 'rgba(248,113,113,.90)',
    text: 'text-white',
  };
}

  if (motivo === 'obturación' || motivo === 'obturacion') {
    return { bg: 'rgba(168,85,247,.90)', text: 'text-white' };
  }

  if (motivo === 'revisión' || motivo === 'revision') {
    return { bg: 'rgba(108,156,224,.90)', text: 'text-white' };
  }

  if (motivo === 'revisión general' || motivo === 'revision general') {
    return { bg: 'rgba(125,211,252,.90)', text: 'text-white' };
  }

  if (motivo === 'prótesis' || motivo === 'protesis') {
    return { bg: 'rgba(255,142,43,.85)', text: 'text-white' };
  }

  if (motivo === 'impresiones') {
    return { bg: 'rgba(255,169,77,.85)', text: 'text-white' };
  }

  if (motivo === 'prueba-colocar') {
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

  // VER-VALORAR (lila claro elegante)
if (motivo === 'ver-valorar' || motivo === 'ver valorar') {
  return {
    bg: 'rgba(184,163,209,.90)',
    text: 'text-white',
  };
}

// ORTODONCIA (morado intenso)
if (motivo === 'ortodoncia') {
  return {
    bg: 'rgba(122,91,157,.90)',
    text: 'text-white',
  };
}

// BLANQUEAMIENTO (plata brillante)
if (motivo === 'blanqueamiento') {
  return {
    bg: 'rgba(246,239,230,.90)',
    text: 'text-slate-800',
  };
}

  return { bg: 'rgba(59,130,246,.85)', text: 'text-white' };
};

export default function AgendasView() {
  const [agendaActiva, setAgendaActiva] = useState('fede');
  const [semanaInicio, setSemanaInicio] = useState(() => getMonday(new Date()));
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [estadosVisita, setEstadosVisita] = useState<Record<string, AgendaEstadoVisita>>({});
  const [menuEstadoVisitaAbierto, setMenuEstadoVisitaAbierto] = useState<string | null>(null);
  const [confirmarEstadoVisita, setConfirmarEstadoVisita] = useState<{
  evento: EventoAgenda;
  estado: EstadoVisita;
  titulo: string;
  texto: string;
  textoBoton: string;
} | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotInicio, setSlotInicio] = useState<string | null>(null);
  const [slotFin, setSlotFin] = useState<string | null>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoAgenda | null>(null);
  const [eventoActivo, setEventoActivo] = useState<EventoAgenda | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mostrarCancelar, setMostrarCancelar] = useState(false);
  const [modalCitaAbierto, setModalCitaAbierto] = useState(false);
  const [usuarioPanel, setUsuarioPanel] = useState('panel');
  const [datosUsuarioPanel, setDatosUsuarioPanel] = useState<UsuarioPanel | null>(null);
  const [mostrarInsertar, setMostrarInsertar] = useState(false);
  const [nuevaCita, setNuevaCita] = useState({
  nombre_paciente: '',
  nombre: '',
  apellidos: '',
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
  const [trabajosLaboratorio, setTrabajosLaboratorio] = useState<LaboratorioTrabajo[]>([]);
const [mostrarInsertarLaboratorio, setMostrarInsertarLaboratorio] = useState(false);
  const [trabajoLaboratorioAbiertoId, setTrabajoLaboratorioAbiertoId] = useState<string | null>(null);

const [nuevoTrabajoLaboratorio, setNuevoTrabajoLaboratorio] = useState({
  paciente_id: '',
  nombre_paciente: '',
  telefono: '',
  laboratorio: 'Julio' as LaboratorioNombre,
  trabajo: 'Incrustación' as TipoTrabajoLaboratorio,
  estado: 'pte_gestionar' as EstadoLaboratorio,
  anotaciones: '',
  piezas: '',
  fecha_cita: '',
  event_id_origen: '',
  calendar_id_origen: '',
});
  // DESKTOP - Buscar paciente en agenda
const [mostrarBuscarPacienteAgenda, setMostrarBuscarPacienteAgenda] = useState(false);

const [busquedaAgendaPaciente, setBusquedaAgendaPaciente] = useState({
  nombre_paciente: '',
  telefono: '',
  motivo: '',
  detalle_motivo: '',
});

const [resultadosBusquedaAgenda, setResultadosBusquedaAgenda] = useState<any[]>([]);
const [buscandoPacienteAgenda, setBuscandoPacienteAgenda] = useState(false);
const [mostrarResultadosPacienteAgenda, setMostrarResultadosPacienteAgenda] = useState(false);
const [pacienteAgendaSeleccionado, setPacienteAgendaSeleccionado] = useState<PatientOption | null>(null);
const [resultadoPendienteIrCita, setResultadoPendienteIrCita] = useState<any | null>(null);

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
  const [mostrarLaboratoriosLab, setMostrarLaboratoriosLab] = useState(false);
const [mostrarTrabajosLab, setMostrarTrabajosLab] = useState(false);
const [mostrarEstadosLab, setMostrarEstadosLab] = useState(false);
  
  const [diaMovilSeleccionado, setDiaMovilSeleccionado] = useState(() => new Date());
const [mostrarCalendarioMovil, setMostrarCalendarioMovil] = useState(false);
  const [mostrarCalendarioDesktop, setMostrarCalendarioDesktop] = useState(false);

  const esProfesional =
  datosUsuarioPanel?.rol === 'doctor' ||
  datosUsuarioPanel?.rol === 'doctora';

const agendaPermitida = datosUsuarioPanel?.agenda_permitida;
    

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

  const esSlotSeleccionado = (slotKey: string) => {
  if (!slotInicio) return false;

  if (!slotFin) {
    return slotKey === slotInicio;
  }

  const [inicio, fin] = [slotInicio, slotFin].sort();

  return slotKey >= inicio && slotKey <= fin;
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

  const citaOriginal = eventos.find(
    (evento) => evento.event_id === citaActualizada.event_id
  );

  const cambiaInicio =
    citaOriginal &&
    new Date(citaOriginal.fecha_inicio).getTime() !==
      new Date(citaActualizada.fecha_inicio).getTime();

  const nuevoNumeroCambios =
    (citaActualizada.cambios || 0) + (cambiaInicio ? 1 : 0);

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
            cambios: nuevoNumeroCambios,
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
        cambios: nuevoNumeroCambios,
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
    nombre: '',
    apellidos: '',
    telefono: '',
    motivo,
    detalle_motivo: '',
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
  });

  setNuevaCita({
  nombre_paciente: '',
  nombre: '',
  apellidos: '',
  telefono: '',
  motivo,
  detalle_motivo: '',
  fecha_inicio: fechaInicio,
  fecha_fin: fechaFin,
});

setBusquedaPaciente('');
setMostrarResultadosPaciente(false);
setMostrarNuevoPaciente(false);

setNuevoPaciente({
  nombre: '',
  apellidos: '',
  telefono: '',
});
    
  setMostrarInsertar(true);
};

  const abrirInsertarRecall = () => {
  if (!eventoActivo) return;

  const motivoOriginal = (eventoActivo.motivo || '').toLowerCase();

  let motivoRecall = 'Revisión general';

  if (
  motivoOriginal.includes('profilaxis') ||
  motivoOriginal.includes('limpieza') ||
  motivoOriginal.includes('higiene')
) {
  motivoRecall = 'Profilaxis';
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

  const abrirInsertarLaboratorio = () => {
  if (!eventoActivo) return;

  setNuevoTrabajoLaboratorio({
    paciente_id: (eventoActivo as any).paciente_id || '',
    nombre_paciente: eventoActivo.nombre_paciente || '',
    telefono: eventoActivo.telefono || '',
    laboratorio: 'Julio',
    trabajo: 'Incrustación',
    piezas: '',
    estado: 'pte_gestionar',
    anotaciones: '',
    fecha_cita:
  getTratamientoValue(eventoActivo.motivo || '') === 'Prueba-colocar'
    ? eventoActivo.fecha_inicio
    : '',
    event_id_origen: eventoActivo.event_id || '',
    calendar_id_origen: eventoActivo.calendar_id || '',
  });

  setMostrarInsertarLaboratorio(true);
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
        nombre: nuevaCita.nombre,
apellidos: nuevaCita.apellidos,
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

  const buscarPacienteEnAgenda = async () => {
  if (buscandoPacienteAgenda) return;

  const nombreBuscado = busquedaAgendaPaciente.nombre_paciente.trim();
  const telefonoBuscado = normalizarTelefonoBusquedaAgenda(busquedaAgendaPaciente.telefono);

  if (!nombreBuscado && !telefonoBuscado) {
    console.error('Falta nombre o teléfono para buscar paciente');
    return;
  }

  setBuscandoPacienteAgenda(true);

  try {
    const response = await fetch(
      'https://sheilacg.app.n8n.cloud/webhook/buscar-cita-paciente-martina-panel',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_paciente: nombreBuscado,
          telefono: telefonoBuscado,
          motivo: 'busqueda_panel',
          detalle_motivo: 'busqueda_panel',
        }),
      }
    );

    const data = await response.json();
    const respuesta = Array.isArray(data) ? data[0] : data;

    if (!respuesta?.encontrado) {
      setResultadosBusquedaAgenda([]);
      return;
    }

    const nombreNormalizado = normalizarTexto(nombreBuscado);

    const resultadosFiltrados = (respuesta.resultados || []).filter((resultado: any) => {
      const telefonoResultado = normalizarTelefonoBusquedaAgenda(resultado.telefono);
      const nombreResultado = normalizarTexto(resultado.nombre_paciente || '');

      if (telefonoBuscado) {
        return telefonoResultado === telefonoBuscado || telefonoResultado.endsWith(telefonoBuscado);
      }

      return nombreNormalizado && nombreResultado === nombreNormalizado;
    });

    setResultadosBusquedaAgenda(resultadosFiltrados);
  } catch (error) {
    console.error('Error buscando paciente en agenda:', error);
    setResultadosBusquedaAgenda([]);
  } finally {
    setBuscandoPacienteAgenda(false);
  }
};

  const normalizarTelefonoBusquedaAgenda = (telefono?: string | null) =>
  String(telefono || '').replace(/\D/g, '');

const pacientesFiltradosBusquedaAgenda = patients.filter((patient) => {
  const busqueda = normalizarTexto(busquedaAgendaPaciente.nombre_paciente || '');

  if (busqueda.length < 2) return false;

  const nombreCompleto = normalizarTexto(
    patient.nombre_completo ||
    `${patient.nombre || ''} ${patient.apellidos || ''}`
  );

  const telefono = normalizarTelefonoBusquedaAgenda(patient.telefono);

  return nombreCompleto.includes(busqueda) || telefono.includes(busqueda);
});

const seleccionarPacienteBusquedaAgenda = (patient: PatientOption) => {
  const nombreCompleto =
    patient.nombre_completo ||
    `${patient.nombre || ''} ${patient.apellidos || ''}`.trim();

  setBusquedaAgendaPaciente({
    nombre_paciente: nombreCompleto,
    telefono: patient.telefono || '',
    motivo: '',
    detalle_motivo: '',
  });

  setPacienteAgendaSeleccionado(patient);
  setMostrarResultadosPacienteAgenda(false);
  setResultadosBusquedaAgenda([]);
};

const actualizarTelefonoBusquedaAgenda = (telefono: string) => {
  const limpio = normalizarTelefonoBusquedaAgenda(telefono);

  const encontrado = patients.find((patient) => {
    const telPatient = normalizarTelefonoBusquedaAgenda(patient.telefono);
    return telPatient === limpio || telPatient.endsWith(limpio);
  });

  setBusquedaAgendaPaciente({
    nombre_paciente: encontrado
      ? encontrado.nombre_completo ||
        `${encontrado.nombre || ''} ${encontrado.apellidos || ''}`.trim()
      : busquedaAgendaPaciente.nombre_paciente,
    telefono,
    motivo: '',
    detalle_motivo: '',
  });

  setPacienteAgendaSeleccionado(encontrado || null);
  setResultadosBusquedaAgenda([]);
};
  
const irACitaResultado = (resultado: any) => {
  const profesional = (resultado.profesional || '').toLowerCase();

  const agendaDestino =
    profesional.includes('celia') ? 'celia' :
    profesional.includes('ana') ? 'ana' :
    'fede';

  const fecha = new Date(resultado.fecha_inicio);

  setResultadoPendienteIrCita(resultado);
  setAgendaActiva(agendaDestino);
  setSemanaInicio(getMonday(fecha));
  setDiaMovilSeleccionado(fecha);
  setMostrarBuscarPacienteAgenda(false);
  setSlotInicio(null);
  setSlotFin(null);
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

const guardarInsertarLaboratorio = async () => {
  if (loading) return;

  if (!nuevoTrabajoLaboratorio.nombre_paciente.trim()) {
    console.error('Falta paciente en trabajo laboratorio');
    return;
  }

  if (!nuevoTrabajoLaboratorio.anotaciones.trim()) {
    console.error('Falta anotación en trabajo laboratorio');
    return;
  }

  setLoading(true);

  try {
    const trabajoCreado = await crearTrabajoLaboratorio({
      paciente_id: nuevoTrabajoLaboratorio.paciente_id || null,
      nombre_paciente: nuevoTrabajoLaboratorio.nombre_paciente,
      telefono: nuevoTrabajoLaboratorio.telefono || null,
      laboratorio: nuevoTrabajoLaboratorio.laboratorio,
      trabajo: nuevoTrabajoLaboratorio.trabajo,
      piezas: nuevoTrabajoLaboratorio.piezas,
      estado: nuevoTrabajoLaboratorio.estado,
      anotaciones: nuevoTrabajoLaboratorio.anotaciones,
      fecha_cita: nuevoTrabajoLaboratorio.fecha_cita || null,
      event_id_origen: nuevoTrabajoLaboratorio.event_id_origen || null,
      calendar_id_origen: nuevoTrabajoLaboratorio.calendar_id_origen || null,
      usuario: usuarioPanel,
    });

    if (!trabajoCreado) {
      console.error('Error creando trabajo laboratorio');
      return;
    }

    setTrabajosLaboratorio(await listTrabajosLaboratorio());
    setMostrarInsertarLaboratorio(false);
    setEventoActivo(null);
    setSlotInicio(null);
    setSlotFin(null);
  } catch (error) {
    console.error('Error guardando trabajo laboratorio:', error);
  } finally {
    setLoading(false);
  }
};

const cargarEstadosVisita = async () => {
  const data = await listEstadosVisita();

  const mapa = data.reduce<Record<string, AgendaEstadoVisita>>((acc, item) => {
    acc[`${item.calendar_id}::${item.event_id}`] = item;
    return acc;
  }, {});

  setEstadosVisita(mapa);
};

const aplicarCambioEstadoVisita = async (
  evento: EventoAgenda,
  estado: EstadoVisita
) => {
  if (!evento?.event_id || !evento?.calendar_id || loading) return;

  const telefonoEvento = normalizarTelefonoBusquedaAgenda(evento.telefono);
  const fechaEvento = new Date(evento.fecha_inicio);

  const siguienteCita = eventos
    .filter((e) => {
      if (!e.event_id || e.event_id === evento.event_id) return false;
      if (esBloqueoAgenda(e)) return false;

      const tel = normalizarTelefonoBusquedaAgenda(e.telefono);
      if (!telefonoEvento || !tel) return false;

      return (
        tel === telefonoEvento ||
        tel.endsWith(telefonoEvento) ||
        telefonoEvento.endsWith(tel)
      );
    })
    .filter((e) => new Date(e.fecha_inicio) > fechaEvento)
    .sort(
      (a, b) =>
        new Date(a.fecha_inicio).getTime() -
        new Date(b.fecha_inicio).getTime()
    )[0] || null;

  const guardado = await upsertEstadoVisita({
    event_id: evento.event_id,
    calendar_id: evento.calendar_id,
    paciente_id: (evento as any).paciente_id || null,
    nombre_paciente: evento.nombre_paciente || evento.titulo || null,
    telefono: evento.telefono || null,
    estado_visita: estado,
    observaciones: null,
    updated_by: usuarioPanel,

    fecha_inicio: evento.fecha_inicio,
    fecha_fin: evento.fecha_fin,
    motivo: evento.motivo || null,

    siguiente_cita_fecha: siguienteCita?.fecha_inicio || null,
    siguiente_cita_fin: siguienteCita?.fecha_fin || null,
    siguiente_cita_motivo: siguienteCita?.motivo || null,
  });

  if (!guardado) return;

  const key = getEventoEstadoKey(evento);

  setMenuEstadoVisitaAbierto(null);
  setEstadosVisita(prev => ({
    ...prev,
    [key]: guardado,
  }));
};

const cambiarEstadoVisita = async (
  evento: EventoAgenda,
  estado: EstadoVisita
) => {
  if (!evento?.event_id || !evento?.calendar_id || loading) return;

  const esCitaPasada =
    new Date(evento.fecha_fin || evento.fecha_inicio) < new Date();

  const requiereConfirmacion =
    estado === 'finalizada' ||
    estado === 'no_ha_venido';

  if (requiereConfirmacion) {
    setConfirmarEstadoVisita({
      evento,
      estado,
      titulo: esCitaPasada
        ? 'Vas a modificar una cita pasada'
        : estado === 'finalizada'
          ? 'Vas a cambiar el estado de esta cita a Finalizada'
          : 'Vas a cambiar el estado de esta cita a No ha venido',
      texto: '¿Deseas continuar?',
      textoBoton: esCitaPasada ? 'Sí, modificar' : 'Sí, cambiar estado',
    });

    setMenuEstadoVisitaAbierto(null);
    return;
  }

  await aplicarCambioEstadoVisita(evento, estado);
};

  const limpiarEstadoVisita = async (evento: EventoAgenda) => {
  if (!evento?.event_id || !evento?.calendar_id || loading) return;

const ok = await deleteEstadoVisita(
  evento.event_id,
  evento.calendar_id
);

  if (!ok) return;

  const key = getEventoEstadoKey(evento);

  setMenuEstadoVisitaAbierto(null);

  setEstadosVisita(prev => {
    const copia = { ...prev };
    delete copia[key];
    return copia;
  });
};
  
const renderEstadoVisitaControl = (
  evento: EventoAgenda,
  color: { text: string } | null
) => {
  const key = getEventoEstadoKey(evento);
  const estadoActual = estadosVisita[key]?.estado_visita || '';
  const meta = getEstadoVisitaMeta(estadoActual);
  const colorTexto = getColorTextoCita(color);
  const abierto = menuEstadoVisitaAbierto === key;
  
  const ahora = new Date();

const esCitaPasada =
  new Date(evento.fecha_fin || evento.fecha_inicio) < ahora;

const estadosDisponibles = esCitaPasada
  ? ESTADOS_VISITA.filter(
      (e) =>
        e.value === 'finalizada' ||
        e.value === 'no_ha_venido'
    )
  : ESTADOS_VISITA;

  return (
    <div
      className={`absolute right-1 bottom-[2px] ${abierto ? 'z-[1000]' : 'z-[80]'}`}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMenuEstadoVisitaAbierto(prev => prev === key ? null : key);
        }}
        
        className={`
  h-[16px]
  w-[16px]

  rounded-[5px]

  border
  border-cyan-200/55

  bg-[#062733]/80
  backdrop-blur-sm

  flex
  items-center
  justify-center

  text-[9px]
  leading-none
  text-white/95
  font-medium

  transition-all
  duration-200

  shadow-[0_0_10px_rgba(34,211,238,.24)]

  hover:bg-[#0A3442]/90
  hover:border-cyan-200/75
  hover:shadow-[0_0_15px_rgba(34,211,238,.34)]
  
  ${meta ? 'min-w-[86px] max-w-[96px] px-1.5 pr-4 gap-1' : 'px-0'}
`}
        
      >
        {meta && (
          <>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,.35)] ${meta.dot}`} />
            <span className="truncate tracking-[0.02em]">{meta.label}</span>
          </>
        )}

        <ChevronDown
          className={`
            w-2.5 h-2.5 shrink-0
            ${meta ? 'absolute right-1' : ''}
            ${abierto ? 'rotate-180' : ''}
            transition-transform
          `}
        />
      </button>

      {abierto && (
  <div className="absolute right-0 top-[calc(100%+5px)] z-[999] min-w-[155px] overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">

    {!esCitaPasada && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          limpiarEstadoVisita(evento);
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-white hover:bg-cyan-500/15"
      >
        <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,.55)]" />
        <span>Sin estado</span>
      </button>
    )}

    {estadosDisponibles.map((estado) => (
      <button
        key={estado.value}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          cambiarEstadoVisita(evento, estado.value as EstadoVisita);
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-white hover:bg-cyan-500/15"
      >
        <span className={`w-2 h-2 rounded-full ${estado.dot}`} />
        <span>{estado.label}</span>
      </button>
    ))}
  </div>
)}
       </div>
    );
};
  

const esUltimaLineaVisibleEvento = (
  evento: EventoAgenda | null | undefined,
  slotFinDate: Date
) => {
  if (!evento) return false;

  const inicioEvento = new Date(evento.fecha_inicio);
  const finEvento = new Date(evento.fecha_fin);

  const siguienteInicio = new Date(slotFinDate);
  const siguienteFin = new Date(slotFinDate);
  siguienteFin.setMinutes(siguienteFin.getMinutes() + 15);

  return !(inicioEvento < siguienteFin && finEvento > siguienteInicio);
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
      .select('*')
      .eq('email', user.email)
      .single();

    setDatosUsuarioPanel(data);
    setUsuarioPanel(data?.nombre || user.email || 'panel');
  };

  cargarUsuarioPanel();
}, []);

  useEffect(() => {
  if (!esProfesional || !agendaPermitida) return;

  if (agendaActiva !== agendaPermitida) {
    const hoy = new Date();

    setAgendaActiva(agendaPermitida);
    setSemanaInicio(getMonday(hoy));
    setDiaMovilSeleccionado(hoy);
  }
}, [esProfesional, agendaPermitida]);

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

  const cargarLaboratorio = async () => {
    const data = await listTrabajosLaboratorio();
    setTrabajosLaboratorio(data);
  };

  cargarPatients();
  cargarLaboratorio();
  cargarEstadosVisita();
}, []);

useEffect(() => {
  if (!resultadoPendienteIrCita) return;
  if (!eventos.length) return;

  const eventoReal = eventos.find(
    (evento) => evento.event_id === resultadoPendienteIrCita.event_id
  );

  if (!eventoReal) return;

  setEventoActivo(eventoReal);
  setEventoSeleccionado(eventoReal);
  setModoEdicion(false);
  setModalCitaAbierto(true);
  setResultadoPendienteIrCita(null);
}, [eventos, resultadoPendienteIrCita]);
  
  const pacientesFiltrados = patients.filter((patient) => {
  const texto = `${patient.nombre_completo || ''} ${patient.telefono || ''}`.toLowerCase();
  return texto.includes(busquedaPaciente.toLowerCase());
});

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden px-2 py-4 lg:p-8 bg-[#02141B] text-white pb-20 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/35 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-300/55">
      <div className="hidden lg:flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="inline-block text-2xl font-semibold tracking-[-0.015em] bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent mb-1">
            Agendas
          </h1>
          <p className="text-sm text-cyan-100/55">Gestión de citas</p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 min-w-[205px]">
          <CalendarDays className="w-5 h-5 text-cyan-300" />

          <div className="relative">
 <button
  type="button"
  onClick={() => {
  if (esProfesional) return;
  setMostrarAgendas(!mostrarAgendas);
}}
  className="flex flex-1 items-center justify-between gap-2 bg-transparent text-white text-sm font-medium outline-none"
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
  if (esProfesional) return;

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
        onClick={() => {
  if (esProfesional) return;
  setMostrarAgendas(!mostrarAgendas);
}}
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
  if (esProfesional) return;

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

<div
  title={esProfesional ? 'Sin acceso' : undefined}
  className={`
    flex gap-2 overflow-x-auto px-3 py-3 border-b border-cyan-500/10
    [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/35
    ${esProfesional ? 'pointer-events-none opacity-45 blur-[0.2px] cursor-not-allowed' : ''}
  `}
>
  <button
  type="button"
  onClick={() => {
    setBusquedaAgendaPaciente({
      nombre_paciente: '',
      telefono: '',
      motivo: '',
      detalle_motivo: '',
    });
    setResultadosBusquedaAgenda([]);
    setMostrarBuscarPacienteAgenda(true);
  }}
  className="shrink-0 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1.5 text-[10px] tracking-[0.12em] text-cyan-100"
>
  BUSCAR PACIENTE
</button>
  
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

        if (accion === 'INSERTAR TRABAJO') {
  abrirInsertarLaboratorio();
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
  {slots.map((hora) => {
    const slotKey = `${toDateKey(diaMovilSeleccionado)}|${hora}`;
    const slotInicioDate = crearFechaDesdeSlot(slotKey);
    const slotFinDate = new Date(slotInicioDate);
    slotFinDate.setMinutes(slotFinDate.getMinutes() + 15);

    const eventosDia = eventos.filter(e => e.fecha_inicio && sameDay(e.fecha_inicio, diaMovilSeleccionado));

    const eventosSlot = eventosDia.filter((evento) => {
  const inicioEvento = new Date(evento.fecha_inicio);
  const finEvento = new Date(evento.fecha_fin);

  return inicioEvento < slotFinDate && finEvento > slotInicioDate;
});

const eventosRealesSlot = eventosSlot
  .filter((evento) => !esBloqueoAgenda(evento))
  .sort(
    (a, b) =>
      new Date(a.fecha_inicio).getTime() -
      new Date(b.fecha_inicio).getTime()
  );

const bloqueoEvento =
  eventosSlot.find((evento) => esBloqueoAgenda(evento)) || null;

const filasSlot: Array<EventoAgenda | null> =
  eventosRealesSlot.length > 0
    ? eventosRealesSlot
    : [bloqueoEvento];

const bloqueadoAutomatico = isHorarioNoDisponible(
  hora,
  diaMovilSeleccionado,
  agendaActiva
);

const seleccionado = esSlotSeleccionado(slotKey);
const haySolapamiento = eventosRealesSlot.length > 1;

return (
  <div key={slotKey}>
    {filasSlot.map((eventoSlot, indiceFila) => {
      const esBloqueoEvento = esBloqueoAgenda(eventoSlot);

      const esInicioEvento = eventoSlot
        ? new Date(eventoSlot.fecha_inicio).getTime() ===
          slotInicioDate.getTime()
        : false;

      const color =
        eventoSlot && !esBloqueoEvento
          ? getColorTratamiento(eventoSlot)
          : null;

      const bloqueado = bloqueadoAutomatico || esBloqueoEvento;

      const esUltimaLineaEvento = esUltimaLineaVisibleEvento(
        eventoSlot,
        slotFinDate
      );

      const mostrarTitulo =
        eventoSlot &&
        !esBloqueoEvento &&
        (esInicioEvento || haySolapamiento);

      return (
        <div
          key={
            eventoSlot?.event_id
              ? `${slotKey}-${eventoSlot.event_id}`
              : `${slotKey}-fila-${indiceFila}`
          }
          role="button"
          tabIndex={0}
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
            backgroundColor:
              seleccionado && (!eventoSlot || esBloqueoEvento)
                ? 'rgba(34,211,238,.34)'
                : esBloqueoEvento
                  ? 'rgba(6,182,212,.25)'
                  : eventoSlot && !esBloqueoEvento
                    ? color?.bg
                    : undefined,
          }}
          className={`
            relative w-full block border-b border-cyan-400/5 text-left px-2 text-[10px] transition-all
            ${
              seleccionado
                ? 'outline outline-[0.5px] outline-cyan-200/55 outline-offset-[-1px]'
                : ''
            }
            ${
              bloqueadoAutomatico
                ? 'bg-cyan-500/25 hover:bg-cyan-500/30'
                : ''
            }
            ${
              !bloqueado && !eventoSlot
                ? 'hover:bg-cyan-500/10'
                : ''
            }
          `}
        >
          <div className="flex items-center min-w-0 pr-1">
            <span
              className={
                eventoSlot && !esBloqueoEvento
                  ? `${color?.text || 'text-white'} font-semibold shrink-0`
                  : bloqueado
                    ? 'text-white/90 shrink-0'
                    : 'text-white shrink-0'
              }
            >
              {hora}
            </span>

            {mostrarTitulo && (
              <span
                className={`ml-3 text-[11px] font-semibold truncate ${
                  color?.text || 'text-white'
                }`}
              >
                {formatTextoCitaAgenda(
                  eventoSlot.titulo ||
                    eventoSlot.nombre_paciente ||
                    'Cita'
                )}
              </span>
            )}
          </div>

          {eventoSlot &&
            !esBloqueoEvento &&
            esUltimaLineaEvento &&
            renderEstadoVisitaControl(eventoSlot, color)}
        </div>
      );
    })}
  </div>
);
  })}
</div>
  </div>
</div>

      
      <div className="hidden lg:block rounded-3xl border border-cyan-500/20 bg-[rgba(5,18,24,.78)] backdrop-blur-xl overflow-hidden shadow-[0_0_35px_rgba(34,211,238,.10)]">
        <div className="bg-cyan-500/10 border-b border-cyan-500/10 px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex items-center gap-2 shrink-0">
              <h2 className="text-[13px] tracking-[0.03em] text-cyan-300 font-semibold whitespace-nowrap">
  {agenda?.nombre.replace('Agenda ', '').toUpperCase()}
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
  className="text-sm text-cyan-100/70 min-w-[105px] text-center hover:text-cyan-200 transition-colors"
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

            <div
  title={esProfesional ? 'Sin acceso' : undefined}
  className={`
    flex flex-wrap items-center justify-end gap-2 flex-1
    ${esProfesional ? 'pointer-events-none opacity-45 blur-[0.2px] cursor-not-allowed' : ''}
  `}
>
              <button
  type="button"
  onClick={() => {
    setBusquedaAgendaPaciente({
      nombre_paciente: '',
      telefono: '',
      motivo: '',
      detalle_motivo: '',
    });
    setResultadosBusquedaAgenda([]);
    setMostrarBuscarPacienteAgenda(true);
  }}
  className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1.5 text-[10px] tracking-[0.12em] text-cyan-100 hover:bg-cyan-500/20 hover:border-cyan-300/50 transition-all whitespace-nowrap"
>
  BUSCAR PACIENTE
</button>
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

                    if (accion === 'INSERTAR TRABAJO') {
  abrirInsertarLaboratorio();
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
  {formatMes(semanaInicio).replace(' DE ', ' ')}
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
                  className="rounded-2xl border border-cyan-400/10 bg-[#03111A]/70 overflow-visible"
                >
                  {slots.map((hora) => {
                    const slotKey = `${toDateKey(dia)}|${hora}`;
                    const slotInicioDate = crearFechaDesdeSlot(slotKey);
                    const slotFinDate = new Date(slotInicioDate);
                    slotFinDate.setMinutes(slotFinDate.getMinutes() + 15);

                   const eventosSlot = eventosDia.filter((evento) => {
  const inicioEvento = new Date(evento.fecha_inicio);
  const finEvento = new Date(evento.fecha_fin);

  return inicioEvento < slotFinDate && finEvento > slotInicioDate;
});


const eventosRealesSlot = eventosSlot
  .filter((evento) => !esBloqueoAgenda(evento))
  .sort(
    (a, b) =>
      new Date(a.fecha_inicio).getTime() -
      new Date(b.fecha_inicio).getTime()
  );

const bloqueoEvento =
  eventosSlot.find((evento) => esBloqueoAgenda(evento)) || null;

const filasSlot: Array<EventoAgenda | null> =
  eventosRealesSlot.length > 0
    ? eventosRealesSlot
    : [bloqueoEvento];

const bloqueadoAutomatico = isHorarioNoDisponible(
  hora,
  dia,
  agendaActiva
);

const seleccionado = esSlotSeleccionado(slotKey);
const haySolapamiento = eventosRealesSlot.length > 1;

return (
  <div key={slotKey}>
    {filasSlot.map((eventoSlot, indiceFila) => {
      const esBloqueoEvento = esBloqueoAgenda(eventoSlot);

      const esInicioEvento = eventoSlot
        ? new Date(eventoSlot.fecha_inicio).getTime() ===
          slotInicioDate.getTime()
        : false;

      const color =
        eventoSlot && !esBloqueoEvento
          ? getColorTratamiento(eventoSlot)
          : null;

      const bloqueado =
        bloqueadoAutomatico || esBloqueoEvento;

      const esUltimaLineaEvento =
        esUltimaLineaVisibleEvento(
          eventoSlot,
          slotFinDate
        );

      const mostrarTitulo =
        eventoSlot &&
        !esBloqueoEvento &&
        (esInicioEvento || haySolapamiento);

      return (
        <div
          key={
            eventoSlot?.event_id
              ? `${slotKey}-${eventoSlot.event_id}`
              : `${slotKey}-fila-${indiceFila}`
          }
          role="button"
          tabIndex={0}
          onClick={() =>
            manejarSeleccion(slotKey, eventoSlot)
          }
          onDoubleClick={() => {
            if (eventoSlot && !esBloqueoEvento) {
              setEventoSeleccionado(eventoSlot);
              setModoEdicion(false);
              setModalCitaAbierto(true);
            }
          }}
          style={{
            height: SLOT_HEIGHT,
            backgroundColor:
              seleccionado &&
              (!eventoSlot || esBloqueoEvento)
                ? 'rgba(34,211,238,.34)'
                : esBloqueoEvento
                  ? 'rgba(6,182,212,.25)'
                  : eventoSlot &&
                      !esBloqueoEvento
                    ? color?.bg
                    : undefined,
          }}
          className={`
            relative w-full block border-b border-cyan-400/5 text-left px-2 text-[10px] transition-all
            ${
              seleccionado
                ? 'outline outline-[0.5px] outline-cyan-200/55 outline-offset-[-1px]'
                : ''
            }
            ${
              bloqueadoAutomatico
                ? 'bg-cyan-500/25 hover:bg-cyan-500/30'
                : ''
            }
            ${
              !bloqueado && !eventoSlot
                ? 'hover:bg-cyan-500/10'
                : ''
            }
          `}
        >
          <div className="flex items-center min-w-0 pr-1">
            <span
              className={
                eventoSlot && !esBloqueoEvento
                  ? `${color?.text || 'text-white'} font-semibold shrink-0`
                  : bloqueado
                    ? 'text-white/90 shrink-0'
                    : 'text-white shrink-0'
              }
            >
              {hora}
            </span>

            {mostrarTitulo && (
              <span
                className={`ml-3 text-[11px] font-semibold truncate ${
                  color?.text || 'text-white'
                }`}
              >
                {formatTextoCitaAgenda(
                  eventoSlot.titulo ||
                    eventoSlot.nombre_paciente ||
                    'Cita'
                )}
              </span>
            )}
          </div>

          {eventoSlot &&
            !esBloqueoEvento &&
            esUltimaLineaEvento &&
            renderEstadoVisitaControl(
              eventoSlot,
              color
            )}
        </div>
      );
    })}
  </div>
);
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
                  
      
      {/* ---------- MODAL BUSCAR PACIENTE DESKTOP ---------- */}

      {mostrarBuscarPacienteAgenda && (
  <div className="hidden lg:flex fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6 py-10">
    <div className="w-full max-w-4xl rounded-3xl border border-cyan-300/45 bg-[#03111A]/95 overflow-hidden shadow-[0_0_46px_rgba(34,211,238,.24)]">
      <div className="px-6 py-5 border-b border-cyan-300/20 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Buscar paciente</h2>

        <button
          onClick={() => setMostrarBuscarPacienteAgenda(false)}
          className="text-white/80 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="relative z-[160] grid grid-cols-[1.4fr_0.9fr_auto] gap-3 items-end">
          <div className="relative">
            <input
              placeholder="Nombre y apellidos"
              value={busquedaAgendaPaciente.nombre_paciente}
              onFocus={() => setMostrarResultadosPacienteAgenda(true)}
              onChange={(e) => {
                setBusquedaAgendaPaciente({
                  ...busquedaAgendaPaciente,
                  nombre_paciente: e.target.value,
                  motivo: '',
                  detalle_motivo: '',
                });
                setPacienteAgendaSeleccionado(null);
                setMostrarResultadosPacienteAgenda(true);
                setResultadosBusquedaAgenda([]);
              }}
              className="w-full rounded-xl border border-cyan-400/20 bg-black/20 px-3 py-2 text-white outline-none placeholder:text-white/30 focus:border-cyan-300/50"
            />

            {mostrarResultadosPacienteAgenda && pacientesFiltradosBusquedaAgenda.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[999] max-h-52 overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                {pacientesFiltradosBusquedaAgenda.map((patient) => {
                  const nombreCompleto =
                    patient.nombre_completo ||
                    `${patient.nombre || ''} ${patient.apellidos || ''}`.trim();

                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => seleccionarPacienteBusquedaAgenda(patient)}
                      className="block w-full px-4 py-2.5 text-left text-sm text-white hover:bg-cyan-500/15"
                    >
                      <div className="font-medium">{nombreCompleto}</div>
                      <div className="text-xs text-cyan-100/55">
                        {patient.telefono || 'Sin teléfono'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <input
            placeholder="Teléfono"
            value={busquedaAgendaPaciente.telefono}
            onChange={(e) => actualizarTelefonoBusquedaAgenda(e.target.value)}
            className="rounded-xl border border-cyan-400/20 bg-black/20 px-3 py-2 text-white outline-none placeholder:text-white/30 focus:border-cyan-300/50"
          />

          <button
            type="button"
            onClick={buscarPacienteEnAgenda}
            disabled={buscandoPacienteAgenda}
            className="h-[42px] w-[48px] flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20 hover:border-cyan-300/50 transition-all disabled:opacity-50"
            title="Buscar cita"
          >
            {buscandoPacienteAgenda ? (
              <span className="text-xs">...</span>
            ) : (
              <Search className="h-5 w-5" />
            )}
          </button>
        </div>

       <div className="relative z-[10] rounded-2xl border border-cyan-400/20 bg-black/15 overflow-hidden max-h-[48vh] overflow-y-auto">
  <div className="grid grid-cols-[180px_110px_110px_110px_90px_110px_170px] gap-0 px-6 py-3 text-[10px] tracking-[0.14em] uppercase text-cyan-300 border-b border-cyan-400/15">
    <div>Paciente</div>
    <div>Teléfono</div>
    <div>Motivo</div>
    <div>Fecha</div>
    <div>Hora</div>
    <div>Agenda</div>
    <div />
  </div>

  {resultadosBusquedaAgenda.length === 0 ? (
    <div className="px-4 py-6 text-sm text-cyan-100/55 text-center">
      Sin resultados
    </div>
  ) : (
    resultadosBusquedaAgenda.map((resultado, index) => (
      <div
        key={`${resultado.event_id}-${index}`}
        className="grid grid-cols-[180px_110px_110px_110px_90px_110px_170px] gap-0 px-6 py-3 items-center border-b border-cyan-400/10 last:border-b-0 text-sm text-white"
      >
        <div className="truncate">{resultado.nombre_paciente}</div>
        <div className="text-cyan-100/75">{resultado.telefono}</div>
        <div className="truncate text-cyan-100/85">{resultado.motivo}</div>

        <div className="text-cyan-100/75">
          {new Date(resultado.fecha_inicio).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </div>

        <div className="text-cyan-100/75">
          {new Date(resultado.fecha_inicio).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>

        <div className="text-cyan-100/75">{resultado.profesional}</div>

        <button
          type="button"
          onClick={() => irACitaResultado(resultado)}
          className="justify-self-start rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] tracking-[0.12em] text-cyan-100 hover:bg-cyan-500/20 hover:border-cyan-300/50 transition-all whitespace-nowrap"
        >
          IR A LA CITA
        </button>
      </div>
    ))
  )}
</div>
      </div>
    </div>
  </div>
)}

      {/* MOBILE - Buscar paciente en agenda */}
{mostrarBuscarPacienteAgenda && (
  <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6">
    <div className="w-full max-w-md rounded-3xl border border-cyan-300/45 bg-[#03111A]/95 overflow-hidden shadow-[0_0_46px_rgba(34,211,238,.24)]">
      <div className="px-5 py-4 border-b border-cyan-300/20 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Buscar paciente</h2>

        <button
          onClick={() => setMostrarBuscarPacienteAgenda(false)}
          className="text-white/80 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div className="relative">
          <input
            placeholder="Nombre y apellidos"
            value={busquedaAgendaPaciente.nombre_paciente}
            onFocus={() => setMostrarResultadosPacienteAgenda(true)}
            onChange={(e) => {
              setBusquedaAgendaPaciente({
                ...busquedaAgendaPaciente,
                nombre_paciente: e.target.value,
                motivo: '',
                detalle_motivo: '',
              });
              setPacienteAgendaSeleccionado(null);
              setMostrarResultadosPacienteAgenda(true);
              setResultadosBusquedaAgenda([]);
            }}
            className="w-full rounded-xl border border-cyan-400/20 bg-black/20 px-3 py-2 text-white outline-none placeholder:text-white/30 focus:border-cyan-300/50"
          />

          {mostrarResultadosPacienteAgenda && pacientesFiltradosBusquedaAgenda.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[999] max-h-52 overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
              {pacientesFiltradosBusquedaAgenda.map((patient) => {
                const nombreCompleto =
                  patient.nombre_completo ||
                  `${patient.nombre || ''} ${patient.apellidos || ''}`.trim();

                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => seleccionarPacienteBusquedaAgenda(patient)}
                    className="block w-full px-4 py-2.5 text-left text-sm text-white hover:bg-cyan-500/15"
                  >
                    <div className="font-medium">{nombreCompleto}</div>
                    <div className="text-xs text-cyan-100/55">
                      {patient.telefono || 'Sin teléfono'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <input
          placeholder="Teléfono"
          value={busquedaAgendaPaciente.telefono}
          onChange={(e) => actualizarTelefonoBusquedaAgenda(e.target.value)}
          className="w-full rounded-xl border border-cyan-400/20 bg-black/20 px-3 py-2 text-white outline-none placeholder:text-white/30 focus:border-cyan-300/50"
        />

        <button
          type="button"
          onClick={buscarPacienteEnAgenda}
          disabled={buscandoPacienteAgenda}
          className="w-full h-[42px] flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20 hover:border-cyan-300/50 transition-all disabled:opacity-50"
        >
          {buscandoPacienteAgenda ? (
            <span className="text-xs tracking-[0.12em]">BUSCANDO…</span>
          ) : (
            <>
              <Search className="h-5 w-5" />
              <span className="text-xs tracking-[0.12em]">BUSCAR CITA</span>
            </>
          )}
        </button>

        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
          {resultadosBusquedaAgenda.length === 0 ? (
            <div className="rounded-2xl border border-cyan-400/20 bg-black/15 px-4 py-6 text-sm text-cyan-100/55 text-center">
              Sin resultados
            </div>
          ) : (
            resultadosBusquedaAgenda.map((resultado, index) => (
              <div
                key={`${resultado.event_id}-${index}`}
                className="rounded-2xl border border-cyan-400/20 bg-black/15 p-4 space-y-3"
              >
                <div>
                  <div className="text-white font-semibold">
                    {resultado.nombre_paciente}
                  </div>
                  <div className="text-sm text-cyan-100/65">
                    {resultado.telefono}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
  <div>
    <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-300 mb-1">
      Motivo
    </div>
    <div className="text-cyan-100/85">
      {resultado.motivo}
    </div>
  </div>

  <div>
    <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-300 mb-1">
      Agenda
    </div>
    <div className="text-cyan-100/85">
      {resultado.profesional}
    </div>
  </div>

  <div>
    <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-300 mb-1">
      Fecha
    </div>
    <div className="text-cyan-100/85">
      {new Date(resultado.fecha_inicio).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}
    </div>
  </div>

  <div>
    <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-300 mb-1">
      Hora
    </div>
    <div className="text-cyan-100/85">
      {new Date(resultado.fecha_inicio).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </div>
  </div>
</div>

                <button
                  type="button"
                  onClick={() => irACitaResultado(resultado)}
                  className="w-full rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-[10px] tracking-[0.12em] text-cyan-100 hover:bg-cyan-500/20 hover:border-cyan-300/50 transition-all"
                >
                  IR A LA CITA
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </div>
)}
      
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

              <div className="grid grid-cols-[2fr_1fr] gap-8 items-start">
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
            {nuevoRecall.nombre_paciente && nuevoRecall.tipo_recall
              ? `${nuevoRecall.nombre_paciente} - ${nuevoRecall.tipo_recall}`
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
                const hora = nuevoRecall.fecha_recall ? toInputTime(nuevoRecall.fecha_recall) : '10:00';

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

        {/* DESKTOP */}
        <div className="hidden lg:block space-y-5">
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
                <span>{nuevoRecall.tipo_recall || tipoRecallLabel(nuevoRecall.motivo_recall)}</span>
                <svg className={`w-4 h-4 text-cyan-200 transition-transform ${mostrarTiposRecall ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                          fecha_recall: tipo.meses ? sumarMesesISO(tipo.meses) : nuevoRecall.fecha_recall,
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
                onChange={(e) => setNuevoRecall({ ...nuevoRecall, telefono: e.target.value })}
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
              onChange={(e) => setNuevoRecall({ ...nuevoRecall, detalle_recall: e.target.value })}
              rows={3}
              className="w-full rounded-2xl border border-white/25 bg-black/20 p-4 text-white resize-none outline-none"
            />
          </div>

          <div className="grid grid-cols-[auto_auto_auto_auto_1fr] gap-x-8 gap-y-3 pt-2 border-t border-white/20">
            <div>
              <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">Origen</div>
              <div className="text-white/95 text-sm">{usuarioPanel}</div>
            </div>

            <div>
              <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">Fecha registro</div>
              <div className="text-white/95 text-sm">{new Date().toLocaleDateString('es-ES')}</div>
            </div>

            <div>
              <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">Estado</div>
              <div className="text-white/95 text-sm">Pendiente envío</div>
            </div>

            <div>
              <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">Cambios</div>
              <div className="text-white/95 text-sm">0</div>
            </div>

            <div className="relative overflow-visible justify-self-end min-w-[130px] mr-6">
              <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">Agenda</div>

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
                <svg className={`w-4 h-4 text-cyan-200 transition-transform ${mostrarAgendaRecall ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        setNuevoRecall({ ...nuevoRecall, profesional: a.key });
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

        {/* MOBILE */}
        <div className="lg:hidden space-y-5">
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
              <svg className={`w-4 h-4 text-cyan-200 transition-transform ${mostrarTiposRecall ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        fecha_recall: tipo.meses ? sumarMesesISO(tipo.meses) : nuevoRecall.fecha_recall,
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
              onChange={(e) => setNuevoRecall({ ...nuevoRecall, telefono: e.target.value })}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
            />
          </div>

          <div>
            <div className="text-cyan-300 text-xs uppercase tracking-wider mb-2 font-bold">
              Detalle recall
            </div>

            <textarea
              value={nuevoRecall.detalle_recall}
              onChange={(e) => setNuevoRecall({ ...nuevoRecall, detalle_recall: e.target.value })}
              rows={4}
              className="w-full rounded-2xl border border-white/25 bg-black/20 p-4 text-white resize-none outline-none"
            />
          </div>

          <div className="pt-3 border-t border-white/20 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">Origen</div>
                <div className="text-white/95 text-xs">{usuarioPanel}</div>
              </div>

              <div>
                <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">Fecha registro</div>
                <div className="text-white/95 text-xs">{new Date().toLocaleDateString('es-ES')}</div>
              </div>

              <div>
                <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">Estado</div>
                <div className="text-white/95 text-xs">Pendiente envío</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">Cambios</div>
                <div className="text-white/95 text-xs">0</div>
              </div>

              <div className="relative overflow-visible">
                <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">Agenda</div>

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
                  <svg className={`w-4 h-4 text-cyan-200 transition-transform ${mostrarAgendaRecall ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {mostrarAgendaRecall && (
                  <div className="absolute right-0 bottom-[calc(100%+8px)] z-[999] min-w-[180px] max-h-40 overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                    {agendas.map((a) => (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => {
                          setNuevoRecall({ ...nuevoRecall, profesional: a.key });
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
      </div>
    </div>
  </div>
)}

      {mostrarInsertarLaboratorio && (
  <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[4vh]">
    <div className="w-full max-w-3xl rounded-3xl border border-cyan-300/45 bg-[#03111A]/95 overflow-visible shadow-[0_0_46px_rgba(34,211,238,.24)]">
      <div className="px-6 py-5 border-b border-cyan-300/20 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {nuevoTrabajoLaboratorio.nombre_paciente
              ? `${nuevoTrabajoLaboratorio.nombre_paciente} - Laboratorio`
              : 'Insertar trabajo'}
          </h2>

          <p className="text-cyan-200 text-sm mt-1">
            Nuevo trabajo de laboratorio
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={guardarInsertarLaboratorio}
            disabled={loading}
            className="text-cyan-200 hover:text-white text-2xl disabled:opacity-50"
          >
            ✓
          </button>

          <button
            onClick={() => setMostrarInsertarLaboratorio(false)}
            className="text-white/80 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* DESKTOP */}
        <div className="hidden lg:block space-y-5">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-4">
            <div>
              <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
                Paciente
              </div>

              <input
                value={nuevoTrabajoLaboratorio.nombre_paciente}
                readOnly
                className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none opacity-80"
              />
            </div>

            <div className="relative overflow-visible">
              <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
                Laboratorio
              </div>

              <button
                type="button"
                onClick={() => setMostrarLaboratoriosLab(!mostrarLaboratoriosLab)}
                className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
              >
                <span>{nuevoTrabajoLaboratorio.laboratorio}</span>
                <ChevronDown className={`w-4 h-4 text-cyan-200 transition-transform ${mostrarLaboratoriosLab ? 'rotate-180' : ''}`} />
              </button>

              {mostrarLaboratoriosLab && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                  {LABORATORIOS.map((lab) => (
                    <button
                      key={lab}
                      type="button"
                      onClick={() => {
                        setNuevoTrabajoLaboratorio({
                          ...nuevoTrabajoLaboratorio,
                          laboratorio: lab as LaboratorioNombre,
                        });
                        setMostrarLaboratoriosLab(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
                    >
                      {lab}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative overflow-visible">
              <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
                Trabajo
              </div>

              <button
                type="button"
                onClick={() => setMostrarTrabajosLab(!mostrarTrabajosLab)}
                className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
              >
                <span>{nuevoTrabajoLaboratorio.trabajo}</span>
                <ChevronDown className={`w-4 h-4 text-cyan-200 transition-transform ${mostrarTrabajosLab ? 'rotate-180' : ''}`} />
              </button>

              {mostrarTrabajosLab && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                  {TIPOS_TRABAJO_LABORATORIO.map((trabajo) => (
                    <button
                      key={trabajo}
                      type="button"
                      onClick={() => {
                        setNuevoTrabajoLaboratorio({
                          ...nuevoTrabajoLaboratorio,
                          trabajo: trabajo as TipoTrabajoLaboratorio,
                        });
                        setMostrarTrabajosLab(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
                    >
                      {trabajo}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative overflow-visible">
              <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
                Estado
              </div>

              <button
                type="button"
                onClick={() => setMostrarEstadosLab(!mostrarEstadosLab)}
                className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
              >
                <span>{getEstadoLaboratorioLabel(nuevoTrabajoLaboratorio.estado)}</span>
                <ChevronDown className={`w-4 h-4 text-cyan-200 transition-transform ${mostrarEstadosLab ? 'rotate-180' : ''}`} />
              </button>

              {mostrarEstadosLab && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[120] w-full overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                  {ESTADOS_LABORATORIO.map((estado) => (
                    <button
                      key={estado.value}
                      type="button"
                      onClick={() => {
                        setNuevoTrabajoLaboratorio({
                          ...nuevoTrabajoLaboratorio,
                          estado: estado.value as EstadoLaboratorio,
                        });
                        setMostrarEstadosLab(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${estado.dot}`} />
                      {estado.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

<div>
  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">
    Piezas
  </label>

  <input
    value={nuevoTrabajoLaboratorio.piezas}
    onChange={(e) =>
      setNuevoTrabajoLaboratorio(prev => ({
        ...prev,
        piezas: e.target.value,
      }))
    }
    placeholder="Ej: 13-23"
    className="w-full rounded-xl border border-cyan-400/20 bg-[#04141D] px-3 py-2 text-white outline-none focus:border-cyan-400"
  />
</div>
          
          <div>
            <div className="text-cyan-300 text-xs uppercase tracking-wider mb-2 font-bold">
              Anotaciones
            </div>

            <textarea
              value={nuevoTrabajoLaboratorio.anotaciones}
              onChange={(e) =>
                setNuevoTrabajoLaboratorio({
                  ...nuevoTrabajoLaboratorio,
                  anotaciones: e.target.value,
                })
              }
              rows={3}
              className="w-full rounded-2xl border border-white/25 bg-black/20 p-4 text-white resize-none outline-none"
              placeholder="Ej. Corona 37 distal..."
            />
          </div>

          <div className="grid grid-cols-[auto_auto_auto_1fr] gap-x-8 gap-y-3 pt-2 border-t border-white/20">
            <div>
              <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
                Origen
              </div>
              <div className="text-white/95 text-sm">{usuarioPanel}</div>
            </div>

            <div>
              <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
                Cambio
              </div>
              <div className="text-white/95 text-sm">Creación</div>
            </div>

            <div>
              <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
                Actualizado
              </div>
              <div className="text-white/95 text-sm">
                {new Date().toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                })} · {new Date().toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="justify-self-end flex items-end">
              <ChevronDown className="w-4 h-4 text-cyan-200 opacity-50" />
            </div>
          </div>
        </div>

        {/* MOBILE */}
        <div className="lg:hidden space-y-5">
          <div>
            <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
              Paciente
            </div>

            <input
              value={nuevoTrabajoLaboratorio.nombre_paciente}
              readOnly
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none opacity-80"
            />
          </div>

          <div className="relative overflow-visible">
            <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
              Laboratorio
            </div>

            <button
              type="button"
              onClick={() => setMostrarLaboratoriosLab(!mostrarLaboratoriosLab)}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
            >
              <span>{nuevoTrabajoLaboratorio.laboratorio}</span>
              <ChevronDown className={`w-4 h-4 text-cyan-200 transition-transform ${mostrarLaboratoriosLab ? 'rotate-180' : ''}`} />
            </button>

            {mostrarLaboratoriosLab && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                {LABORATORIOS.map((lab) => (
                  <button
                    key={lab}
                    type="button"
                    onClick={() => {
                      setNuevoTrabajoLaboratorio({
                        ...nuevoTrabajoLaboratorio,
                        laboratorio: lab as LaboratorioNombre,
                      });
                      setMostrarLaboratoriosLab(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
                  >
                    {lab}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative overflow-visible">
            <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
              Trabajo
            </div>

            <button
              type="button"
              onClick={() => setMostrarTrabajosLab(!mostrarTrabajosLab)}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
            >
              <span>{nuevoTrabajoLaboratorio.trabajo}</span>
              <ChevronDown className={`w-4 h-4 text-cyan-200 transition-transform ${mostrarTrabajosLab ? 'rotate-180' : ''}`} />
            </button>

            {mostrarTrabajosLab && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                {TIPOS_TRABAJO_LABORATORIO.map((trabajo) => (
                  <button
                    key={trabajo}
                    type="button"
                    onClick={() => {
                      setNuevoTrabajoLaboratorio({
                        ...nuevoTrabajoLaboratorio,
                        trabajo: trabajo as TipoTrabajoLaboratorio,
                      });
                      setMostrarTrabajosLab(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
                  >
                    {trabajo}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative overflow-visible">
            <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
              Estado
            </div>

            <button
              type="button"
              onClick={() => setMostrarEstadosLab(!mostrarEstadosLab)}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
            >
              <span>{getEstadoLaboratorioLabel(nuevoTrabajoLaboratorio.estado)}</span>
              <ChevronDown className={`w-4 h-4 text-cyan-200 transition-transform ${mostrarEstadosLab ? 'rotate-180' : ''}`} />
            </button>

            {mostrarEstadosLab && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                {ESTADOS_LABORATORIO.map((estado) => (
                  <button
                    key={estado.value}
                    type="button"
                    onClick={() => {
                      setNuevoTrabajoLaboratorio({
                        ...nuevoTrabajoLaboratorio,
                        estado: estado.value as EstadoLaboratorio,
                      });
                      setMostrarEstadosLab(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${estado.dot}`} />
                    {estado.label}
                  </button>
                ))}
              </div>
            )}
          </div>

<div>
  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">
    Piezas
  </label>

  <input
    value={nuevoTrabajoLaboratorio.piezas}
    onChange={(e) =>
      setNuevoTrabajoLaboratorio(prev => ({
        ...prev,
        piezas: e.target.value,
      }))
    }
    placeholder="Ej: 13-23"
    className="w-full rounded-xl border border-cyan-400/20 bg-[#04141D] px-3 py-2 text-white outline-none focus:border-cyan-400"
  />
</div>
          
          <div>
            <div className="text-cyan-300 text-xs uppercase tracking-wider mb-2 font-bold">
              Anotaciones
            </div>

            <textarea
              value={nuevoTrabajoLaboratorio.anotaciones}
              onChange={(e) =>
                setNuevoTrabajoLaboratorio({
                  ...nuevoTrabajoLaboratorio,
                  anotaciones: e.target.value,
                })
              }
              rows={4}
              className="w-full rounded-2xl border border-white/25 bg-black/20 p-4 text-white resize-none outline-none"
              placeholder="Ej. Corona 37 distal..."
            />
          </div>

          <div className="pt-3 border-t border-white/20">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
              <div>
                <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">
                  Origen
                </div>
                <div className="text-white/95 text-xs">{usuarioPanel}</div>
              </div>

              <div>
                <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">
                  Cambio
                </div>
                <div className="text-white/95 text-xs">Creación</div>
              </div>

              <div>
                <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">
                  Actualizado
                </div>
                <div className="text-white/95 text-xs">
                  {new Date().toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                  })}
                </div>
              </div>

              <ChevronDown className="w-4 h-4 text-cyan-200 opacity-50 mb-0.5" />
            </div>
          </div>
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
  nombre: nuevoPaciente.nombre.trim(),
  apellidos: nuevoPaciente.apellidos.trim(),
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

      {confirmarEstadoVisita && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
    <div className="w-full max-w-[330px] rounded-3xl border border-cyan-300/45 bg-[#03111A]/95 px-6 py-5 shadow-[0_0_46px_rgba(34,211,238,.28)]">

      <div className="text-center text-cyan-300 text-[12px] uppercase tracking-[0.28em] font-medium mb-4">
        {confirmarEstadoVisita.titulo}
      </div>

      <div className="text-center text-cyan-100 text-sm font-medium mb-5">
        {confirmarEstadoVisita.evento.titulo || confirmarEstadoVisita.evento.nombre_paciente || 'Cita'}
      </div>

      <div className="text-center text-white/95 text-sm mb-5">
        {confirmarEstadoVisita.texto}
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => setConfirmarEstadoVisita(null)}
          className="rounded-full border border-cyan-400/50 bg-cyan-500/10 px-5 py-1.5 text-sm text-cyan-100 hover:bg-cyan-500/20 hover:border-cyan-300/70 transition-all"
        >
          No
        </button>

        <button
          type="button"
          onClick={async () => {
            const pendiente = confirmarEstadoVisita;
            if (!pendiente) return;

            setConfirmarEstadoVisita(null);

            await aplicarCambioEstadoVisita(
              pendiente.evento,
              pendiente.estado
            );
          }}
          disabled={loading}
          style={{
            backgroundColor: getColorTratamiento(confirmarEstadoVisita.evento).bg
              .replace('.95)', '.68)')
              .replace('.90)', '.68)')
              .replace('.85)', '.68)'),
          }}
          className="rounded-full border border-white/25 px-5 py-1.5 text-sm text-white hover:brightness-110 disabled:opacity-50 transition-all"
        >
          {confirmarEstadoVisita.textoBoton}
        </button>
      </div>

    </div>
  </div>
)}
      
    </div>
  );
}
