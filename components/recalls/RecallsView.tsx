'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { createRecall, listRecalls, updateRecall } from '@/lib/repos/recalls.repo';
import type { Recall, EstadoRecall } from '@/lib/types/db.types';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

type Filtro = 'todos' | EstadoRecall;
type PatientOption = {
  id: string;
  paciente_id: string | null;
  nombre: string | null;
  apellidos: string | null;
  nombre_completo: string | null;
  telefono: string | null;
};


const filtros: { key: Filtro; label: string; color: string }[] = [
  { key: 'todos', label: 'Todos', color: 'bg-amber-400' },

  { key: 'pendiente_envio', label: 'Pendiente envío', color: 'bg-rose-300' },

  { key: 'enviado', label: 'Pendiente respuesta', color: 'bg-cyan-300' },

  { key: 'quiere_cita', label: 'En curso', color: 'bg-emerald-300' },

  { key: 'confirmada', label: 'Cita agendada', color: 'bg-green-400' },

  { key: 'pospuesta', label: 'Pospuestas', color: 'bg-red-400' },
];

const agendas = [
  { key: 'fede', nombre: 'Agenda Fede' },
  { key: 'celia', nombre: 'Agenda Celia' },
  { key: 'ana', nombre: 'Agenda Ana' },
];

const TIPOS_RECALL = [
  { label: 'MTO Periodontal 4 meses', value: 'Limpieza', meses: 4 },
  { label: 'MTO Periodontal 6 meses', value: 'Limpieza', meses: 6 },
  { label: 'MTO Periodontal 1 año', value: 'Limpieza', meses: 12 },
  { label: 'Revisión', value: 'Revisión', meses: null },
  { label: 'Revisión general', value: 'Revisión general', meses: null },
];

const getDuracionRecall = (motivo: string) => {
  if (motivo === 'Revisión') return 5;
  return 30;
};

const pad = (n: number) => String(n).padStart(2, '0');

const toInputDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toInputTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const buildISOFromDateTime = (date: string, time: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
};

const sumarMesesISO = (meses: number) => {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() + meses);
  fecha.setHours(10, 0, 0, 0);
  return fecha.toISOString();
};

const formatTelefono = (telefono?: string | null) => {
  if (!telefono) return '—';

  const clean = telefono.replace(/\D/g, '');
  const sinPrefijo =
    clean.startsWith('34') && clean.length >= 11 ? clean.slice(2) : clean;

  return sinPrefijo.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
};

const recallEstadoVisual = (
  estado: EstadoRecall | string | null | undefined
) => {
  if (estado === 'pendiente_envio') {
    return { label: 'Pendiente envío', color: 'bg-rose-300' };
  }

  if (estado === 'enviado') {
    return { label: 'Pendiente respuesta', color: 'bg-cyan-300' };
  }

  if (estado === 'quiere_cita') {
    return { label: 'En curso', color: 'bg-emerald-300' };
  }

  if (estado === 'confirmada') {
    return { label: 'Cita agendada', color: 'bg-green-400' };
  }

  if (estado === 'pospuesta') {
    return { label: 'Pospuesta', color: 'bg-red-400' };
  }

  return { label: 'Pendiente envío', color: 'bg-sky-300' };
};

const tipoRecallLabel = (tipo?: string | null) => {
  if (!tipo) return '—';

  if (tipo === 'Limpieza') return 'MTO Periodontal';
  if (tipo === 'Revisión') return 'Revisión';
  if (tipo === 'Revisión general') return 'Revisión general';

  if (tipo === 'mto_periodontal') return 'MTO Periodontal';
  if (tipo === 'revision_general') return 'Revisión general';

  return tipo;
};

