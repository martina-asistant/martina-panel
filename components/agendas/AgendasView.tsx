'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { getAgendaFede, type EventoAgenda } from '@/lib/repos/agendas.repo';

const agendas = [
  { key: 'fede', nombre: 'Agenda Fede' },
  { key: 'celia', nombre: 'Agenda Celia' },
  { key: 'ana', nombre: 'Agenda Ana' },
];

const acciones = ['INSERTAR CITA', 'MODIFICAR CITA', 'CANCELAR CITA', 'INSERTAR RECALL'];

const SLOT_HEIGHT = 22;
const START_HOUR = 9;
const END_HOUR = 19.5;

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

const isHorarioNoDisponible = (hora: string, dia: Date) => {
  const diaSemana = dia.getDay();

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
  const texto = `${evento.titulo || ''} ${evento.motivo || ''}`.toLowerCase();

  if (texto.includes('primera visita')) {
    return { bg: 'rgba(34,197,94,.78)', text: 'text-white' };
  }

  if (texto.includes('endodoncia')) {
    return { bg: 'rgba(244,114,182,.80)', text: 'text-white' };
  }

  if (texto.includes('obturacion') || texto.includes('obturación')) {
    return { bg: 'rgba(168,85,247,.82)', text: 'text-white' };
  }

  if (texto.includes('revision') || texto.includes('revisión')) {
    return { bg: 'rgba(34,211,238,.75)', text: 'text-white' };
  }

  if (
    texto.includes('protesis') ||
    texto.includes('prótesis') ||
    texto.includes('impresiones')
  ) {
    return { bg: 'rgba(249,115,22,.80)', text: 'text-white' };
  }

  if (texto.includes('cirugia') || texto.includes('cirugía')) {
    return { bg: 'rgba(255,255,255,.88)', text: 'text-[#03111A]' };
  }

  return { bg: 'rgba(34,211,238,.65)', text: 'text-white' };
};

export default function AgendasView() {
  const [agendaActiva, setAgendaActiva] = useState('fede');
  const [semanaInicio, setSemanaInicio] = useState(() => getMonday(new Date()));
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotInicio, setSlotInicio] = useState<string | null>(null);
  const [slotFin, setSlotFin] = useState<string | null>(null);

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

  const manejarSeleccion = (slotKey: string) => {
    if (!slotInicio) {
      setSlotInicio(slotKey);
      setSlotFin(null);
      return;
    }

    const diaInicio = slotInicio.split('|')[0];
    const diaNuevo = slotKey.split('|')[0];

    if (diaInicio !== diaNuevo) {
      setSlotInicio(slotKey);
      setSlotFin(null);
      return;
    }

    if (!slotFin) {
      setSlotFin(slotKey);
      return;
    }

    setSlotInicio(slotKey);
    setSlotFin(null);
  };

  const cargarAgenda = async () => {
    setLoading(true);

    if (agendaActiva === 'fede') {
      const data = await getAgendaFede(toISO(semanaInicio), toISO(addDays(semanaInicio, 7)));
      setEventos(data);
    } else {
      setEventos([]);
    }

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
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString(),
        usuario: 'Sheila',
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

  useEffect(() => {
    cargarAgenda();
  }, [agendaActiva, semanaInicio]);

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

                    const bloqueadoAutomatico = isHorarioNoDisponible(hora, dia);
                    const bloqueado = bloqueadoAutomatico || esBloqueoEvento;

                    return (
                      <button
                        key={slotKey}
                        onClick={() => manejarSeleccion(slotKey)}
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
                        <span className={bloqueado ? 'text-cyan-50/75' : 'text-cyan-100/30'}>
                          {hora}
                        </span>

                        {eventoSlot && !esBloqueoEvento && esInicioEvento && (
                          <span className={`ml-3 text-[11px] font-semibold truncate ${color?.text}`}>
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
    </div>
  );
}
