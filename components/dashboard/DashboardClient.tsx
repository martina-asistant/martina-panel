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
        overflow-hidden
        rounded-3xl
        border
        border-cyan-400/25
        bg-[linear-gradient(145deg,rgba(6,32,39,.90),rgba(2,17,24,.96))]
        p-5
        min-h-[150px]
        cursor-pointer
        transition-all
        duration-500
        hover:-translate-y-1
        hover:scale-[1.012]
        hover:border-cyan-300/70
        hover:shadow-[0_0_38px_rgba(34,211,238,.32)]
      "
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_35%)] opacity-70" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[linear-gradient(120deg,transparent,rgba(34,211,238,.16),transparent)]" />

      <div className="absolute left-1/2 bottom-3 h-[26px] w-[125px] -translate-x-1/2 rounded-full border border-cyan-300/35 bg-cyan-300/5 shadow-[0_0_22px_rgba(34,211,238,.35)] transition-all duration-500 group-hover:border-cyan-200/70 group-hover:shadow-[0_0_34px_rgba(34,211,238,.65)]" />
      <div className="absolute left-1/2 bottom-6 h-[8px] w-[78px] -translate-x-1/2 rounded-full bg-cyan-300/25 blur-md transition-all duration-500 group-hover:bg-cyan-200/45" />

      <div className="relative z-10 flex h-full min-h-[110px] justify-between">
        <div className="flex flex-col justify-between">
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
            {label}
          </div>

          <div className="text-5xl font-bold text-white drop-shadow-[0_0_14px_rgba(255,255,255,.12)]">
            {value}
          </div>
        </div>

        <div
          className="
            w-14
            h-14
            rounded-2xl
            bg-cyan-500/10
            border
            border-cyan-300/20
            flex
            items-center
            justify-center
            shadow-[0_0_20px_rgba(34,211,238,.18)]
            transition-all
            duration-500
            group-hover:scale-110
            group-hover:bg-cyan-400/15
            group-hover:border-cyan-200/45
            group-hover:shadow-[0_0_28px_rgba(34,211,238,.45)]
          "
        >
          <Icon className="w-7 h-7 text-cyan-300" />
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
    <div className="min-h-full bg-[radial-gradient(circle_at_top,rgba(10,80,92,.35),#02141B_62%)] p-8 text-white">
      <div className="mb-8">
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

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 uppercase tracking-[0.24em] text-cyan-300">
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
          <h2 className="mb-4 uppercase tracking-[0.24em] text-cyan-300">
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
          <h2 className="mb-4 uppercase tracking-[0.24em] text-cyan-300">
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
