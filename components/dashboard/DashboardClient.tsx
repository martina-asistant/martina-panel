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
        group relative overflow-hidden rounded-3xl border border-cyan-500/20
        bg-[rgba(5,18,24,.78)] backdrop-blur-xl p-5 cursor-pointer
        transition-all duration-500 hover:-translate-y-1 hover:scale-[1.015]
        hover:border-cyan-300/60 hover:shadow-[0_0_35px_rgba(34,211,238,.32)]
      "
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-cyan-400/15 via-transparent to-transparent" />
      <div className="absolute -bottom-10 left-1/2 h-20 w-32 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex justify-between items-center">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/70 mb-3">
            {label}
          </div>

          <div className="text-5xl font-bold text-white">{value}</div>
        </div>

        <div
          className="
            w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center
            shadow-[0_0_20px_rgba(34,211,238,.18)]
            transition-all duration-500 group-hover:bg-cyan-400/15
            group-hover:shadow-[0_0_26px_rgba(34,211,238,.35)]
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
  const [nombreUsuario, setNombreUsuario] = useState('');

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
    (async () => {
      const supa = createClient();

      if (!supa) return;

      const {
        data: { user }
      } = await supa.auth.getUser();

      if (!user?.email) return;

      const { data } = await supa
        .from('usuarios_panel')
        .select('nombre')
        .eq('email', user.email)
        .single();

      if (data?.nombre) {
        setNombreUsuario(data.nombre);
      }
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

const isToday = (iso: string | null) => (iso ? new Date(iso) >= today : false);

const nuevas = convs.filter(
  c =>
    c.estado_cita !== 'gestionada' &&
    !(c.estado_cita || '').toLowerCase().includes('recado')
).length;
const enCurso = convs.filter(c => (c.modo_atencion as string) === 'ia' && c.estado_cita !== 'gestionada').length;
const recepcion = convs.filter(c => c.modo_atencion === 'recepcion' && c.estado_cita !== 'gestionada' && !(c.estado_cita || '').toLowerCase().includes('recado')
).length;
const gestion = convs.filter(c => c.estado_cita === 'gestionada').length;
const recados = convs.filter(c => c.estado_cita !== 'gestionada' && (c.estado_cita || '').toLowerCase().includes('recado')).length;

const citasHoy = convs.filter(c => c.estado_cita === 'gestionada' && isToday(c.updated_at)).length;
const recordatoriosHoy = recs.filter(r => isToday(r.created_at)).length;
const recallsEnviadosHoy = recalls.filter(r => r.estado === 'enviado' && isToday(r.fecha_envio)).length;
const recallsAceptadosHoy = recalls.filter(r => r.estado === 'cita_agendada' && isToday(r.fecha_envio)).length;

  const recPendiente = recs.filter(r => r.estado === 'sin_respuesta').length;
  const recConf = recs.filter(r => r.estado === 'confirmada').length;
  const recNo = recs.filter(r => r.estado === 'no_podra_asistir').length;
  const recMod = recs.filter(r => r.estado === 'cita_modificada').length;
  const recCancel = recs.filter(r => r.estado === 'cancelada_recado').length;

  return (
    <div className="min-h-full p-8 bg-[#02141B] text-white">
      <div className="mb-10">
        <h1
          className="
            flex items-center gap-3 text-4xl font-bold
            bg-gradient-to-r from-white to-cyan-300
            bg-clip-text text-transparent mb-4
          "
        >
          ¡Hola {nombreUsuario || '...'}!

          <span className="text-cyan-300 text-3xl drop-shadow-[0_0_12px_rgba(34,211,238,.8)]">
            ✦
          </span>
        </h1>

        <div
          className="
            inline-flex items-center gap-3 rounded-full
            border border-cyan-400/20 bg-cyan-500/10
            px-5 py-2.5 text-cyan-100 text-sm font-medium
            shadow-[0_0_20px_rgba(34,211,238,.08)]
          "
        >
          <span
            className="
              w-2 h-2 rounded-full bg-cyan-300 animate-pulse
              shadow-[0_0_12px_rgba(34,211,238,.95)]
            "
          />

          Martina activa
        </div>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 uppercase tracking-[0.22em] text-cyan-300/70">
            Conversaciones
          </h2>

          <div className="grid lg:grid-cols-5 gap-4">
            <Metric icon={MessageCircle} label="Nuevas" value={nuevas} href="/conversaciones" />
            <Metric icon={LoaderCircle} label="Martina" value={enCurso} href="/conversaciones" />
            <Metric icon={Building2} label="Recepción" value={recepcion} href="/conversaciones" />
            <Metric icon={Check} label="Gestionadas" value={gestion} href="/conversaciones" />
            <Metric icon={ClipboardPen} label="Recados" value={recados} href="/conversaciones" />
          </div>
        </section>

        <section>
          <h2 className="mb-4 uppercase tracking-[0.22em] text-cyan-300/70">
            Actividad de hoy
          </h2>

          <div className="grid lg:grid-cols-4 gap-4">
            <Metric icon={CalendarDays} label="Citas creadas" value={citasHoy} href="/conversaciones" />
            <Metric icon={Bell} label="Recordatorios" value={recordatoriosHoy} href="/recordatorios" />
            <Metric icon={PhoneOutgoing} label="Recalls enviados" value={recallsEnviadosHoy} href="/recalls" />
            <Metric icon={PhoneCall} label="Recalls aceptados" value={recallsAceptadosHoy} href="/recalls" />
          </div>
        </section>

        <section>
          <h2 className="mb-4 uppercase tracking-[0.22em] text-cyan-300/70">
            Estado recordatorios
          </h2>

          <div className="grid lg:grid-cols-5 gap-4">
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
