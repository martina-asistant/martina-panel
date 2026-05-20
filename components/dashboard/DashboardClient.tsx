'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { ConversacionWhatsapp, RecordatorioCita, Recall } from '@/lib/types/db.types';
import { listConversaciones } from '@/lib/repos/conversaciones.repo';
import { listRecordatorios } from '@/lib/repos/recordatorios.repo';
import { listRecalls } from '@/lib/repos/recalls.repo';
import { createClient } from '@/lib/supabase/client';

interface Props {
  initialConvs?: ConversacionWhatsapp[];
  initialRecs?: RecordatorioCita[];
  initialRecalls?: Recall[];
}

const Metric = ({ icon, label, value, hint }: { icon: string; label: string; value: number; hint?: string }) => (
  <Card className="p-5 border-martina-border bg-white hover:shadow-sm transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs text-martina-muted uppercase tracking-wide">{label}</div>
        <div className="text-3xl font-semibold text-martina-text mt-1">{value}</div>
        {hint && <div className="text-xs text-martina-muted mt-1">{hint}</div>}
      </div>
      <div className="w-10 h-10 rounded-lg bg-martina-bg flex items-center justify-center text-lg">{icon}</div>
    </div>
  </Card>
);

const DashboardClient = ({ initialConvs = [], initialRecs = [], initialRecalls = [] }: Props) => {
  const [convs, setConvs] = useState<ConversacionWhatsapp[]>(initialConvs);
  const [recs, setRecs] = useState<RecordatorioCita[]>(initialRecs);
  const [recalls, setRecalls] = useState<Recall[]>(initialRecalls);

  useEffect(() => {
    (async () => {
      const [c, r, rc] = await Promise.all([listConversaciones(), listRecordatorios(), listRecalls()]);
      setConvs(c); setRecs(r); setRecalls(rc);
    })();
  }, []);

  useEffect(() => {
    const supa = createClient();
    if (!supa) return;
    const ch = supa.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversaciones_whatsapp' }, async () => setConvs(await listConversaciones()))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recordatorios_cita' }, async () => setRecs(await listRecordatorios()))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recalls' }, async () => setRecalls(await listRecalls()))
      .subscribe();
    return () => { supa.removeChannel(ch); };
  }, []);

  const today = new Date(); today.setHours(0,0,0,0);
  const isToday = (iso: string | null) => iso ? new Date(iso) >= today : false;

  const nuevas    = convs.filter(c => c.estado_visual === 'nueva').length;
  const enCurso   = convs.filter(c => c.estado_visual === 'en_curso').length;
  const recepcion = convs.filter(c => c.estado_visual === 'recepcion').length;
  const gestion   = convs.filter(c => c.estado_visual === 'gestionada').length;
  const recados   = convs.filter(c => (c.notas_internas || '').trim().length > 0).length;

  const recallsEnviadosHoy   = recalls.filter(r => isToday(r.fecha_envio)).length;
  const recordatoriosEnviadosHoy = recs.filter(r => isToday(r.created_at)).length;
  const citasCreadasHoy = convs.filter(c => c.estado_cita === 'creada' && isToday(c.updated_at)).length;

  const recConf    = recs.filter(r => r.estado === 'confirmada').length;
  const recNo      = recs.filter(r => r.estado === 'no_podra_asistir').length;
  const recMod     = recs.filter(r => r.estado === 'cita_modificada').length;
  const recCancel  = recs.filter(r => r.estado === 'cancelada_recado').length;

  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Dashboard</h1>
      <p className="text-sm text-martina-muted mb-6">Resumen en tiempo real de la actividad de la clínica.</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-xs uppercase tracking-wider text-martina-muted mb-3">Conversaciones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <Metric icon="🤖" label="Nuevas" value={nuevas} />
            <Metric icon="💬" label="En curso" value={enCurso} />
            <Metric icon="👩🏽‍⚕️" label="Recepción" value={recepcion} />
            <Metric icon="✅" label="Gestionadas" value={gestion} />
            <Metric icon="📌" label="Recados" value={recados} />
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-martina-muted mb-3">Actividad de hoy</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Metric icon="📅" label="Citas creadas hoy" value={citasCreadasHoy} />
            <Metric icon="🔔" label="Recordatorios enviados" value={recordatoriosEnviadosHoy} />
            <Metric icon="📞" label="Recalls enviados hoy" value={recallsEnviadosHoy} />
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-martina-muted mb-3">Recordatorios · estado</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Metric icon="🟢" label="Confirmadas" value={recConf} />
            <Metric icon="❌" label="No podrá asistir" value={recNo} />
            <Metric icon="✔️" label="Modificadas" value={recMod} />
            <Metric icon="🔴" label="Cancelada + recado" value={recCancel} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardClient;
