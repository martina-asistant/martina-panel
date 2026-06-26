'use client';

import { useEffect, useMemo, useState } from 'react';
import { listRecordatorios } from '@/lib/repos/recordatorios.repo';
import type { RecordatorioCita, EstadoRecordatorio } from '@/lib/types/db.types';
import { recordatorioLabel } from '@/lib/utils/visualMaps';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

type Filtro = 'todos' | EstadoRecordatorio;

const filtros: { key: Filtro; label: string; color: string }[] = [
  { key: 'todos', label: 'Todos', color: 'bg-amber-400' },
  { key: 'sin_respuesta', label: 'Pendiente', color: 'bg-violet-300' },
  { key: 'confirmada', label: 'Confirmadas', color: 'bg-green-400' },
  { key: 'no_podra_asistir', label: 'No podrá asistir', color: 'bg-pink-400' },
  { key: 'cita_modificada', label: 'Modificadas', color: 'bg-indigo-400' },
  { key: 'cancelada_recado', label: 'Canceladas', color: 'bg-red-400' },
];

const formatTelefono = (telefono?: string | null) => {
  if (!telefono) return '—';

  const clean = telefono.replace(/\D/g, '');
  const sinPrefijo = clean.startsWith('34') && clean.length >= 11 ? clean.slice(2) : clean;

  return sinPrefijo.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
};

const estadoColor = (estado?: EstadoRecordatorio | null) =>
  cn(
    estado === 'confirmada' && 'bg-green-400',
    estado === 'sin_respuesta' && 'bg-violet-300',
    estado === 'no_podra_asistir' && 'bg-pink-400',
    estado === 'cita_modificada' && 'bg-indigo-400',
    estado === 'cancelada_recado' && 'bg-red-400'
  );

