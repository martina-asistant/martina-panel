'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  MessageCircle,
  LoaderCircle,
  Building2,
  Check,
  ClipboardPen,
  CalendarDays,
  Bell,
  PhoneOutgoing,
  PhoneCall,
  CircleDot,
  CircleCheck,
  CircleX,
  RefreshCcw,
  Ban,
  type LucideIcon
} from 'lucide-react';

import type {
  ConversacionWhatsapp,
  RecordatorioCita,
  Recall
} from '@/lib/types/db.types';

import { listConversaciones } from '@/lib/repos/conversaciones.repo';
import { listRecordatorios } from '@/lib/repos/recordatorios.repo';
import { listRecalls } from '@/lib/repos/recalls.repo';
import { createClient } from '@/lib/supabase/client';

interface Props {
  initialConvs?: ConversacionWhatsapp[];
  initialRecs?: RecordatorioCita[];
  initialRecalls?: Recall[];
}

const Metric = ({
  icon: Icon,
  label,
  value,
  href
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  href: string;
}) => (
  <Link href={href} className="block">
    <Card
      className="
        group
        relative
        min-h-[170px]
        overflow-hidden
        rounded-[26px]
        border
        border-cyan-400/35
        bg-[linear-gradient(145deg,rgba(4,24,31,.92),rgba(1,11,16,.96))]
        p-5
        cursor-pointer
        transition-all
        duration-500
        hover:-translate-y-1
        hover:border-cyan-300/80
        hover:shadow-[0_0_38px_rgba(34,211,238,.38)]
      "
    >
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_100%,rgba(34,211,238,.22),transparent_36%)]" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(120deg,transparent,rgba(34,211,238,.16),transparent)]" />

      <div className="absolute left-1/2 bottom-3 h-[34px] w-[120px] -translate-x-1/2 rounded-full border border-cyan-300/50 shadow-[0_0_22px_rgba(34,211,238,.55)] opacity-70" />
      <div className="absolute left-1/2 bottom-6 h-[12px] w-[70px] -translate-x-1/2 rounded-full bg-cyan-300/30 blur-md opacity-80" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
            {label}
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,.25)] transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_32px_rgba(34,211,238,.55)]">
            <Icon className="h-7 w-7 text-cyan-200" />
          </div>
        </div>

        <div className="text-5xl font-bold text-white drop-shadow-[0_0_16px_rgba(255,255,255,.18)]">
          {value}
        </div>
      </div>
    </Card>
  </Link>
);

const DashboardClient = ({
  initialConvs = [],
  initialRecs = [],
  initialRecalls = []
}: Props) => {
  const [convs, setConvs] = useState<ConversacionWhatsapp[]>(initialConvs);
  const [recs, setRecs] = useState<RecordatorioCita[]>(initialRecs);
  const [recalls, setRecalls] = useState<Recall[]>(initialRecalls);

  useEffect(() => {
    (async () => {
      const [c, r, rc] = await Promise.all([
        listConversaciones(),
        listRecordatorios(),
        listRecalls()
      ]);

      setConvs(c);
      setRecs(r);
      setRecalls(rc);
    })();
  }, []);

  useEffect(() => {
    const supa = createClient();

    if (!supa) return;

    const ch = supa
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversaciones_whatsapp' },
        async () => setConvs(await listConversaciones())
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recordatorios_cita' },
        async () => setRecs(await listRecordatorios())
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recalls' },
        async () => setRecalls(await listRecalls())
      )
      .subscribe();

    return () => {
      supa.removeChannel(ch);
    };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (iso: string | null) => iso ? new Date(iso) >= today : false;

  const nuevas = convs.filter(c => c.estado_visual === 'nueva').length;
  const enCurso = convs.filter(c => c.estado_visual === 'en_curso').length;
  const recepcion = convs.filter(c => c.estado_visual === 'recepcion').length;
  const gestion = convs.filter(c => c.estado_visual === 'gestionada').length;
  const recados = convs.filter(c => (c.notas_internas || '').trim().length > 0).length;

  const citasHoy = convs.filter(
    c => c.estado_cita === 'creada' && isToday(c.updated_at)
  ).length;

  const recordatoriosHoy = recs.filter(r => isToday(r.created_at)).length;

  const recallsEnviadosHoy = recalls.filter(
    r => r.estado === 'enviado' && isToday(r.fecha_envio)
  ).length;

  const recallsAceptadosHoy = recalls.filter(
    r => r.estado === 'cita_agendada' && isToday(r.fecha_envio)
  ).length;

  const recPendiente = recs.filter(r => r.estado === 'sin_respuesta').length;
  const recConf = recs.filter(r => r.estado === 'confirmada').length;
  const recNo = recs.filter(r => r.estado === 'no_podra_asistir').length;
  const recMod = recs.filter(r => r.estado === 'cita_modificada').length;
  const recCancel = recs.filter(r => r.estado === 'cancelada_recado').length;

  return (
    <div className="min-h-full bg-[#02141B] p-8 text-white">
      <div className="mb-10">
        <h1 className="mb-4 flex items-center gap-3 bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-5xl font-bold text-transparent">
          ¡Hola Sheila!
          <span className="text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,.8)]">
            ✦
          </span>
        </h1>

        <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,.08)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.95)]" />
          Martina activa
        </div>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 uppercase tracking-[0.22em] text-cyan-300">
            Conversaciones
          </h2>

          <div className="grid gap-4 lg:grid-cols-5">
            <Metric icon={MessageCircle} label="Nuevas" value={nuevas} href="/conversaciones" />
            <Metric icon={LoaderCircle} label="En curso" value={enCurso} href="/conversaciones" />
            <Metric icon={Building2} label="Recepción" value={recepcion} href="/conversaciones" />
            <Metric icon={Check} label="Gestionadas" value={gestion} href="/conversaciones" />
            <Metric icon={ClipboardPen} label="Recados" value={recados} href="/conversaciones" />
          </div>
        </section>

        <section>
          <h2 className="mb-4 uppercase tracking-[0.22em] text-cyan-300">
            Actividad de hoy
          </h2>

          <div className="grid gap-4 lg:grid-cols-4">
            <Metric icon={CalendarDays} label="Citas creadas" value={citasHoy} href="/conversaciones" />
            <Metric icon={Bell} label="Recordatorios" value={recordatoriosHoy} href="/recordatorios" />
            <Metric icon={PhoneOutgoing} label="Recalls enviados" value={recallsEnviadosHoy} href="/recalls" />
            <Metric icon={PhoneCall} label="Recalls aceptados" value={recallsAceptadosHoy} href="/recalls" />
          </div>
        </section>

        <section>
          <h2 className="mb-4 uppercase tracking-[0.22em] text-cyan-300">
            Estado recordatorios
          </h2>

          <div className="grid gap-4 lg:grid-cols-5">
            <Metric icon={CircleDot} label="Pendiente" value={recPendiente} href="/recordatorios" />
            <Metric icon={CircleCheck} label="Confirmadas" value={recConf} href="/recordatorios" />
            <Metric icon={CircleX} label="No podrá asistir" value={recNo} href="/recordatorios" />
            <Metric icon={RefreshCcw} label="Modificadas" value={recMod} href="/recordatorios" />
            <Metric icon={Ban} label="Canceladas" value={recCancel} href="/recordatorios" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardClient;
