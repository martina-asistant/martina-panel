'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Paperclip, Send, Save } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  listConversaciones,
  tomarConversacion,
  devolverAMartina,
  cerrarGestion,
  actualizarNotasConversacion
} from '@/lib/repos/conversaciones.repo';
import { listMensajesByConversation } from '@/lib/repos/mensajes.repo';
import { getPatientById, updatePatientNotas } from '@/lib/repos/patients.repo';
import type {
  ConversacionWhatsapp,
  MensajeWhatsapp,
  Patient,
  EstadoVisualConv
} from '@/lib/types/db.types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  formatRelativeOrTime,
  formatTime,
  lastActivity,
  formatDate
} from '@/lib/utils/formatDate';
import { conversacionLabel } from '@/lib/utils/visualMaps';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type Filtro = 'todas' | EstadoVisualConv;

const filtros: { key: Filtro; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'nueva', label: 'Martina activa' },
  { key: 'recepcion', label: 'Recepción' },
  { key: 'gestionada', label: 'Gestionadas' },
];

const formatTelefono = (telefono?: string | null) => {
  if (!telefono) return '';

  const clean = telefono.replace(/\D/g, '');

  const sinPrefijo =
    clean.startsWith('34') && clean.length >= 11
      ? clean.slice(2)
      : clean;

  return sinPrefijo.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
};

