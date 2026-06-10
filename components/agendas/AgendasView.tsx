'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { getAgendaFede, getAgendaCelia, getAgendaAna, type EventoAgenda } from '@/lib/repos/agendas.repo';
import { createClient } from '@/lib/supabase/client';

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
  'Impresiones',
  'Prueba-colocar',
  'Raspados',
  'Tallados',
  'Prótesis',
  'Férula Michigan',
];

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

  if (m === 'impresiones') return 30;

  if (m === 'prueba-colocar') return 30;

  if (m === 'raspados') return 45;

  if (m === 'tallados') return 60;

  if (m === 'prótesis' || m === 'protesis') return 30;

  if (m === 'férula michigan' || m === 'ferula michigan') return 30;

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
    

  const agenda = agendas.find(a => a.key === agendaActiva);

  const diasSemana = useMemo(
    () => [0, 1, 2, 3, 4].map(d => addDays(semanaInicio, d)),
    [semanaInicio]
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

  let data: EventoAgenda[] = [];

  if (agendaActiva === 'fede') {
    data = await getAgendaFede(toISO(semanaInicio), toISO(addDays(semanaInicio, 7)));
  }

  if (agendaActiva === 'celia') {
    data = await getAgendaCelia(toISO(semanaInicio), toISO(addDays(semanaInicio, 7)));
  }

  if (agendaActiva === 'ana') {
    data = await getAgendaAna(toISO(semanaInicio), toISO(addDays(semanaInicio, 7)));
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

    setLoading(true);

    const response = await fetch('/agendas/gestionar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accion: 'cancelar_cita',
        agenda: agendaActiva,
        calendar_id: eventoActivo.calendar_id,
        event_id: eventoActivo.event_id,
        telefono: eventoActivo.telefono,
        fecha_inicio: eventoActivo.fecha_inicio,
        fecha_fin: eventoActivo.fecha_fin,
        motivo: eventoActivo.motivo,
        usuario: usuarioPanel,
      }),
    });

    const data = await response.json();

    setLoading(false);

    if (!data?.ok) {
      console.error('Error cancelando cita:', data);
      return;
    }

    setMostrarCancelar(false);
    setEventoSeleccionado(null);
    setEventoActivo(null);
    setModoEdicion(false);
    setSlotInicio(null);
    setSlotFin(null);

    await cargarAgenda();
  };

  useEffect(() => {
    cargarAgenda();
  }, [agendaActiva, semanaInicio]);

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

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-8 bg-[#02141B] text-white pb-20">
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="inline-block text-2xl font-semibold tracking-[-0.015em] bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent mb-1">
            Agendas
          </h1>
          <p className="text-sm text-cyan-100/55">Gestión de citas</p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3">
          <CalendarDays className="w-5 h-5 text-cyan-300" />

          <select
            value={agendaActiva}
            onChange={(e) => setAgendaActiva(e.target.value)}
            className="bg-transparent text-white text-sm font-medium outline-none"
          >
            {agendas.map((a) => (
              <option key={a.key} value={a.key} className="bg-[#03111A] text-white">
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-[rgba(5,18,24,.78)] backdrop-blur-xl overflow-hidden shadow-[0_0_35px_rgba(34,211,238,.10)]">
        <div className="bg-cyan-500/10 border-b border-cyan-500/10 px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <h2 className="text-[13px] tracking-[0.32em] text-cyan-300 font-semibold">
                {agenda?.nombre.toUpperCase()}
              </h2>

              <button
                onClick={() => setSemanaInicio(prev => addWeeks(prev, -1))}
                className="w-8 h-8 rounded-full border border-cyan-400/25 bg-cyan-500/10 flex items-center justify-center hover:bg-cyan-500/20"
              >
                <ChevronLeft className="w-4 h-4 text-cyan-200" />
              </button>

              <div className="text-sm text-cyan-100/70 min-w-[145px] text-center">
                {formatSemana(semanaInicio)}
              </div>

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
                          ${seleccionado ? 'ring-1 ring-white/70 bg-cyan-500/35' : ''}
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[13vh]">
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
  <div className="grid grid-cols-3 gap-4">
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
      className="rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
    />

    <input
      type="time"
      step={300}
      value={toInputTime(eventoSeleccionado.fecha_inicio)}
      onChange={(e) => {
        const fecha = toInputDate(eventoSeleccionado.fecha_inicio);
        const nuevaHoraInicio = e.target.value;

        const nuevaFechaInicio = buildISOFromDateTime(fecha, nuevaHoraInicio);

        const duracion = getDuracionPorMotivo(
          eventoSeleccionado.motivo || eventoSeleccionado.titulo || ''
        );

        const nuevaFechaFin = sumarMinutosISO(nuevaFechaInicio, duracion);

        setEventoSeleccionado({
          ...eventoSeleccionado,
          fecha_inicio: nuevaFechaInicio,
          fecha_fin: nuevaFechaFin,
        });
      }}
      className="rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
    />

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
      className="rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
    />
  </div>
)}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
                    Motivo
                  </div>

                  {modoEdicion ? (
  <select
    value={eventoSeleccionado.motivo || ''}
    onChange={(e) => {
      const nuevoMotivo = e.target.value;

      const duracion = getDuracionPorMotivo(nuevoMotivo);

      const nuevaFechaFin = sumarMinutosISO(
        eventoSeleccionado.fecha_inicio,
        duracion
      );

      setEventoSeleccionado({
        ...eventoSeleccionado,
        motivo: nuevoMotivo,
        fecha_fin: nuevaFechaFin,
      });
    }}
    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
  >
    {TRATAMIENTOS.map((tratamiento) => (
      <option
        key={tratamiento}
        value={tratamiento}
        className="bg-[#03111A]"
      >
        {tratamiento}
      </option>
    ))}
  </select>
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
                  <div className="text-white text-lg font-medium">
                    {eventoSeleccionado.telefono || 'No disponible'}
                  </div>
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

      {mostrarCancelar && eventoActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/45 bg-[#03111A]/95 p-6 shadow-[0_0_45px_rgba(255,255,255,.25)]">
            <h3 className="text-xl font-semibold text-white mb-2">
              ¿Cancelar esta cita?
            </h3>

            <p className="text-cyan-100/80 text-sm mb-6">
              {eventoActivo.titulo || eventoActivo.nombre_paciente}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMostrarCancelar(false)}
                className="rounded-full border border-white/20 px-5 py-2 text-white/80 hover:text-white hover:bg-white/10"
              >
                No
              </button>

              <button
                onClick={cancelarCita}
                disabled={loading}
                className="rounded-full border border-red-300/40 bg-red-500/20 px-5 py-2 text-red-100 hover:bg-red-500/30 disabled:opacity-50"
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
