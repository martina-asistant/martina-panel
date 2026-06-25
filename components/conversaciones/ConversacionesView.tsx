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
  Trash2,
  MoreVertical
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
import AudioBubble from '@/components/conversaciones/AudioBubble';
import AttachmentBubble from '@/components/conversaciones/AttachmentBubble';
import {
  getPatientByPacienteId,
  updatePatientNotas
} from '@/lib/repos/patients.repo';

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

const getInicialEmisor = (m: MensajeWhatsapp) => {
  const emisor = String(m.tipo_emisor || m.direccion || '').toLowerCase();

  if (
    emisor.includes('recepcion') ||
    emisor.includes('recepción')
  ) {
    return 'R';
  }

  return 'M';
};

const isAudioMessage = (contenido?: string | null) => {
  if (!contenido) return false;

  const value = contenido.trim().toLowerCase();

  return (
    value.startsWith('audio_') &&
    (
      value.endsWith('.webm') ||
      value.endsWith('.ogg') ||
      value.endsWith('.mp3') ||
      value.endsWith('.m4a') ||
      value.endsWith('.wav')
    )
  );
};

const getAudioUrl = (contenido?: string | null) => {
  if (!contenido) return '';

  // CASO 1: ya viene una URL completa
  if (contenido.startsWith('http://') || contenido.startsWith('https://')) {
    return contenido;
  }

  // CASO 2: de momento solo tenemos el nombre del archivo.
  // Cuando conectemos storage real, aquí montaremos la URL pública/firma.
  return contenido;
};

const isAttachmentMessage = (m: MensajeWhatsapp) => {
  const mime = String((m as any).mime_type || '').toLowerCase();
  const tipo = String(m.tipo_mensaje || '').toLowerCase();
  const url = String((m as any).url_archivo || '').trim();
  const contenido = String(m.contenido_texto || '').trim().toLowerCase();

  if (tipo === 'audio' || isAudioMessage(m.contenido_texto)) return false;

  if (mime) return true;
  if (tipo === 'archivo' || tipo === 'imagen' || tipo === 'documento') return true;
  if (url) return true;

  return (
    contenido.endsWith('.pdf') ||
    contenido.endsWith('.doc') ||
    contenido.endsWith('.docx') ||
    contenido.endsWith('.jpg') ||
    contenido.endsWith('.jpeg') ||
    contenido.endsWith('.png') ||
    contenido.endsWith('.webp')
  );
};

const getAttachmentFileName = (m: MensajeWhatsapp) => {
  const nombre = (m as any).nombre_archivo || (m as any).file_name;
  if (nombre) return String(nombre);

  const contenido = String(m.contenido_texto || '').trim();
  if (contenido) return contenido;

  const url = String((m as any).url_archivo || '').trim();
  if (!url) return 'Archivo';

  try {
    return decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'Archivo');
  } catch {
    return 'Archivo';
  }
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
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [userEmail, setUserEmail] = useState<string>('demo@martina.local');

  const [mostrarListaMovil, setMostrarListaMovil] = useState(false);
  const [mostrarFichaMovil, setMostrarFichaMovil] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const mensajesEndRef = useRef<HTMLDivElement | null>(null);
  const mensajesScrollRef = useRef<HTMLDivElement | null>(null);
  const mensajesScrollDesktopRef = useRef<HTMLDivElement | null>(null); // nuevo para desktop

  const [grabandoAudio, setGrabandoAudio] = useState(false);
const [enviandoAudio, setEnviandoAudio] = useState(false);
const [audioPreviewFile, setAudioPreviewFile] = useState<File | null>(null);
const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
const [reproduciendoPreview, setReproduciendoPreview] = useState(false);