const ConversacionesView = () => {
  const [convs, setConvs] = useState<ConversacionWhatsapp[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<MensajeWhatsapp[]>([]);
  const [paciente, setPaciente] = useState<Patient | null>(null);
  const [filter, setFilter] = useState<Filtro>('todas');
  const [search, setSearch] = useState('');
  const [notasPaciente, setNotasPaciente] = useState('');
  const [notasConv, setNotasConv] = useState('');
  const [userEmail, setUserEmail] = useState<string>('demo@martina.local');

  const selected = useMemo(
    () => convs.find(c => c.id === selectedId) || null,
    [convs, selectedId]
  );

  useEffect(() => {
    (async () => {
      const list = await listConversaciones();
      setConvs(list);
      if (list[0]) setSelectedId(list[0].id);
    })();

    if (isSupabaseConfigured()) {
      const supa = createClient();
      supa.auth.getUser().then(({ data }) => {
        if (data.user?.email) setUserEmail(data.user.email);
      });
    }
  }, []);

  useEffect(() => {
    const supa = createClient();
    if (!supa) return;

    const ch = supa
      .channel('conv-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversaciones_whatsapp' },
        async () => {
          setConvs(await listConversaciones());
        }
      )
      .subscribe();

    return () => {
      supa.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMensajes([]);
      setPaciente(null);
      return;
    }

    (async () => {
      const ms = await listMensajesByConversation(selectedId);
      setMensajes(ms);
    })();

    const conv = convs.find(c => c.id === selectedId);
    setNotasConv(conv?.notas_internas || '');

    if (conv?.paciente_id) {
      getPatientById(conv.paciente_id).then(p => {
        setPaciente(p);
        setNotasPaciente(p?.notas_internas || '');
      });
    } else {
      setPaciente(null);
      setNotasPaciente('');
    }
  }, [selectedId, convs]);

  useEffect(() => {
    const supa = createClient();
    if (!supa || !selectedId) return;

    const ch = supa
      .channel(`msg-realtime-${selectedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes_whatsapp',
          filter: `conversation_id=eq.${selectedId}`
        },
        payload => {
          setMensajes(prev => [...prev, payload.new as MensajeWhatsapp]);
        }
      )
      .subscribe();

    return () => {
      supa.removeChannel(ch);
    };
  }, [selectedId]);

  const filtered = convs.filter(c => {
    if (filter !== 'todas' && c.estado_visual !== filter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();

      return (
        (c.nombre_paciente || '').toLowerCase().includes(q) ||
        (c.telefono_e164 || '').includes(q) ||
        (c.motivo || '').toLowerCase().includes(q)
      );
    }

    return true;
  });

  const doTomar = async () => {
    if (!selected) return;
    await tomarConversacion(selected.id, userEmail);
    setConvs(await listConversaciones());
    toast.success('Conversación tomada por recepción');
  };

  const doDevolver = async () => {
    if (!selected) return;
    await devolverAMartina(selected.id);
    setConvs(await listConversaciones());
    toast.success('Devuelta a Martina');
  };

  const doCerrar = async () => {
    if (!selected) return;
    await cerrarGestion(selected.id);
     const updated = await listConversaciones();

  // quitar la conversación cerrada de la vista actual
  const visibles = updated.filter(
    c => c.estado_visual !== 'gestionada'
  );

  setConvs(visibles);

  // volver a estado base
  setSelectedId(visibles[0]?.id || null);

  toast.success('Conversación cerrada');
};

  const saveNotasConv = async () => {
    if (!selected) return;
    await actualizarNotasConversacion(selected.id, notasConv);
    toast.success('Notas guardadas');
    setConvs(await listConversaciones());
  };

  const saveNotasPaciente = async () => {
    if (!paciente) return;
    await updatePatientNotas(paciente.id, notasPaciente);
    toast.success('Notas del paciente guardadas');
  };

  return (
    <div className="h-full flex bg-[#02141B] text-white">
      <div className="w-[340px] border-r border-cyan-500/15 bg-[#03111A] flex flex-col">

  <div className="px-6 pt-6 pb-4">
   <h1 className="text-[38px] font-semibold tracking-[-0.02em] scale-x-[1.02] origin-left bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent mb-1">
    Conversaciones
    </h1>

    <p className="text-sm text-cyan-100/55">
      WhatsApp
    </p>
  </div>

  <div className="p-4 border-b border-cyan-500/15 space-y-3">

    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300/70" />
      <Input
              placeholder="Buscar paciente, teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-white/5 border-cyan-500/20 text-white placeholder:text-cyan-100/45 focus-visible:ring-cyan-400"
            />
          </div>

          <div className="flex mb-2">
  {filtros
    .filter(f => f.key === 'todas')
    .map(f => (
      <button
        key={f.key}
        onClick={() => setFilter(f.key)}
        className={cn(
          'text-[12px] px-2.5 py-[5px] rounded-full border transition-colors whitespace-nowrap',
          filter === f.key
            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-300/50 shadow-[0_0_18px_rgba(34,211,238,.22)]'
            : 'bg-white/5 text-cyan-100/65 border-cyan-500/20 hover:bg-cyan-500/10 hover:text-white'
        )}
      >
        {f.label}
      </button>
    ))}
</div>

<div className="flex flex-wrap gap-2">
  {filtros
    .filter(f => f.key !== 'todas')
    .map(f => (
      <button
        key={f.key}
        onClick={() => setFilter(f.key)}
        className={cn(
          'text-[12px] px-2.5 py-[5px] rounded-full border transition-colors whitespace-nowrap',
          filter === f.key
            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-300/50 shadow-[0_0_18px_rgba(34,211,238,.22)]'
            : 'bg-white/5 text-cyan-100/65 border-cyan-500/20 hover:bg-cyan-500/10 hover:text-white'
        )}
      >
        {f.label}
      </button>
    ))}
</div>

</div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-cyan-100/50">
              Sin conversaciones
            </div>
          )}

          {filtered.map(c => {
            const lbl = c.estado_visual ? conversacionLabel[c.estado_visual] : null;
            const last = lastActivity(c);
            const isSel = c.id === selectedId;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  'w-full text-left px-5 py-4 border-b border-cyan-500/10 transition-all',
                  isSel
                    ? 'bg-cyan-500/15 shadow-[inset_3px_0_0_rgba(34,211,238,.9)]'
                    : 'hover:bg-white/5'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.9)]" />
                      <span className="text-sm font-semibold truncate text-white">
                        {c.nombre_paciente || formatTelefono(c.telefono_e164) || 'Sin nombre'}
                      </span>
                    </div>

                    <div className="text-xs text-cyan-100/60 truncate mt-1 ml-4">
                      {c.motivo || formatTelefono(c.telefono_e164)}
                    </div>
                  </div>

                  <div className="text-[11px] text-cyan-100/60 shrink-0">
                    {formatRelativeOrTime(last)}
                  </div>
                </div>

                {lbl && (
                  <div className="mt-2 ml-4">
                    <span className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-100 border border-cyan-400/20">
                      {lbl.label}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FBFC] text-[#06111A] shadow-[0_0_25px_rgba(14,124,139,.08)]">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Selecciona una conversación
          </div>
        ) : (
          <>
          <div className="relative z-10 bg-[#F8FBFC] px-8 py-5 border-b border-cyan-100 shadow-[0_12px_30px_rgba(14,124,139,.08)]">

  <button
    onClick={doCerrar}
    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white bg-[linear-gradient(180deg,#214955_0%,#163C46_100%)] border border-cyan-300/15 shadow-[0_0_0_3px_rgba(34,211,238,.10),0_0_18px_rgba(34,211,238,.25)] hover:scale-105 transition-all z-20"
  >
   <span className="text-[12px] leading-[1] flex items-center justify-center translate-y-[-1px]">✕</span>
  </button>
  <div className="w-full rounded-3xl border border-[#6FD7E2]/35 bg-[linear-gradient(180deg,#0F2C35_0%,#163C46_100%)] px-8 py-4 shadow-[0_0_34px_rgba(34,211,238,.18),0_16px_32px_rgba(14,124,139,.14),inset_0_1px_0_rgba(255,255,255,.06)]">
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <div className="font-semibold text-white">
          {selected.nombre_paciente || formatTelefono(selected.telefono_e164)}
        </div>

        <div className="text-xs text-cyan-100/75">
          {formatTelefono(selected.telefono_e164)} · {selected.motivo || 'Sin motivo'}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={doTomar}
          className="bg-cyan-50 border-cyan-300/35 text-cyan-700 hover:bg-cyan-100"
        >
          Tomar conversación
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={doDevolver}
          className="bg-cyan-50 border-cyan-300/35 text-cyan-700 hover:bg-cyan-100"
        >
          Devolver a Martina
        </Button>
      </div>
    </div>
  </div>
</div>

            <div className="flex-1 overflow-y-auto px-8 py-7 space-y-4 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.04),#F8FBFC_45%)]">
              {mensajes.map(m => {
                const isPaciente = m.rol === 'paciente';

                return (
                  <div
                    key={m.id}
                    className={cn('flex', isPaciente ? 'justify-start' : 'justify-end')}
                  >
                    <div
                      className={cn(
                        'max-w-[72%] rounded-2xl px-5 py-3 text-sm shadow-sm',
                        isPaciente
                          ? 'bg-white border border-slate-200 text-[#06111A] rounded-bl-sm'
                          : 'bg-[#D9F7FA] border border-[#B6EAEF] text-[#184B53] rounded-br-sm shadow-[0_0_12px_rgba(34,211,238,.08)]'
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words leading-relaxed">
                        {m.contenido}
                      </div>

                      <div
                        className={cn(
                          'text-[10px] mt-2 text-right',
                          isPaciente ? 'text-slate-400' : 'text-cyan-900/60'
                        )}
                      >
                        {m.rol !== 'paciente' && (
                          <span className="mr-2 uppercase tracking-wide">
                            {m.rol}
                          </span>
                        )}
                        {formatTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {mensajes.length === 0 && (
                <div className="text-center text-sm text-slate-400 py-8">
                  Sin mensajes
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#6FD7E2]/20 bg-[#F8FBFC] shadow-[0_-6px_20px_rgba(14,124,139,.08)]">
              <div className="flex items-center gap-3 rounded-2xl border border-[#6FD7E2]/35 bg-[linear-gradient(180deg,#0F2C35_0%,#163C46_100%)] p-3 shadow-[0_-10px_35px_rgba(34,211,238,.14),0_14px_30px_rgba(34,211,238,.10),inset_0_1px_0_rgba(255,255,255,.05)]">
                <button
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#17C7D6] to-[#0E7C8B] hover:scale-[1.03] shadow-[0_0_20px_rgba(14,124,139,.35)] text-white flex items-center justify-center transition-all"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <div className="flex-1 rounded-xl bg-white border border-cyan-100 px-4 py-2 text-sm text-slate-400">
                  Envío gestionado por Martina desde n8n
                </div>

                <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#17C7D6] to-[#0E7C8B] hover:from-[#25D6E6] hover:to-[#118FA0] shadow-[0_0_24px_rgba(14,124,139,.45)] text-white flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="w-[340px] border-l border-cyan-500/15 bg-[#03111A] overflow-y-auto">
        {!selected ? null : !paciente ? (
          <div className="p-5 text-sm text-cyan-100/50">
            Sin paciente vinculado.
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border border-cyan-300/60 bg-cyan-500/10 flex items-center justify-center text-base font-semibold text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,.22)]">
                {(paciente.nombre_completo || '?')
                  .split(' ')
                  .map(s => s[0])
                  .slice(0, 2)
                  .join('')}
              </div>

              <div className="min-w-0">
                <div className="font-semibold truncate text-white">
                  {paciente.nombre_completo}
                </div>
                <div className="text-xs text-cyan-100/60">
                  {formatTelefono(paciente.telefono)}
                </div>
              </div>
            </div>

            {paciente.alerta_urgencia && (
              <div className="text-xs px-3 py-2 rounded-xl bg-red-500/10 text-red-100 border border-red-400/25">
                Posible urgencia
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-cyan-100/50 mb-1">Última cita</div>
                <div className="font-medium text-white">
                  {formatDate(paciente.ultima_cita_fecha)}
                </div>
                <div className="text-cyan-100/50">
                  {paciente.ultima_cita_motivo || '—'}
                </div>
              </div>

              <div>
                <div className="text-cyan-100/50 mb-1">Próxima cita</div>
                <div className="font-medium text-white">
                  {formatDate(paciente.proxima_cita_fecha)}
                </div>
                <div className="text-cyan-100/50">
                  {paciente.proxima_cita_motivo || '—'}
                </div>
              </div>
            </div>

            {paciente.etiquetas && paciente.etiquetas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {paciente.etiquetas.map(t => (
                  <span
                    key={t}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-100 border border-cyan-400/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs font-medium text-cyan-100/60 uppercase tracking-wide">
                Notas del paciente
              </div>

              <Textarea
                value={notasPaciente}
                onChange={e => setNotasPaciente(e.target.value)}
                rows={4}
                className="text-sm bg-white/5 border-cyan-500/20 text-white placeholder:text-cyan-100/35"
                placeholder="Añade notas…"
              />

              <Button
                size="sm"
                onClick={saveNotasPaciente}
                className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar notas
              </Button>
            </div>

            <div className="space-y-2 pt-4 border-t border-cyan-500/15">
              <div className="text-xs font-medium text-cyan-100/60 uppercase tracking-wide">
                Notas de esta conversación
              </div>

              <Textarea
                value={notasConv}
                onChange={e => setNotasConv(e.target.value)}
                rows={3}
                className="text-sm bg-white/5 border-cyan-500/20 text-white placeholder:text-cyan-100/35"
                placeholder="Recado, contexto…"
              />

              <Button
                size="sm"
                variant="outline"
                onClick={saveNotasConv}
                className="w-full border-cyan-400/30 text-white hover:bg-cyan-500/10"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar recado
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversacionesView;