const RecordatoriosView = () => {
  const [items, setItems] = useState<RecordatorioCita[]>([]);
  const [filter, setFilter] = useState<Filtro>('todos');
  const [selected, setSelected] = useState<RecordatorioCita | null>(null);

  useEffect(() => {
    listRecordatorios().then(setItems);
  }, []);

  useEffect(() => {
    const supa = createClient();
    if (!supa) return;

    const ch = supa
      .channel('rec-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recordatorios_cita' },
        async () => setItems(await listRecordatorios())
      )
      .subscribe();

    return () => {
      supa.removeChannel(ch);
    };
  }, []);

  const filtered = useMemo(
    () => filter === 'todos' ? items : items.filter(i => i.estado === filter),
    [items, filter]
  );

  return (
    <div className="min-h-full overflow-y-auto px-2 py-4 lg:p-8 bg-[#02141B] text-white">
      <div className="mb-6 lg:mb-8 px-2 lg:px-0">
        <h1 className="inline-block text-3xl lg:text-2xl font-semibold tracking-[-0.015em] bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent mb-1">
          Recordatorios
        </h1>

        <p className="text-sm text-cyan-100/55">
          Próximas citas
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/35">
        {filtros.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'text-[13px] px-4 py-[9px] rounded-full border transition-all whitespace-nowrap shrink-0',
              filter === f.key
                ? 'bg-cyan-500/20 text-cyan-100 border-cyan-300/50 shadow-[0_0_18px_rgba(34,211,238,.22)]'
                : 'bg-white/5 text-cyan-100/65 border-cyan-500/20 hover:bg-cyan-500/10 hover:text-white'
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn('w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]', f.color)} />
              <span className={f.key === 'todos' ? 'font-bold uppercase' : ''}>
                {f.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* MOBILE */}
      <div className="lg:hidden rounded-3xl border border-cyan-500/20 bg-[rgba(5,18,24,.78)] overflow-hidden shadow-[0_0_35px_rgba(34,211,238,.10)]">
        <div className="grid grid-cols-[1fr_72px_110px] gap-2 px-3 py-3 bg-cyan-500/10 text-cyan-300/75 text-[11px] uppercase tracking-[0.16em]">
          <div>Paciente</div>
          <div>Fecha</div>
          <div>Estado</div>
        </div>

        {filtered.map(recordatorio => {
          const lbl = recordatorioLabel[recordatorio.estado] || recordatorioLabel.sin_respuesta;

          return (
            <button
              key={recordatorio.id}
              type="button"
              onClick={() => setSelected(recordatorio)}
              className="w-full grid grid-cols-[1fr_72px_110px] gap-2 items-center px-3 py-4 border-t border-cyan-500/10 text-left hover:bg-cyan-500/5"
            >
              <div className="min-w-0 font-medium text-white truncate">
                {recordatorio.nombre_paciente || '—'}
              </div>

              <div className="text-xs text-cyan-100/70 whitespace-nowrap">
                {formatDate(recordatorio.proxima_cita_fecha)}
              </div>

              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-[11px] text-cyan-100 max-w-full">
                  <span className={cn('w-2 h-2 rounded-full shrink-0 shadow-[0_0_10px_currentColor]', estadoColor(recordatorio.estado))} />
                  <span className="truncate">{lbl.label}</span>
                </span>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="px-6 py-10 text-center text-cyan-100/45">
            Sin resultados
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:block rounded-3xl border border-cyan-500/20 bg-[rgba(5,18,24,.78)] backdrop-blur-xl overflow-hidden shadow-[0_0_35px_rgba(34,211,238,.10)]">
        <table className="w-full text-sm">
          <thead className="bg-cyan-500/10 text-cyan-300/75 text-xs uppercase tracking-[0.18em]">
            <tr>
              <th className="text-left pl-6 pr-2 py-4 font-medium">Paciente</th>
              <th className="text-left px-6 py-4 font-medium">Teléfono</th>
              <th className="text-left px-6 py-4 font-medium">Fecha cita</th>
              <th className="text-left px-6 py-4 font-medium">Motivo</th>
              <th className="text-left px-6 py-4 font-medium">Agenda</th>
              <th className="text-left px-6 py-4 font-medium">Estado</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(recordatorio => {
              const lbl = recordatorioLabel[recordatorio.estado] || recordatorioLabel.sin_respuesta;

              return (
                <tr key={recordatorio.id} className="border-t border-cyan-500/10 hover:bg-cyan-500/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{recordatorio.nombre_paciente || '—'}</td>
                  <td className="px-6 py-4 text-cyan-100/65">{formatTelefono(recordatorio.telefono)}</td>
                  <td className="px-6 py-4 text-cyan-100/80">{formatDate(recordatorio.proxima_cita_fecha)}</td>
                  <td className="px-6 py-4 text-cyan-100/75">{recordatorio.proxima_cita_motivo || '—'}</td>
                  <td className="px-6 py-4 text-cyan-100/75">{recordatorio.profesional || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,.10)]">
                      <span className={cn('w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]', estadoColor(recordatorio.estado))} />
                      {lbl.label}
                    </span>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-cyan-100/45">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 flex items-end lg:items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-cyan-400/25 bg-[#031A22] text-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-cyan-500/15">
              <div>
                <div className="text-lg font-semibold">
                  {selected.nombre_paciente || '—'}
                </div>
                <div className="text-sm text-cyan-100/55">
                  {formatTelefono(selected.telefono)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-white/5 border border-cyan-400/20 text-cyan-100"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div>
                <div className="text-cyan-100/45 text-xs uppercase tracking-wide mb-1">Fecha cita</div>
                <div>{formatDate(selected.proxima_cita_fecha)}</div>
              </div>

              <div>
                <div className="text-cyan-100/45 text-xs uppercase tracking-wide mb-1">Motivo</div>
                <div>{selected.proxima_cita_motivo || '—'}</div>
              </div>

              <div>
                <div className="text-cyan-100/45 text-xs uppercase tracking-wide mb-1">Agenda</div>
                <div>{selected.profesional || '—'}</div>
              </div>

              <div>
                <div className="text-cyan-100/45 text-xs uppercase tracking-wide mb-1">Estado</div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5">
                  <span className={cn('w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]', estadoColor(selected.estado))} />
                  {(recordatorioLabel[selected.estado] || recordatorioLabel.sin_respuesta).label}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordatoriosView;
