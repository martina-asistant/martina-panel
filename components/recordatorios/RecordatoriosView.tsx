'use client';

import { useEffect, useMemo, useState } from 'react';
import { listRecordatorios } from '@/lib/repos/recordatorios.repo';
import type { RecordatorioCita, EstadoRecordatorio } from '@/lib/types/db.types';
import { recordatorioLabel } from '@/lib/utils/visualMaps';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

type Filtro = 'todos' | EstadoRecordatorio;
const filtros: { key: Filtro; label: string; emoji: string }[] = [
  { key: 'todos',            label: 'Todos',            emoji: '📂' },
  { key: 'sin_respuesta',    label: 'Sin respuesta',    emoji: '⚪' },
  { key: 'confirmada',       label: 'Confirmadas',      emoji: '🟢' },
  { key: 'no_podra_asistir', label: 'No podrá asistir', emoji: '❌' },
  { key: 'cita_modificada',  label: 'Modificadas',      emoji: '✔️' },
  { key: 'cancelada_recado', label: 'Cancelada + recado', emoji: '🔴' },
];

const RecordatoriosView = () => {
  const [items, setItems] = useState<RecordatorioCita[]>([]);
  const [filter, setFilter] = useState<Filtro>('todos');

  useEffect(() => { listRecordatorios().then(setItems); }, []);
  useEffect(() => {
    const supa = createClient();
    if (!supa) return;
    const ch = supa.channel('rec-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'recordatorios_cita' }, async () => setItems(await listRecordatorios())).subscribe();
    return () => { supa.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => filter === 'todos' ? items : items.filter(i => i.estado === filter), [items, filter]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Recordatorios</h1>
      <p className="text-sm text-martina-muted mb-5">Recordatorios de cita enviados por Martina</p>

      <div className="flex flex-wrap gap-1 mb-4">
        {filtros.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn('text-xs px-3 py-1.5 rounded-full border transition-colors',
              filter === f.key ? 'bg-martina-text text-white border-martina-text' : 'bg-white text-martina-muted border-martina-border hover:bg-martina-bg')}>
            <span className="mr-1">{f.emoji}</span>{f.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-martina-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-martina-bg text-martina-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Paciente</th>
              <th className="text-left px-4 py-3 font-medium">Teléfono</th>
              <th className="text-left px-4 py-3 font-medium">Fecha cita</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const lbl = recordatorioLabel[r.estado] || recordatorioLabel.sin_respuesta;
              return (
                <tr key={r.id} className="border-t border-martina-border hover:bg-martina-bg/50">
                  <td className="px-4 py-3">{r.nombre_completo || '—'}</td>
                  <td className="px-4 py-3 text-martina-muted">{r.telefono}</td>
                  <td className="px-4 py-3">{formatDate(r.fecha_cita)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full', lbl.color)}>
                      <span>{lbl.emoji}</span>{lbl.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (<tr><td colSpan={4} className="px-4 py-8 text-center text-martina-muted">Sin resultados</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecordatoriosView;
