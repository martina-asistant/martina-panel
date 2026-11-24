'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  MessageCircle, PhoneCall, CalendarCheck2, ChevronLeft, ChevronRight, ChevronDown,
  ChartNoAxesCombined, ClipboardList, FlaskConical, Bot, HeartPulse,
  X, Search, AlertCircle
} from 'lucide-react';
import type { CanalMartina } from '@/lib/types/db.types';
import { getConfiguracionMartina, updateCanalMartina } from '@/lib/repos/configuracion.repo';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

/**
 * MARTINA PANEL — DashboardClientProvisional (vista independiente de prueba, 24/11/2026).
 * 1. Los encabezados del Dashboard original se han conservado literalmente.
 * 2. Ninguna escritura a Supabase/Google Calendar desde las estadísticas.
 * 3. Las estadísticas se calculan exclusivamente a partir de Supabase.
 * 4. Las modificaciones de Martina se leen de historial_citas_cambios
 *    si están registradas, sin incrementar el número de citas.
 * 5. Inspeccionar es una vista local operativa, no requiere una ruta nueva.
 *    En el futuro puede trasladarse a /dashboard/inspeccionar.
 */

type CitaDB = {
  id: string; event_id: string | null; calendar_id: string | null;
  profesional: string | null; nombre_paciente: string | null;
  motivo: string | null; estado: string | null; origen: string | null;
  fecha_inicio: string | null; fecha_fin: string | null;
  created_at: string | null; updated_at: string | null;
};
type TrabajoLabResumen = {
  id: string;
  nombre_paciente: string | null;
  laboratorio: string | null;
  trabajo: string | null;
  estado: string | null;
  fecha_cita: string | null;
};
const estadosLab: Record<string,{etiqueta:string,color:string}> = {
  pte_gestionar:{etiqueta:'Pte gestionar',color:'bg-red-600'},
  disenado:{etiqueta:'Diseñado',color:'bg-violet-300'},
  impreso:{etiqueta:'Impreso',color:'bg-pink-400'},
  fresado:{etiqueta:'Fresado',color:'bg-cyan-300'},
  horneado:{etiqueta:'Horneado',color:'bg-orange-400'},
  en_clinica:{etiqueta:'En clínica',color:'bg-green-400'},
};
function CajaLaboratorio() {
  const [trabajos,setTrabajos]=useState<TrabajoLabResumen[]>([]);
  const [cargandoLab,setCargandoLab]=useState(true);
  const [errorLab,setErrorLab]=useState('');
  useEffect(()=>{
    let activo=true;
    async function cargarSoloLectura(){
      const supa=createClient();
      if(!supa){if(activo){setErrorLab('Sin conexión');setCargandoLab(false);}return;}
      try{
        const datos=await leerTodas<TrabajoLabResumen>(supa,'laboratorio_trabajos','id,nombre_paciente,laboratorio,trabajo,estado,fecha_cita');
        if(activo){setTrabajos(datos);setErrorLab('');}
      }catch(err){if(activo)setErrorLab(err instanceof Error?err.message:'Error al leer Laboratorio');}
      finally{if(activo)setCargandoLab(false);}
    }
    void cargarSoloLectura();
    return ()=>{activo=false;};
  },[]);
  // Solo lectura: los trabajos se mantienen visibles hasta que pasan a Finalizado.
  const hoy=Date.now();
  const abiertos=trabajos.filter(t=>t.estado!=='finalizado');
  const proximos=abiertos.filter(t=>t.fecha_cita && !Number.isNaN(new Date(t.fecha_cita).getTime()) && new Date(t.fecha_cita).getTime()>=hoy)
    .sort((a,b)=>new Date(a.fecha_cita!).getTime()-new Date(b.fecha_cita!).getTime());
  const sinCita=abiertos.filter(t=>!t.fecha_cita);
  const visibles=[...proximos,...sinCita];
  const formatoFecha=(fecha:string|null)=>fecha?new Date(fecha).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'2-digit',timeZone:'Europe/Madrid'}):'Sin cita';
  const contador=(numero:number,descripcion:string)=>(
    <div className="group min-w-0 flex-1 rounded-xl border border-cyan-300/45 bg-[#082B35] px-2 py-2 text-center shadow-[0_0_12px_rgba(34,211,238,.10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/90 hover:bg-[#0A3541] hover:shadow-[0_0_18px_rgba(34,211,238,.40),0_0_30px_rgba(34,211,238,.13)] sm:px-3">
      <div className="flex items-baseline justify-center gap-2"><span className="text-[9px] uppercase tracking-[.08em] text-cyan-100/65">Total</span><strong className="text-[25px] font-semibold leading-none tabular-nums text-white sm:text-[29px]">{cargandoLab?'…':errorLab?'—':numero}</strong></div>
      <div className="mt-1 text-[10px] leading-tight text-cyan-100/75">{descripcion}</div>
    </div>
  );
  return (
    <section className="min-w-0 overflow-hidden rounded-[28px] border border-cyan-300/50 bg-[#031B24] p-4 text-white shadow-[0_12px_35px_rgba(0,0,0,.3),0_0_22px_rgba(34,211,238,.11)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/[.055] shadow-[0_0_22px_rgba(34,211,238,.17)] sm:h-10 sm:w-10"><FlaskConical className="h-5 w-5 text-cyan-300"/></div>
          <h2 className="text-[11px] font-normal uppercase tracking-[.08em] text-cyan-200 sm:text-sm sm:tracking-[.10em]">LABORATORIO</h2>
        </div>
        <div className="flex w-full gap-2 sm:w-auto sm:min-w-[280px]">
          {contador(proximos.length,'Citas próximas')}
          {contador(sinCita.length,'Pendientes de cita')}
        </div>
      </div>
      <div aria-hidden="true" className="mt-3 h-px w-full bg-cyan-300/75 shadow-[0_0_10px_rgba(34,211,238,.75)]" />
      <div className="mt-3 overflow-hidden rounded-2xl border border-cyan-400/30 bg-[rgba(5,18,24,.78)]">
        {/* Móvil: paciente, estado y fecha; escritorio: las cinco columnas acordadas. */}
        <div className="grid grid-cols-[minmax(0,1fr)_100px_65px] gap-2 bg-cyan-500/10 px-3 py-3 text-[10px] uppercase tracking-[.04em] text-cyan-300/90 lg:hidden">
          <span>Paciente</span><span>Estado</span><span>Fecha cita</span>
        </div>
        <div className="hidden grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_85px] gap-2 bg-cyan-500/10 px-3 py-3 text-[10px] uppercase tracking-[.035em] text-cyan-300/90 lg:grid">
          <span>Paciente</span><span>Laboratorio</span><span>Trabajo</span><span>Estado</span><span>Fecha cita</span>
        </div>
        <div className="max-h-[420px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(103,232,249,.22)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/20 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-300/35">
          {!cargandoLab && !errorLab && visibles.length===0 && <div className="px-4 py-8 text-center text-xs text-cyan-100/55">Sin trabajos con citas próximas o pendientes de cita</div>}
          {cargandoLab && <div className="px-4 py-8 text-center text-xs text-cyan-100/55">Cargando trabajos…</div>}
          {errorLab && <div className="px-4 py-6 text-center text-xs text-amber-200">No se pudo cargar Laboratorio: {errorLab}</div>}
          {visibles.map(t=>{
            const estado=estadosLab[t.estado||'']||{etiqueta:t.estado||'Sin estado',color:'bg-slate-300'};
            const pendiente=t.estado==='pte_gestionar';
            const chip=<span className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-1.5 text-[10px] ${pendiente?'border-red-500/40 bg-red-500/[.09] text-red-300':'border-cyan-500/25 bg-cyan-500/5 text-cyan-100'}`}><span className={`h-2 w-2 shrink-0 rounded-full shadow-[0_0_10px_currentColor] ${estado.color}`}/><span className="min-w-0 truncate">{pendiente?'Pendiente':estado.etiqueta}</span></span>;
            return <div key={t.id} className="border-t border-cyan-500/10 transition-colors hover:bg-cyan-500/[.035]">
              <div className="grid grid-cols-[minmax(0,1fr)_100px_65px] items-center gap-2 px-3 py-3.5 text-xs lg:hidden">
                <span className="min-w-0 truncate font-medium text-white" title={t.nombre_paciente||''}>{t.nombre_paciente||'—'}</span><span className="min-w-0">{chip}</span><span className="whitespace-nowrap text-[11px] text-cyan-100/75">{formatoFecha(t.fecha_cita)}</span>
              </div>
              <div className="hidden grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_85px] items-center gap-2 px-3 py-3.5 text-xs lg:grid">
                <span className="min-w-0 truncate font-medium text-white" title={t.nombre_paciente||''}>{t.nombre_paciente||'—'}</span><span className="min-w-0 truncate text-cyan-100/70" title={t.laboratorio||''}>{t.laboratorio||'—'}</span><span className="min-w-0 truncate text-cyan-100/80" title={t.trabajo||''}>{t.trabajo||'—'}</span><span className="min-w-0">{chip}</span><span className="whitespace-nowrap text-cyan-100/75">{formatoFecha(t.fecha_cita)}</span>
              </div>
            </div>;
          })}
        </div>
      </div>
      <div className="mt-3 flex justify-end"><Link href="/laboratorio" className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/45 bg-cyan-400/[.06] px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[.1em] text-cyan-100 shadow-[0_0_11px_rgba(34,211,238,.11)] transition hover:border-cyan-200 hover:bg-cyan-400/20"><FlaskConical className="h-3.5 w-3.5 text-cyan-300"/> Acceder</Link></div>
    </section>
  );
}

type CambioDB = {
  historial_cita_id: string;
  realizado_por: string | null;
  created_at: string | null;
  tipo_movimiento: string | null;
};
type CitaMartina = {
  id: string; event_id: string; calendar_id: string; paciente: string;
  motivo: string; fechaActividad: string; fechaCita: string | null;
};
const fechaMadrid = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit'
});
const mesES = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
const fechaCorta = new Intl.DateTimeFormat('es-ES', {day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Madrid'});
const normalizar = (s: string | null | undefined) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const esMartina = (s: string | null | undefined) => {
  const t = normalizar(s);
  return t === 'martina' || t === 'asistente virtual' || t === 'asistente_virtual' || t.includes('martina assistant');
};
const idDeCita = (c: CitaDB) => `${normalizar(c.calendar_id)}:${c.event_id || c.id}`;
const diaMadrid = (s: string | null | undefined) => {
  if (!s || Number.isNaN(new Date(s).getTime())) return '';
  return fechaMadrid.format(new Date(s));
};
function moverDia(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function lunesSemana(d: Date) { const x = new Date(d.getFullYear(),d.getMonth(),d.getDate(),12); return moverDia(x,-((x.getDay()+6)%7)); }
function claveLocal(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function esPrimeraVisita(m: string | null) { return /primera\s+visita|primera\s+consulta/.test(normalizar(m)); }
function profesionalGrupo(c: CitaDB) { const agenda=normalizar(c.calendar_id||c.profesional); return agenda==='ana'?'ana':(agenda==='fede'||agenda==='celia'?'fede':'otro'); }
function estadoVigente(c: CitaDB) { return !['cancelada', 'no_ha_venido', 'no asistio'].includes(normalizar(c.estado)); }
function etiquetaEstado(e: string|null) {
  const s=normalizar(e);
  return ({finalizada:'Finalizada',pendiente:'Pendiente',cancelada:'Cancelada',no_ha_venido:'No asistió'} as Record<string,string>)[s] || (e||'Sin estado');
}
function EstadoConPunto({estado}: {estado:string | null}) {
  const base = 'inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium';
  const clave=normalizar(estado);
  const estilos: Record<string,{caja:string,punto:string}> = {
    pendiente:{caja:'border-amber-400/35 bg-amber-400/10 text-amber-100',punto:'bg-amber-400 shadow-[0_0_9px_rgba(251,191,36,.95)]'},
    finalizada:{caja:'border-green-400/35 bg-green-400/10 text-green-100',punto:'bg-green-400 shadow-[0_0_9px_rgba(74,222,128,.95)]'},
    no_ha_venido:{caja:'border-red-400/35 bg-red-400/10 text-red-100',punto:'bg-red-500 shadow-[0_0_9px_rgba(239,68,68,.95)]'},
    cancelada:{caja:'border-slate-400/30 bg-slate-400/10 text-slate-200',punto:'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,.6)]'}
  };
  const estilo=estilos[clave] || estilos.cancelada;
  return <span className={`${base} ${estilo.caja}`}><span className={`h-2 w-2 shrink-0 rounded-full ${estilo.punto}`}/>{etiquetaEstado(estado)}</span>;
}
async function leerTodas<T>(supa: NonNullable<ReturnType<typeof createClient>>, tabla: string, columnas:string):Promise<T[]> {
  const todos:T[]=[];
  for (let desde=0;desde<50000;desde+=1000) {
    const {data,error}=await supa.from(tabla).select(columnas).range(desde,desde+999);
    if(error) throw new Error(`${tabla}: ${error.message}`);
    const lote=(data||[]) as unknown as T[];
    todos.push(...lote);
    if(lote.length<1000) break;
  }
  return todos;
}
function compilarMartina(citas:CitaDB[], cambios:CambioDB[], historialCompleto:CitaDB[]) {
  // Solo Supabase: origen de creación o una intervención registrada por Martina.
  // Cada cita (agenda + event_id) se contabiliza una única vez.
  const primeraMod = new Map<string, string>();
  for (const m of cambios) {
    if (!esMartina(m.realizado_por) || !m.created_at) continue;
    const previa = primeraMod.get(m.historial_cita_id);
    if (!previa || m.created_at < previa) primeraMod.set(m.historial_cita_id, m.created_at);
  }

  // Si existen varias filas históricas de un mismo evento, una modificación
  // registrada sobre cualquiera de ellas sigue identificando la misma cita.
  const primeraModPorEvento = new Map<string, string>();
  for (const c of historialCompleto) {
    const fecha = primeraMod.get(c.id);
    if (!fecha) continue;
    const clave = idDeCita(c);
    const previa = primeraModPorEvento.get(clave);
    if (!previa || fecha < previa) primeraModPorEvento.set(clave, fecha);
  }

  const registros = new Map<string, CitaMartina>();
  for (const c of citas) {
    const esCreacion = esMartina(c.origen);
    const primera = primeraModPorEvento.get(idDeCita(c));
    if (!esCreacion && !primera) continue;

    const clave = idDeCita(c);
    const fechaActividad = (esCreacion ? c.created_at : primera) || c.updated_at || c.fecha_inicio;
    if (!fechaActividad) continue;

    registros.set(clave, {
      id: clave,
      event_id: c.event_id || c.id,
      calendar_id: normalizar(c.calendar_id),
      paciente: c.nombre_paciente || 'Paciente sin nombre',
      motivo: c.motivo || 'Sin motivo',
      fechaActividad,
      fechaCita: c.fecha_inicio,
    });
  }
  return Array.from(registros.values()).sort((a, b) =>
    new Date(b.fechaActividad).getTime() - new Date(a.fechaActividad).getTime()
  );
}

function CajaPendiente({titulo, icono:Icon}:{titulo:string;icono:typeof Bot}) {
  return (
    <section className="group relative flex min-h-[280px] flex-col overflow-hidden rounded-[28px] border border-cyan-400/30 bg-[radial-gradient(ellipse_at_85%_0%,rgba(15,111,128,.20),transparent_58%),linear-gradient(150deg,#062B35_0%,#031C25_55%,#02141B_100%)] p-5 text-white shadow-[0_12px_40px_rgba(0,0,0,.23),0_0_22px_rgba(34,211,238,.085),inset_0_1px_0_rgba(165,243,252,.07)] transition-shadow duration-300 hover:shadow-[0_14px_44px_rgba(0,0,0,.3),0_0_32px_rgba(34,211,238,.17)] sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-cyan-400/10 blur-[65px]" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/[.07] shadow-[0_0_22px_rgba(34,211,238,.12)]">
          <Icon className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_9px_rgba(103,232,249,.55)]" />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-[.18em] text-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,.28)]">{titulo}</h2>
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center gap-3 text-cyan-100/55">
        <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[.035] p-4">
          <ClipboardList className="h-7 w-7 text-cyan-300/45" />
        </div>
        <span className="text-xs tracking-wide">En desarrollo</span>
      </div>
    </section>
  );
}

const tarjetaGlow = 'relative overflow-hidden rounded-[28px] border border-cyan-400/30 bg-[radial-gradient(ellipse_at_92%_0%,rgba(18,117,134,.19),transparent_56%),linear-gradient(150deg,#062B35_0%,#031C25_60%,#02141B_100%)] text-white shadow-[0_12px_40px_rgba(0,0,0,.25),0_0_25px_rgba(34,211,238,.09),inset_0_1px_0_rgba(165,243,252,.065)]';
const scrollCyan = '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-cyan-950/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-500/55 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-300/80';

interface Props {
  initialConvs?: unknown[];
  initialRecs?: unknown[];
  initialRecalls?: unknown[];
}
const DashboardClientProvisional = (_props: Props) => {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [whatsappActivo, setWhatsappActivo] = useState(true);
  const [llamadasActivo, setLlamadasActivo] = useState(true);
  const [guardandoCanal, setGuardandoCanal] = useState<CanalMartina | null>(null);


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
  (async () => {
    const config = await getConfiguracionMartina();

    const whatsapp = config.find(c => c.canal === 'whatsapp');
    const llamadas = config.find(c => c.canal === 'llamadas');

    if (whatsapp) setWhatsappActivo(whatsapp.activo);
    if (llamadas) setLlamadasActivo(llamadas.activo);
  })();
}, []);

  


  // Datos del panel: consultas exclusivamente de lectura.
  const [citas,setCitas]=useState<CitaDB[]>([]);
  const [cambios,setCambios]=useState<CambioDB[]>([]);
  const [cargando,setCargando]=useState(true);
  const [errorDatos,setErrorDatos]=useState('');
  const [desplazamiento,setDesplazamiento]=useState(0);
  const [mostrarFinde,setMostrarFinde]=useState(false);
  const [inspeccionar,setInspeccionar]=useState(false);
  const [anioInspeccion,setAnioInspeccion]=useState(String(new Date().getFullYear()));
  const [mesInspeccion,setMesInspeccion]=useState(String(new Date().getMonth()+1));
  const [profInspeccion,setProfInspeccion]=useState('todos');
  const [estadoInspeccion,setEstadoInspeccion]=useState('vigentes');
  const [motivoInspeccion,setMotivoInspeccion]=useState('todos');
  const [buscarInspeccion,setBuscarInspeccion]=useState('');
  const [filtroAbierto,setFiltroAbierto]=useState<string | null>(null);
  const [fechaBase]=useState(()=>lunesSemana(new Date()));
  useEffect(()=>{
    let vivo=true;
    async function cargar(){
      const supa=createClient();
      if(!supa){if(vivo){setErrorDatos('No se ha establecido conexión con Supabase.');setCargando(false);}return;}
      try {
        const [cs,ms]=await Promise.all([
          leerTodas<CitaDB>(supa,'historial_citas','id,event_id,calendar_id,profesional,nombre_paciente,motivo,estado,origen,fecha_inicio,fecha_fin,created_at,updated_at'),
          leerTodas<CambioDB>(supa,'historial_citas_cambios','historial_cita_id,realizado_por,created_at,tipo_movimiento')
        ]);
        if(vivo){setCitas(cs);setCambios(ms);setErrorDatos('');}
      } catch(e) {if(vivo)setErrorDatos(e instanceof Error?e.message:'Error al cargar estadísticas');}
      finally {if(vivo)setCargando(false);}
    }
    void cargar();
    return ()=>{vivo=false;};
  },[]);
  const citasUnicas=useMemo(()=>{
    const porEvento=new Map<string,CitaDB>();
    for(const c of citas){
      const key=idDeCita(c), anterior=porEvento.get(key);
      if(!anterior || (c.updated_at||c.created_at||'')>(anterior.updated_at||anterior.created_at||'')) porEvento.set(key,c);
    }
    return Array.from(porEvento.values());
  },[citas]);
  const martina=useMemo(()=>compilarMartina(citasUnicas,cambios,citas),[citasUnicas,cambios,citas]);
  const lunes=useMemo(()=>moverDia(fechaBase,desplazamiento*7),[fechaBase,desplazamiento]);
  const dias=useMemo(()=>Array.from({length:mostrarFinde?7:5},(_,i)=>moverDia(lunes,i)),[lunes,mostrarFinde]);
  const diasClave=useMemo(()=>new Set(dias.map(claveLocal)),[dias]);
  const citasSemana=useMemo(()=>martina.filter(c=>diasClave.has(diaMadrid(c.fechaCita))),[martina,diasClave]);
  const barras=useMemo(()=>dias.map(d=>citasSemana.filter(c=>diaMadrid(c.fechaCita)===claveLocal(d)).length),[dias,citasSemana]);
  const mayorBarra=Math.max(5,...barras);
  // Resumen clínico anual: Dr. Federico incluye histórico de Celia internamente.
  // Ningún total clínico incluye canceladas ni no asistidas.
  const anioActual=String(new Date().getFullYear());
  const clinicaAnual=useMemo(()=>citasUnicas.filter(c=>estadoVigente(c) && diaMadrid(c.fecha_inicio).slice(0,4)===anioActual),[citasUnicas,anioActual]);
  const totalFede=clinicaAnual.filter(c=>profesionalGrupo(c)==='fede').length;
  const totalAna=clinicaAnual.filter(c=>profesionalGrupo(c)==='ana').length;
  const opcionesAnios=Array.from(new Set(['2026',anioActual,...citasUnicas.map(c=>diaMadrid(c.fecha_inicio).slice(0,4)).filter(Boolean)])).sort().reverse();
  const inspeccion=useMemo(()=>citasUnicas.filter(c=>{
    const fecha=diaMadrid(c.fecha_inicio);
    if(fecha.slice(0,4)!==anioInspeccion)return false;
    if(mesInspeccion!=='todos'&&Number(fecha.slice(5,7))!==Number(mesInspeccion))return false;
    if(profInspeccion!=='todos'&&profesionalGrupo(c)!==profInspeccion)return false;
    if(estadoInspeccion==='vigentes'&&!estadoVigente(c))return false;
    if(estadoInspeccion!=='todos'&&estadoInspeccion!=='vigentes'&&normalizar(c.estado)!==estadoInspeccion)return false;
    if(motivoInspeccion==='primera'&&!esPrimeraVisita(c.motivo))return false;
    if(motivoInspeccion==='otras'&&esPrimeraVisita(c.motivo))return false;
    if(buscarInspeccion&&!normalizar(`${c.nombre_paciente} ${c.motivo}`).includes(normalizar(buscarInspeccion)))return false;
    return true;
  }).sort((a,b)=>(a.fecha_inicio||'').localeCompare(b.fecha_inicio||'')),[citasUnicas,anioInspeccion,mesInspeccion,profInspeccion,estadoInspeccion,motivoInspeccion,buscarInspeccion]);

  const toggleCanal = async (canal: CanalMartina) => {
  const nuevoEstado =
    canal === 'whatsapp'
      ? !whatsappActivo
      : !llamadasActivo;

  setGuardandoCanal(canal);

  const actualizado = await updateCanalMartina(
    canal,
    nuevoEstado,
    nombreUsuario || null
  );

  setGuardandoCanal(null);

  if (!actualizado) return;

  if (canal === 'whatsapp') {
    setWhatsappActivo(actualizado.activo);
  } else {
    setLlamadasActivo(actualizado.activo);
  }
};



  // Primeras visitas: TODAS las no canceladas, incluso las programadas y las
  // reservadas por Martina; el estado del filtro principal no las limita.
  const primerasVisitasPeriodo=useMemo(()=>citasUnicas.filter(c=>{
    const fecha=diaMadrid(c.fecha_inicio);
    return estadoVigente(c) && esPrimeraVisita(c.motivo)
      && fecha.slice(0,4)===anioInspeccion
      && (mesInspeccion==='todos'||Number(fecha.slice(5,7))===Number(mesInspeccion))
      && (profInspeccion==='todos'||profesionalGrupo(c)===profInspeccion);
  }).length,[citasUnicas,anioInspeccion,mesInspeccion,profInspeccion]);

  // La vista de escritorio y móvil comparten componentes y datos, pero las
  // clases responsive evitan desbordamientos en pantallas pequeñas.
  const contenido = (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-7">
<section className="relative overflow-hidden rounded-[28px] border border-cyan-400/35 bg-[#031B24] p-4 text-white shadow-[0_12px_35px_rgba(0,0,0,.3),0_0_19px_rgba(34,211,238,.075),inset_0_1px_0_rgba(165,243,252,.045)] sm:p-5">
        {/* Título fino, halo del icono y caja oscura: sin gradiente luminoso superior. */}
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/[.055] shadow-[0_0_22px_rgba(34,211,238,.17)] sm:h-10 sm:w-10">
              <CalendarCheck2 className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,.75)]" />
            </div>
            
<h2 className="text-[11px] font-normal uppercase tracking-[.08em] text-cyan-200 drop-shadow-[0_0_9px_rgba(34,211,238,.48)] sm:text-sm sm:tracking-[.10em]">
  CITAS CREADAS
</h2>
          </div>
<div className="group shrink-0 rounded-xl border border-cyan-300/45 bg-[#082B35] px-2.5 py-1.5 text-center shadow-[0_0_12px_rgba(34,211,238,.10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/90 hover:bg-[#0A3541] hover:shadow-[0_0_18px_rgba(34,211,238,.40),0_0_30px_rgba(34,211,238,.13)] sm:px-3 sm:py-2">
            <div className="flex items-baseline justify-center gap-2 sm:gap-3">
              <span className="text-[9px] font-normal uppercase tracking-[.12em] text-cyan-100/70 sm:text-[10px]">TOTAL</span>
              <strong className="text-[26px] font-semibold leading-none tabular-nums text-white sm:text-[30px]">{cargando?'…':martina.length}</strong>
            </div>
            <div className="mt-1 text-[9px] leading-tight text-cyan-100/65 sm:text-[10px]">Gestionadas por Martina</div>
          </div>
        </div>

        {/* Separador cyan glow fino y selector semanal compacto. */}
        <div aria-hidden="true" className="mt-3 h-px w-full bg-cyan-300/65 shadow-[0_0_9px_rgba(34,211,238,.72)] sm:mt-3" />
        <div className="mt-2.5 flex items-center justify-center gap-3 sm:mt-3 sm:gap-5">
          <button type="button" aria-label="Semana anterior" onClick={()=>setDesplazamiento(n=>n-1)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/45 bg-cyan-400/[.06] text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,.08)] transition hover:border-cyan-200 hover:bg-cyan-400/15"><ChevronLeft className="h-4 w-4"/></button>
          <div className="min-w-[116px] text-center text-sm font-normal tabular-nums text-white sm:min-w-[144px] sm:text-base">{mesES.format(lunes)} – {mesES.format(dias[dias.length-1])}</div>
          <button type="button" aria-label="Semana siguiente" disabled={desplazamiento>=0} onClick={()=>setDesplazamiento(n=>Math.min(0,n+1))} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/45 bg-cyan-400/[.06] text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button>
        </div>
        <div className="mt-1.5 text-center"><button type="button" onClick={()=>setMostrarFinde(v=>!v)} className="text-[10px] text-cyan-200/60 underline decoration-cyan-500/35 underline-offset-4 transition hover:text-cyan-100">{mostrarFinde?'Mostrar lunes a viernes':'Ver también sábado y domingo'}</button></div>

        <div className="mt-2.5 rounded-2xl border border-cyan-400/25 bg-[#062631] px-3 py-3 shadow-[inset_0_1px_0_rgba(165,243,252,.035)] sm:px-4">
          <div className="mb-2 text-xs font-medium text-cyan-100/80">Citas de Martina</div>
          <div className="flex h-[118px] items-end gap-2 sm:gap-3">
            {dias.map((d,i)=><div key={claveLocal(d)} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"><span className="text-[11px] tabular-nums text-cyan-100/80">{barras[i]}</span><div className="flex h-[84px] w-full items-end justify-center border-b border-cyan-400/20"><div className="w-full max-w-9 rounded-t-md bg-[linear-gradient(180deg,#67E8F9,#0891B2)] shadow-[0_0_14px_rgba(34,211,238,.24)]" style={{height:`${barras[i]===0 ? 0 : Math.max(3,barras[i]/mayorBarra*100)}%`}} /></div><span className="text-[11px] text-cyan-100/75">{['L','M','X','J','V','S','D'][i]}</span></div>)}
          </div>
        </div>

        {/* Tres contadores anuales; el histórico de Celia se agrupa internamente. */}
        <div className="mt-4">
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[.1em] text-cyan-200/85">Total citas clínica <span className="ml-1 font-normal tracking-normal text-cyan-100/55">{anioActual}</span></h3>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <div className="min-w-0 rounded-xl border border-cyan-400/25 bg-[#082B35] px-2 py-2.5 text-center sm:px-3"><div className="truncate text-[10px] text-cyan-100/70 sm:text-xs">Total</div><div className="mt-1 text-xl font-semibold tabular-nums text-white sm:text-2xl">{cargando?'…':errorDatos?'—':totalFede+totalAna}</div></div>
            <div className="min-w-0 rounded-xl border border-cyan-400/25 bg-[#082B35] px-2 py-2.5 text-center sm:px-3"><div className="truncate text-[10px] text-cyan-100/70 sm:text-xs">Dr. Federico</div><div className="mt-1 text-xl font-semibold tabular-nums text-white sm:text-2xl">{cargando?'…':errorDatos?'—':totalFede}</div></div>
            <div className="min-w-0 rounded-xl border border-cyan-400/25 bg-[#082B35] px-2 py-2.5 text-center sm:px-3"><div className="truncate text-[10px] text-cyan-100/70 sm:text-xs">Dra. Ana</div><div className="mt-1 text-xl font-semibold tabular-nums text-white sm:text-2xl">{cargando?'…':errorDatos?'—':totalAna}</div></div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-b border-cyan-400/20 pb-2 text-xs"><strong className="font-medium text-cyan-50">Citas de Martina</strong><span className="text-cyan-100/55">{citasSemana.length} en la semana</span></div>
        <div className={`mt-1 max-h-[140px] min-h-[35px] overflow-y-auto pr-1 ${scrollCyan}`}>
          {citasSemana.length===0?<p className="py-4 text-center text-xs text-cyan-100/50">Sin citas de Martina para esta semana</p>:
            citasSemana.map(c=><div key={c.id} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,.7fr)] items-center gap-2 border-b border-cyan-500/10 py-2.5 text-[11px] sm:text-xs"><span className="truncate text-white" title={c.paciente}>{c.paciente}</span><span className="truncate text-cyan-100/70" title={c.motivo}>{c.motivo}</span><span className="truncate text-right text-cyan-100/60">{c.calendar_id==='ana'?'Ana':'Federico'}</span></div>)}
        </div>
        {errorDatos?<p className="mt-2 flex gap-1 text-xs text-amber-200"><AlertCircle className="h-4 w-4 shrink-0"/>{errorDatos}. No se han podido actualizar las estadísticas desde Supabase.</p>:null}
        <div className="mt-2 flex justify-end"><button type="button" onClick={()=>setInspeccionar(true)} className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/45 bg-cyan-400/[.06] px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[.1em] text-cyan-100 shadow-[0_0_11px_rgba(34,211,238,.11)] transition hover:border-cyan-200 hover:bg-cyan-400/20 hover:shadow-[0_0_20px_rgba(34,211,238,.22)]"><ChartNoAxesCombined className="h-3.5 w-3.5 text-cyan-300"/> Inspeccionar</button></div>
      </section>
      <CajaPendiente titulo="SEGUIMIENTO" icono={HeartPulse}/>
      <CajaLaboratorio/>
      <CajaPendiente titulo="GESTIÓN MARTINA" icono={Bot}/>
    </div>
  );

  // Inspeccionar mantiene los filtros y los cálculos originales. Solo cambia la presentación.
  const inspector = inspeccionar ? (
    <div role="dialog" aria-modal="true" aria-label="Inspeccionar actividad clínica" className={`fixed inset-0 z-[100] overflow-y-auto bg-[#02141B]/95 px-2 py-4 text-white backdrop-blur-lg sm:px-6 sm:py-6 lg:px-10 lg:py-8 ${scrollCyan}`}>
      <div className="mx-auto max-w-6xl space-y-5 pb-10 sm:space-y-7">
        {/* Cabecera idéntica en lenguaje visual a Citas creadas; título blanco. */}
        <div className="flex items-center justify-between gap-3 border-b border-cyan-300/35 pb-3 shadow-[0_1px_0_rgba(34,211,238,.06)] sm:pb-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/[.055] shadow-[0_0_22px_rgba(34,211,238,.17)] sm:h-10 sm:w-10">
              <ChartNoAxesCombined className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,.75)]" />
            </span>
            <h2 className="text-base font-normal uppercase tracking-[.08em] text-white drop-shadow-[0_0_10px_rgba(34,211,238,.20)] sm:text-lg sm:tracking-[.10em]">INSPECCIONAR</h2>
          </div>
          <button type="button" onClick={()=>setInspeccionar(false)} aria-label="Cerrar Inspeccionar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/[.05] text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,.1)] transition hover:border-cyan-200 hover:bg-cyan-400/15 sm:h-10 sm:w-10"><X className="h-4 w-4 sm:h-5 sm:w-5"/></button>
        </div>

        {/* Filtros con menú Martina propio: colores cian en todas las opciones, también en Windows. */}
        <section className="relative z-30 rounded-[22px] border border-cyan-400/25 bg-cyan-400/[.035] px-3 py-3 shadow-[0_0_24px_rgba(34,211,238,.065),inset_0_1px_0_rgba(165,243,252,.035)] sm:px-5 sm:py-3.5">
          <h3 className="mb-2.5 text-[11px] font-normal uppercase tracking-[.12em] text-cyan-200 sm:mb-3 sm:text-xs">FILTROS DE ACTIVIDAD</h3>
          <div className="grid grid-cols-3 gap-x-2 gap-y-2.5 sm:gap-x-4 sm:gap-y-3 lg:grid-cols-5">
            {([
              {label:'Año',value:anioInspeccion,change:setAnioInspeccion,options:opcionesAnios.map(y=>({value:y,label:y}))},
              {label:'Mes',value:mesInspeccion,change:setMesInspeccion,options:[{value:'todos',label:'Todo el año'},...Array.from({length:12},(_,i)=>{const mes=new Intl.DateTimeFormat('es-ES',{month:'long'}).format(new Date(2026,i,1));return {value:String(i+1),label:mes.charAt(0).toUpperCase()+mes.slice(1)};})]},
              {label:'Profesional',value:profInspeccion,change:setProfInspeccion,options:[{value:'todos',label:'Todos'},{value:'fede',label:'Dr. Federico'},{value:'ana',label:'Dra. Ana'}]},
              {label:'Estado',value:estadoInspeccion,change:setEstadoInspeccion,options:[{value:'vigentes',label:'Vigentes'},{value:'finalizada',label:'Finalizadas'},{value:'pendiente',label:'Pendientes'},{value:'no_ha_venido',label:'No asistió'},{value:'cancelada',label:'Canceladas'},{value:'todos',label:'Todos los estados'}]},
              {label:'Tipo',value:motivoInspeccion,change:setMotivoInspeccion,options:[{value:'todos',label:'Todos'},{value:'primera',label:'Primeras visitas'},{value:'otras',label:'Otros tratamientos'}]},
            ] as {label:string;value:string;change:(v:string)=>void;options:{value:string;label:string}[]}[]).map((f,i)=>(
              <div key={f.label} className={`relative min-w-0 text-[11px] text-cyan-100/70 sm:text-xs ${i===4?'col-span-2 lg:col-span-1':''}`}>
                <span className="block">{f.label}</span>
                <button
                  type="button"
                  aria-label={`Filtrar por ${f.label.toLowerCase()}`}
                  aria-expanded={filtroAbierto===f.label}
                  aria-haspopup="listbox"
                  onClick={()=>setFiltroAbierto(actual=>actual===f.label?null:f.label)}
                  onKeyDown={e=>{if(e.key==='Escape')setFiltroAbierto(null);}}
                  className="relative mt-1 flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-cyan-400/30 bg-[#0A303B] pl-3 pr-3 text-left text-xs text-white shadow-[inset_0_1px_0_rgba(165,243,252,.04)] transition hover:border-cyan-300/65 hover:bg-[#0C3945] focus:border-cyan-300/75 focus:outline-none focus:ring-1 focus:ring-cyan-300/35 sm:mt-1.5 sm:h-10 sm:text-sm"
                >
                  <span className="min-w-0 truncate">{f.options.find(o=>o.value===f.value)?.label||'Seleccionar'}</span>
                  <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-cyan-300 transition-transform ${filtroAbierto===f.label?'rotate-180':''}`}/>
                </button>
                {filtroAbierto===f.label && (
                  <>
                    <button type="button" aria-label="Cerrar menú de filtros" className="fixed inset-0 z-40 cursor-default" onClick={()=>setFiltroAbierto(null)} />
                    <div role="listbox" aria-label={f.label} className={`absolute left-0 top-full z-50 mt-1.5 max-h-52 w-full min-w-[145px] overflow-y-auto rounded-xl border border-cyan-400/45 bg-[#082B36] p-1 shadow-[0_15px_35px_rgba(0,0,0,.60),0_0_20px_rgba(34,211,238,.18)] ${scrollCyan}`}>
                      {f.options.map(o=><button type="button" role="option" aria-selected={o.value===f.value} key={o.value} onClick={()=>{f.change(o.value);setFiltroAbierto(null);}} className={`block w-full rounded-lg px-3 py-2 text-left text-xs transition sm:text-sm ${o.value===f.value?'bg-cyan-400/20 font-medium text-cyan-100 shadow-[inset_2px_0_0_rgba(103,232,249,.8)]':'text-cyan-50/85 hover:bg-cyan-400/15 hover:text-white'}`}>{o.label}</button>)}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Indicadores más pequeños y separados: efecto flotante al pasar el ratón. */}
        <div className="grid grid-cols-4 items-center justify-items-center gap-x-1 gap-y-2 py-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-9 sm:py-3 lg:gap-14">
          {([['TOTAL FILTRADO',inspeccion.length],['DR. FEDERICO',inspeccion.filter(c=>profesionalGrupo(c)==='fede').length],['DRA. ANA',inspeccion.filter(c=>profesionalGrupo(c)==='ana').length],['PRIMERAS VISITAS',primerasVisitasPeriodo]] as [string,number][]).map(([titulo,valor])=>(
            <div key={titulo} className="group flex h-[clamp(65px,20vw,88px)] w-[clamp(65px,20vw,88px)] min-w-0 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border border-cyan-300/35 bg-[radial-gradient(circle_at_50%_35%,#0E3945_0%,#05232D_75%,#031820_100%)] px-2 text-center shadow-[0_0_14px_rgba(34,211,238,.08),inset_0_0_14px_rgba(34,211,238,.045)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/85 hover:shadow-[0_0_18px_rgba(34,211,238,.38),0_0_38px_rgba(34,211,238,.20),inset_0_0_20px_rgba(34,211,238,.10)] sm:h-[120px] sm:w-[120px]">
              <strong className="text-[clamp(19px,5.8vw,26px)] font-semibold leading-none tabular-nums text-white drop-shadow-[0_0_12px_rgba(103,232,249,.15)] sm:text-[31px]">{valor}</strong>
              <span className="max-w-[94px] px-0.5 text-[clamp(6px,1.85vw,8px)] font-medium uppercase leading-tight tracking-[.015em] text-cyan-200/80 group-hover:text-cyan-100 sm:max-w-[112px] sm:text-[9px] sm:tracking-[.035em]">{titulo}</span>
            </div>
          ))}
        </div>

        {/* Cabecera del detalle más oscura que el encabezado de la tabla, estilo barra de acciones. */}
        <section className="overflow-hidden rounded-[26px] border border-cyan-400/30 bg-[#041D26] shadow-[0_0_26px_rgba(34,211,238,.075),inset_0_1px_0_rgba(165,243,252,.05)]">
          <div className="flex flex-col gap-3 border-b border-cyan-400/20 bg-[#021820] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <h3 className="text-xs font-medium uppercase tracking-[.11em] text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,.55)] sm:text-sm">DETALLE DE CITAS</h3>
            <label className="flex w-full items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/[.045] px-3 py-2 text-xs shadow-[0_0_16px_rgba(34,211,238,.09)] transition focus-within:border-cyan-200 focus-within:shadow-[0_0_22px_rgba(34,211,238,.18)] sm:w-auto sm:px-4">
              <Search className="h-4 w-4 shrink-0 text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,.65)]" />
              <input aria-label="Buscar paciente o tratamiento" value={buscarInspeccion} onChange={e=>setBuscarInspeccion(e.target.value)} placeholder="Buscar paciente o tratamiento" className="min-w-0 w-full bg-transparent text-white outline-none placeholder:text-cyan-100/40 sm:w-52" />
            </label>
          </div>
          <div className={`max-h-[55vh] overflow-auto ${scrollCyan}`}>
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="sticky top-0 bg-[#0B3540] text-cyan-200"><tr>{['Fecha','Paciente','Motivo','Profesional','Estado'].map(t=><th key={t} className="px-4 py-4 font-semibold uppercase tracking-[.11em]">{t}</th>)}</tr></thead>
              <tbody>{inspeccion.map(c=><tr key={c.id} className="border-t border-cyan-500/10 transition hover:bg-cyan-400/[.055]"><td className="px-4 py-3.5">{c.fecha_inicio?fechaCorta.format(new Date(c.fecha_inicio)):'—'}</td><td className="px-4 py-3.5 text-white">{c.nombre_paciente||'—'}</td><td className="px-4 py-3.5 text-cyan-100/75">{c.motivo||'—'}</td><td className="px-4 py-3.5">{profesionalGrupo(c)==='ana'?'Dra. Ana':profesionalGrupo(c)==='fede'?'Dr. Federico':'Otro'}</td><td className="px-4 py-3.5"><EstadoConPunto estado={c.estado}/></td></tr>)}{inspeccion.length===0?<tr><td className="p-8 text-center text-cyan-100/50" colSpan={5}>{cargando?'Cargando…':'Sin citas para estos filtros'}</td></tr>:null}</tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  ) : null;


return (
  <>
    {/* DESKTOP */}
    <div className="hidden lg:block h-full overflow-y-auto p-8 pb-24 bg-[#02141B] text-white">
      <div className="mb-10 flex items-center justify-between gap-8">
        <div>
          <h1 className="mb-4 flex items-center gap-2 text-[2rem] leading-none font-bold text-white whitespace-nowrap">
      ¡Hola {nombreUsuario || '...'}!
      <span className="text-cyan-300 text-[1.35rem] drop-shadow-[0_0_12px_rgba(34,211,238,.8)]">
        ✦
      </span>
    </h1>

          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-2.5 text-cyan-100 text-sm font-medium shadow-[0_0_20px_rgba(34,211,238,.08)]">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                whatsappActivo || llamadasActivo
                  ? 'bg-cyan-300 animate-pulse shadow-[0_0_12px_rgba(34,211,238,.95)]'
                  : 'bg-slate-500'
              )}
            />

            {whatsappActivo && llamadasActivo
              ? 'Martina activa'
              : whatsappActivo
                ? 'Martina WhatsApp activa'
                : llamadasActivo
                  ? 'Martina llamadas activa'
                  : 'Martina inactiva'}
          </div>
        </div>

        <div className="flex items-center gap-8 pr-20">
          <button
            type="button"
            onClick={() => toggleCanal('whatsapp')}
            disabled={guardandoCanal === 'whatsapp'}
            title={whatsappActivo ? 'Desactivar WhatsApp' : 'Activar WhatsApp'}
            className={cn(
              'w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-300',
              whatsappActivo
                ? 'bg-[radial-gradient(circle_at_35%_30%,#1A6C78_0%,#0D4450_45%,#072B34_100%)] border-cyan-200/80 text-white shadow-[0_0_12px_rgba(34,211,238,.65),0_0_28px_rgba(34,211,238,.30),inset_0_0_12px_rgba(255,255,255,.18)]'
                : 'bg-white/5 border-cyan-500/15 text-cyan-100/35'
            )}
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => toggleCanal('llamadas')}
            disabled={guardandoCanal === 'llamadas'}
            title={llamadasActivo ? 'Desactivar llamadas' : 'Activar llamadas'}
            className={cn(
              'w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-300',
              llamadasActivo
                ? 'bg-[radial-gradient(circle_at_35%_30%,#1A6C78_0%,#0D4450_45%,#072B34_100%)] border-cyan-200/80 text-white shadow-[0_0_12px_rgba(34,211,238,.65),0_0_28px_rgba(34,211,238,.30),inset_0_0_12px_rgba(255,255,255,.18)]'
                : 'bg-white/5 border-cyan-500/15 text-cyan-100/35'
            )}
          >
            <PhoneCall className="w-6 h-6" />
          </button>
        </div>
      </div>

      {contenido}
    </div>
    {/* MOBILE */}
    <div className="lg:hidden h-[calc(100dvh-190px)] overflow-y-auto bg-[#02141B] text-white px-3 pt-6 pb-32 overflow-x-hidden">
  <div className="mb-7">    
<h1 className="flex items-center gap-2 text-[2rem] leading-none font-bold text-white whitespace-nowrap">
      ¡Hola {nombreUsuario || '...'}!
      <span className="text-cyan-300 text-[1.35rem] drop-shadow-[0_0_12px_rgba(34,211,238,.8)]">
        ✦
      </span>
    </h1>


    <div className="mt-5 flex items-center justify-between gap-4">
      <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-cyan-100 text-sm font-medium shadow-[0_0_20px_rgba(34,211,238,.08)] whitespace-nowrap">
        <span
          className={cn(
            'w-2.5 h-2.5 rounded-full shrink-0',
            whatsappActivo || llamadasActivo
              ? 'bg-cyan-300 animate-pulse shadow-[0_0_12px_rgba(34,211,238,.95)]'
              : 'bg-slate-500'
          )}
        />
        Martina activa
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => toggleCanal('whatsapp')}
          disabled={guardandoCanal === 'whatsapp'}
          className={cn(
            'w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-300',
            whatsappActivo
              ? 'bg-[radial-gradient(circle_at_35%_30%,#1A6C78_0%,#0D4450_45%,#072B34_100%)] border-cyan-200/80 text-white shadow-[0_0_14px_rgba(34,211,238,.65)]'
              : 'bg-white/5 border-cyan-500/15 text-cyan-100/35'
          )}
        >
          <MessageCircle className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={() => toggleCanal('llamadas')}
          disabled={guardandoCanal === 'llamadas'}
          className={cn(
            'w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-300',
            llamadasActivo
              ? 'bg-[radial-gradient(circle_at_35%_30%,#1A6C78_0%,#0D4450_45%,#072B34_100%)] border-cyan-200/80 text-white shadow-[0_0_14px_rgba(34,211,238,.65)]'
              : 'bg-white/5 border-cyan-500/15 text-cyan-100/35'
          )}
        >
          <PhoneCall className="w-6 h-6" />
        </button>
      </div>
    </div>
  </div>

      {contenido}
    </div>
    {inspector}
  </>
);
};

export default DashboardClientProvisional;


