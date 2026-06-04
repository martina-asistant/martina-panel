'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAgendaFede, type EventoAgenda } from '@/lib/repos/agendas.repo';

const agendas = [
  { key: 'fede', nombre: 'Agenda Fede' },
  { key: 'celia', nombre: 'Agenda Celia' },
  { key: 'ana', nombre: 'Agenda Ana' },
];

const acciones = ['INSERTAR CITA', 'MODIFICAR CITA', 'CANCELAR CITA', 'INSERTAR RECALL'];

const SLOT_HEIGHT = 16;
const START_HOUR = 9;
const END_HOUR = 20;

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

const formatHora = (iso?: string | null) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getMinutesFromStart = (iso: string) => {
  const d = new Date(iso);
  return (d.getHours() - START_HOUR) * 60 + d.getMinutes();
};

const getDuration = (inicio?: string | null, fin?: string | null) => {
  if (!inicio || !fin) return 15;
  return Math.max(5, Math.round((+new Date(fin) - +new Date(inicio)) / 60000));
};

const slots = Array.from({ length: ((END_HOUR - START_HOUR) * 60) / 15 }, (_, i) => {
  const total = START_HOUR * 60 + i * 15;
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
});

export default function AgendasView() {
  const [agendaActiva, setAgendaActiva] = useState('fede');
  const [semanaInicio, setSemanaInicio] = useState(() => getMonday(new Date()));
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState<string | null>(null);

  const agenda = agendas.find(a => a.key === agendaActiva);

  const diasSemana = useMemo(
    () => [0, 1, 2, 3, 4].map(d => addDays(semanaInicio, d)),
    [semanaInicio]
  );

  useEffect(() => {
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

    cargarAgenda();
  }, [agendaActiva, semanaInicio]);

  return (
    <div className="min-h-full overflow-y-auto p-8 bg-[#02141B] text-white">
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
            </div>
          </div>
        </div>

        <div className="px-6 pt-5 pb-3 text-left text-white text-sm tracking-[0.28em] font-light">
          {formatMes(semanaInicio)}
        </div>

        <div className="px-4 pb-5">
          {loading && <div className="mb-3 text-sm text-cyan-100/55">Cargando agenda...</div>}

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
                  className="relative rounded-2xl border border-cyan-400/10 bg-[#03111A]/70 overflow-hidden"
                  style={{ height: slots.length * SLOT_HEIGHT }}
                >
                  {slots.map((hora) => {
                    const slotKey = `${dia.toISOString()}-${hora}`;

                    return (
                      <button
                        key={slotKey}
                        onClick={() => setSlotSeleccionado(slotKey)}
                        style={{ height: SLOT_HEIGHT }}
                        className={`
                          w-full block border-b border-cyan-400/5 text-left px-2 text-[10px]
                          ${slotSeleccionado === slotKey ? 'bg-cyan-500/20' : 'hover:bg-cyan-500/10'}
                        `}
                      >
                        <span className="text-cyan-100/20">{hora}</span>
                      </button>
                    );
                  })}

                  {eventosDia.map((evento) => {
                    const top = Math.max(0, (getMinutesFromStart(evento.fecha_inicio) / 15) * SLOT_HEIGHT);
                    const height = Math.max(9, (getDuration(evento.fecha_inicio, evento.fecha_fin) / 15) * SLOT_HEIGHT);

                    return (
                      <button
                        key={evento.event_id}
                        style={{ top, height }}
                        className="
                          absolute left-2 right-2 rounded-lg border border-cyan-300/30
                          bg-cyan-500/20 px-2 py-1 text-left overflow-hidden
                          hover:bg-cyan-500/30 transition-all
                        "
                      >
                        <div className="text-[10px] text-cyan-100">
                          {formatHora(evento.fecha_inicio)} - {formatHora(evento.fecha_fin)}
                        </div>
                        <div className="text-[11px] text-white truncate">
                          {evento.titulo || 'Cita sin título'}
                        </div>
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