const RecallsView = () => {
  const [items, setItems] = useState<Recall[]>([]);
  const [filter, setFilter] = useState<Filtro>('todos');

  const [usuarioPanel, setUsuarioPanel] = useState('panel');
  const [mostrarInsertarRecall, setMostrarInsertarRecall] = useState(false);
  const [mostrarTiposRecall, setMostrarTiposRecall] = useState(false);
  const [mostrarAgendaRecall, setMostrarAgendaRecall] = useState(false);
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [mostrarResultadosPaciente, setMostrarResultadosPaciente] = useState(false);
  const [recallSeleccionado, setRecallSeleccionado] = useState<Recall | null>(null);
  const [modoEdicionRecall, setModoEdicionRecall] = useState(false);

  const [nuevoRecall, setNuevoRecall] = useState({
    paciente_id: '',
  nombre_paciente: '',
  telefono: '',
  motivo_recall: 'Limpieza',
  tipo_recall: 'MTO Periodontal',
  detalle_recall: '',
  fecha_recall: '',
  profesional: 'fede',
});

  const cargarRecalls = async () => {
    const data = await listRecalls();
    setItems(data);
  };

  useEffect(() => {
    cargarRecalls();
  }, []);

  useEffect(() => {
    const cargarUsuarioPanel = async () => {
      const supa = createClient();
      if (!supa) return;

      const {
        data: { user },
      } = await supa.auth.getUser();

      if (!user?.email) return;

      const { data } = await supa
        .from('usuarios_panel')
        .select('nombre')
        .eq('email', user.email)
        .single();

      setUsuarioPanel(data?.nombre || user.email);
    };

    cargarUsuarioPanel();
  }, []);

  useEffect(() => {
    const supa = createClient();
    if (!supa) return;

    const ch = supa
      .channel('recalls-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recalls' },
        async () => cargarRecalls()
      )
      .subscribe();

    return () => {
      supa.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
  const cargarPatients = async () => {
    const supa = createClient();
    if (!supa) return;

    const { data, error } = await supa
      .from('patients')
      .select('id, paciente_id, nombre, apellidos, nombre_completo, telefono')
      .order('nombre_completo', { ascending: true });

    if (error) {
      console.error('Error cargando pacientes:', error);
      return;
    }

    setPatients(data || []);
  };

  cargarPatients();
}, []);

  const guardarInsertarRecall = async () => {
  if (loadingGuardar) return;

  if (!nuevoRecall.nombre_paciente.trim() || !nuevoRecall.telefono.trim()) {
    console.error('Falta nombre o teléfono');
    return;
  }

  if (!nuevoRecall.fecha_recall) {
    console.error('Falta fecha recall');
    return;
  }

  setLoadingGuardar(true);

  try {
    const payload = {
      nombre_paciente: nuevoRecall.nombre_paciente.trim(),
      telefono: nuevoRecall.telefono.trim(),
      motivo_recall: nuevoRecall.motivo_recall,
      tipo_recall: nuevoRecall.tipo_recall,
      detalle_recall: nuevoRecall.detalle_recall,
      fecha_recall: nuevoRecall.fecha_recall,
      fecha_envio: null,
      profesional: nuevoRecall.profesional,
      origen: usuarioPanel,
      paciente_id: nuevoRecall.paciente_id || null,
      duracion_minutos: getDuracionRecall(nuevoRecall.motivo_recall),
      estado: 'pendiente_envio' as EstadoRecall,
    };

    const recallGuardado = recallSeleccionado
      ? await updateRecall(recallSeleccionado.id, {
          ...payload,
          numero_cambios: ((recallSeleccionado as any).numero_cambios || 0) + 1,
        })
      : await createRecall({
          ...payload,
          fecha_registro: new Date().toISOString(),
          numero_cambios: 0,
        });

    if (!recallGuardado) {
      console.error('Error guardando recall');
      return;
    }

    setMostrarInsertarRecall(false);
    setRecallSeleccionado(null);
    setModoEdicionRecall(false);
    setBusquedaPaciente('');
    setMostrarResultadosPaciente(false);

    setNuevoRecall({
      paciente_id: '',
      nombre_paciente: '',
      telefono: '',
      motivo_recall: 'Limpieza',
      tipo_recall: 'MTO Periodontal',
      detalle_recall: '',
      fecha_recall: '',
      profesional: 'fede',
    });

    await cargarRecalls();
  } catch (error) {
    console.error('Error guardando recall:', error);
  } finally {
    setLoadingGuardar(false);
  }
};

  const filtered = useMemo(() => {
    const data =
      filter === 'todos' ? items : items.filter((i) => i.estado === filter);

    return [...data].sort((a, b) => {
      const fechaA = a.fecha_recall ? new Date(a.fecha_recall).getTime() : 0;
      const fechaB = b.fecha_recall ? new Date(b.fecha_recall).getTime() : 0;
      return fechaA - fechaB;
    });
  }, [items, filter]);

  const pacientesFiltrados = patients.filter((patient) => {
  const texto =
  `${patient.nombre_completo || ''} ${patient.nombre || ''} ${patient.apellidos || ''} ${patient.telefono || ''}`
    .toLowerCase();
  return texto.includes(busquedaPaciente.toLowerCase());
});

  return (
    <div className="min-h-full overflow-y-auto p-8 bg-[#02141B] text-white">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-[-0.015em] origin-left inline-block bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
          Recalls
        </h1>

        <p className="text-sm text-cyan-100/55">
          Reactivación de pacientes
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {filtros.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'text-[12px] px-3.5 py-[7px] rounded-full border transition-all whitespace-nowrap',
                filter === f.key
                  ? 'bg-cyan-500/20 text-cyan-100 border-cyan-300/50 shadow-[0_0_18px_rgba(34,211,238,.22)]'
                  : 'bg-white/5 text-cyan-100/65 border-cyan-500/20 hover:bg-cyan-500/10 hover:text-white'
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full shadow-[0_0_12px_currentColor]',
                    f.color
                  )}
                />

                <span
                  className={cn(
                    f.key === 'todos'
                      ? 'font-bold uppercase'
                      : 'font-normal text-[13px] tracking-[-0.01em]'
                  )}
                >
                  {f.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setMostrarInsertarRecall(true)}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-400/10 px-3.5 py-[7px] text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,.14)] transition-all hover:bg-cyan-400/18 hover:border-cyan-200/70 whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          Insertar recall
        </button>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-[rgba(5,18,24,.78)] backdrop-blur-xl overflow-hidden shadow-[0_0_35px_rgba(34,211,238,.10)]">
        <table className="w-full text-sm">
          <thead className="bg-cyan-500/10 text-cyan-300/75 text-xs uppercase tracking-[0.18em]">
            <tr>
              <th className="text-left px-6 py-4 font-medium">Paciente</th>
              <th className="text-left px-6 py-4 font-medium">Teléfono</th>
              <th className="text-left px-6 py-4 font-medium">Tipo</th>
              <th className="text-left px-6 py-4 font-medium">Detalle</th>
              <th className="text-left px-6 py-4 font-medium">Fecha recall</th>
              <th className="text-left px-6 py-4 font-medium">Fecha envío</th>
              <th className="text-left px-6 py-4 font-medium">Estado</th>
              <th className="text-left px-6 py-4 font-medium">Próxima cita</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => {
              const lbl = recallEstadoVisual(r.estado);

              return (
                <tr
  key={r.id}
  onDoubleClick={() => {
  setRecallSeleccionado(r);
  setModoEdicionRecall(true);

  setNuevoRecall({
    paciente_id: r.paciente_id || '',
    nombre_paciente: r.nombre_paciente || r.nombre_completo || '',
    telefono: r.telefono || '',
    motivo_recall: r.motivo_recall || 'Limpieza',
    tipo_recall:
      r.tipo_recall ||
      tipoRecallLabel(r.motivo_recall || r.tipo),
    detalle_recall: r.detalle_recall || '',
    fecha_recall: r.fecha_recall || '',
    profesional: r.profesional || 'fede',
  });

  setBusquedaPaciente(
    r.nombre_paciente ||
    r.nombre_completo ||
    ''
  );

  setMostrarResultadosPaciente(false);
  setMostrarInsertarRecall(true);
}}
  className="border-t border-cyan-500/10 hover:bg-cyan-500/5 transition-colors cursor-pointer"
>
                  <td className="px-6 py-4 font-medium text-white">
                    {r.nombre_paciente || r.nombre_completo || '—'}
                  </td>

                  <td className="px-6 py-4 text-cyan-100/65">
                    {formatTelefono(r.telefono)}
                  </td>

                  <td className="px-6 py-4 text-cyan-100/80">
                    {r.tipo_recall || tipoRecallLabel(r.motivo_recall || r.tipo)}
                  </td>

                  <td className="px-6 py-4 text-cyan-100/65 max-w-[280px]">
                    <div className="line-clamp-2">
                      {r.detalle_recall || '—'}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-cyan-100/75">
                    {r.fecha_recall ? formatDate(r.fecha_recall) : '—'}
                  </td>

                  <td className="px-6 py-4 text-cyan-100/55">
                    {r.fecha_envio ? formatDate(r.fecha_envio) : '—'}
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,.10)]">
                      <span
                        className={cn(
                          'w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]',
                          lbl.color
                        )}
                      />

                      {lbl.label}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-cyan-100/65">
                    {r.proxima_cita_fecha ? (
                      <div>
                        <div>{formatDate(r.proxima_cita_fecha)}</div>
                        <div className="text-xs text-cyan-100/40">
                          {r.proxima_cita_motivo || ''}
                        </div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-10 text-center text-cyan-100/45"
                >
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarInsertarRecall && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm px-4 py-6">
          <div className="mx-auto w-full max-w-2xl rounded-3xl border border-cyan-300/45 bg-[#03111A]/95 overflow-visible shadow-[0_0_46px_rgba(34,211,238,.24)]">
            <div className="px-6 py-5 border-b border-cyan-300/20 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
  {modoEdicionRecall
    ? 'Editar recall'
    : 'Insertar recall'}
</h2>

                <p className="text-cyan-200 text-sm mt-1">
  {modoEdicionRecall
    ? `${nuevoRecall.nombre_paciente} · ${nuevoRecall.tipo_recall}`
    : `${nuevoRecall.nombre_paciente || 'Nuevo recall'}${nuevoRecall.tipo_recall ? ` · ${nuevoRecall.tipo_recall}` : ''}`}
</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={guardarInsertarRecall}
                  disabled={loadingGuardar}
                  className="text-cyan-200 hover:text-white text-2xl disabled:opacity-50"
                >
                  ✓
                </button>

                <button
                  onClick={() => setMostrarInsertarRecall(false)}
                  className="text-white/80 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
                    Fecha recall
                  </div>

                  <input
                    type="date"
                    value={
                      nuevoRecall.fecha_recall
                        ? toInputDate(nuevoRecall.fecha_recall)
                        : ''
                    }
                    onChange={(e) => {
                      const hora = nuevoRecall.fecha_recall
                        ? toInputTime(nuevoRecall.fecha_recall)
                        : '10:00';

                      setNuevoRecall({
                        ...nuevoRecall,
                        fecha_recall: buildISOFromDateTime(e.target.value, hora),
                      });
                    }}
                    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
                  />
                </div>

                <div>
                  <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
                    Hora envío
                  </div>

                  <input
                    type="time"
                    step={300}
                    value={
                      nuevoRecall.fecha_recall
                        ? toInputTime(nuevoRecall.fecha_recall)
                        : '10:00'
                    }
                    onChange={(e) => {
                      const fecha = nuevoRecall.fecha_recall
                        ? toInputDate(nuevoRecall.fecha_recall)
                        : toInputDate(new Date().toISOString());

                      setNuevoRecall({
                        ...nuevoRecall,
                        fecha_recall: buildISOFromDateTime(fecha, e.target.value),
                      });
                    }}
                    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-10 items-start">
  <div className="relative overflow-visible min-w-0">
    <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
      Paciente
    </div>

    <input
      placeholder="Buscar paciente"
      value={busquedaPaciente}
      onChange={(e) => {
        setBusquedaPaciente(e.target.value);
        setMostrarResultadosPaciente(true);
        setNuevoRecall({
          ...nuevoRecall,
          paciente_id: '',
          nombre_paciente: e.target.value,
        });
      }}
      className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
    />

    {mostrarResultadosPaciente && busquedaPaciente && pacientesFiltrados.length > 0 && (
      <div className="absolute left-0 top-[calc(100%+8px)] z-[120] max-h-44 w-full overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.18)]">
        {pacientesFiltrados.slice(0, 8).map((patient) => {
          const nombreCompleto =
            patient.nombre_completo ||
            `${patient.nombre || ''} ${patient.apellidos || ''}`.trim();

          return (
            <button
              key={patient.id}
              type="button"
              onClick={() => {
                setMostrarResultadosPaciente(false);

                setNuevoRecall({
                  ...nuevoRecall,
                  paciente_id: patient.paciente_id || patient.id,
                  nombre_paciente: nombreCompleto,
                  telefono: patient.telefono || '',
                });

                setBusquedaPaciente(nombreCompleto);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
            >
              <div>{nombreCompleto}</div>
              <div className="text-xs text-cyan-100/60">{patient.telefono}</div>
            </button>
          );
        })}
      </div>
    )}
  </div>

  <div>
    <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
      Teléfono
    </div>

    <input
      value={nuevoRecall.telefono}
      onChange={(e) =>
        setNuevoRecall({
          ...nuevoRecall,
          telefono: e.target.value,
        })
      }
      className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
    />
  </div>
</div>

<div className="relative overflow-visible">
  <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
    Tipo
  </div>

  <button
    type="button"
    onClick={() => setMostrarTiposRecall(!mostrarTiposRecall)}
    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
  >
    <span>{nuevoRecall.tipo_recall || tipoRecallLabel(nuevoRecall.motivo_recall)}</span>

    <svg
      className={`w-4 h-4 text-cyan-200 transition-transform ${
        mostrarTiposRecall ? 'rotate-180' : ''
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {mostrarTiposRecall && (
    <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full max-h-56 overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
      {TIPOS_RECALL.map((tipo) => (
        <button
  key={tipo.value}
  type="button"
  onClick={() => {
    setNuevoRecall({
      ...nuevoRecall,
    motivo_recall: tipo.value,
    tipo_recall: tipo.label,
    fecha_recall: tipo.meses
      ? sumarMesesISO(tipo.meses)
      : '',
  });

    setMostrarTiposRecall(false);
  }}
  className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
>
  {tipo.label}
</button>
      ))}
    </div>
  )}
</div>

              <div>
                <div className="text-cyan-300 text-xs uppercase tracking-wider mb-2 font-bold">
                  Detalle recall
                </div>

                <textarea
                  value={nuevoRecall.detalle_recall}
                  onChange={(e) =>
                    setNuevoRecall({
                      ...nuevoRecall,
                      detalle_recall: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full min-h-[86px] rounded-2xl border border-white/25 bg-black/20 p-4 text-white resize-y outline-none"
                />
              </div>

              <div className="grid grid-cols-[auto_auto_auto_auto_1fr] gap-x-8 gap-y-3 pt-2 border-t border-white/20">
                <div>
                  <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
                    Origen
                  </div>
                  <div className="text-white/95 text-sm">
                    {usuarioPanel}
                  </div>
                </div>

                <div>
  <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
    Fecha registro
  </div>
  <div className="text-white/95 text-sm">
    {recallSeleccionado?.fecha_registro
  ? formatDate(recallSeleccionado.fecha_registro)
  : new Date().toLocaleDateString('es-ES')}
  </div>
</div>

                <div>
                  <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
                    Estado
                  </div>
                  <div className="text-white/95 text-sm">
                    {recallEstadoVisual(recallSeleccionado?.estado || 'pendiente_envio').label}
                  </div>
                </div>

                <div>
                  <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
                    Cambios
                  </div>
                  <div className="text-white/95 text-sm">
                    {recallSeleccionado?.numero_cambios ?? 0}
                  </div>
                </div>

                <div className="relative overflow-visible justify-self-end min-w-[130px] mr-6">
                  <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">
                    Agenda
                  </div>

                  <button
                    type="button"
                    onClick={() => setMostrarAgendaRecall(!mostrarAgendaRecall)}
                    className="w-full text-left text-white/95 text-sm flex items-center justify-between gap-2"
                  >
                    <span>
                      {agendas.find((a) => a.key === nuevoRecall.profesional)
                        ?.nombre || 'Agenda'}
                    </span>

                    <svg
                      className={`w-4 h-4 text-cyan-200 transition-transform ${
                        mostrarAgendaRecall ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {mostrarAgendaRecall && (
                    <div className="absolute right-0 top-[calc(100%+8px)] z-[120] min-w-[160px] overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                      {agendas.map((a) => (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() => {
                            setNuevoRecall({
                              ...nuevoRecall,
                              profesional: a.key,
                            });
                            setMostrarAgendaRecall(false);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
                        >
                          {a.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecallsView;
