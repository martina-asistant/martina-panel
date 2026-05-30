'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  listConversaciones,
  tomarConversacion,
  devolverAMartina,
  cerrarGestion,
  actualizarNotasConversacion
} from '@/lib/repos/conversaciones.repo';
import {
  listMensajesByConversation,
  crearMensajeSaliente
} from '@/lib/repos/mensajes.repo';
import { getPatientById, getPatientByTelefono, updatePatientNotas } from '@/lib/repos/patients.repo';
import type {
  ConversacionWhatsapp,
  MensajeWhatsapp,
  Patient,
  EstadoVisualConv
} from '@/lib/types/db.types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { formatRelativeOrTime, formatTime, lastActivity, formatDate } from '@/lib/utils/formatDate';
import { conversacionLabel } from '@/lib/utils/visualMaps';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type Filtro = 'todas' | EstadoVisualConv;

const filtros: { key: Filtro; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'nueva', label: 'Martina' },
  { key: 'recepcion', label: 'Recepción' },
  { key: 'gestionada', label: 'Gestionadas' },
];

const ConversacionesView = () => {
  const [convs, setConvs] = useState<ConversacionWhatsapp[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<MensajeWhatsapp[]>([]);
  const [paciente, setPaciente] = useState<Patient | null>(null);
  const [filter, setFilter] = useState<Filtro>('todas');
  const [search, setSearch] = useState('');
  const [notasPaciente, setNotasPaciente] = useState('');
  const [notasConv, setNotasConv] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [userEmail, setUserEmail] = useState<string>('demo@martina.local');

  const selected = useMemo(
    () => convs.find(c => c.id === selectedId) || null,
    [convs, selectedId]
  );

  const citasPaciente = useMemo(() => {
    if (!selected?.telefono_e164) {
      return {
        ultima: null as ConversacionWhatsapp | null,
        proxima: null as ConversacionWhatsapp | null
      };
    }

    const telefono = selected.telefono_e164.replace(/\D/g, '');

    const citas = convs
      .filter(c => {
        const t = (c.telefono_e164 || '').replace(/\D/g, '');

        return (
          t === telefono &&
          c.estado_cita === 'gestionada' &&
          !!c.fecha_inicio
        );
      })
      .sort(
        (a, b) =>
          new Date(a.fecha_inicio || '').getTime() -
          new Date(b.fecha_inicio || '').getTime()
      );

    const ahora = new Date().getTime();

    const pasadas = citas.filter(
      c => new Date(c.fecha_inicio || '').getTime() < ahora
    );

    const futuras = citas.filter(
      c => new Date(c.fecha_inicio || '').getTime() >= ahora
    );

    return {
      ultima: pasadas[pasadas.length - 1] || null,
      proxima: futuras[0] || null
    };
  }, [convs, selected]);

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
    } else if (conv?.telefono_e164) {
      getPatientByTelefono(conv.telefono_e164).then(p => {
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

    if (filter === 'gestionada') {
      if (c.estado_cita !== 'gestionada') return false;

    } else if (filter === 'nueva') {
      if (
        c.modo_atencion !== 'ia' ||
        c.estado_cita === 'gestionada'
      ) return false;

    } else if (filter === 'recepcion') {
      if (
        c.modo_atencion !== 'recepcion' ||
        c.estado_cita === 'gestionada'
      ) return false;
    }

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
    setConvs(await listConversaciones());
    toast.success('Gestión cerrada');
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

  const enviarMensaje = async () => {
    if (!selected || !nuevoMensaje.trim()) return;

    const creado = await crearMensajeSaliente(
      selected.id,
      nuevoMensaje.trim()
    );

    if (!creado) {
      toast.error('No se ha podido guardar el mensaje');
      return;
    }

    setNuevoMensaje('');
    setMensajes(await listMensajesByConversation(selected.id));
    toast.success('Mensaje guardado');
  };

  return (
    <div className="h-full w-full overflow-x-auto overflow-y-hidden">
      <div className="flex min-w-[1180px] h-full">

        <div className="w-[320px] shrink-0 border-r border-martina-border bg-white flex flex-col">
          <div className="p-3 border-b border-martina-border space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-martina-muted" />
              <Input
                placeholder="Buscar paciente, teléfono…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 bg-martina-bg border-martina-border"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {filtros.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-colors',
                    filter === f.key
                      ? 'bg-martina-text text-white border-martina-text'
                      : 'bg-white text-martina-muted border-martina-border hover:bg-martina-bg'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-martina-muted">
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
                    'w-full text-left px-4 py-3 border-b border-martina-border hover:bg-martina-bg transition-colors',
                    isSel && 'bg-martina-beige hover:bg-martina-beige'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">
                          {c.nombre_paciente || c.telefono_e164 || 'Sin nombre'}
                        </span>
                      </div>

                      <div className="text-xs text-martina-muted truncate mt-0.5">
                        {c.motivo || c.telefono_e164}
                      </div>
                    </div>

                    <div className="text-[10px] text-martina-muted shrink-0">
                      {formatRelativeOrTime(last)}
                    </div>
                  </div>

                  {lbl && (
                    <div className="mt-1.5">
                      <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full', lbl.color)}>
                        <span>{lbl.emoji}</span>
                        {lbl.label}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-[1_1_700px] min-w-[700px] flex flex-col bg-martina-bg min-h-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-martina-muted text-sm">
              Selecciona una conversación
            </div>
          ) : (
            <>
              <div className="h-16 shrink-0 border-b border-martina-border bg-white px-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {selected.nombre_paciente || selected.telefono_e164}
                  </div>
                  <div className="text-xs text-martina-muted truncate">
                    {selected.telefono_e164} · {selected.motivo || 'Sin motivo'}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={doTomar} className="border-martina-border">
                    Tomar conversación
                  </Button>
                  <Button size="sm" variant="outline" onClick={doDevolver} className="border-martina-border">
                    Devolver a Martina
                  </Button>
                  <Button size="sm" onClick={doCerrar} className="bg-martina-text hover:bg-black text-white">
                    Cerrar gestión
                  </Button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-2">
                {mensajes.map(m => {
                  const msg = m as any;

                  const isPaciente =
                    msg.tipo_emisor === 'paciente' ||
                    msg.direccion === 'entrante' ||
                    msg.rol === 'paciente';

                  const contenido =
                    msg.contenido_texto ||
                    msg.contenido ||
                    '';

                  const emisor =
                    msg.tipo_emisor ||
                    msg.rol ||
                    '';

                  return (
                    <div key={msg.id} className={cn('flex', isPaciente ? 'justify-start' : 'justify-end')}>
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-1.5 text-sm shadow-sm',
                          isPaciente
                            ? 'bg-white border border-martina-border text-martina-text rounded-bl-sm'
                            : 'bg-martina-beige text-martina-text rounded-br-sm'
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {contenido}
                        </div>

                        <div className="text-[10px] text-martina-muted mt-1 text-right">
                          {!isPaciente && emisor && (
                            <span className="mr-2 uppercase tracking-wide">
                              {emisor}
                            </span>
                          )}
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {mensajes.length === 0 && (
                  <div className="text-center text-sm text-martina-muted py-8">
                    Sin mensajes
                  </div>
                )}
              </div>

              <div className="px-6 py-3 shrink-0 border-t border-martina-border bg-white">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        enviarMensaje();
                      }
                    }}
                    className="flex-1 h-10 bg-martina-bg border-martina-border"
                  />

                  <Button
                    onClick={enviarMensaje}
                    disabled={!nuevoMensaje.trim()}
                    className="bg-martina-text hover:bg-black text-white"
                  >
                    Enviar
                  </Button>
                </div>

                <div className="text-[11px] text-martina-muted mt-2">
                  El mensaje se guarda en el historial. Pendiente conectar envío real por WhatsApp.
                </div>
              </div>
            </>
          )}
        </div>

        <div className="hidden min-[1600px]:block w-[320px] border-l border-martina-border bg-white overflow-y-auto shrink-0">
          {!selected ? null : (
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-martina-beige flex items-center justify-center text-base font-medium">
                  {(paciente?.nombre_completo || selected.nombre_paciente || '?')
                    .split(' ')
                    .map(s => s[0])
                    .slice(0, 2)
                    .join('')}
                </div>

                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {paciente?.nombre_completo || selected.nombre_paciente || 'Sin nombre registrado'}
                  </div>
                  <div className="text-xs text-martina-muted">
                    {paciente?.telefono || selected.telefono_e164 || 'Sin teléfono registrado'}
                  </div>
                </div>
              </div>

              {paciente?.alerta_urgencia && (
                <div className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-800 border border-red-100">
                  🚨 Posible urgencia
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-martina-muted">Última cita</div>
                  <div className="font-medium">
                    {formatDate(citasPaciente.ultima?.fecha_inicio)}
                  </div>
                  <div className="text-martina-muted">
                    {citasPaciente.ultima?.motivo || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-martina-muted">Próxima cita</div>
                  <div className="font-medium">
                    {formatDate(citasPaciente.proxima?.fecha_inicio)}
                  </div>
                  <div className="text-martina-muted">
                    {citasPaciente.proxima?.motivo || '—'}
                  </div>
                </div>
              </div>

              {paciente?.etiquetas && paciente.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {paciente.etiquetas.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-martina-beige text-martina-text">
                      ⚠️ {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs font-medium text-martina-muted uppercase tracking-wide">
                  Notas del paciente
                </div>

                <Textarea
                  value={notasPaciente}
                  onChange={e => setNotasPaciente(e.target.value)}
                  rows={4}
                  className="text-sm bg-martina-bg border-martina-border"
                  placeholder="Añade notas…"
                  disabled={!paciente}
                />

                <Button
                  size="sm"
                  onClick={saveNotasPaciente}
                  disabled={!paciente}
                  className="w-full bg-martina-text hover:bg-black text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Guardar notas
                </Button>

                {!paciente && (
                  <div className="text-[11px] text-martina-muted">
                    No hay ficha en patients. Mostrando datos desde conversaciones.
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-martina-border">
                <div className="text-xs font-medium text-martina-muted uppercase tracking-wide">
                  Notas de esta conversación
                </div>

                <Textarea
                  value={notasConv}
                  onChange={e => setNotasConv(e.target.value)}
                  rows={3}
                  className="text-sm bg-martina-bg border-martina-border"
                  placeholder="Recado, contexto…"
                />

                <Button size="sm" variant="outline" onClick={saveNotasConv} className="w-full border-martina-border">
                  Guardar recado
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ConversacionesView;