const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
const [menuMensajeId, setMenuMensajeId] = useState<string | null>(null);
const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
const [segundosGrabacion, setSegundosGrabacion] = useState(0);

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
      setNotasPaciente('');
      setNotasConv('');
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
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.removeAttribute('src');
      audioPreviewRef.current.load();
    }
  };
}, []);

  useEffect(() => {
  if (!grabandoAudio) {
    setSegundosGrabacion(0);
    return;
  }

  const interval = window.setInterval(() => {
    setSegundosGrabacion(prev => prev + 1);
  }, 1000);

  return () => window.clearInterval(interval);
}, [grabandoAudio]);

  useEffect(() => {
  const timeout = window.setTimeout(() => {
    const el = mensajesScrollRef.current;

    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, 150);

  return () => window.clearTimeout(timeout);
}, [mensajes.length, selectedId]);

  useEffect(() => {
  const timeout = window.setTimeout(() => {
    const el = mensajesScrollDesktopRef.current;

    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, 200);

  return () => window.clearTimeout(timeout);
}, [mensajes.length, selectedId]);

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

    const visibles = updated.filter(
      c => c.estado_visual !== 'gestionada'
    );

    setConvs(visibles);
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

    const actualizado = await updatePatientNotas(
      paciente.id,
      notasPaciente
    );

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

    const texto = nuevoMensaje.trim();

    const res = await enviarMensajePanelWhatsapp({
      conversationId: selected.id,
      telefono: selected.telefono_e164 || selected.telefono || '',
      mensaje: texto
    });

    if (!res.ok) {
      toast.error(res.error || 'No se ha podido enviar el mensaje');
      return;
    }

    setNuevoMensaje('');
    setMensajes(await listMensajesByConversation(selected.id));
    toast.success('Mensaje enviado');
  };

  const enviarAdjunto = async (file: File) => {
    if (!selected || !file) return;

    const telefono = selected.telefono_e164 || selected.telefono || '';

    if (!telefono) {
      toast.error('Esta conversación no tiene teléfono válido');
      return;
    }

    const res = await enviarAdjuntoPanelWhatsapp({
      conversationId: selected.id,
      telefono,
      file
    });

    if (!res.ok) {
      toast.error(res.error || 'No se ha podido enviar el adjunto');
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setMensajes(await listMensajesByConversation(selected.id));
    toast.success('Adjunto enviado');
  };

  const limpiarPreviewAudio = () => {
  const urlToRevoke = audioPreviewUrl;

  if (audioPreviewRef.current) {
    audioPreviewRef.current.pause();
    audioPreviewRef.current.removeAttribute('src');
    audioPreviewRef.current.load();
  }

  setAudioPreviewFile(null);
  setAudioPreviewUrl(null);
  setReproduciendoPreview(false);

  if (urlToRevoke) {
    window.setTimeout(() => {
      URL.revokeObjectURL(urlToRevoke);
    }, 500);
  }
};

  const enviarAudio = async (audioFile: File) => {
    if (!selected || !audioFile) return;

    const telefono = selected.telefono_e164 || selected.telefono || '';

    if (!telefono) {
      toast.error('Esta conversación no tiene teléfono válido');
      return;
    }

    setEnviandoAudio(true);

    try {
      const res = await enviarAudioPanelWhatsapp({
        conversationId: selected.id,
        telefono,
        audio: audioFile
      });

      if (!res.ok) {
        toast.error(res.error || 'No se ha podido enviar el audio');
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

    const mimeType = 'audio/webm';
    const mediaRecorder = new MediaRecorder(stream);

    audioChunksRef.current = [];
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, {
        type: mimeType
      });

      const audioFile = new File(
        [blob],
        `audio_${Date.now()}.webm`,
        { type: mimeType }
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

  const formatAudioDuration = (seconds?: number) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';

  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);

  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const eliminarMensaje = async (mensajeId: string) => {
  setMensajes(prev => prev.filter(m => m.id !== mensajeId));
  setMenuMensajeId(null);

  const supa = createClient();

  if (!supa) {
    toast.error('Supabase no está configurado');
    return;
  }

  const { error } = await supa
    .from('mensajes_whatsapp')
    .delete()
    .eq('id', mensajeId);

  if (error) {
    console.error('Error eliminando mensaje:', error);
    toast.error('No se ha podido eliminar de Supabase');
    return;
  }

  toast.success('Mensaje eliminado');
};
  const formatAudioTime = (seconds?: number) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';

  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);

  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const toggleAudioMessage = async (id: string) => {
  const audio = audioRefs.current[id];

  if (!audio) {
    toast.error('Audio no disponible');
    return;
  }

  try {
    if (audioPlayingId && audioPlayingId !== id) {
      const previous = audioRefs.current[audioPlayingId];
      if (previous) previous.pause();
    }

    if (audio.ended) {
      audio.currentTime = 0;
    }

    if (audio.paused) {
      await audio.play();
      setAudioPlayingId(id);
    } else {
      audio.pause();
      setAudioPlayingId(null);
    }
  } catch (error) {
    console.error('ERROR PLAY AUDIO', {
      error,
      src: audio.currentSrc || audio.src,
      readyState: audio.readyState,
      duration: audio.duration
    });

    toast.error('No se ha podido reproducir el audio');
  }
};

  const guardarDuracionAudio = (id: string, audio: HTMLAudioElement) => {
  const duration = audio.duration;

  if (Number.isFinite(duration) && duration > 0) {
    setAudioDurations(prev => ({
      ...prev,
      [id]: duration
    }));
  }
};

  return (
    <div className="h-full flex bg-[#02141B] text-white overflow-hidden">
      <div className="hidden lg:flex h-full w-full">
      <div className="w-[28%] min-w-[280px] max-w-[340px] border-r border-cyan-500/15 bg-[#03111A] flex flex-col shrink-0 min-h-0">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-2xl font-semibold tracking-[-0.015em] scale-x-[0.97] origin-left bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent mb-1">
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

        <div className="flex-1 min-h-0 overflow-y-auto">
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
            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F8FBFC] text-[#06111A] shadow-[0_0_25px_rgba(14,124,139,.08)]">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Selecciona una conversación
          </div>
        ) : (
          <>
            <div className="relative z-10 bg-[#F8FBFC] px-8 py-5 border-b border-cyan-100 shadow-[0_12px_30px_rgba(14,124,139,.08)] shrink-0">
              <button
                onClick={doCerrar}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white bg-[linear-gradient(180deg,#214955_0%,#163C46_100%)] border border-cyan-300/15 shadow-[0_0_0_3px_rgba(34,211,238,.10),0_0_18px_rgba(34,211,238,.25)] hover:scale-105 transition-all z-20"
              >
                <span className="text-[12px] leading-[1] flex items-center justify-center translate-y-[-1px]">✕</span>
              </button>

              <div className="w-full rounded-3xl border border-[#6FD7E2]/35 bg-[linear-gradient(180deg,#0F2C35_0%,#163C46_100%)] px-8 py-4 shadow-[0_0_34px_rgba(34,211,238,.18),0_16px_32px_rgba(14,124,139,.14),inset_0_1px_0_rgba(255,255,255,.06)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-white">
                      {selected.nombre_paciente || formatTelefono(selected.telefono_e164)}
                    </div>

                    <div className="text-xs text-cyan-100/75">
                      {formatTelefono(selected.telefono_e164)} · {selected.motivo || 'Sin motivo'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={doTomar}
                      className="bg-cyan-50 border-cyan-300/35 text-cyan-700 hover:bg-cyan-100 whitespace-nowrap"
                    >
                      Tomar conversación
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={doDevolver}
                      className="bg-cyan-50 border-cyan-300/35 text-cyan-700 hover:bg-cyan-100 whitespace-nowrap"
                    >
                      Devolver a Martina
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div
  ref={mensajesScrollDesktopRef}
  className="flex-1 min-h-0 overflow-y-auto px-8 py-7 space-y-4 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.04),#F8FBFC_45%)] flex flex-col"
>
              {mensajes.map(m => {
                const isPaciente =
                  m.tipo_emisor === 'paciente' ||
                  m.direccion === 'entrante';
            
            const audioSrc = m.url_archivo || getAudioUrl(m.contenido_texto);
  const isAttachment = isAttachmentMessage(m);
const attachmentName = getAttachmentFileName(m);

                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex',
                      isPaciente ? 'justify-start' : 'justify-end'
                    )}
                  >
                    <div
                      className={cn(
                        'w-fit max-w-[72%] rounded-2xl pl-4 pr-2 py-2 text-sm shadow-sm',
                        isPaciente
                          ? 'bg-white border border-slate-200 text-[#06111A] rounded-bl-sm'
                          : 'bg-[#D9F7FA] border border-[#B6EAEF] text-[#184B53] rounded-br-sm shadow-[0_0_12px_rgba(34,211,238,.08)]'
                      )}
                    >
                    {(m.tipo_mensaje === 'audio' || isAudioMessage(m.contenido_texto)) ? (
  <>
    <AudioBubble
      src={audioSrc}
      onDelete={() => eliminarMensaje(m.id)}
    />

    <div className="text-[10px] mt-2 text-right whitespace-nowrap text-cyan-900/60">
      {formatTime(m.created_at)} {!isPaciente && getInicialEmisor(m)}
    </div>
  </>
) : isAttachment ? (
  <>
    <AttachmentBubble
      fileName={attachmentName}
      url={(m as any).url_archivo || null}
      mimeType={(m as any).mime_type || null}
      onDelete={() => eliminarMensaje(m.id)}
    />

    <div className="text-[10px] mt-2 text-right whitespace-nowrap text-cyan-900/60">
      {formatTime(m.created_at)} {!isPaciente && getInicialEmisor(m)}
    </div>
  </>
) : (
  <div className="relative pr-7">
    <button
      type="button"
      onClick={() => setMenuMensajeId(menuMensajeId === m.id ? null : m.id)}
      className="absolute top-[2px] right-1 w-4 h-4 rounded-full text-cyan-900/45 hover:text-cyan-900 hover:bg-cyan-100 flex items-center justify-center z-20"
      title="Opciones mensaje"
    >
      <MoreVertical className="w-4 h-4" />
    </button>

    {menuMensajeId === m.id && (
      <div className="absolute top-5 right-0 z-50 w-36 rounded-xl border border-cyan-200 bg-white shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={() => eliminarMensaje(m.id)}
          className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
        >
          Eliminar mensaje
        </button>
      </div>
    )}

    <div className="max-w-full whitespace-pre-wrap break-words leading-snug">
      {m.contenido_texto || ''}
      <span className="float-right ml-2 mt-[3px] text-[10px] whitespace-nowrap text-cyan-900/45">
        {formatTime(m.created_at)} {!isPaciente && getInicialEmisor(m)}
      </span>
    </div>
  </div>
)}
                    </div>
                  </div>
                );
              })}

              {mensajes.length === 0 && (
                <div className="text-center text-sm text-slate-400 py-8">
                  Sin mensajes
                </div>
              )}
              
              <div ref={mensajesEndRef} />
            </div>

            <div className="px-6 py-4 border-t border-[#6FD7E2]/20 bg-[#F8FBFC] shadow-[0_-6px_20px_rgba(14,124,139,.08)] shrink-0">
              <div className="flex items-center gap-3 rounded-2xl border border-[#6FD7E2]/35 bg-[linear-gradient(180deg,#0F2C35_0%,#163C46_100%)] p-3 shadow-[0_-10px_35px_rgba(34,211,238,.14),0_14px_30px_rgba(34,211,238,.10),inset_0_1px_0_rgba(255,255,255,.05)]">
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
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#17C7D6] to-[#0E7C8B] hover:scale-[1.03] shadow-[0_0_20px_rgba(14,124,139,.35)] text-white flex items-center justify-center transition-all disabled:opacity-40"
                  title="Adjuntar archivo"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {audioPreviewUrl ? (
                  <div className="flex-1 h-10 rounded-xl bg-white border border-cyan-100 px-2 flex items-center gap-2 min-w-0">
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
                      className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center disabled:opacity-40"
                      title="Borrar audio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={togglePreviewAudio}
                      disabled={enviandoAudio}
                      className="h-8 w-8 rounded-lg text-cyan-800 hover:bg-cyan-50 flex items-center justify-center disabled:opacity-40"
                      title={reproduciendoPreview ? 'Pausar audio' : 'Escuchar audio'}
                    >
                      {reproduciendoPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <div className="min-w-0 flex-1 truncate text-sm text-slate-700">
                      Audio listo para enviar
                    </div>

                    <button
                      type="button"
                      onClick={enviarAudioPreview}
                      disabled={enviandoAudio}
                      className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#17C7D6] to-[#0E7C8B] text-white flex items-center justify-center disabled:opacity-40"
                      title="Enviar audio"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder={
  grabandoAudio
    ? `Grabando audio... ${formatAudioTime(segundosGrabacion)}`
    : 'Escribe un mensaje...'
}
                      value={nuevoMensaje}
                      onChange={(e) => setNuevoMensaje(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!grabandoAudio) enviarMensaje();
                        }
                      }}
                      disabled={grabandoAudio}
                      className="flex-1 h-10 rounded-xl bg-white border border-cyan-100 px-4 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:ring-cyan-400 disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={enviarMensaje}
                      disabled={!nuevoMensaje.trim() || grabandoAudio}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#17C7D6] to-[#0E7C8B] hover:from-[#25D6E6] hover:to-[#118FA0] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_24px_rgba(14,124,139,.45)] text-white flex items-center justify-center"
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
                      'w-10 h-10 rounded-xl text-white flex items-center justify-center transition-all',
                      grabandoAudio
                        ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,.35)]'
                        : 'bg-gradient-to-br from-[#17C7D6] to-[#0E7C8B] hover:scale-[1.03] shadow-[0_0_20px_rgba(14,124,139,.35)]'
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

      <div className="w-[24%] min-w-[280px] max-w-[340px] border-l border-cyan-500/15 bg-[#03111A] overflow-y-auto shrink-0 min-h-0">
        {!selected ? null : (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[radial-gradient(circle_at_35%_30%,#1A6C78_0%,#0D4450_45%,#072B34_100%)] border-2 border-cyan-200/80 flex items-center justify-center text-lg font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,.65),0_0_28px_rgba(34,211,238,.30),inset_0_0_12px_rgba(255,255,255,.18)]">
                {(paciente?.nombre_completo || selected.nombre_paciente || '?')
                  .split(' ')
                  .map(s => s[0])
                  .slice(0, 2)
                  .join('')}
              </div>

              <div className="min-w-0">
                <div className="font-semibold truncate text-white">
                  {paciente?.nombre_completo || selected.nombre_paciente || 'Sin nombre registrado'}
                </div>

                <div className="text-xs text-cyan-100/60">
                  {formatTelefono(paciente?.telefono || selected.telefono_e164) || 'Sin teléfono registrado'}
                </div>
              </div>
            </div>

            {paciente?.alerta_urgencia && (
              <div className="text-xs px-3 py-2 rounded-xl bg-red-500/10 text-red-100 border border-red-400/25">
                Posible urgencia
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-cyan-100/50 mb-1">Última cita</div>
                <div className="font-medium text-white">
                  {formatDate(paciente?.ultima_cita_fecha)}
                </div>
                <div className="text-cyan-100/50">
                  {paciente?.ultima_cita_motivo || '—'}
                </div>
              </div>

              <div>
                <div className="text-cyan-100/50 mb-1">Próxima cita</div>
                <div className="font-medium text-white">
                  {formatDate(paciente?.proxima_cita_fecha)}
                </div>
                <div className="text-cyan-100/50">
                  {paciente?.proxima_cita_motivo || '—'}
                </div>
              </div>
            </div>

            {Array.isArray(paciente?.etiquetas) && paciente.etiquetas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {paciente?.etiquetas.map(t => (
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
                onClick={saveNotasConv}
                className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar recado
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
      
      <div className="lg:hidden h-full">
    <div className="h-full flex flex-col bg-[#F8FBFC] text-[#06111A]">
  {/* OVERLAY LISTA */}
  {mostrarListaMovil && (
    <div
      className="fixed inset-0 z-40 bg-black/45"
      onClick={() => setMostrarListaMovil(false)}
    />
  )}

  {/* OVERLAY FICHA */}
  {mostrarFichaMovil && (
    <div
      className="fixed inset-0 z-40 bg-black/45"
      onClick={() => setMostrarFichaMovil(false)}
    />
  )}

  {/* DRAWER LISTA CONVERSACIONES */}
  <div
    className={cn(
      'fixed inset-y-0 left-0 z-50 w-[88%] max-w-[340px] bg-[#03111A] text-white border-r border-cyan-500/15 flex flex-col transition-transform duration-300',
      mostrarListaMovil ? 'translate-x-0' : '-translate-x-full'
    )}
  >
    <div className="px-5 pt-5 pb-4 border-b border-cyan-500/15">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.015em] bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent">
            Conversaciones
          </h2>
          <p className="text-xs text-cyan-100/55">WhatsApp</p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarListaMovil(false)}
          className="w-8 h-8 rounded-xl bg-white/5 border border-cyan-400/20 text-cyan-50 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300/70" />
          <Input
            placeholder="Buscar paciente, teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-white/5 border-cyan-500/20 text-white placeholder:text-cyan-100/45 focus-visible:ring-cyan-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {filtros.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'text-[12px] px-2.5 py-[6px] rounded-full border transition-colors whitespace-nowrap shrink-0',
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
            onClick={() => {
              setSelectedId(c.id);
              setMostrarListaMovil(false);
            }}
            className={cn(
              'w-full text-left px-4 py-4 border-b border-cyan-500/10 transition-all',
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

  {/* DRAWER FICHA PACIENTE */}
  <div
    className={cn(
      'fixed inset-y-0 right-0 z-50 w-[88%] max-w-[360px] bg-[#03111A] text-white border-l border-cyan-500/15 overflow-y-auto transition-transform duration-300',
      mostrarFichaMovil ? 'translate-x-0' : 'translate-x-full'
    )}
  >
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b border-cyan-500/15 bg-[#03111A]">
      <div className="text-sm font-semibold text-white">Ficha paciente</div>

      <button
        type="button"
        onClick={() => setMostrarFichaMovil(false)}
        className="w-8 h-8 rounded-xl bg-white/5 border border-cyan-400/20 text-cyan-50 flex items-center justify-center"
      >
        <X className="w-4 h-4" />
      </button>
    </div>

    {selected && (
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[radial-gradient(circle_at_35%_30%,#1A6C78_0%,#0D4450_45%,#072B34_100%)] border-2 border-cyan-200/80 flex items-center justify-center text-lg font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,.65),0_0_28px_rgba(34,211,238,.30),inset_0_0_12px_rgba(255,255,255,.18)]">
            {(paciente?.nombre_completo || selected.nombre_paciente || '?')
              .split(' ')
              .map(s => s[0])
              .slice(0, 2)
              .join('')}
          </div>

          <div className="min-w-0">
            <div className="font-semibold truncate text-white">
              {paciente?.nombre_completo || selected.nombre_paciente || 'Sin nombre registrado'}
            </div>

            <div className="text-xs text-cyan-100/60">
              {formatTelefono(paciente?.telefono || selected.telefono_e164) || 'Sin teléfono registrado'}
            </div>
          </div>
        </div>

        {paciente?.alerta_urgencia && (
          <div className="text-xs px-3 py-2 rounded-xl bg-red-500/10 text-red-100 border border-red-400/25">
            Posible urgencia
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-cyan-100/50 mb-1">Última cita</div>
            <div className="font-medium text-white">
              {formatDate(paciente?.ultima_cita_fecha)}
            </div>
            <div className="text-cyan-100/50">
              {paciente?.ultima_cita_motivo || '—'}
            </div>
          </div>

          <div>
            <div className="text-cyan-100/50 mb-1">Próxima cita</div>
            <div className="font-medium text-white">
              {formatDate(paciente?.proxima_cita_fecha)}
            </div>
            <div className="text-cyan-100/50">
              {paciente?.proxima_cita_motivo || '—'}
            </div>
          </div>
        </div>

        {Array.isArray(paciente?.etiquetas) && paciente.etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {paciente?.etiquetas.map(t => (
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
            onClick={saveNotasConv}
            className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar recado
          </Button>
        </div>
      </div>
    )}
  </div>

  {/* CHAT MÓVIL */}
  {!selected ? (
    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm px-6 text-center">
      Selecciona una conversación
    </div>
  ) : (
    <>
           <div className="relative z-10 bg-[#F8FBFC] px-3 pt-6 pb-3 border-b border-cyan-100 shadow-[0_12px_30px_rgba(14,124,139,.08)] shrink-0">
        <button
          onClick={doCerrar}
          className="absolute top-1 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white bg-[linear-gradient(180deg,#214955_0%,#163C46_100%)] border border-cyan-300/20 shadow-[0_0_0_3px_rgba(34,211,238,.10),0_0_14px_rgba(34,211,238,.22)] hover:scale-105 transition-all z-30"
        >
          <span className="text-[12px] leading-[1] flex items-center justify-center translate-y-[-1px]">✕</span>
        </button>

        <div className="w-[97%] mx-auto rounded-3xl border border-[#6FD7E2]/45 bg-[linear-gradient(180deg,#0F2C35_0%,#163C46_100%)] px-3 py-3 shadow-[0_0_28px_rgba(34,211,238,.16),0_12px_26px_rgba(14,124,139,.12),inset_0_1px_0_rgba(255,255,255,.06)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarListaMovil(true)}
              className="w-8 h-8 rounded-xl bg-white/5 border border-[#6FD7E2]/55 text-cyan-100 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(34,211,238,.12)] mr-1"
              title="Abrir conversaciones"
            >
              <span className="text-2xl leading-none -translate-y-[1px]">›</span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white truncate leading-tight">
                {selected.nombre_paciente || formatTelefono(selected.telefono_e164)}
              </div>

              <div className="text-[11px] text-cyan-100/75 truncate mt-1">
                {formatTelefono(selected.telefono_e164)} · {selected.motivo || 'Sin motivo'}
              </div>
            </div>

            <div className="flex flex-col gap-1 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={doTomar}
                className="h-6 min-w-[74px] px-2 bg-cyan-50 border-cyan-300/40 text-cyan-700 hover:bg-cyan-100 whitespace-nowrap text-[10px] leading-none"
              >
                Tomar
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={doDevolver}
                className="h-6 min-w-[74px] px-2 bg-cyan-50 border-cyan-300/40 text-cyan-700 hover:bg-cyan-100 whitespace-nowrap text-[10px] leading-none"
              >
                Devolver
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setMostrarFichaMovil(true)}
              className="w-8 h-8 rounded-xl bg-white/5 border border-[#6FD7E2]/55 text-cyan-100 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(34,211,238,.12)] ml-1"
              title="Ver ficha paciente"
            >
              <span className="text-2xl leading-none -translate-y-[1px]">‹</span>
            </button>
          </div>
        </div>
      </div>

      <div
  ref={mensajesScrollRef}
  className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-4 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.04),#F8FBFC_45%)]"
>
        {mensajes.map(m => {
          const isPaciente =
            m.tipo_emisor === 'paciente' ||
            m.direccion === 'entrante';

          const audioSrc = m.url_archivo || getAudioUrl(m.contenido_texto);
  const isAttachment = isAttachmentMessage(m);
const attachmentName = getAttachmentFileName(m);

          return (
            <div
              key={m.id}
              className={cn(
                'flex',
                isPaciente ? 'justify-start' : 'justify-end'
              )}
            >
              <div
                className={cn(
                  'w-fit max-w-[88%] rounded-2xl pl-4 pr-2 py-2 text-sm shadow-sm',
                  isPaciente
                    ? 'bg-white border border-slate-200 text-[#06111A] rounded-bl-sm'
                    : 'bg-[#D9F7FA] border border-[#B6EAEF] text-[#184B53] rounded-br-sm shadow-[0_0_12px_rgba(34,211,238,.08)]'
                )}
              >
                
{(m.tipo_mensaje === 'audio' || isAudioMessage(m.contenido_texto)) ? (
  <>
    <AudioBubble
      src={audioSrc}
      onDelete={() => eliminarMensaje(m.id)}
    />

    <div className="text-[10px] mt-2 text-right whitespace-nowrap text-cyan-900/60">
      {formatTime(m.created_at)} {!isPaciente && getInicialEmisor(m)}
    </div>
  </>
) : isAttachment ? (
  <>
    <AttachmentBubble
      fileName={attachmentName}
      url={(m as any).url_archivo || null}
      mimeType={(m as any).mime_type || null}
      onDelete={() => eliminarMensaje(m.id)}
    />

    <div className="text-[10px] mt-2 text-right whitespace-nowrap text-cyan-900/60">
      {formatTime(m.created_at)} {!isPaciente && getInicialEmisor(m)}
    </div>
  </>
) : (
  <div className="relative pr-7">
    <button
      type="button"
      onClick={() => setMenuMensajeId(menuMensajeId === m.id ? null : m.id)}
      className="absolute top-[2px] right-1 w-4 h-4 rounded-full text-cyan-900/45 hover:text-cyan-900 hover:bg-cyan-100 flex items-center justify-center z-20"
      title="Opciones mensaje"
    >
      <MoreVertical className="w-4 h-4" />
    </button>

    {menuMensajeId === m.id && (
      <div className="absolute top-5 right-0 z-50 w-36 rounded-xl border border-cyan-200 bg-white shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={() => eliminarMensaje(m.id)}
          className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
        >
          Eliminar mensaje
        </button>
      </div>
    )}

    <div className="max-w-full whitespace-pre-wrap break-words leading-snug">
      {m.contenido_texto || ''}
      <span className="float-right ml-2 mt-[3px] text-[10px] whitespace-nowrap text-cyan-900/45">
        {formatTime(m.created_at)} {!isPaciente && getInicialEmisor(m)}
      </span>
    </div>
  </div>
)}
              </div>
            </div>
          );
        })}

        {mensajes.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-8">
            Sin mensajes
          </div>
        )}

        <div ref={mensajesEndRef} />
      </div>

      <div className="px-3 py-3 border-t border-[#6FD7E2]/20 bg-[#F8FBFC] shadow-[0_-6px_20px_rgba(14,124,139,.08)] shrink-0">
        <div className="flex items-center gap-2 rounded-2xl border border-[#6FD7E2]/35 bg-[linear-gradient(180deg,#0F2C35_0%,#163C46_100%)] p-2.5 shadow-[0_-10px_35px_rgba(34,211,238,.14),0_14px_30px_rgba(34,211,238,.10),inset_0_1px_0_rgba(255,255,255,.05)]">
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
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#17C7D6] to-[#0E7C8B] shadow-[0_0_20px_rgba(14,124,139,.35)] text-white flex items-center justify-center transition-all disabled:opacity-40 shrink-0"
            title="Adjuntar archivo"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {audioPreviewUrl ? (
            <div className="flex-1 h-10 rounded-xl bg-white border border-cyan-100 px-2 flex items-center gap-2 min-w-0">
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
                className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center disabled:opacity-40"
                title="Borrar audio"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={togglePreviewAudio}
                disabled={enviandoAudio}
                className="h-8 w-8 rounded-lg text-cyan-800 hover:bg-cyan-50 flex items-center justify-center disabled:opacity-40"
                title={reproduciendoPreview ? 'Pausar audio' : 'Escuchar audio'}
              >
                {reproduciendoPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <div className="min-w-0 flex-1 truncate text-sm text-slate-700">
                Audio listo para enviar
              </div>

              <button
                type="button"
                onClick={enviarAudioPreview}
                disabled={enviandoAudio}
                className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#17C7D6] to-[#0E7C8B] text-white flex items-center justify-center disabled:opacity-40"
                title="Enviar audio"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Input
                placeholder={
                  grabandoAudio
                    ? `Grabando audio... ${formatAudioTime(segundosGrabacion)}`
                    : 'Escribe un mensaje...'
                }
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!grabandoAudio) enviarMensaje();
                  }
                }}
                disabled={grabandoAudio}
                className="flex-1 h-10 rounded-xl bg-white border border-cyan-100 px-4 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:ring-cyan-400 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={enviarMensaje}
                disabled={!nuevoMensaje.trim() || grabandoAudio}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#17C7D6] to-[#0E7C8B] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_24px_rgba(14,124,139,.45)] text-white flex items-center justify-center shrink-0"
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
                'w-10 h-10 rounded-xl text-white flex items-center justify-center transition-all shrink-0',
                grabandoAudio
                  ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,.35)]'
                  : 'bg-gradient-to-br from-[#17C7D6] to-[#0E7C8B] shadow-[0_0_20px_rgba(14,124,139,.35)]'
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
  </div>
</div>
  );
};

export default ConversacionesView;
