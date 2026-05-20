'use client';

import { useEffect, useMemo, useState } from 'react';
import { listRecalls } from '@/lib/repos/recalls.repo';
import type { Recall, EstadoRecall } from '@/lib/types/db.types';
import { recallLabel } from '@/lib/utils/visualMaps';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

type Filtro = 'todos' | EstadoRecall;
const filtros: { key: Filtro; label: string; emoji: string }[] = [
  { key: 'todos',         label: 'Todos',          emoji: '📂' },
  { key: 'enviado',       label: 'Enviados',       emoji: '⚪' },
  { key: 'quiere_cita',   label: 'Quiere cita',    emoji: '🟢' },
  { key: 'cita_agendada', label: 'Cita agendada',  emoji: '✅' },
  { key: 'pospuesto',     label: 'Más adelante',   emoji: '🔴' },
];

const RecallsView = () => {
  const [items, setItems] = useState<Recall[]>([]);
  const [filter, setFilter] = useState<Filtro>('todos');

  useEffect(() => { listRecalls().then(setItems); }, []);
  useEffect(() => {
    const supa = createClient();
    if (!supa) return;
    const ch = supa.channel('recalls-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'recalls' }, async () => setItems(await listRecalls())).subscribe();
    return () => { supa.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => filter === 'todos' ? items : items.filter(i => i.estado === filter), [items, filter]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Recalls</h1>
      <p className="text-sm text-martina-muted mb-5">Reactivación de pacientes · gestionada por Martina</p>

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
              <th className="text-left px-4 py-3 font-medium">Tipo</th>
              <th className="text-left px-4 py-3 font-medium">Fecha envío</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const lbl = recallLabel[r.estado] || recallLabel.enviado;
              return (
                <tr key={r.id} className="border-t border-martina-border hover:bg-martina-bg/50">
                  <td className="px-4 py-3">{r.nombre_completo || '—'}</td>
                  <td className="px-4 py-3 text-martina-muted">{r.telefono}</td>
                  <td className="px-4 py-3">{r.tipo || '—'}</td>
                  <td className="px-4 py-3 text-martina-muted">{formatDate(r.fecha_envio)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full', lbl.color)}>
                      <span>{lbl.emoji}</span>{lbl.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (<tr><td colSpan={5} className="px-4 py-8 text-center text-martina-muted">Sin resultados</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecallsView;
