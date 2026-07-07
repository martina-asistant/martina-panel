'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import {
  listTrabajosLaboratorio,
  crearTrabajoLaboratorio,
  actualizarTrabajoLaboratorio,
} from '@/lib/repos/laboratorio.repo';
import type {
  LaboratorioTrabajo,
  EstadoLaboratorio,
  LaboratorioNombre,
  TipoTrabajoLaboratorio,
} from '@/lib/types/db.types';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

type FiltroLab = 'todos' | EstadoLaboratorio;

type PatientOption = {
  id: string;
  paciente_id: string | null;
  nombre: string | null;
  apellidos: string | null;
  nombre_completo: string | null;
  telefono: string | null;
};

const filtros: { key: FiltroLab; label: string; color: string }[] = [
  { key: 'todos', label: 'Todos', color: 'bg-amber-400' },
  { key: 'pte_gestionar', label: 'Pte gestionar', color: 'bg-red-600' },
  { key: 'disenado', label: 'Diseñado', color: 'bg-violet-300' },
  { key: 'impreso', label: 'Impreso', color: 'bg-pink-400' },
  { key: 'fresado', label: 'Fresado', color: 'bg-cyan-300' },
  { key: 'horneado', label: 'Horneado', color: 'bg-orange-400' },
  { key: 'en_clinica', label: 'En clínica', color: 'bg-green-400' },
  { key: 'finalizado', label: 'Finalizado', color: 'bg-slate-300' },
];

const LABORATORIOS = ['Julio', 'Juanjo', 'Alex', 'Claudia', 'Otro'];

const TIPOS_TRABAJO = [
  'Incrustación',
  'Corona',
  'Puente',
  'Implante',
  'Férula',
  'Otro',
];

const estadoVisual = (estado?: string | null) =>
  filtros.find((f) => f.key === estado) ||
  { key: 'pte_gestionar', label: 'Pte gestionar', color: 'bg-red-600' };

const formatFechaCorta = (iso?: string | null) => {
  if (!iso) return '-';

  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
};

const formatFechaDetalle = (iso?: string | null) => {
  if (!iso) return '-';

  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
};

