'use client';

import { useEffect, useMemo, useState } from 'react';
import { listRecordatorios } from '@/lib/repos/recordatorios.repo';
import type { RecordatorioCita, EstadoRecordatorio } from '@/lib/types/db.types';
import { recordatorioLabel } from '@/lib/utils/visualMaps';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

type Filtro = 'todos' | EstadoRecordatorio;

const filtros: { key: Filtro; label: string; icon: string; color: string }[] = [
  { key: 'todos', label: 'Todos', icon: 'folder', color: 'bg-amber-400' },
  { key: 'sin_respuesta', label: 'Pendiente', icon: 'dot', color: 'bg-violet-300' },
  { key: 'confirmada', label: 'Confirmadas', icon: 'dot', color: 'bg-green-400' },
  { key: 'no_podra_asistir', label: 'No podrá asistir', icon: 'close', color: 'bg-pink-400' },
  { key: 'cita_modificada', label: 'Modificadas', icon: 'check', color: 'bg-indigo-400' },
  { key: 'cancelada_recado', label: 'Canceladas', icon: 'dot', color: 'bg-red-400' },
];

const formatTelefono = (telefono?: string | null) => {
  if (!telefono) return '—';

  const clean = telefono.replace(/\D/g, '');
  const sinPrefijo = clean.startsWith('34') && clean.length >= 11 ? clean.slice(2) : clean;

  return sinPrefijo.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
};

const RecordatoriosView = () => {
  const [items, setItems] = useState<RecordatorioCita[]>([]);
  const [filter, setFilter] = useState<Filtro>('todos');

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
    <div className="min-h-full overflow-y-auto p-8 bg-[#02141B] text-white">
      <div className="mb-8">
        <h1 className="inline-block text-2xl font-semibold tracking-[-0.015em] bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent mb-1">
        Recordatorios
        </h1>

        <p className="text-sm text-cyan-100/55">
          Enviados por Martina
        </p>
      </div>

<div className="flex flex-wrap gap-2 mb-6">
  {filtros.map(f => (
    <button
      key={f.key}
      onClick={() => setFilter(f.key)}
      className={cn(
        'text-sm px-4 py-2 rounded-full border transition-all',
        filter === f.key
          ? 'bg-cyan-500/20 text-cyan-100 border-cyan-300/50 shadow-[0_0_18px_rgba(34,211,238,.22)]'
          : 'bg-white/5 text-cyan-100/65 border-cyan-500/20 hover:bg-cyan-500/10 hover:text-white'
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]',
            f.color
          )}
        />
        <span className={f.key === 'todos' ? 'font-bold uppercase' : ''}>
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
              <th className="text-left pl-6 pr-2 py-4 font-medium">Paciente</th>
              <th className="text-left px-6 py-4 font-medium">Teléfono</th>
              <th className="text-left px-6 py-4 font-medium">Fecha cita</th>
              <th className="text-left px-6 py-4 font-medium">Estado</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(r => {
              const lbl = recordatorioLabel[r.estado] || recordatorioLabel.sin_respuesta;

              return (
                <tr
                  key={r.id}
                  className="border-t border-cyan-500/10 hover:bg-cyan-500/5 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    {r.nombre_completo || '—'}
                  </td>

                  <td className="px-6 py-4 text-cyan-100/65">
                    {formatTelefono(r.telefono)}
                  </td>

                  <td className="px-6 py-4 text-cyan-100/80">
                    {formatDate(r.fecha_cita)}
                  </td>

                  <td className="px-6 py-4">
                   <span
  className={cn(
    'inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,.10)]',
  )}
>
  <span
    className={cn(
      'w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]',
      r.estado === 'confirmada' && 'bg-green-400',
      r.estado === 'sin_respuesta' && 'bg-violet-300',
      r.estado === 'no_podra_asistir' && 'bg-pink-400',
      r.estado === 'cita_modificada' && 'bg-indigo-400',
      r.estado === 'cancelada_recado' && 'bg-red-400'
    )}
  />

   {lbl.label}
  </span>
</td>
</tr>
);
})}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-cyan-100/45">
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

export default RecordatoriosView;
