
'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Pencil,
  Phone,
  Plus,
  Save,
  Search,
  X,
} from 'lucide-react';

import type { Patient } from '@/lib/types/db.types';
import { createClient } from '@/lib/supabase/client';

import {
  actualizarPaciente,
  crearPacienteManual,
  type PacienteFormulario,
} from '@/lib/repos/pacientes.repo';

// ================================================================
// 1. DATOS Y UTILIDADES COMPARTIDAS (ESCRITORIO + MÓVIL)
// ================================================================

const formularioVacio: PacienteFormulario = {
  nombre: '',
  apellidos: '',
  telefono: '',
  notas_internas: '',
  alerta_urgencia: false,
};

const desdePaciente = (p: Patient): PacienteFormulario => ({
  nombre: p.nombre ?? '',
  apellidos: p.apellidos ?? '',
  telefono: p.telefono ?? '',
  notas_internas: p.notas_internas ?? '',
  alerta_urgencia: Boolean(p.alerta_urgencia),
});

const nombreVisible = (p: Patient) =>
  p.nombre_completo?.trim() ||
  [p.nombre, p.apellidos].filter(Boolean).join(' ').trim() ||
  'Paciente sin nombre';

const normalizar = (v: string) =>
  v.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const digitos = (v: string) => v.replace(/\D/g, '');

const iniciales = (p: Patient) =>
  nombreVisible(p)
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('');

const mostrarFecha = (valor?: string | null) => {
  if (!valor) return '—';

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return '—';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
};

// Fecha abreviada del listado de escritorio (no altera los datos).
const mostrarFechaCorta = (valor?: string | null) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  }).format(fecha);
};

// ================================================================
// COMPONENTES VISUALES COMPARTIDOS
// ================================================================

function ResumenCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string | null;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-cyan-400/10 bg-cyan-500/[0.035] p-3 sm:p-4">
      <div className="text-[11px] uppercase tracking-[0.11em] text-cyan-200/45">
        {label}
      </div>

      <div className="mt-2 break-words text-sm font-medium text-white/85">
        {value}
      </div>

      {detail && (
        <div className="mt-1 break-words text-xs text-white/35">
          {detail}
        </div>
      )}
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-cyan-200/60">
        {label}
      </span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 rounded-2xl border border-cyan-500/15 bg-black/15 px-4 py-3 text-sm text-white outline-none"
      />
    </label>
  );
}

// ================================================================
// 2. LÓGICA COMPARTIDA: SUPABASE, BUSCADOR, ALTA Y EDICIÓN
// ================================================================