const formatHora = (iso?: string | null) => {
  if (!iso) return '';

  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const LaboratorioView = () => {
  const [items, setItems] = useState<LaboratorioTrabajo[]>([]);
  const [filter, setFilter] = useState<FiltroLab>('todos');
  const [loading, setLoading] = useState(true);
  const [loadingGuardar, setLoadingGuardar] = useState(false);

  const [usuarioPanel, setUsuarioPanel] = useState('panel');
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [mostrarResultadosPaciente, setMostrarResultadosPaciente] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState<LaboratorioTrabajo | null>(null);
  const [historialAbiertoId, setHistorialAbiertoId] = useState<string | null>(null);
  const [mostrarHistorialModal, setMostrarHistorialModal] = useState(false);

  const [mostrarLaboratorio, setMostrarLaboratorio] = useState(false);
  const [mostrarTrabajo, setMostrarTrabajo] = useState(false);
  const [mostrarEstado, setMostrarEstado] = useState(false);

  const [nuevoTrabajo, setNuevoTrabajo] = useState({
    paciente_id: '',
    nombre_paciente: '',
    telefono: '',
    laboratorio: 'Julio' as LaboratorioNombre,
    trabajo: 'Incrustación' as TipoTrabajoLaboratorio,
    piezas: '',
    estado: 'pte_gestionar' as EstadoLaboratorio,
    anotaciones: '',
    fecha_cita: '',
    event_id_origen: '',
    calendar_id_origen: '',
  });

  const cargarLaboratorio = async () => {
    setLoading(true);
    const data = await listTrabajosLaboratorio();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarLaboratorio();
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

  useEffect(() => {
    const supa = createClient();
    if (!supa) return;

    const ch = supa
      .channel('laboratorio-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'laboratorio_trabajos' },
        async () => cargarLaboratorio()
      )
      .subscribe();

    return () => {
      supa.removeChannel(ch);
    };
  }, []);

  const filtered = useMemo(() => {
    const data =
      filter === 'todos'
        ? items
        : items.filter((i) => i.estado === filter);

    return [...data].sort((a, b) => {
      const fechaA = new Date(a.updated_at || a.created_at).getTime();
      const fechaB = new Date(b.updated_at || b.created_at).getTime();
      return fechaB - fechaA;
    });
  }, [items, filter]);

  const pacientesFiltrados = patients.filter((patient) => {
    const texto =
      `${patient.nombre_completo || ''} ${patient.nombre || ''} ${patient.apellidos || ''} ${patient.telefono || ''}`
        .toLowerCase();

    return texto.includes(busquedaPaciente.toLowerCase());
  });

  const abrirNuevo = () => {
    setTrabajoSeleccionado(null);
    setBusquedaPaciente('');
    setMostrarResultadosPaciente(false);
    setMostrarHistorialModal(false);

    setNuevoTrabajo({
      paciente_id: '',
      nombre_paciente: '',
      telefono: '',
      laboratorio: 'Julio',
      trabajo: 'Incrustación',
      piezas: '',
      estado: 'pte_gestionar',
      anotaciones: '',
      fecha_cita: '',
      event_id_origen: '',
      calendar_id_origen: '',
    });

    setMostrarModal(true);
  };

  const abrirEditar = (trabajo: LaboratorioTrabajo) => {
    setTrabajoSeleccionado(trabajo);
    setBusquedaPaciente(trabajo.nombre_paciente || '');
    setMostrarResultadosPaciente(false);
    setMostrarHistorialModal(false);

    setNuevoTrabajo({
      paciente_id: trabajo.paciente_id || '',
      nombre_paciente: trabajo.nombre_paciente || '',
      telefono: trabajo.telefono || '',
      laboratorio: (trabajo.laboratorio || 'Julio') as LaboratorioNombre,
      trabajo: (trabajo.trabajo || 'Incrustación') as TipoTrabajoLaboratorio,
      piezas: trabajo.piezas || '',
      estado: trabajo.estado || 'pte_gestionar',
      anotaciones: trabajo.anotaciones || '',
      fecha_cita: trabajo.fecha_cita || '',
      event_id_origen: trabajo.event_id_origen || '',
      calendar_id_origen: trabajo.calendar_id_origen || '',
    });

    setMostrarModal(true);
  };

  const guardarTrabajo = async () => {
    if (loadingGuardar) return;

    if (!nuevoTrabajo.nombre_paciente.trim()) {
      console.error('Falta paciente');
      return;
    }

    if (!nuevoTrabajo.anotaciones.trim()) {
      console.error('Falta anotación');
      return;
    }

    setLoadingGuardar(true);

    try {
      const payload = {
        paciente_id: nuevoTrabajo.paciente_id || null,
        nombre_paciente: nuevoTrabajo.nombre_paciente.trim(),
        telefono: nuevoTrabajo.telefono || null,
        laboratorio: nuevoTrabajo.laboratorio,
        trabajo: nuevoTrabajo.trabajo,
        piezas: nuevoTrabajo.piezas,
        estado: nuevoTrabajo.estado,
        anotaciones: nuevoTrabajo.anotaciones,
        fecha_cita: nuevoTrabajo.fecha_cita || null,
        event_id_origen: nuevoTrabajo.event_id_origen || null,
        calendar_id_origen: nuevoTrabajo.calendar_id_origen || null,
      };

      const guardado = trabajoSeleccionado
        ? await actualizarTrabajoLaboratorio(
            trabajoSeleccionado.id,
            payload,
            usuarioPanel,
            'Trabajo'
          )
        : await crearTrabajoLaboratorio({
            ...payload,
            usuario: usuarioPanel,
          });

      if (!guardado) {
        console.error('Error guardando trabajo laboratorio');
        return;
      }

      setMostrarModal(false);
      setTrabajoSeleccionado(null);
      setBusquedaPaciente('');
      setMostrarResultadosPaciente(false);
      await cargarLaboratorio();
    } catch (error) {
      console.error('Error guardando laboratorio:', error);
    } finally {
      setLoadingGuardar(false);
    }
  };

return (
  <div className="min-h-full overflow-y-auto px-2 py-4 sm:p-8 bg-[#02141B] text-white">
    <div className="mb-8 px-2 sm:px-0 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.015em] origin-left inline-block bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
          Laboratorio
        </h1>
        <p className="text-sm text-cyan-100/55">Seguimiento de trabajos</p>
      </div>

      <button
        type="button"
        onClick={abrirNuevo}
        className="inline-flex shrink-0 items-center gap-1 sm:gap-2 rounded-full border border-cyan-300/45 bg-cyan-400/10 px-2.5 sm:px-3.5 py-[5px] sm:py-[7px] text-[8px] sm:text-[10px] font-semibold uppercase tracking-[0.10em] sm:tracking-[0.15em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,.14)] transition-all hover:bg-cyan-400/18 hover:border-cyan-200/70 whitespace-nowrap"
      >
        <Plus className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
        Insertar trabajo
      </button>
    </div>

    <div className="mb-6 flex gap-2 overflow-x-auto pb-2 xl:flex-wrap xl:overflow-visible [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/35">
      {filtros.map((f) => (
        <button
          key={f.key}
          onClick={() => setFilter(f.key)}
          className={cn(
            'text-[12px] px-3.5 py-[7px] rounded-full border transition-all whitespace-nowrap shrink-0',
            filter === f.key
              ? 'bg-cyan-500/20 text-cyan-100 border-cyan-300/50 shadow-[0_0_18px_rgba(34,211,238,.22)]'
              : 'bg-white/5 text-cyan-100/65 border-cyan-500/20 hover:bg-cyan-500/10 hover:text-white'
          )}
        >
          <div className="flex items-center gap-2">
            <span className={cn('w-2.5 h-2.5 rounded-full shadow-[0_0_12px_currentColor]', f.color)} />
            <span className={cn(f.key === 'todos' ? 'font-bold uppercase' : 'font-normal text-[13px] tracking-[-0.01em]')}>
              {f.label}
            </span>
          </div>
        </button>
      ))}
    </div>

    {/* MOBILE */}
    <div className="lg:hidden rounded-3xl border border-cyan-500/20 bg-[rgba(5,18,24,.78)] overflow-hidden shadow-[0_0_35px_rgba(34,211,238,.10)]">
      <div className="grid grid-cols-[1fr_48px_62px_94px] gap-2 px-3 py-3 bg-cyan-500/10 text-cyan-300/75 text-[11px] uppercase tracking-[0.16em]">
        <div>Paciente</div>
        <div>Lab.</div>
        <div>Fecha</div>
        <div>Estado</div>
      </div>

      {filtered.map((t) => {
        const lbl = estadoVisual(t.estado);

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => abrirEditar(t)}
            className="w-full grid grid-cols-[1fr_48px_62px_94px] gap-2 items-center px-3 py-4 border-t border-cyan-500/10 text-left hover:bg-cyan-500/5"
          >
            <div className="min-w-0 font-medium text-white truncate">
              {t.nombre_paciente || '—'}
            </div>

            <div className="text-xs text-cyan-100/70 truncate">
              {t.laboratorio || '—'}
            </div>

            <div className="text-xs text-cyan-100/70 whitespace-nowrap">
              {formatFechaCorta(t.fecha_cita)}
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-[11px] text-cyan-100 max-w-full">
                <span className={cn('w-2 h-2 rounded-full shrink-0 shadow-[0_0_10px_currentColor]', lbl.color)} />
                <span className="truncate">{lbl.label}</span>
              </span>
            </div>
          </button>
        );
      })}

      {!loading && filtered.length === 0 && (
        <div className="px-6 py-10 text-center text-cyan-100/45">
          Sin resultados
        </div>
      )}
    </div>

    {/* DESKTOP */}
    <div className="hidden lg:block rounded-3xl border border-cyan-500/20 bg-[rgba(5,18,24,.78)] backdrop-blur-xl overflow-hidden shadow-[0_0_35px_rgba(34,211,238,.10)]">
      <div className="w-full overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[8%]" />
            <col className="w-[29%]" />
            <col className="w-[12%]" />
            <col className="w-[11%]" />
            <col className="w-[5%]" />
          </colgroup>

          <thead className="bg-cyan-500/10 text-cyan-300/75 text-xs uppercase tracking-[0.18em]">
            <tr>
              <th className="text-left px-5 py-4 font-medium">Paciente</th>
              <th className="text-left px-4 py-4 font-medium">Laboratorio</th>
              <th className="text-left px-5 py-4 font-medium">Trabajo</th>
              <th className="text-left px-3 py-4 font-medium">Piezas</th>
              <th className="text-left px-5 py-4 font-medium">Anotaciones</th>
              <th className="text-left px-5 py-4 font-medium">Estado</th>
              <th className="text-left px-5 py-4 font-medium">Fecha cita</th>
              <th className="px-3 py-4 font-medium" />
            </tr>
          </thead>

          <tbody>
            {filtered.map((t) => {
              const lbl = estadoVisual(t.estado);
              const abierto = historialAbiertoId === t.id;
              const historial = t.historial || [];
              const ultimo = historial[historial.length - 1];

              return (
                <>
                  <tr
                    key={t.id}
                    onDoubleClick={() => abrirEditar(t)}
                    className="border-t border-cyan-500/10 hover:bg-cyan-500/5 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 font-medium text-white truncate">{t.nombre_paciente || '—'}</td>
                    <td className="px-5 py-4 text-cyan-100/65 truncate">{t.laboratorio || '—'}</td>
                    <td className="px-5 py-4 text-cyan-100/80 truncate">{t.trabajo || '—'}</td>
                    <td className="px-3 py-4 text-cyan-100/75 whitespace-nowrap">{t.piezas || '—'}</td>
                    <td className="px-5 py-4 text-cyan-100/65 truncate">{t.anotaciones || '—'}</td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,.10)]">
                        <span className={cn('w-2.5 h-2.5 shrink-0 rounded-full shadow-[0_0_10px_currentColor]', lbl.color)} />
                        {lbl.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-cyan-100/75 whitespace-nowrap">
                      {formatFechaDetalle(t.fecha_cita)}
                    </td>

                    <td className="px-3 py-4">
                      <button
                        type="button"
                        title="Consultar historial"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistorialAbiertoId(abierto ? null : t.id);
                        }}
                        className="w-8 h-8 rounded-full border border-cyan-400/25 bg-cyan-500/10 flex items-center justify-center hover:bg-cyan-500/20"
                      >
                        <ChevronDown className={cn('w-4 h-4 text-cyan-200 transition-transform', abierto && 'rotate-180')} />
                      </button>
                    </td>
                  </tr>

                  {abierto && (
                    <tr>
                      <td colSpan={8} className="border-t border-cyan-500/10 bg-black/20 px-6 py-4">
                        <div className="grid grid-cols-[auto_auto_auto_1fr] gap-x-10 gap-y-3 text-sm">
                          <div>
                            <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">Origen</div>
                            <div className="text-white/90">{ultimo?.usuario || '—'}</div>
                          </div>

                          <div>
                            <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">Cambio</div>
                            <div className="text-white/90">{ultimo?.tipo || 'Creación'}</div>
                          </div>

                          <div>
                            <div className="text-cyan-300 text-[10px] uppercase tracking-wider mb-1 font-bold">Actualizado</div>
                            <div className="text-white/90">
                              {ultimo?.fecha ? `${formatFechaDetalle(ultimo.fecha)} · ${formatHora(ultimo.fecha)}` : '—'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {historial.map((h, index) => (
                            <div key={`${t.id}-hist-${index}`} className="rounded-2xl border border-cyan-400/15 bg-black/20 px-4 py-3 text-sm">
                              <div className="text-cyan-300 text-xs mb-1">
                                {formatFechaDetalle(h.fecha)} · {formatHora(h.fecha)}
                              </div>
                              <div className="text-white/90 font-medium">{h.tipo}</div>
                              <div className="text-cyan-100/70 mt-1">
                                {typeof h.texto === 'string' && h.texto.trim().startsWith('{')
                                  ? 'Trabajo actualizado'
                                  : h.texto}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-cyan-100/45">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {mostrarModal && (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm px-3 sm:px-4 py-6">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-cyan-300/45 bg-[#03111A]/95 overflow-visible shadow-[0_0_46px_rgba(34,211,238,.24)]">
          <div className="px-5 sm:px-6 py-5 border-b border-cyan-300/20 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {trabajoSeleccionado ? 'Editar trabajo' : 'Insertar trabajo'}
              </h2>
              <p className="text-cyan-200 text-sm mt-1">
                {nuevoTrabajo.nombre_paciente || 'Nuevo trabajo laboratorio'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={guardarTrabajo} disabled={loadingGuardar} className="text-cyan-200 hover:text-white text-2xl disabled:opacity-50">
                ✓
              </button>

              <button
                onClick={() => {
                  setMostrarModal(false);
                  setTrabajoSeleccionado(null);
                  setBusquedaPaciente('');
                  setMostrarResultadosPaciente(false);
                }}
                className="text-white/80 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <div className="relative overflow-visible">
              <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
                Paciente
              </div>

              <input
                placeholder="Buscar paciente"
                value={busquedaPaciente}
                onChange={(e) => {
                  setBusquedaPaciente(e.target.value);
                  setMostrarResultadosPaciente(true);
                  setNuevoTrabajo({
                    ...nuevoTrabajo,
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
                          setNuevoTrabajo({
                            ...nuevoTrabajo,
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

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="relative overflow-visible">
                <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">Laboratorio</div>

                <button
                  type="button"
                  onClick={() => setMostrarLaboratorio(!mostrarLaboratorio)}
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
                >
                  <span>{nuevoTrabajo.laboratorio}</span>
                  <ChevronDown className={cn('w-4 h-4 text-cyan-200 transition-transform', mostrarLaboratorio && 'rotate-180')} />
                </button>

                {mostrarLaboratorio && (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                    {LABORATORIOS.map((lab) => (
                      <button
                        key={lab}
                        type="button"
                        onClick={() => {
                          setNuevoTrabajo({ ...nuevoTrabajo, laboratorio: lab as LaboratorioNombre });
                          setMostrarLaboratorio(false);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
                      >
                        {lab}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative overflow-visible">
                <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">Trabajo</div>

                <button
                  type="button"
                  onClick={() => setMostrarTrabajo(!mostrarTrabajo)}
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
                >
                  <span>{nuevoTrabajo.trabajo}</span>
                  <ChevronDown className={cn('w-4 h-4 text-cyan-200 transition-transform', mostrarTrabajo && 'rotate-180')} />
                </button>

                {mostrarTrabajo && (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                    {TIPOS_TRABAJO.map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => {
                          setNuevoTrabajo({ ...nuevoTrabajo, trabajo: tipo as TipoTrabajoLaboratorio });
                          setMostrarTrabajo(false);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">
                  Piezas
                </div>

                <input
                  value={nuevoTrabajo.piezas}
                  onChange={(e) =>
                    setNuevoTrabajo({
                      ...nuevoTrabajo,
                      piezas: e.target.value,
                    })
                  }
                  placeholder="Ej: 13-23"
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="relative overflow-visible">
                <div className="text-cyan-300 text-xs uppercase tracking-wider mb-1 font-bold">Estado</div>

                <button
                  type="button"
                  onClick={() => setMostrarEstado(!mostrarEstado)}
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-white outline-none flex items-center justify-between"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full', estadoVisual(nuevoTrabajo.estado).color)} />
                    {estadoVisual(nuevoTrabajo.estado).label}
                  </span>
                  <ChevronDown className={cn('w-4 h-4 text-cyan-200 transition-transform', mostrarEstado && 'rotate-180')} />
                </button>

                {mostrarEstado && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-[120] w-full overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#03111A] shadow-[0_0_25px_rgba(34,211,238,.22)]">
                    {filtros.filter(f => f.key !== 'todos').map((estado) => (
                      <button
                        key={estado.key}
                        type="button"
                        onClick={() => {
                          setNuevoTrabajo({ ...nuevoTrabajo, estado: estado.key as EstadoLaboratorio });
                          setMostrarEstado(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white hover:bg-cyan-500/15"
                      >
                        <span className={cn('h-2.5 w-2.5 rounded-full', estado.color)} />
                        {estado.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="text-cyan-300 text-xs uppercase tracking-wider mb-2 font-bold">
                Anotaciones
              </div>

              <textarea
                value={nuevoTrabajo.anotaciones}
                onChange={(e) =>
                  setNuevoTrabajo({
                    ...nuevoTrabajo,
                    anotaciones: e.target.value,
                  })
                }
                rows={3}
                className="w-full min-h-[96px] rounded-2xl border border-white/25 bg-black/20 p-4 text-white resize-y outline-none"
              />
            </div>

            <div className="grid grid-cols-[auto_auto_auto_1fr] gap-x-8 gap-y-3 pt-2 border-t border-white/20">
              <div>
                <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">Origen</div>
                <div className="text-white/95 text-sm">{usuarioPanel}</div>
              </div>

              <div>
                <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">Cambio</div>
                <div className="text-white/95 text-sm">{trabajoSeleccionado ? 'Trabajo' : 'Creación'}</div>
              </div>

              <div>
                <div className="text-cyan-300 text-[11px] uppercase tracking-wider mb-1 font-bold">Actualizado</div>
                <div className="text-white/95 text-sm">
                  {new Date().toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                  })} · {new Date().toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMostrarHistorialModal(!mostrarHistorialModal)}
                className="justify-self-end self-end w-8 h-8 rounded-full border border-cyan-400/25 bg-cyan-500/10 flex items-center justify-center hover:bg-cyan-500/20"
              >
                <ChevronDown className={cn('w-4 h-4 text-cyan-200 transition-transform', mostrarHistorialModal && 'rotate-180')} />
              </button>
            </div>

            {mostrarHistorialModal && trabajoSeleccionado && (
              <div className="space-y-2">
                {(trabajoSeleccionado.historial || []).map((h, index) => (
                  <div key={`modal-hist-${index}`} className="rounded-2xl border border-cyan-400/15 bg-black/20 px-4 py-3 text-sm">
                    <div className="text-cyan-300 text-xs mb-1">
                      {formatFechaDetalle(h.fecha)} · {formatHora(h.fecha)}
                    </div>
                    <div className="text-white/90 font-medium">{h.tipo}</div>
                    <div className="text-cyan-100/70 mt-1">
                      {typeof h.texto === 'string' && h.texto.trim().startsWith('{')
                        ? 'Trabajo actualizado'
                        : h.texto}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default LaboratorioView;
