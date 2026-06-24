'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Save,
  Menu,
  ChevronDown,
  X,
  Paperclip,
  Send,
  Mic,
  Square,
  Play,
  Pause,
  Trash2
} from 'lucide-react';
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
  enviarMensajePanelWhatsapp,
  enviarAdjuntoPanelWhatsapp,
  enviarAudioPanelWhatsapp
} from '@/lib/repos/mensajes.repo';
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
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
  getPatientByPacienteId,
  updatePatientNotas
} from '@/lib/repos/patients.repo';

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
  const [filter, setFilter] = useState<Filtro>('todas');
  const [search, setSearch] = useState('');
  const [notasConv, setNotasConv] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [userEmail, setUserEmail] = useState<string>('demo@martina.local');
  const [paciente, setPaciente] = useState<Patient | null>(null);
  const [notasPaciente, setNotasPaciente] = useState('');

  // UI móvil
  const [mostrarListaMovil, setMostrarListaMovil] = useState(false);
  const [mostrarFichaMovil, setMostrarFichaMovil] = useState(false);

  // Adjuntos + audio
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const [grabandoAudio, setGrabandoAudio] = useState(false);
  const [enviandoAudio, setEnviandoAudio] = useState(false);

  // Preview tipo WhatsApp
  const [audioPreviewFile, setAudioPreviewFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [reproduciendoPreview, setReproduciendoPreview] = useState(false);

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
      setNotasConv('');
      setPaciente(null);
      setNotasPaciente('');
      return;
    }

    (async () => {
      const ms = await listMensajesByConversation(selectedId);
      setMensajes(ms);
    })();

    const conv = convs.find(c => c.id === selectedId);
    setNotasConv(conv?.notas_internas || '');

    if (conv?.paciente_id) {
      getPatientByPacienteId(conv.paciente_id).then(p => {
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

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  const filtered = convs.filter(c => {
    if (filter === 'gestionada') {
      if (c.estado_visual !== 'gestionada') return false;
    } else if (filter === 'nueva') {
      if (c.estado_visual !== 'nueva') return false;
    } else if (filter === 'recepcion') {
      if (c.estado_visual !== 'recepcion') return false;
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

    const actualizado = await updatePatientNotas(paciente.id, notasPaciente);

    if (!actualizado) {
      toast.error('No se han podido guardar las notas del paciente');
      return;
    }

    setPaciente(actualizado);
    setNotasPaciente(actualizado.notas_internas || '');
    toast.success('Notas del paciente guardadas');
  };

  const enviarMensaje = async () => {
    if (!selected || !nuevoMensaje.trim()) return;

    const telefono =
      selected.telefono_e164 ||
      selected.telefono ||
      '';

    if (!telefono) {
      toast.error('Esta conversación no tiene teléfono válido');
      return;
    }

    const texto = nuevoMensaje.trim();

    const resultado = await enviarMensajePanelWhatsapp({
      conversationId: selected.id,
      telefono,
      mensaje: texto
    });

    if (!resultado?.ok) {
      toast.error(resultado?.error || 'No se ha podido enviar el WhatsApp');
      return;
    }

    setNuevoMensaje('');
    setMensajes(await listMensajesByConversation(selected.id));
    toast.success('Mensaje enviado por WhatsApp');
  };

  const enviarAdjunto = async (file: File) => {
    if (!selected || !file) return;

    const telefono =
      selected.telefono_e164 ||
      selected.telefono ||
      '';

    if (!telefono) {
      toast.error('Esta conversación no tiene teléfono válido');
      return;
    }

    const resultado = await enviarAdjuntoPanelWhatsapp({
      conversationId: selected.id,
      telefono,
      file
    });

    if (!resultado?.ok) {
      toast.error(resultado?.error || 'No se ha podido enviar el adjunto');
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setMensajes(await listMensajesByConversation(selected.id));
    toast.success('Adjunto enviado');
  };

  const limpiarPreviewAudio = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
    }

    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }

    setAudioPreviewFile(null);
    setAudioPreviewUrl(null);
    setReproduciendoPreview(false);
  };

  const enviarAudio = async (audioFile: File) => {
    if (!selected || !audioFile) return;

    const telefono =
      selected.telefono_e164 ||
      selected.telefono ||
      '';

    if (!telefono) {
      toast.error('Esta conversación no tiene teléfono válido');
      return;
    }

    setEnviandoAudio(true);

    try {
      const resultado = await enviarAudioPanelWhatsapp({
        conversationId: selected.id,
        telefono,
        audio: audioFile
      });

      if (!resultado?.ok) {
        toast.error(resultado?.error || 'No se ha podido enviar el audio');
        return;
      }

      limpiarPreviewAudio();
      setMensajes(await listMensajesByConversation(selected.id));
      toast.success('Audio enviado');
    } finally {
      setEnviandoAudio(false);
    }
  };

  const togglePreviewAudio = async () => {
    if (!audioPreviewRef.current || !audioPreviewUrl) return;

    try {
      if (reproduciendoPreview) {
        audioPreviewRef.current.pause();
        setReproduciendoPreview(false);
      } else {
        await audioPreviewRef.current.play();
        setReproduciendoPreview(true);
      }
    } catch (error) {
      console.error(error);
      toast.error('No se ha podido reproducir el audio');
    }
  };

  const enviarAudioPreview = async () => {
    if (!audioPreviewFile) return;
    await enviarAudio(audioPreviewFile);
  };

  const iniciarGrabacionAudio = async () => {
    if (grabandoAudio || enviandoAudio) return;

    if (audioPreviewUrl || audioPreviewFile) {
      toast.message('Tienes un audio pendiente. Envíalo o bórralo antes de grabar otro.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm'
        });

        const audioFile = new File(
          [blob],
          `audio_${Date.now()}.webm`,
          { type: blob.type || 'audio/webm' }
        );

        const previewUrl = URL.createObjectURL(blob);

        stream.getTracks().forEach(track => track.stop());
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;

        setAudioPreviewFile(audioFile);
        setAudioPreviewUrl(previewUrl);
        setReproduciendoPreview(false);
      };

      mediaRecorder.start();
      setGrabandoAudio(true);
    } catch (error) {
      console.error(error);
      toast.error('No se ha podido acceder al micrófono');
    }
  };

  const pararGrabacionAudio = () => {
    if (!mediaRecorderRef.current) return;

    setGrabandoAudio(false);
    mediaRecorderRef.current.stop();
  };

  return (
    <div className="h-full min-h-0 w-full overflow-hidden relative">
      {/* 💻 SECCIÓN DESKTOP */}
      <div className="hidden md:flex min-w-[1180px] h-full min-h-0">
        {/* Sidebar */}
        <div className="w-[320px] h-full min-h-0 shrink-0 border-r border-martina-border bg-white flex flex-col">
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

          <div className="flex-1 min-h-0 overflow-y-scroll">
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

        {/* Chat central */}
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
                    {selected.nombre_paciente || 'Sin nombre registrado'}
                  </div>
                  <div className="text-xs text-martina-muted">
                    {selected.telefono_e164 || 'Sin WhatsApp registrado'}
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

              <div className="flex-1 min-h-0 overflow-y-scroll px-6 py-5 space-y-2">
                {mensajes.map(m => {
                  const msg = m as any;
                  const isPaciente =
                    msg.tipo_emisor === 'paciente' ||
                    msg.direccion === 'entrante' ||
                    msg.rol === 'paciente';

                  const contenido = msg.contenido_texto || msg.contenido || '';
                  const emisor = msg.tipo_emisor || msg.rol || '';

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

              {/* Composer desktop Martina + audio preview */}
              <div className="px-6 py-3 shrink-0 border-t border-martina-border bg-white">
                <div className="flex gap-2 items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) enviarAdjunto(file);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={grabandoAudio || enviandoAudio}
                    className="h-10 w-10 shrink-0 rounded-xl border border-martina-border bg-martina-bg flex items-center justify-center text-martina-text hover:bg-martina-beige transition-colors disabled:opacity-40"
                    title="Adjuntar archivo"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {audioPreviewUrl ? (
                    <div className="flex-1 h-10 rounded-xl bg-martina-bg border border-martina-border px-2 flex items-center gap-2 min-w-0">
                      <audio
                        ref={audioPreviewRef}
                        src={audioPreviewUrl}
                        onEnded={() => setReproduciendoPreview(false)}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={limpiarPreviewAudio}
                        disabled={enviandoAudio}
                        className="h-8 w-8 shrink-0 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 flex items-center justify-center"
                        title="Borrar audio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={togglePreviewAudio}
                        disabled={enviandoAudio}
                        className="h-8 w-8 shrink-0 rounded-lg text-martina-text hover:bg-martina-beige disabled:opacity-40 flex items-center justify-center"
                        title={reproduciendoPreview ? 'Pausar audio' : 'Escuchar audio'}
                      >
                        {reproduciendoPreview ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1 truncate text-sm text-martina-text">
                        Audio listo para enviar
                      </div>

                      <button
                        type="button"
                        onClick={enviarAudioPreview}
                        disabled={enviandoAudio}
                        className="h-8 w-8 shrink-0 rounded-lg bg-martina-text text-white hover:bg-black disabled:opacity-40 flex items-center justify-center"
                        title="Enviar audio"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder={grabandoAudio ? 'Grabando audio…' : 'Escribe un mensaje...'}
                        value={nuevoMensaje}
                        onChange={(e) => setNuevoMensaje(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!grabandoAudio) enviarMensaje();
                          }
                        }}
                        disabled={grabandoAudio}
                        className="flex-1 h-10 bg-martina-bg border-martina-border"
                      />

                      <button
                        type="button"
                        onClick={enviarMensaje}
                        disabled={!nuevoMensaje.trim() || grabandoAudio}
                        className="h-10 w-10 shrink-0 rounded-xl bg-martina-text hover:bg-black text-white disabled:opacity-40 flex items-center justify-center"
                        title="Enviar"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {!audioPreviewUrl && (
                    <button
                      type="button"
                      onClick={grabandoAudio ? pararGrabacionAudio : iniciarGrabacionAudio}
                      disabled={enviandoAudio}
                      className={cn(
                        'h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center transition-colors',
                        grabandoAudio
                          ? 'border-red-300 bg-red-50 text-red-600'
                          : 'border-martina-border bg-martina-bg text-martina-text hover:bg-martina-beige'
                      )}
                      title={grabandoAudio ? 'Parar grabación' : 'Grabar audio'}
                    >
                      {grabandoAudio ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Ficha paciente desktop */}
        <div className="hidden xl:block w-[320px] h-full min-h-0 shrink-0 border-l border-martina-border bg-white overflow-y-auto">
          {!selected ? null : (
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-martina-beige border border-martina-border flex items-center justify-center text-lg font-semibold text-martina-text">
                  {(paciente?.nombre_completo || selected.nombre_paciente || '?')
                    .split(' ')
                    .map((s: string) => s[0])
                    .slice(0, 2)
                    .join('')}
                </div>

                <div className="min-w-0">
                  <div className="font-semibold truncate text-martina-text">
                    {paciente?.nombre_completo || selected.nombre_paciente || 'Sin nombre registrado'}
                  </div>

                  <div className="text-xs text-martina-muted">
                    {paciente?.telefono || selected.telefono_e164 || selected.telefono || 'Sin teléfono registrado'}
                  </div>
                </div>
              </div>

              {paciente?.alerta_urgencia && (
                <div className="text-xs px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200">
                  Posible urgencia
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-martina-muted mb-1">Última cita</div>
                  <div className="font-medium text-martina-text">
                    {formatDate(paciente?.ultima_cita_fecha)}
                  </div>
                  <div className="text-martina-muted">
                    {paciente?.ultima_cita_motivo || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-martina-muted mb-1">Próxima cita</div>
                  <div className="font-medium text-martina-text">
                    {formatDate(paciente?.proxima_cita_fecha)}
                  </div>
                  <div className="text-martina-muted">
                    {paciente?.proxima_cita_motivo || '—'}
                  </div>
                </div>
              </div>

              {paciente?.etiquetas && paciente.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {paciente.etiquetas.map((t: string) => (
                    <span
                      key={t}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-martina-beige text-martina-text border border-martina-border"
                    >
                      {t}
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
                />

                <Button
                  size="sm"
                  onClick={saveNotasPaciente}
                  className="w-full bg-martina-text hover:bg-black text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar notas paciente
                </Button>
              </div>

              <div className="space-y-2 pt-4 border-t border-martina-border">
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

                <Button
                  size="sm"
                  onClick={saveNotasConv}
                  className="w-full bg-martina-text hover:bg-black text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar recado
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 📱 SECCIÓN MOBILE */}
            <div className="flex md:hidden flex-col h-[calc(100dvh-180px)] w-full bg-[#020f14] min-h-0 relative">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-cyan-400 text-xs p-4 text-center">
            Abre el menú superior para cargar una conversación activa.
          </div>
        ) : (
          <>
            <div className="h-14 shrink-0 border-b border-cyan-500/10 bg-[#03161d] px-2 flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <button
                  onClick={() => setMostrarListaMovil(!mostrarListaMovil)}
                  className="p-1.5 rounded-lg text-cyan-400 hover:bg-[#020f14] shrink-0"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setMostrarFichaMovil(!mostrarFichaMovil)}
                  className="flex items-center gap-0.5 text-left min-w-0"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-white truncate">
                      {selected.nombre_paciente || 'Sin nombre'}
                    </div>
                    <div className="text-[9px] text-cyan-400/70 truncate">
                      {selected.telefono_e164 || 'Sin número'}
                    </div>
                  </div>

                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 text-cyan-400 shrink-0 transition-transform duration-300',
                      mostrarFichaMovil && 'rotate-180'
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={doTomar}
                  className="h-7 text-[10px] px-2 font-medium rounded-md border border-cyan-500/20 text-cyan-400 bg-transparent"
                >
                  Tomar
                </button>
                <button
                  onClick={doDevolver}
                  className="h-7 text-[10px] px-2 font-medium rounded-md bg-cyan-950/60 border border-cyan-400/30 text-cyan-300"
                >
                  Martina
                </button>
                <button
                  onClick={doCerrar}
                  className="h-7 text-[10px] px-2 font-bold rounded-md bg-cyan-400 text-slate-900"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2.5 bg-[#020f14]/40">
              {mensajes.map(m => {
                const msg = m as any;
                const isPaciente =
                  msg.tipo_emisor === 'paciente' ||
                  msg.direccion === 'entrante' ||
                  msg.rol === 'paciente';

                const contenido = msg.contenido_texto || msg.contenido || '';
                const emisor = msg.tipo_emisor || msg.rol || '';

                return (
                  <div key={msg.id} className={cn('flex w-full', isPaciente ? 'justify-start' : 'justify-end')}>
                    <div
                      className={cn(
                        'max-w-[85%] rounded-xl px-3 py-2 text-xs shadow-md break-words',
                        isPaciente
                          ? 'bg-[#03161d] border border-cyan-500/10 text-slate-200 rounded-bl-none'
                          : 'bg-cyan-950/40 border border-cyan-400/20 text-cyan-100 rounded-br-none'
                      )}
                    >
                      <div className="whitespace-pre-wrap">{contenido}</div>
                      <div className="text-[9px] opacity-60 mt-1 text-right">
                        {!isPaciente && emisor && (
                          <span className="mr-1.5 uppercase font-bold">{emisor}</span>
                        )}
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {mensajes.length === 0 && (
                <div className="text-center text-xs text-slate-500 py-6">
                  Sin mensajes históricos
                </div>
              )}
            </div>

            {/* Composer móvil con estilo actual + preview audio */}
            <div className="p-3 shrink-0 border-t border-cyan-500/10 bg-[#03161d]">
              <div className="flex gap-2 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) enviarAdjunto(file);
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={grabandoAudio || enviandoAudio}
                  className="h-9 w-9 shrink-0 rounded-md border border-cyan-500/20 bg-[#020f14] text-cyan-300 disabled:opacity-40 flex items-center justify-center"
                  title="Adjuntar archivo"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {audioPreviewUrl ? (
                  <div className="flex-1 h-9 rounded-md bg-[#020f14] border border-cyan-500/20 px-2 flex items-center gap-2 min-w-0">
                    <audio
                      ref={audioPreviewRef}
                      src={audioPreviewUrl}
                      onEnded={() => setReproduciendoPreview(false)}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={limpiarPreviewAudio}
                      disabled={enviandoAudio}
                      className="h-7 w-7 shrink-0 rounded-md text-red-400 hover:bg-red-500/10 disabled:opacity-40 flex items-center justify-center"
                      title="Borrar audio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={togglePreviewAudio}
                      disabled={enviandoAudio}
                      className="h-7 w-7 shrink-0 rounded-md text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-40 flex items-center justify-center"
                      title={reproduciendoPreview ? 'Pausar audio' : 'Escuchar audio'}
                    >
                      {reproduciendoPreview ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 truncate text-[11px] text-cyan-100">
                      Audio listo para enviar
                    </div>

                    <button
                      type="button"
                      onClick={enviarAudioPreview}
                      disabled={enviandoAudio}
                      className="h-7 w-7 shrink-0 rounded-md bg-cyan-400 text-slate-900 disabled:opacity-40 flex items-center justify-center"
                      title="Enviar audio"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder={grabandoAudio ? 'Grabando audio…' : 'Escribe un mensaje...'}
                      value={nuevoMensaje}
                      onChange={(e) => setNuevoMensaje(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!grabandoAudio) enviarMensaje();
                        }
                      }}
                      disabled={grabandoAudio}
                      className="flex-1 h-9 rounded-md text-xs bg-[#020f14] border border-cyan-500/20 px-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={enviarMensaje}
                      disabled={!nuevoMensaje.trim() || grabandoAudio}
                      className="h-9 w-9 shrink-0 rounded-md bg-cyan-400 text-slate-900 disabled:opacity-40 flex items-center justify-center"
                      title="Enviar"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </>
                )}

                {!audioPreviewUrl && (
                  <button
                    type="button"
                    onClick={grabandoAudio ? pararGrabacionAudio : iniciarGrabacionAudio}
                    disabled={enviandoAudio}
                    className={cn(
                      'h-9 w-9 shrink-0 rounded-md flex items-center justify-center',
                      grabandoAudio
                        ? 'bg-red-500 text-white'
                        : 'border border-cyan-500/20 bg-[#020f14] text-cyan-300'
                    )}
                    title={grabandoAudio ? 'Parar grabación' : 'Grabar audio'}
                  >
                    {grabandoAudio ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {(mostrarListaMovil || mostrarFichaMovil) && (
              <div
                onClick={() => {
                  setMostrarListaMovil(false);
                  setMostrarFichaMovil(false);
                }}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs z-20 pointer-events-auto"
              />
            )}

            {/* Lista móvil */}
            <div
              className={cn(
                'absolute inset-y-0 left-0 z-30 w-[290px] bg-[#03161d] border-r border-cyan-500/10 flex flex-col transition-transform duration-300 ease-out',
                mostrarListaMovil ? 'translate-x-0' : '-translate-x-full'
              )}
            >
              <div className="p-3 border-b border-cyan-500/10 flex items-center justify-between bg-[#020f14]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  Conversaciones
                </span>
                <button
                  onClick={() => setMostrarListaMovil(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 border-b border-cyan-500/10 space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/60" />
                  <input
                    placeholder="Buscar paciente..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 h-8 rounded-md bg-[#020f14] border border-cyan-500/20 text-xs text-white placeholder-slate-500"
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {filtros.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={cn(
                        'text-[10px] px-2.5 py-1 rounded-full border transition-colors',
                        filter === f.key
                          ? 'bg-cyan-400 text-slate-900 border-cyan-400 font-medium'
                          : 'bg-transparent text-slate-400 border-cyan-500/10'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-cyan-500/5">
                {filtered.map(c => {
                  const lbl = c.estado_visual ? conversacionLabel[c.estado_visual] : null;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedId(c.id);
                        setMostrarListaMovil(false);
                      }}
                      className={cn(
                        'w-full text-left px-3.5 py-3 transition-colors',
                        c.id === selectedId ? 'bg-[#020f14]/80 border-l-2 border-cyan-400' : ''
                      )}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-slate-200 truncate">
                            {c.nombre_paciente || 'Sin nombre'}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {c.motivo || c.telefono_e164}
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-500 shrink-0">
                          {formatRelativeOrTime(lastActivity(c))}
                        </div>
                      </div>

                      {lbl && (
                        <div className="mt-1 flex text-[9px] text-cyan-300 bg-cyan-950/50 border border-cyan-500/10 px-2 py-0.5 rounded-full w-max">
                          <span className="mr-1">{lbl.emoji}</span>
                          {lbl.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ficha móvil */}
            <div
              className={cn(
                'absolute inset-x-0 top-14 z-30 bg-[#03161d] border-b border-cyan-500/10 rounded-b-2xl shadow-2xl overflow-y-auto transition-all duration-300 ease-out origin-top',
                mostrarFichaMovil ? 'scale-y-100 opacity-100 visible max-h-[75vh]' : 'scale-y-0 opacity-0 invisible max-h-0'
              )}
            >
              <div className="p-4 space-y-4 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center text-sm font-bold text-cyan-400 shrink-0">
                    {(paciente?.nombre_completo || selected.nombre_paciente || '?')
                      .split(' ')
                      .map((s: string) => s[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">
                      {paciente?.nombre_completo || selected.nombre_paciente || 'Sin nombre'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {paciente?.telefono || selected.telefono_e164 || 'Sin teléfono'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 bg-[#020f14]/50 p-2.5 rounded-xl border border-cyan-500/5">
                  <div>
                    <div className="text-slate-500 text-[10px] mb-0.5">Última cita</div>
                    <div className="font-medium text-slate-300">
                      {formatDate(paciente?.ultima_cita_fecha)}
                    </div>
                    <div className="text-slate-500 text-[10px] truncate">
                      {paciente?.ultima_cita_motivo || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px] mb-0.5">Próxima cita</div>
                    <div className="font-medium text-slate-300">
                      {formatDate(paciente?.proxima_cita_fecha)}
                    </div>
                    <div className="text-slate-500 text-[10px] truncate">
                      {paciente?.proxima_cita_motivo || '—'}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Notas del paciente
                  </label>
                  <textarea
                    value={notasPaciente}
                    onChange={e => setNotasPaciente(e.target.value)}
                    rows={3}
                    className="w-full text-xs rounded-md bg-[#020f14] border border-cyan-500/10 p-2 text-white focus:outline-none"
                    placeholder="Modificar notas..."
                  />
                  <button
                    onClick={saveNotasPaciente}
                    className="w-full h-8 text-xs font-semibold rounded-md bg-[#020f14] border border-cyan-400/30 text-cyan-400 flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Guardar notas paciente
                  </button>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-cyan-500/5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Notas de esta conversación
                  </label>
                  <textarea
                    value={notasConv}
                    onChange={e => setNotasConv(e.target.value)}
                    rows={2}
                    className="w-full text-xs rounded-md bg-[#020f14] border border-cyan-500/10 p-2 text-white focus:outline-none"
                    placeholder="Contexto o recado rápido..."
                  />
                  <button
                    onClick={saveNotasConv}
                    className="w-full h-8 text-xs font-semibold rounded-md bg-[#020f14] border border-cyan-400/30 text-cyan-400 flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Guardar recado
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConversacionesView;