export default function PacientesView() {
  const [pacientes, setPacientes] = useState<Patient[]>([]);

  const [seleccionado, setSeleccionado] =
    useState<Patient | null>(null);

  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [busquedaTelefono, setBusquedaTelefono] = useState('');

  const [filtros, setFiltros] = useState({
    nombre: '',
    telefono: '',
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(false);

  const [form, setForm] = useState<PacienteFormulario>({
    ...formularioVacio,
  });

  const [error, setError] = useState('');

  // En móvil: listado y ficha son pantallas distintas.
  // En escritorio: aparecen como columnas.
  const [vistaMovil, setVistaMovil] =
    useState<'listado' | 'ficha'>('listado');

  // ================================================================
  // CARGAR PACIENTES DESDE SUPABASE
  // ================================================================

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        const supa = createClient();

        if (!supa) {
          throw new Error('Supabase no está configurado');
        }

        const { data, error: consultaError } = await supa
          .from('patients')
          .select('*')
          .order('nombre_completo', { ascending: true });

        if (consultaError) throw consultaError;

        if (activo) {
          setPacientes((data ?? []) as Patient[]);
        }
      } catch (e) {
        console.error('Error cargando pacientes:', e);

        if (activo) {
          setError(
            'No se ha podido cargar la lista de pacientes.'
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    void cargar();

    return () => {
      activo = false;
    };
  }, []);

  // ================================================================
  // BÚSQUEDA DE PACIENTES
  // ================================================================

  const filtrados = pacientes.filter(
    (p) =>
      normalizar(nombreVisible(p)).includes(
        normalizar(filtros.nombre)
      ) &&
      digitos(p.telefono || '').includes(
        digitos(filtros.telefono)
      )
  );

  const buscar = () => {
    setFiltros({
      nombre: busquedaNombre,
      telefono: busquedaTelefono,
    });
  };

  const limpiar = () => {
    setBusquedaNombre('');
    setBusquedaTelefono('');

    setFiltros({
      nombre: '',
      telefono: '',
    });
  };

  // ================================================================
  // SELECCIONAR PACIENTE
  // ================================================================

  const elegir = (p: Patient) => {
    setSeleccionado(p);
    setCreando(false);
    setEditando(false);
    setForm(desdePaciente(p));
    setError('');
    setVistaMovil('ficha');
  };

  // ================================================================
  // NUEVO PACIENTE
  // ================================================================

  const nuevo = () => {
    setSeleccionado(null);
    setCreando(true);
    setEditando(true);
    setForm({ ...formularioVacio });
    setError('');
    setVistaMovil('ficha');
  };

  // ================================================================
  // EDITAR PACIENTE
  // ================================================================

  const editar = () => {
    if (!seleccionado) return;

    setForm(desdePaciente(seleccionado));
    setEditando(true);
    setError('');
  };

  // ================================================================
  // VOLVER AL LISTADO EN MÓVIL
  // ================================================================

  const volverListadoMovil = () => {
    if (guardando) return;

    setVistaMovil('listado');
    setCreando(false);
    setEditando(false);
    setSeleccionado(null);
    setForm({ ...formularioVacio });
    setError('');
  };

  const cancelar = () => {
    setCreando(false);
    setEditando(false);

    setForm(
      seleccionado
        ? desdePaciente(seleccionado)
        : { ...formularioVacio }
    );

    setError('');

    if (!seleccionado) {
      setVistaMovil('listado');
    }
  };

  // ================================================================
  // GUARDAR EN SUPABASE (NO MODIFICA GOOGLE CALENDAR)
  // ================================================================

  const guardar = async () => {
    if (guardando) return;

    if (!form.nombre.trim() && !form.apellidos.trim()) {
      setError('Introduce el nombre del paciente.');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const resultado = creando
        ? await crearPacienteManual(form)
        : seleccionado
          ? await actualizarPaciente(seleccionado.id, form)
          : null;

      if (!resultado) {
        setError(
          'No se ha podido guardar el paciente. Inténtalo de nuevo.'
        );
        return;
      }

      setPacientes((previos) =>
        [
          ...previos.filter((p) => p.id !== resultado.id),
          resultado,
        ].sort((a, b) =>
          nombreVisible(a).localeCompare(nombreVisible(b), 'es')
        )
      );

      setSeleccionado(resultado);
      setForm(desdePaciente(resultado));
      setCreando(false);
      setEditando(false);
    } catch (e) {
      console.error('Error guardando paciente:', e);

      setError(
        'No se ha podido guardar el paciente.'
      );
    } finally {
      setGuardando(false);
    }
  };

  // ================================================================
  // 3. BUSCADOR COMPARTIDO (ESCRITORIO + MÓVIL)
  // ================================================================

  const buscador = (
    <div className="border-b border-cyan-500/10 p-4">
      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        <label className="relative block min-w-0">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/60" />

          <input
            value={busquedaNombre}
            onChange={(e) =>
              setBusquedaNombre(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') buscar();
            }}
            placeholder="Nombre y apellidos"
            className="w-full min-w-0 rounded-2xl border border-cyan-500/15 bg-black/15 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-white/25"
          />
        </label>

        <label className="relative block min-w-0">
          <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/60" />

          <input
            value={busquedaTelefono}
            onChange={(e) =>
              setBusquedaTelefono(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') buscar();
            }}
            placeholder="Teléfono"
            className="w-full min-w-0 rounded-2xl border border-cyan-500/15 bg-black/15 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-white/25"
          />
        </label>

        <div className="flex min-w-0 gap-2 md:col-span-2">
          <button
            type="button"
            onClick={buscar}
            className="min-w-0 flex-1 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-2.5 text-xs text-cyan-100"
          >
            Buscar
          </button>

          {(filtros.nombre ||
            filtros.telefono ||
            busquedaNombre ||
            busquedaTelefono) && (
            <button
              type="button"
              onClick={limpiar}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white/60"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ================================================================
  // FICHA COMPARTIDA: MISMA INFORMACIÓN EN ESCRITORIO Y MÓVIL
  // ================================================================

  const ficha = (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#03111A]/90 p-4 sm:p-5 lg:p-6">
      {!seleccionado && !editando ? (
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/70">
            Ficha de paciente
          </div>

          <p className="mt-4 text-sm text-white/40">
            Selecciona un paciente para ver su ficha
          </p>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 items-start justify-between gap-3 border-b border-cyan-500/10 pb-5">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/70">
                Ficha de paciente
              </div>

              {editando ? (
                <h2 className="mt-3 break-words text-xl font-semibold">
                  {creando
                    ? 'Nuevo paciente'
                    : seleccionado
                      ? nombreVisible(seleccionado)
                      : 'Paciente'}
                </h2>
              ) : (
                seleccionado && (
                  <div className="mt-4 flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-sm font-semibold text-cyan-200">
                      {iniciales(seleccionado)}
                    </div>

                    <div className="min-w-0">
                      <h2 className="break-words text-xl font-semibold">
                        {nombreVisible(seleccionado)}
                      </h2>

                      <div className="mt-1 flex items-center gap-2 text-sm text-white/50">
                        <Phone className="h-4 w-4 shrink-0 text-cyan-300/50" />
                        {seleccionado.telefono || 'Sin teléfono'}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {seleccionado && !editando && (
              <button
                type="button"
                onClick={editar}
                aria-label="Editar paciente"
                className="shrink-0 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-2 text-cyan-100"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          {editando ? (
            <div className="mt-5 min-w-0">
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <Campo
                  label="Nombre"
                  value={form.nombre}
                  onChange={(nombre) =>
                    setForm((f) => ({
                      ...f,
                      nombre,
                    }))
                  }
                />

                <Campo
                  label="Apellidos"
                  value={form.apellidos}
                  onChange={(apellidos) =>
                    setForm((f) => ({
                      ...f,
                      apellidos,
                    }))
                  }
                />

                <Campo
                  label="Teléfono"
                  value={form.telefono}
                  onChange={(telefono) =>
                    setForm((f) => ({
                      ...f,
                      telefono,
                    }))
                  }
                />
              </div>

              <label className="mt-4 block min-w-0">
                <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-cyan-200/60">
                  Notas internas
                </span>

                <textarea
                  rows={5}
                  value={form.notas_internas}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      notas_internas: e.target.value,
                    }))
                  }
                  className="w-full min-w-0 resize-y rounded-2xl border border-cyan-500/15 bg-black/15 px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-300/10 bg-amber-400/[0.035] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.alerta_urgencia}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      alerta_urgencia: e.target.checked,
                    }))
                  }
                />

                <span className="text-sm text-white/65">
                  Marcar paciente con alerta
                </span>
              </label>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={cancelar}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60"
                >
                  <X className="mr-2 inline h-4 w-4" />
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={guardando}
                  onClick={guardar}
                  className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-sm text-cyan-100 disabled:opacity-50"
                >
                  <Save className="mr-2 inline h-4 w-4" />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            seleccionado && (
              <div className="mt-5 min-w-0 space-y-5">
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                  <ResumenCard
                    label="Última cita"
                    value={mostrarFecha(
                      seleccionado.ultima_cita_fecha
                    )}
                    detail={seleccionado.ultima_cita_motivo}
                  />

                  <ResumenCard
                    label="Próxima cita"
                    value={mostrarFecha(
                      seleccionado.proxima_cita_fecha
                    )}
                    detail={seleccionado.proxima_cita_motivo}
                  />

                  <ResumenCard
                    label="Total"
                    value={String(seleccionado.total_citas ?? 0)}
                  />
                </div>

                {seleccionado.alerta_urgencia && (
                  <div className="flex items-center gap-3 rounded-2xl border border-amber-300/15 bg-amber-400/[0.04] px-4 py-3 text-sm text-amber-100/75">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" />
                    Este paciente tiene una alerta activa
                  </div>
                )}

                <div className="rounded-2xl border border-cyan-400/10 bg-black/10 p-4">
                  <div className="text-xs uppercase tracking-[0.12em] text-cyan-200/55">
                    Notas internas
                  </div>

                  <p className="mt-3 min-h-[44px] whitespace-pre-wrap break-words text-sm leading-6 text-white/60">
                    {seleccionado.notas_internas ||
                      'Sin notas internas'}
                  </p>
                </div>

                <div className="rounded-2xl border border-cyan-400/10 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.12em] text-cyan-200/55">
                        Historial de citas
                      </div>

                      <p className="mt-1 text-xs text-white/30">
                        Cronología de tratamientos y visitas
                      </p>
                    </div>

                    <CalendarDays className="h-5 w-5 shrink-0 text-cyan-300/50" />
                  </div>

                  <div className="mt-5 rounded-2xl border border-dashed border-cyan-400/10 px-4 py-8 text-center text-sm text-white/35">
                    Historial no disponible
                  </div>
                </div>

                {/* Eliminación pendiente de verificar relaciones y política DELETE. */}
              </div>
            )
          )}
        </>
      )}
    </div>
  );

  const errorVisible = error && (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"
    >
      {error}
    </div>
  );

  // ================================================================
  // 4. CABECERA COMPARTIDA
  //    PACIENTES IZQUIERDA - NUEVO PACIENTE DERECHA
  // ================================================================

  return (
    <section className="h-full w-full max-w-full overflow-x-hidden overflow-y-auto bg-[#020F14] px-3 py-5 text-white sm:px-4 lg:px-8 lg:py-7">
      <div className="mx-auto w-full min-w-0 max-w-[1600px]">
        <div className="mb-5 flex min-w-0 items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-[0.32em] text-cyan-300">
              MARTINA
            </div>

            <h1 className="mt-1 text-2xl font-semibold">
              Pacientes
            </h1>

            <p className="mt-1 hidden text-sm text-white/45 sm:block">
              Información y seguimiento operativo
            </p>
          </div>

          <button
            type="button"
            onClick={nuevo}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-3 text-xs text-cyan-100 hover:bg-cyan-500/15 sm:gap-2 sm:px-5 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo paciente
          </button>
        </div>

        {/* ====================================================== */}
        {/* 5. VERSIÓN ESCRITORIO                              */}
        {/* Dos columnas desde 768 px                           */}
        {/* Dos columnas de igual ancho (50 % / 50 %)            */}
        {/* Scroll del listado: 640 px, fino y cian oscuro       */}
        {/* ====================================================== */}

        <div className="hidden md:block">
          {errorVisible}

          <div className="grid w-full min-w-0 gap-5 md:grid-cols-2">
            {/* LISTADO ESCRITORIO */}

            <div className="min-w-0 overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#03111A]/90">
              {buscador}

              <div className="max-h-[640px] overflow-y-auto overflow-x-hidden p-2 [scrollbar-width:thin] [scrollbar-color:#176477_#03111A] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-[#03111A] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#176477]">
                {cargando ? (
                  <p className="py-10 text-center text-sm text-white/35">
                    Cargando pacientes...
                  </p>
                ) : filtrados.length === 0 ? (
                  <p className="py-10 text-center text-sm text-white/35">
                    No hay pacientes coincidentes
                  </p>
                ) : (
                  filtrados.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => elegir(p)}
                      className={`mb-1 w-full min-w-0 overflow-x-auto rounded-2xl border px-4 py-3 text-left [scrollbar-width:thin] [scrollbar-color:#176477_#03111A] ${
                        seleccionado?.id === p.id
                          ? 'border-cyan-400/30 bg-cyan-500/10'
                          : 'border-transparent hover:bg-white/[0.035]'
                      }`}
                    >
                      
                    {/* ESCRITORIO: tres columnas centradas y alineadas */}
                    <div className="grid min-w-[620px] grid-cols-[minmax(200px,1.4fr)_100px_minmax(230px,1.5fr)] items-center gap-3">

                      {/* COLUMNA 1: NOMBRE COMPLETO Y ALERTA */}
                      <div className="flex min-w-0 items-center justify-center gap-1.5">
                        <span className="text-center text-sm font-medium">
                          {nombreVisible(p)}
                        </span>

                        {p.alerta_urgencia && (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
                        )}
                      </div>

                      {/* COLUMNA 2: TELÉFONO */}
                      <span className="text-center text-xs tabular-nums text-white/50">
                        {p.telefono || 'Sin teléfono'}
                      </span>

                      {/* COLUMNA 3: PRÓXIMA CITA */}
                      <span className="text-center text-xs text-cyan-200/70">
                        Próx. cita{' '}
                        {mostrarFechaCorta(p.proxima_cita_fecha)}{' '}
                        {p.proxima_cita_motivo || ''}
                      </span>

                    </div>
                  </button>
                ))
              )}
            </div>
          </div>


            {/* FICHA ESCRITORIO */}

            {ficha}
          </div>
        </div>

        {/* ====================================================== */}
        {/* 6. VERSIÓN MÓVIL                                   */}
        {/* Una pantalla a la vez, menos de 768 px               */}
        {/* Nombre completo + teléfono en la misma fila         */}
        {/* Flecha cian para acceder y regresar                  */}
        {/* ====================================================== */}

        <div className="md:hidden">
          {vistaMovil === 'listado' ? (
            <div className="min-w-0 overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#03111A]/90">
              {errorVisible}

              {buscador}

              {/* LISTADO MÓVIL */}

              <div className="max-h-[640px] overflow-y-auto overflow-x-hidden p-2">
                {cargando ? (
                  <p className="py-10 text-center text-sm text-white/35">
                    Cargando pacientes...
                  </p>
                ) : filtrados.length === 0 ? (
                  <p className="py-10 text-center text-sm text-white/35">
                    No hay pacientes coincidentes
                  </p>
                ) : (
                  filtrados.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => elegir(p)}
                      className="mb-1 w-full min-w-0 rounded-2xl border border-transparent px-3 py-3 text-left hover:border-cyan-400/30 hover:bg-cyan-500/10"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 flex-1 break-words text-sm font-medium">
                          {nombreVisible(p)}
                        </span>

                        <span className="shrink-0 whitespace-nowrap text-[11px] tabular-nums text-white/60">
                          {p.telefono || 'Sin teléfono'}
                        </span>

                        {p.alerta_urgencia && (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                        )}

                        <ChevronRight className="h-4 w-4 shrink-0 text-cyan-300" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* FICHA MÓVIL */

            <div className="min-w-0">
              <button
                type="button"
                onClick={volverListadoMovil}
                disabled={guardando}
                className="mb-3 inline-flex items-center gap-2 rounded-xl px-1 py-2 text-sm font-medium text-cyan-300 disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" />
                Volver a pacientes
              </button>

              {errorVisible}

              {ficha}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
