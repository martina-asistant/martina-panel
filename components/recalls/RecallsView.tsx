'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { listRecalls } from '@/lib/repos/recalls.repo';
import type { Recall, EstadoRecall } from '@/lib/types/db.types';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

type Filtro = 'todos' | EstadoRecall;

const filtros: { key: Filtro; label: string; color: string }[] = [
  { key: 'todos', label: 'Todos', color: 'bg-amber-400' },
  { key: 'pendiente_envio', label: 'Pendiente envío', color: 'bg-sky-300' },
  { key: 'pendiente', label: 'Pendientes', color: 'bg-violet-300' },
  { key: 'confirmada', label: 'Confirmadas', color: 'bg-green-400' },
  { key: 'pospuesta', label: 'Pospuestas', color: 'bg-red-400' },
];

const formatTelefono = (telefono?: string | null) => {
  if (!telefono) return '—';

  const clean = telefono.replace(/\D/g, '');
  const sinPrefijo =
    clean.startsWith('34') && clean.length >= 11 ? clean.slice(2) : clean;

  return sinPrefijo.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
};

const recallEstadoVisual = (estado: EstadoRecall | null | undefined) => {
  if (estado === 'pendiente_envio') {
    return {
      label: 'Pendiente envío',
      color: 'bg-sky-300',
    };
  }

  if (estado === 'pendiente') {
    return {
      label: 'Pendiente contestar',
      color: 'bg-violet-300',
    };
  }

  if (estado === 'confirmada') {
    return {
      label: 'Confirmada',
      color: 'bg-green-400',
    };
  }

  if (estado === 'pospuesta') {
    return {
      label: 'Pospuesta',
      color: 'bg-red-400',
    };
  }

  return {
    label: 'Pendiente envío',
    color: 'bg-sky-300',
  };
};

const tipoRecallLabel = (tipo?: string | null) => {
  if (!tipo) return '—';

  if (tipo === 'mto_periodontal') return 'Mto. Periodontal';
  if (tipo === 'revision_general') return 'Revisión general';

  return tipo;
};

const RecallsView = () => {
  const [items, setItems] = useState<Recall[]>([]);
  const [filter, setFilter] = useState<Filtro>('todos');

  const cargarRecalls = async () => {
    const data = await listRecalls();
    setItems(data);
  };

  useEffect(() => {
    cargarRecalls();
  }, []);

  useEffect(() => {
    const supa = createClient();
    if (!supa) return;

    const ch = supa
      .channel('recalls-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recalls' },
        async () => cargarRecalls()
      )
      .subscribe();

    return () => {
      supa.removeChannel(ch);
    };
  }, []);

  const filtered = useMemo(() => {
    const data =
      filter === 'todos' ? items : items.filter((i) => i.estado === filter);

    return [...data].sort((a, b) => {
      const fechaA = a.fecha_recall ? new Date(a.fecha_recall).getTime() : 0;
      const fechaB = b.fecha_recall ? new Date(b.fecha_recall).getTime() : 0;
      return fechaA - fechaB;
    });
  }, [items, filter]);

  return (
    <div className="min-h-full overflow-y-auto p-8 bg-[#02141B] text-white">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.015em] origin-left inline-block bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
            Recalls
          </h1>

          <p className="text-sm text-cyan-100/55">
            Reactivación de pacientes
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-400/10 px-5 py-2.5 text-sm font-medium text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,.18)] transition-all hover:bg-cyan-400/18 hover:border-cyan-200/70"
        >
          <Plus className="h-4 w-4" />
          Insertar recall
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filtros.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'text-[13px] px-4 py-[9px] rounded-full border transition-all whitespace-nowrap',
              filter === f.key
                ? 'bg-cyan-500/20 text-cyan-100 border-cyan-300/50 shadow-[0_0_18px_rgba(34,211,238,.22)]'
                : 'bg-white/5 text-cyan-100/65 border-cyan-500/20 hover:bg-cyan-500/10 hover:text-white'
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-2.5 h-2.5 rounded-full shadow-[0_0_12px_currentColor]',
                  f.color
                )}
              />

              <span
                className={cn(
                  f.key === 'todos'
                    ? 'font-bold uppercase'
                    : 'font-normal text-[14px] tracking-[-0.01em]'
                )}
              >
                {f.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-[rgba(5,18,24,.78)] backdrop-blur-xl overflow-hidden shadow-[0_0_35px_rgba(34,211,238,.10)]">
        <table className="w-full text-sm">
          <thead className="bg-cyan-500/10 text-cyan-300/75 text-xs uppercase tracking-[0.18em]">
            <tr>
              <th className="text-left px-6 py-4 font-medium">Paciente</th>
              <th className="text-left px-6 py-4 font-medium">Teléfono</th>
              <th className="text-left px-6 py-4 font-medium">Tipo</th>
              <th className="text-left px-6 py-4 font-medium">Detalle</th>
              <th className="text-left px-6 py-4 font-medium">Fecha recall</th>
              <th className="text-left px-6 py-4 font-medium">Fecha envío</th>
              <th className="text-left px-6 py-4 font-medium">Estado</th>
              <th className="text-left px-6 py-4 font-medium">Próxima cita</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => {
              const lbl = recallEstadoVisual(r.estado);

              return (
                <tr
                  key={r.id}
                  className="border-t border-cyan-500/10 hover:bg-cyan-500/5 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    {r.nombre_paciente || r.nombre_completo || '—'}
                  </td>

                  <td className="px-6 py-4 text-cyan-100/65">
                    {formatTelefono(r.telefono)}
                  </td>

                  <td className="px-6 py-4 text-cyan-100/80">
                    {tipoRecallLabel(r.motivo_recall || r.tipo)}
                  </td>

                  <td className="px-6 py-4 text-cyan-100/65 max-w-[280px]">
                    <div className="line-clamp-2">
                      {r.detalle_recall || '—'}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-cyan-100/75">
                    {r.fecha_recall ? formatDate(r.fecha_recall) : '—'}
                  </td>

                  <td className="px-6 py-4 text-cyan-100/55">
                    {r.fecha_envio ? formatDate(r.fecha_envio) : '—'}
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,.10)]">
                      <span
                        className={cn(
                          'w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]',
                          lbl.color
                        )}
                      />

                      {lbl.label}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-cyan-100/65">
                    {r.proxima_cita_fecha ? (
                      <div>
                        <div>{formatDate(r.proxima_cita_fecha)}</div>
                        <div className="text-xs text-cyan-100/40">
                          {r.proxima_cita_motivo || ''}
                        </div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-10 text-center text-cyan-100/45"
                >
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecallsView;
