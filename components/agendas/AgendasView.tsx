'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAgendaFede, type EventoAgenda } from '@/lib/repos/agendas.repo';

const agendas = [
  { key: 'fede', nombre: 'Agenda Fede' },
  { key: 'celia', nombre: 'Agenda Celia' },
  { key: 'ana', nombre: 'Agenda Ana' },
];

const acciones = [
  'INSERTAR CITA',
  'MODIFICAR CITA',
  'CANCELAR CITA',
  'INSERTAR RECALL',
];

const horas = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '16:00',
  '17:00',
  '18:00',
];

const getMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  d.setDate(d.getDate() + diff);
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

const formatDia = (date: Date) =>
  date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

const formatSemana = (inicio: Date) => {
  const fin = addDays(inicio, 4);

  return `${inicio.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })} - ${fin.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
};

const sameDay = (iso: string, date: Date) => {
  const d = new Date(iso);

  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
};

const formatHoraEvento = (iso?: string | null) => {
  if (!iso) return '';

  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AgendasView() {
  const [agendaActiva, setAgendaActiva] = useState('fede');
  const [semanaInicio, setSemanaInicio] = useState(() => getMonday(new Date()));
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [loading, setLoading] = useState(false);

  const agenda = agendas.find(a => a.key === agendaActiva);

  const diasSemana = useMemo(
    () => [0, 1, 2, 3, 4].map(d => addDays(semanaInicio, d)),
    [semanaInicio]
  );

  useEffect(() => {
    const cargarAgenda = async () => {
      setLoading(true);

      const inicio = semanaInicio;
      const fin = addDays(semanaInicio, 7);

      if (agendaActiva === 'fede') {
        const data = await getAgendaFede(toISO(inicio), toISO(fin));
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

          <p className="text-sm text-cyan-100/55">
            Gestión de citas
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3">
          <CalendarDays className="w-5 h-5 text-cyan-300" />

          <select
            value={agendaActiva}
            onChange={(e) => setAgendaActiva(e.target.value)}
            className="bg-transparent text-white text-sm font-medium outline-none"
          >
            {agendas.map((a) => (
              <option
                key={a.key}
                value={a.key}
                className="bg-[#03111A] text-white"
              >
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-[rgba(5,18,24,.78)] backdrop-blur-xl overflow-hidden shadow-[0_0_35px_rgba(34,211,238,.10)]">
        <div className="bg-cyan-500/10 border-b border-cyan-500/10 px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <h2 className="text-[13px] tracking-[0.32em] text-cyan-300 font-semibold">
                {agenda?.nombre.toUpperCase()}
              </h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSemanaInicio(prev => addWeeks(prev, -1))}
                  className="w-8 h-8 rounded-full border border-cyan-400/25 bg-cyan-500/10 flex items-center justify-center hover:bg-cyan-500/20 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-cyan-200" />
                </button>

                <div className="text-xs text-cyan-100/65 min-w-[170px] text-center">
                  {formatSemana(semanaInicio)}
                </div>

                <button
                  onClick={() => setSemanaInicio(prev => addWeeks(prev, 1))}
                  className="w-8 h-8 rounded-full border border-cyan-400/25 bg-cyan-500/10 flex items-center justify-center hover:bg-cyan-500/20 transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-cyan-200" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {acciones.map((accion) => (
                <button
                  key={accion}
                  className="
                    rounded-full border border-cyan-400/30 bg-cyan-500/10
                    px-4 py-2 text-[11px] tracking-[0.12em]
                    text-cyan-100
                    hover:bg-cyan-500/20
                    hover:border-cyan-300/50
                    hover:shadow-[0_0_18px_rgba(34,211,238,.18)]
                    transition-all whitespace-nowrap
                  "
                >
                  {accion}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 min-h-[520px]">
          {loading && (
            <div className="mb-4 text-sm text-cyan-100/55">
              Cargando agenda...
            </div>
          )}

          <div className="grid grid-cols-5 gap-3 text-sm text-cyan-100/60">
            {diasSemana.map((dia) => {
              const eventosDia = eventos.filter(e => e.fecha_inicio && sameDay(e.fecha_inicio, dia));

              return (
                <div
                  key={dia.toISOString()}
                  className="rounded-2xl border border-cyan-400/10 bg-[#03111A]/70 p-4 min-h-[420px]"
                >
                  <div className="font-medium text-cyan-200 mb-4 capitalize">
                    {formatDia(dia)}
                  </div>

                  <div className="space-y-2">
                    {eventosDia.map((evento) => (
                      <button
                        key={evento.event_id}
                        className="
                          w-full rounded-xl border border-cyan-400/20
                          bg-cyan-500/10 px-3 py-2 text-left
                          hover:bg-cyan-500/20 hover:text-white
                          transition-all
                        "
                      >
                        <div className="text-xs text-cyan-200 mb-1">
                          {formatHoraEvento(evento.fecha_inicio)} - {formatHoraEvento(evento.fecha_fin)}
                        </div>

                        <div className="text-sm text-white truncate">
                          {evento.titulo || 'Cita sin título'}
                        </div>

                        {evento.telefono && (
                          <div className="text-[11px] text-cyan-100/50 mt-1 truncate">
                            {evento.telefono}
                          </div>
                        )}
                      </button>
                    ))}

                    {eventosDia.length === 0 && (
                      <div className="text-xs text-cyan-100/35">
                        Sin citas
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
