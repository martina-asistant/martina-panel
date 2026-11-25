'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  MessageCircle, PhoneCall, CalendarCheck2, ChevronLeft, ChevronRight, ChevronDown,
  ChartNoAxesCombined, ClipboardList, FlaskConical, Bot, HeartPulse,
  X, Search, AlertCircle, UserRound, CalendarDays, Check, Plus, ClipboardCheck, CircleCheck, CircleX, Pencil
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
  id: string; patient_id: string | null; event_id: string | null; calendar_id: string | null;
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
        <div className="max-h-[420px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#155365_#031B24] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-[#031B24] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#155365] hover:[&::-webkit-scrollbar-thumb]:bg-[#216D80]">
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

// SEGUIMIENTO: solo las citas se leen de historial_citas; las acciones se registran
// en historial_seguimiento. No se escribe en Google Calendar ni en historial_citas.
type GestionSeguimiento = {
  id:string; historial_cita_id:string; patient_id:string; tipo_registro:string;
  fecha_gestion:string; canal_contacto:string|null; resultado:string|null;
  observaciones:string|null; financiacion_ofrecida:boolean;
  nueva_valoracion_propuesta:boolean; acepta_nuevo_contacto:boolean|null;
  fecha_proximo_contacto:string|null; motivo_no_continua:string|null;
  fin_tratamiento:boolean; gestionado_por:string; fecha_registro:string;
  registro_origen_id:string|null;
  presupuesto_entregado:boolean|null; financiacion_inicial_ofrecida:boolean|null; motivo_no_coge_cita:string|null; contactara_paciente:boolean|null;
};
type EstadoSeguimiento = 'pendiente'|'curso'|'finalizado'|'no_continua';
type FilaSeguimiento = {
  primera:CitaDB; proxima:CitaDB|null; estado:EstadoSeguimiento;
  gestiones:GestionSeguimiento[]; ultimo:GestionSeguimiento|null;
  finActivo:GestionSeguimiento|null; fechaContacto:string|null;
  estadoTexto:string; alerta:boolean;
};
const scrollSeguimiento = '[scrollbar-width:thin] [scrollbar-color:#155365_#031B24] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-[#031B24] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#155365] hover:[&::-webkit-scrollbar-thumb]:bg-[#216D80]';
const estilosSeg = {
  pendiente:{dot:'bg-red-600',color:'text-red-300',hex:'#DC2626',capsula:'border-red-500/40 bg-red-500/[.09] text-red-200'},
  curso:{dot:'bg-yellow-400',color:'text-yellow-200',hex:'#FACC15',capsula:'border-yellow-400/40 bg-yellow-400/[.09] text-yellow-100'},
  finalizado:{dot:'bg-green-400',color:'text-green-200',hex:'#4ADE80',capsula:'border-green-400/40 bg-green-400/[.09] text-green-100'},
  no_continua:{dot:'bg-violet-400',color:'text-violet-200',hex:'#A78BFA',capsula:'border-violet-400/40 bg-violet-400/[.09] text-violet-100'}
};
function fechaCitaSeg(fecha:string|null) {
  return fecha ? new Date(fecha).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'2-digit',timeZone:'Europe/Madrid'}) : 'Sin cita';
}
function fechaGestionSeg(fecha:string|null) {
  if(!fecha)return '—';
  const [a,m,d]=fecha.split('-');
  return a&&m&&d ? `${d}/${m}/${a}` : fecha;
}
function siguienteLaborable(fechaISO:string) {
  const d=new Date(`${fechaISO}T12:00:00Z`);
  if(Number.isNaN(d.getTime()))return '';
  do {d.setUTCDate(d.getUTCDate()+1);} while ([0,6].includes(d.getUTCDay()));
  return d.toISOString().slice(0,10);
}
function clasificarSeguimiento(citas:CitaDB[],gestiones:GestionSeguimiento[],hoy:string):FilaSeguimiento[] {
  const porPaciente=new Map<string,CitaDB[]>();
  for(const c of citas){
    if(!c.patient_id)continue;
    const arr=porPaciente.get(c.patient_id)||[];
    arr.push(c);porPaciente.set(c.patient_id,arr);
  }
  const porVisita=new Map<string,GestionSeguimiento[]>();
  for(const g of gestiones){
    const arr=porVisita.get(g.historial_cita_id)||[];
    arr.push(g);porVisita.set(g.historial_cita_id,arr);
  }
  return citas.filter(c=>Boolean(c.patient_id&&c.fecha_inicio)&&esPrimeraVisita(c.motivo)&&normalizar(c.estado)==='finalizada').map(primera=>{
    const historial=[...(porVisita.get(primera.id)||[])].sort((a,b)=>a.fecha_registro.localeCompare(b.fecha_registro)||a.id.localeCompare(b.id));
    const ult=historial[historial.length-1]||null;
    // La última decisión explícita de cierre o reapertura determina el cierre actual.
    let finActivo:GestionSeguimiento|null=null;
    let cerrado=false;
    for(const g of historial){
      if(g.tipo_registro==='fin_tratamiento')finActivo=g;
      if(g.tipo_registro==='rectificar_fin_tratamiento')finActivo=null;
      if(g.tipo_registro==='no_continua')cerrado=true;
      if(g.tipo_registro==='reabrir_seguimiento')cerrado=false;
    }
    const fechaPrimera=primera.fecha_inicio||'';
    const proxima=(porPaciente.get(primera.patient_id!)||[])
      .filter(c=>c.id!==primera.id && c.fecha_inicio && c.fecha_inicio>fechaPrimera
        && c.fecha_fin && new Date(c.fecha_fin).getTime()>Date.now() && normalizar(c.estado)!=='finalizada' && estadoVigente(c))
      .sort((a,b)=>(a.fecha_inicio||'').localeCompare(b.fecha_inicio||''))[0]||null;
    const estado:EstadoSeguimiento=finActivo?'finalizado':cerrado?'no_continua':proxima?'curso':'pendiente';
    const ultimaGestion=historial.filter(g=>g.tipo_registro==='gestion' && g.presupuesto_entregado==null && !['presupuesto_entregado','datos_iniciales'].includes(g.resultado||'')).sort((a,b)=>b.fecha_gestion.localeCompare(a.fecha_gestion)||b.fecha_registro.localeCompare(a.fecha_registro))[0]||null;
    const fechaContacto=ultimaGestion?.fecha_proximo_contacto||null;
    const contactoVencido=estado==='pendiente'&&Boolean(fechaContacto&&fechaContacto<=hoy);
    const sinGestionVencida=estado==='pendiente'&&!ultimaGestion&&Boolean(
      primera.fecha_inicio && hoy>=siguienteLaborable(diaMadrid(primera.fecha_inicio))
    );
    let estadoTexto='Sin gestionar';
    if(estado==='finalizado')estadoTexto='Finalizado';
    else if(estado==='no_continua')estadoTexto='No continúa';
    else if(estado==='curso')estadoTexto='En tratamiento';
    else if(contactoVencido)estadoTexto='Nuevo contacto sin realizar';
    else if(fechaContacto)estadoTexto=`Volver a contactar ${fechaGestionSeg(fechaContacto)}`;
    else if(ultimaGestion?.contactara_paciente)estadoTexto='Contactará el paciente';
    else if(ultimaGestion?.acepta_nuevo_contacto===false)estadoTexto='No acepta próximo contacto';
    else if(ultimaGestion)estadoTexto=ultimaGestion.resultado==='sin_respuesta'?'Sin respuesta':ultimaGestion.resultado==='no_contesta'?'No contesta':'En seguimiento';
    return {primera,proxima,estado,gestiones:historial,ultimo:ult,finActivo,fechaContacto,estadoTexto,alerta:contactoVencido||sinGestionVencida};
  }).sort((a,b)=>(b.primera.fecha_inicio||'').localeCompare(a.primera.fecha_inicio||''));
}
function DonutSeguimiento({valores}:{valores:number[]}) {
  // Sectores de una sola circunferencia: nunca se desplaza el centro de cada
  // porción, porque eso crea los huecos triangulares visibles en la versión anterior.
  const total = valores.reduce((a,b)=>a+b,0);
  const colores = [estilosSeg.pendiente.hex,estilosSeg.curso.hex,estilosSeg.finalizado.hex,estilosSeg.no_continua.hex];
  const activos = valores.filter(v=>v>0).length;
  const centro = 100;
  const radio = 81;
  let angulo = -90;
  const sectores = valores.flatMap((valor,i)=>{
    if(valor<=0 || total===0) return [];
    const amplitud = 360*valor/total;
    // Separación muy fina: los sectores comparten centro y radio.
    const margen = activos>1 ? Math.min(0.85,amplitud/10) : 0;
    const inicio = angulo+margen;
    const fin = angulo+amplitud-margen;
    angulo += amplitud;
    const punto = (grados:number) => {
      const rad=grados*Math.PI/180;
      return `${(centro+radio*Math.cos(rad)).toFixed(3)} ${(centro+radio*Math.sin(rad)).toFixed(3)}`;
    };
    const d = `M ${centro} ${centro} L ${punto(inicio)} A ${radio} ${radio} 0 ${fin-inicio>180?1:0} 1 ${punto(fin)} Z`;
    return [{id:i,d,color:colores[i]}];
  });
  return <svg viewBox="0 0 200 200" className="h-[142px] w-[142px] shrink-0 sm:h-[184px] sm:w-[184px]" role="img" aria-label={`Distribución de ${total} primeras visitas: ${valores[0]} pendientes, ${valores[1]} en tratamiento, ${valores[2]} finalizadas y ${valores[3]} no continúan`}>
    <defs>
      <filter id="martina-seguimiento-halo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>
    </defs>
    {activos===1 ? <>
      <circle cx={centro} cy={centro} r={radio} fill={colores[valores.findIndex(v=>v>0)]} opacity="0.35" filter="url(#martina-seguimiento-halo)"/>
      <circle cx={centro} cy={centro} r={radio} fill={colores[valores.findIndex(v=>v>0)]}/>
    </> : sectores.map(p=><g key={p.id}>
      <path d={p.d} fill={p.color} opacity="0.35" filter="url(#martina-seguimiento-halo)"/>
      <path d={p.d} fill={p.color}/>
    </g>)}
    {total===0&&<circle cx={centro} cy={centro} r={radio} fill="#0A303B" stroke="#145063" strokeWidth="1"/>}
  </svg>;
}

const campoSeg='flex min-h-8 w-full items-center gap-2 rounded-xl border border-cyan-400/35 bg-[#0A303B] px-3 py-1.5 text-left text-xs lg:text-sm text-white transition hover:border-cyan-300/75 hover:shadow-[0_0_12px_rgba(34,211,238,.18)]';
const botonSeg='inline-flex items-center justify-center gap-1.5 rounded-full border border-cyan-300/45 bg-cyan-400/[.07] px-3 py-1.5 text-xs lg:text-sm text-cyan-100 transition hover:bg-cyan-400/20 hover:shadow-[0_0_15px_rgba(34,211,238,.22)] disabled:opacity-40';
const motivosSeg=['Motivos económicos','Necesita consultarlo','Está comparando clínicas','Otro motivo'];
const resultadosSeg:Record<string,{label:string,dot:string}>={no_contesta:{label:'No contesta',dot:'bg-red-500'},pendiente_respuesta:{label:'Pendiente de respuesta',dot:'bg-yellow-400'},valorando_presupuesto:{label:'Valorando presupuesto',dot:'bg-yellow-400'},ha_cogido_cita:{label:'Ha cogido cita',dot:'bg-green-400'},no_continua:{label:'No continúa',dot:'bg-violet-400'}};
function SelectorSeg({valor,opciones,cambiar,placeholder}:{valor:string;opciones:{value:string;label:string;dot?:string}[];cambiar:(v:string)=>void;placeholder:string}){
  const [abierto,setAbierto]=useState(false);const actual=opciones.find(o=>o.value===valor);
  return <div className="relative"><button type="button" aria-expanded={abierto} onClick={()=>setAbierto(v=>!v)} className={campoSeg}>{actual?.dot&&<span className={`h-2 w-2 rounded-full ${actual.dot}`}/>}<span className="flex-1">{actual?.label||placeholder}</span><ChevronDown className="h-4 w-4 text-cyan-300"/></button>{abierto&&<><button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Cerrar opciones" onClick={()=>setAbierto(false)}/><div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-cyan-400/45 bg-[#082B36] p-1 shadow-[0_8px_30px_rgba(0,0,0,.6),0_0_16px_rgba(34,211,238,.16)]">{opciones.map(o=><button key={o.value} type="button" onClick={()=>{cambiar(o.value);setAbierto(false)}} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs lg:text-sm hover:bg-cyan-400/15 ${valor===o.value?'bg-cyan-400/10':''}`}>{o.dot&&<span className={`h-2 w-2 rounded-full ${o.dot}`}/>}<span className="flex-1">{o.label}</span>{valor===o.value&&<Check className="h-3.5 w-3.5 text-cyan-300"/>}</button>)}</div></>}</div>;
}
function CalendarioSeg({valor,cambiar,min,max}:{valor:string;cambiar:(v:string)=>void;min?:string;max?:string}){
  const [abierto,setAbierto]=useState(false);const [mes,setMes]=useState(()=>new Date());
  const y=mes.getFullYear(),m=mes.getMonth(),inicio=(new Date(y,m,1).getDay()+6)%7,dias=new Date(y,m+1,0).getDate(),hoy=diaMadrid(new Date().toISOString());
  return <div className="relative"><button type="button" aria-expanded={abierto} className={campoSeg} onClick={()=>{if(!abierto)setMes(new Date(`${valor||hoy}T12:00:00`));setAbierto(v=>!v)}}><CalendarDays className="h-4 w-4 text-cyan-300"/><span className="flex-1">{valor?fechaGestionSeg(valor):'Seleccionar fecha'}</span><ChevronDown className="h-4 w-4 text-cyan-300"/></button>{abierto&&<><button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Cerrar calendario" onClick={()=>setAbierto(false)}/><div className="absolute left-1/2 top-full z-50 mt-1 w-[230px] -translate-x-1/2 rounded-xl border border-cyan-400/45 bg-[#062631] p-3 shadow-[0_8px_30px_rgba(0,0,0,.6),0_0_15px_rgba(34,211,238,.18)]"><div className="mb-2 flex items-center justify-between border-b border-cyan-400/25 pb-2 text-xs lg:text-sm uppercase text-cyan-200"><button type="button" aria-label="Mes anterior" onClick={()=>setMes(new Date(y,m-1,1))}><ChevronLeft className="h-4 w-4"/></button>{mes.toLocaleDateString('es-ES',{month:'long',year:'numeric'})}<button type="button" aria-label="Mes siguiente" onClick={()=>setMes(new Date(y,m+1,1))}><ChevronRight className="h-4 w-4"/></button></div><div className="grid grid-cols-7 text-center text-[11px]">{['L','M','X','J','V','S','D'].map(d=><span key={d} className="pb-1 text-cyan-300/70">{d}</span>)}{Array.from({length:inicio},(_,i)=><span key={`e${i}`}/>)}{Array.from({length:dias},(_,i)=>{const f=claveLocal(new Date(y,m,i+1));return <button key={f} type="button" disabled={Boolean((min&&f<min)||(max&&f>max))} onClick={()=>{cambiar(f);setAbierto(false)}} className={`h-7 rounded-full hover:bg-cyan-400/20 disabled:opacity-25 ${f===valor?'bg-cyan-500/40 text-white':f===hoy?'border border-cyan-300 text-white':(inicio+i)%7>=5?'text-slate-400':'text-white'}`}>{i+1}</button>})}</div></div></>}</div>;
}

function CajaSeguimiento({citas,cargando,errorDatos}:{citas:CitaDB[];cargando:boolean;errorDatos:string}) {
  const [gestiones,setGestiones]=useState<GestionSeguimiento[]>([]);
  const [cargandoGestiones,setCargandoGestiones]=useState(true);
  const [errorSeg,setErrorSeg]=useState('');
  const [guardando,setGuardando]=useState<string|null>(null);
  const [expandida,setExpandida]=useState<string|null>(null);
  const [inspectorAbierto,setInspectorAbierto]=useState(false);
  const [filtroTablaSeguimiento,setFiltroTablaSeguimiento]=useState<'mes'|'todos'>('mes');
  const [ordenPaciente,setOrdenPaciente]=useState<'original'|'asc'|'desc'>('original');
  const [anio,setAnio]=useState(String(new Date().getFullYear()));
  const [mes,setMes]=useState('todos');
  const [situacion,setSituacion]=useState('todas');
  const [buscar,setBuscar]=useState('');
  const [menuFiltro,setMenuFiltro]=useState<string|null>(null);
  const [formulario,setFormulario]=useState(false);
  const [fechaGestion,setFechaGestion]=useState(()=>diaMadrid(new Date().toISOString()));
  const [canal,setCanal]=useState('llamada');
  const [resultado,setResultado]=useState('');
  const [observaciones,setObservaciones]=useState('');
  const [financiacion,setFinanciacion]=useState(false);
  const [valoracion,setValoracion]=useState(false);
  const [contacto,setContacto]=useState('');
  const [fechaContacto,setFechaContacto]=useState('');
  const [motivoCierre,setMotivoCierre]=useState('');
  const [otroCierre,setOtroCierre]=useState('');
  const [editarInicial,setEditarInicial]=useState(false);
  const [editarPresupuesto,setEditarPresupuesto]=useState(false);
  const [finInicial,setFinInicial]=useState<boolean|null>(null);
  const [motivoInicial,setMotivoInicial]=useState('');
  const [otroInicial,setOtroInicial]=useState('');
  const [errorGuardar,setErrorGuardar]=useState('');
  const hoy=diaMadrid(new Date().toISOString());
  const mesActual=hoy.slice(0,7);
  const cargandoTodo=cargando||cargandoGestiones;
  const errorTodo=errorDatos||errorSeg;
  useEffect(()=>{
    let activo=true;
    (async()=>{
      const supa=createClient();
      if(!supa){if(activo){setErrorSeg('Sin conexión con Supabase');setCargandoGestiones(false);}return;}
      try {
        const datos=await leerTodas<GestionSeguimiento>(supa,'historial_seguimiento','id,historial_cita_id,patient_id,tipo_registro,fecha_gestion,canal_contacto,resultado,observaciones,financiacion_ofrecida,nueva_valoracion_propuesta,acepta_nuevo_contacto,fecha_proximo_contacto,motivo_no_continua,fin_tratamiento,gestionado_por,fecha_registro,registro_origen_id,presupuesto_entregado,financiacion_inicial_ofrecida,motivo_no_coge_cita,contactara_paciente');
        if(activo){setGestiones(datos);setErrorSeg('');}
      }catch(e){if(activo)setErrorSeg(e instanceof Error?e.message:'No se pudo leer el historial de seguimiento');}
      finally{if(activo)setCargandoGestiones(false);}
    })();
    return ()=>{activo=false;};
  },[]);
  const registros=useMemo(()=>clasificarSeguimiento(citas,gestiones,hoy),[citas,gestiones,hoy]);
  // Excepción de la carga inicial: los cierres previos a este ajuste quedan solo en el histórico.
  const corteCierresIniciales=Date.parse('2026-11-25T15:59:53+01:00');
  const prioridadSeguimiento:Record<EstadoSeguimiento,number>={pendiente:0,curso:1,finalizado:2,no_continua:3};
  const datosMes=registros.filter(r=>{
    if(r.estado==='no_continua')return false;
    if(r.estado==='pendiente')return true;
    if(r.estado==='finalizado'){
      const cierre=r.finActivo?.fecha_registro;
      return Boolean(cierre && Date.parse(cierre)>=corteCierresIniciales && diaMadrid(cierre).slice(0,7)===mesActual);
    }
    return diaMadrid(r.primera.fecha_inicio).slice(0,7)===mesActual;
  }).sort((a,b)=>prioridadSeguimiento[a.estado]-prioridadSeguimiento[b.estado] || (a.primera.fecha_inicio||'').localeCompare(b.primera.fecha_inicio||''));
  const datosTablaSeguimiento=filtroTablaSeguimiento==='mes'
    ? datosMes.filter(r=>diaMadrid(r.primera.fecha_inicio).slice(0,7)===mesActual)
    : datosMes;
  const historico=[
    registros.filter(r=>r.estado==='pendiente').length,
    registros.filter(r=>r.estado==='curso').length,
    registros.filter(r=>r.estado==='finalizado').length,
    registros.filter(r=>r.estado==='no_continua').length
  ];
  const anos=[...new Set([hoy.slice(0,4),...registros.map(r=>diaMadrid(r.primera.fecha_inicio).slice(0,4)).filter(Boolean)])].sort().reverse();
  const filtrados=registros.filter(r=>{
    const fecha=diaMadrid(r.primera.fecha_inicio);
    return (anio==='todos'||fecha.slice(0,4)===anio)
      &&(mes==='todos'||Number(fecha.slice(5,7))===Number(mes))
      &&(situacion==='todas'||r.estado===situacion)
      &&(!buscar||normalizar(r.primera.nombre_paciente).includes(normalizar(buscar)));
  }).sort((a,b)=>{
    // El orden por nombre es opcional y solo afecta a Inspeccionar.
    if(ordenPaciente!=='original'||(a.estado===b.estado&&a.estado!=='curso')){
      const nombreA=(a.primera.nombre_paciente||'').trim();
      const nombreB=(b.primera.nombre_paciente||'').trim();
      if(!nombreA&&nombreB)return 1;
      if(nombreA&&!nombreB)return -1;
      const comparacion=nombreA.localeCompare(nombreB,'es',{sensitivity:'base'});
      if(comparacion)return ordenPaciente==='desc'?-comparacion:comparacion;
    }
    const prioridad=prioridadSeguimiento[a.estado]-prioridadSeguimiento[b.estado];
    if(prioridad)return prioridad;
    if(a.estado==='curso'&&b.estado==='curso'){
      const fechaA=a.proxima?.fecha_inicio?Date.parse(a.proxima.fecha_inicio):Infinity;
      const fechaB=b.proxima?.fecha_inicio?Date.parse(b.proxima.fecha_inicio):Infinity;
      const seguraA=Number.isFinite(fechaA)?fechaA:Infinity;
      const seguraB=Number.isFinite(fechaB)?fechaB:Infinity;
      if(seguraA!==seguraB)return seguraA<seguraB?-1:1;
    }
    return (b.primera.fecha_inicio||'').localeCompare(a.primera.fecha_inicio||'');
  });
  const circulos=[
    ['TOTAL',filtrados.length],['PENDIENTES',filtrados.filter(r=>r.estado==='pendiente').length],
    ['EN TRATAMIENTO',filtrados.filter(r=>r.estado==='curso').length],
    ['FINALIZADAS',filtrados.filter(r=>r.estado==='finalizado').length],
    ['NO CONTINÚAN',filtrados.filter(r=>r.estado==='no_continua').length]
  ] as [string,number][];
  const actualizar=async(registro:Record<string,unknown>,id:string)=>{
    if(guardando)return false;
    setGuardando(id);setErrorGuardar('');
    try{
      const supa=createClient();
      if(!supa)throw new Error('Sin conexión con Supabase');
      const {data,error}=await supa.from('historial_seguimiento').insert(registro).select('id,historial_cita_id,patient_id,tipo_registro,fecha_gestion,canal_contacto,resultado,observaciones,financiacion_ofrecida,nueva_valoracion_propuesta,acepta_nuevo_contacto,fecha_proximo_contacto,motivo_no_continua,fin_tratamiento,gestionado_por,fecha_registro,registro_origen_id,presupuesto_entregado,financiacion_inicial_ofrecida,motivo_no_coge_cita,contactara_paciente').single();
      if(error)throw error;
      if(!data)throw new Error('No se ha confirmado el guardado');
      setGestiones(v=>[...v,data as GestionSeguimiento]);
      return true;
    }catch(e){setErrorGuardar(e instanceof Error?e.message:'No se ha podido guardar');return false;}
    finally{setGuardando(null);}
  };
  const finTratamiento=async(r:FilaSeguimiento)=>{
    if(r.estado==='no_continua')return;
    if(r.finActivo){
      await actualizar({historial_cita_id:r.primera.id,tipo_registro:'rectificar_fin_tratamiento',registro_origen_id:r.finActivo.id},r.primera.id);
    }else{
      await actualizar({historial_cita_id:r.primera.id,tipo_registro:'fin_tratamiento',fin_tratamiento:true},r.primera.id);
    }
  };
  const resetFormulario=()=>{setFechaGestion(hoy);setCanal('llamada');setResultado('');setObservaciones('');setFinanciacion(false);setValoracion(false);setContacto('');setFechaContacto('');setMotivoCierre('');setOtroCierre('');setErrorGuardar('');};
  const desplegar=(r:FilaSeguimiento)=>{setExpandida(v=>v===r.primera.id?null:r.primera.id);setFormulario(false);setEditarInicial(false);setEditarPresupuesto(false);resetFormulario();};
  const necesitaFecha=['no_contesta','pendiente_respuesta'].includes(resultado)||(resultado==='valorando_presupuesto'&&contacto==='si');
  const registrar=async(r:FilaSeguimiento)=>{
    if(!resultado||!fechaGestion){setErrorGuardar('Selecciona fecha y resultado');return;}
    if(resultado==='valorando_presupuesto'&&!contacto){setErrorGuardar('Indica si acepta próximo contacto');return;}
    if(necesitaFecha&&(!fechaContacto||fechaContacto<fechaGestion)){setErrorGuardar('Selecciona una fecha válida para el próximo contacto');return;}
    if(resultado==='ha_cogido_cita'&&!r.proxima){setErrorGuardar('Registra primero la cita en Agenda y vuelve a abrir el Dashboard');return;}
    const motivo=motivoCierre==='Otro motivo'?otroCierre.trim():motivoCierre;
    if(resultado==='no_continua'&&!motivo){setErrorGuardar('Indica el motivo de cierre');return;}
    const ok=await actualizar({historial_cita_id:r.primera.id,tipo_registro:resultado==='no_continua'?'no_continua':'gestion',fecha_gestion:fechaGestion,canal_contacto:canal,resultado,observaciones:observaciones.trim()||null,financiacion_ofrecida:resultado==='valorando_presupuesto'&&financiacion,nueva_valoracion_propuesta:resultado==='valorando_presupuesto'&&valoracion,acepta_nuevo_contacto:resultado==='valorando_presupuesto'?contacto==='si':null,contactara_paciente:resultado==='valorando_presupuesto'?contacto==='paciente':null,fecha_proximo_contacto:necesitaFecha?fechaContacto:null,motivo_no_continua:resultado==='no_continua'?motivo:null},r.primera.id);
    if(ok){setFormulario(false);resetFormulario();}
  };
  const cambiarPresupuesto=async(r:FilaSeguimiento,valor:boolean,previo:GestionSeguimiento|undefined)=>{
    if(previo?.presupuesto_entregado===valor){setEditarPresupuesto(false);return;}
    const base={historial_cita_id:r.primera.id,presupuesto_entregado:valor};
    const registro=valor && r.finActivo?.presupuesto_entregado===false
      ? {...base,tipo_registro:'rectificar_fin_tratamiento',registro_origen_id:r.finActivo.id,fin_tratamiento:false}
      : !valor && !r.finActivo
      ? {...base,tipo_registro:'fin_tratamiento',fin_tratamiento:true}
      : {...base,tipo_registro:'gestion',resultado:valor?'presupuesto_entregado':'presupuesto_no_entregado',fin_tratamiento:false};
    if(await actualizar(registro,r.primera.id))setEditarPresupuesto(false);
  };
  const indicadorPresupuesto=(valor:boolean|null|undefined)=><span className={`inline-flex min-w-0 items-center gap-1.5 ${valor===true?'text-green-400':valor===false?'text-violet-400':'text-cyan-100/55'}`}>{valor===true?<CircleCheck className="h-4 w-4 shrink-0"/>:valor===false?<CircleX className="h-4 w-4 shrink-0"/>:null}<span>{valor===true?'Entregado':valor===false?'No entregado':'PTE Registro'}</span></span>;
  const fila=(r:FilaSeguimiento,esInspector:boolean)=>{
    const abierta=expandida===r.primera.id;
    const presupuesto=[...r.gestiones].reverse().find(g=>g.presupuesto_entregado!==null&&g.presupuesto_entregado!==undefined);
    const inicial=[...r.gestiones].reverse().find(g=>g.resultado==='datos_iniciales');
    const puedeGestionar=r.estado==='pendiente'||r.estado==='curso';
    const opcionesMotivo=motivosSeg.map(v=>({value:v,label:v}));
    const inputSeg='w-full rounded-xl border border-cyan-400/35 bg-[#0A303B] px-3 py-1.5 text-xs lg:text-sm text-white outline-none focus:border-cyan-300 placeholder:text-cyan-100/40';
    const labelSeg='mb-1 block text-xs lg:text-sm text-cyan-100/75';
    const capsula=(texto:string,activo:boolean,accion:()=>void,dot?:string)=><button key={texto} type="button" onClick={accion} className={`${botonSeg} ${activo?'border-cyan-300 bg-cyan-400/20 shadow-[0_0_12px_rgba(34,211,238,.2)]':''}`}>{dot&&<span className={`h-2 w-2 rounded-full ${dot}`}/ >}{texto}</button>;
        return <div key={r.primera.id} className="border-t border-cyan-500/10 transition-colors hover:bg-cyan-500/[.035]">
      <div className={`grid items-center gap-1.5 px-2 py-3 text-[11px] sm:gap-2 sm:px-3 sm:text-xs lg:px-4 lg:gap-4 lg:text-sm 2xl:text-[15px] ${esInspector?'grid-cols-[minmax(0,1.15fr)_48px_minmax(0,1.4fr)_34px_24px] sm:grid-cols-[minmax(0,1.35fr)_75px_minmax(0,1fr)_84px_28px] lg:grid-cols-[minmax(0,1.5fr)_minmax(125px,.85fr)_minmax(100px,.8fr)_minmax(0,1.65fr)_minmax(125px,.65fr)_32px] 2xl:grid-cols-[minmax(0,1.5fr)_minmax(145px,.9fr)_minmax(120px,.9fr)_minmax(0,1.65fr)_minmax(150px,.65fr)_36px]':'grid-cols-[minmax(0,1.4fr)_70px_minmax(0,1.05fr)_28px]'}`}>
        <span className="min-w-0 truncate font-medium text-white" title={r.primera.nombre_paciente||''}>{r.primera.nombre_paciente||'—'}</span>
        {esInspector&&<span className="hidden min-w-0 justify-center text-center text-xs lg:text-sm lg:flex">{indicadorPresupuesto(presupuesto?.presupuesto_entregado)}</span>}
        <span className={`whitespace-nowrap text-[10px] lg:text-center lg:text-xs 2xl:text-sm ${r.proxima?'text-cyan-100/75':r.estado==='finalizado'?'text-green-300':r.estado==='no_continua'?'text-violet-300':'text-red-300'}`}>{fechaCitaSeg(r.proxima?.fecha_inicio||null)}</span>
        <span className={`inline-flex min-w-0 items-center gap-1 rounded-full border px-1 py-1 text-[9px] sm:px-1.5 sm:text-[10px] leading-tight lg:w-full lg:max-w-full lg:gap-2 lg:px-2.5 lg:text-xs 2xl:text-sm ${estilosSeg[r.estado].capsula}`} title={r.estadoTexto}>
          <span className={`h-2 w-2 shrink-0 rounded-full ${estilosSeg[r.estado].dot}`}/><span className="min-w-0 whitespace-normal [overflow-wrap:normal] sm:break-words">{r.estadoTexto}</span>
        </span>
        {esInspector&&<label className="flex justify-center" title="FIN TRATAMIENTO"><input type="checkbox" checked={Boolean(r.finActivo)} disabled={Boolean(guardando)||r.estado==='no_continua'} onChange={()=>void finTratamiento(r)} aria-label={`FIN TRATAMIENTO ${r.primera.nombre_paciente||''}`} className="peer sr-only"/><span aria-hidden="true" className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-[3px] border-[1.5px] border-white bg-transparent text-transparent peer-checked:border-cyan-300 peer-checked:text-cyan-300 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-40"><Check className="h-3 w-3" strokeWidth={2.5}/></span></label>}
        <button type="button" onClick={()=>desplegar(r)} aria-label={`Historial de ${r.primera.nombre_paciente||'paciente'}`} aria-expanded={abierta} className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/[.06] text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-400/20">
          <ChevronDown className={`h-4 w-4 transition-transform ${abierta?'rotate-180':''}`}/>
        </button>
      </div>

      {abierta&&<div className="space-y-3 border-t border-cyan-500/10 bg-[#021820] px-3 py-3 sm:px-4">
        <div className="rounded-xl border border-cyan-400/30 bg-[#06232D] p-3 text-xs lg:text-sm">
          <div className="grid grid-cols-3 items-start gap-2 lg:gap-4">
            <div><span className={labelSeg}>Primera visita</span><div className="flex min-h-7 items-center">{fechaCitaSeg(r.primera.fecha_inicio)}</div></div>
            <div className="relative min-w-0"><span className={labelSeg}>Presupuesto</span><div className="flex min-h-7 flex-wrap items-center gap-1.5">{indicadorPresupuesto(presupuesto?.presupuesto_entregado)}<button type="button" disabled={Boolean(guardando)} aria-label="Editar presupuesto" aria-expanded={editarPresupuesto} onClick={()=>setEditarPresupuesto(v=>!v)} className="rounded p-1 text-cyan-300 hover:bg-cyan-400/15 disabled:opacity-40"><Pencil className="h-3.5 w-3.5"/></button></div>
              {editarPresupuesto&&<div className="absolute left-0 top-full z-30 mt-1 min-w-[155px] rounded-xl border border-cyan-400/45 bg-[#082B36] p-1 shadow-[0_8px_30px_rgba(0,0,0,.6),0_0_16px_rgba(34,211,238,.16)]">{[true,false].map(v=><button key={String(v)} type="button" disabled={Boolean(guardando)} onClick={()=>void cambiarPresupuesto(r,v,presupuesto)} className="flex w-full items-center rounded-lg px-2 py-2 text-left hover:bg-cyan-400/15 disabled:opacity-40">{indicadorPresupuesto(v)}</button>)}</div>}
            </div>
            <div><span className={labelSeg}>Próxima cita</span><div className={`flex min-h-7 items-center ${r.proxima?'text-cyan-100/75':r.estado==='finalizado'?'text-green-300':r.estado==='no_continua'?'text-violet-300':'text-red-300'}`}>{fechaCitaSeg(r.proxima?.fecha_inicio||null)}</div></div>
          </div>
          {presupuesto?.presupuesto_entregado===true&&<div className="mt-3 space-y-2 border-t border-cyan-400/20 pt-3"><div className="flex items-center justify-between gap-2"><span className="text-cyan-200">EXPLICACIÓN INICIAL DEL PRESUPUESTO</span><button type="button" className={botonSeg} onClick={()=>{setFinInicial(inicial?.financiacion_inicial_ofrecida??null);const m=inicial?.motivo_no_coge_cita||'';setMotivoInicial(m&&!motivosSeg.includes(m)?'Otro motivo':m);setOtroInicial(m&&!motivosSeg.includes(m)?m:'');setEditarInicial(v=>!v)}}>{editarInicial?'Cancelar':'Editar'}</button></div>
          {!editarInicial?<div className="text-cyan-100/80">Financiación: {inicial?.financiacion_inicial_ofrecida==null?'Sin registrar':inicial.financiacion_inicial_ofrecida?'Sí':'No'}{!r.proxima&&<p className="mt-1">Motivo: {inicial?.motivo_no_coge_cita||'Sin registrar'}</p>}</div>:<><div className="flex flex-wrap items-center gap-2"><span>¿Se ha ofrecido financiación?</span>{capsula('Sí',finInicial===true,()=>setFinInicial(true))}{capsula('No',finInicial===false,()=>setFinInicial(false))}</div>{!r.proxima&&<><span className={labelSeg}>Motivo por el que no ha cogido cita</span><SelectorSeg valor={motivoInicial} opciones={opcionesMotivo} cambiar={setMotivoInicial} placeholder="Seleccionar motivo"/>{motivoInicial==='Otro motivo'&&<input className={inputSeg} value={otroInicial} onChange={e=>setOtroInicial(e.target.value)} placeholder="Especificar motivo"/>}</>}<button type="button" disabled={Boolean(guardando)} className={botonSeg} onClick={async()=>{if(motivoInicial==='Otro motivo'&&!otroInicial.trim()){setErrorGuardar('Especifica el motivo');return;}if(await actualizar({historial_cita_id:r.primera.id,tipo_registro:'gestion',resultado:'datos_iniciales',financiacion_inicial_ofrecida:finInicial,motivo_no_coge_cita:motivoInicial==='Otro motivo'?otroInicial.trim():motivoInicial||null},r.primera.id))setEditarInicial(false)}}>Guardar información inicial</button></>}
          </div>}
        <div className="mt-3 border-t border-cyan-400/25 pt-3"><div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-cyan-400/25 pb-2"><h4 className="text-xs lg:text-sm text-cyan-300">HISTORIAL DE SEGUIMIENTO</h4>{puedeGestionar&&<button type="button" className={botonSeg} onClick={()=>{resetFormulario();setFormulario(v=>!v)}}><Plus className="h-4 w-4"/> Añadir gestión</button>}</div>
          {!r.gestiones.length&&<p className="text-xs lg:text-sm text-cyan-100/55">Sin gestiones registradas.</p>}
          {[...r.gestiones].sort((a,b)=>a.fecha_gestion.localeCompare(b.fecha_gestion)||a.fecha_registro.localeCompare(b.fecha_registro)).map((g,i,arr)=>{const Icon=g.presupuesto_entregado!=null?ClipboardCheck:g.canal_contacto==='llamada'?PhoneCall:g.canal_contacto==='whatsapp'?MessageCircle:ClipboardList;const titulo=g.presupuesto_entregado!=null?(g.tipo_registro==='rectificar_fin_tratamiento'?'Presupuesto rectificado · Entregado':g.presupuesto_entregado?'Presupuesto entregado':'Presupuesto no entregado'):g.resultado==='datos_iniciales'?'Información inicial del presupuesto':g.tipo_registro==='gestion'?`${g.canal_contacto==='llamada'?'Llamada · ':g.canal_contacto==='whatsapp'?'WhatsApp · ':''}${resultadosSeg[g.resultado||'']?.label||g.resultado?.replace(/_/g,' ')||'Gestión'}`:({fin_tratamiento:'TTO finalizado',rectificar_fin_tratamiento:'Fin de tratamiento rectificado',no_continua:'No continúa',reabrir_seguimiento:'Seguimiento reabierto'}[g.tipo_registro]||g.tipo_registro);
          return <div key={g.id} className="relative flex gap-3 pb-4 last:pb-0">{i<arr.length-1&&<span className="absolute left-[15px] top-8 bottom-0 w-px bg-cyan-400/35"/>}<span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-[#0A303B] ${g.canal_contacto==='whatsapp'||g.presupuesto_entregado===true?'text-green-300':'text-cyan-300'}`}><Icon className="h-4 w-4"/></span><div className="min-w-0 flex-1 pt-1 text-xs lg:text-sm"><p className="font-medium text-white">{titulo}</p><p className="mt-1 text-cyan-100/65">{fechaGestionSeg(g.fecha_gestion)}{diaMadrid(g.fecha_registro)===g.fecha_gestion?` · ${new Date(g.fecha_registro).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'})}`:''}</p><p className="mt-1 flex items-center gap-1 text-slate-400"><UserRound className="h-3 w-3"/> Gestionado por {g.gestionado_por}</p>{diaMadrid(g.fecha_registro)!==g.fecha_gestion&&<p className="mt-1 text-[10px] text-slate-400">Registrado: {new Date(g.fecha_registro).toLocaleString('es-ES',{timeZone:'Europe/Madrid'})}</p>}
          {(g.observaciones||g.financiacion_ofrecida||g.nueva_valoracion_propuesta||g.fecha_proximo_contacto||g.motivo_no_continua||g.contactara_paciente||g.acepta_nuevo_contacto===false||g.financiacion_inicial_ofrecida!=null||g.motivo_no_coge_cita)&&<div className="mt-2 space-y-1 rounded-lg bg-[#082B35] p-2 text-cyan-100/85">{g.financiacion_ofrecida&&<p>✓ Financiación ofrecida</p>}{g.nueva_valoracion_propuesta&&<p>✓ Nueva cita de valoración propuesta</p>}{g.financiacion_inicial_ofrecida!=null&&<p>Financiación inicial: {g.financiacion_inicial_ofrecida?'Sí':'No'}</p>}{g.motivo_no_coge_cita&&<p>Motivo inicial: {g.motivo_no_coge_cita}</p>}{g.fecha_proximo_contacto&&<p className="text-yellow-200">Volver a contactar el {fechaGestionSeg(g.fecha_proximo_contacto)}</p>}{g.contactara_paciente?<p>Contactará el paciente</p>:g.acepta_nuevo_contacto===false&&<p>No acepta próximo contacto</p>}{g.motivo_no_continua&&<p>Motivo: {g.motivo_no_continua}</p>}{g.observaciones&&<p className="whitespace-pre-wrap">{g.observaciones}</p>}</div>}</div></div>})}
        </div>
        </div>
        {r.estado==='no_continua'&&<button type="button" disabled={Boolean(guardando)} className={botonSeg} onClick={()=>void actualizar({historial_cita_id:r.primera.id,tipo_registro:'reabrir_seguimiento'},r.primera.id)}>Reabrir seguimiento</button>}
        {r.estado==='finalizado'&&<p className="text-xs lg:text-sm text-cyan-100/65">Tratamiento finalizado. Para rectificarlo, desmarca FIN TRATAMIENTO.</p>}
        {formulario&&puedeGestionar&&<div className="mx-auto max-w-3xl space-y-3 rounded-2xl border border-cyan-400/45 bg-[#062631] p-3 shadow-[0_0_20px_rgba(34,211,238,.12)] sm:p-4"><h4 className="flex items-center gap-2 border-b border-cyan-400/50 pb-2 text-xs lg:text-sm text-cyan-200"><ClipboardList className="h-5 w-5 text-cyan-300"/> NUEVA GESTIÓN</h4><div className="grid gap-3 sm:grid-cols-2"><div><span className={labelSeg}>Fecha de gestión</span><CalendarioSeg valor={fechaGestion} cambiar={setFechaGestion} max={hoy}/></div><div><span className={labelSeg}>Canal de contacto</span><div className="flex gap-2">{(['llamada','whatsapp'] as const).map(v=>{const Icon=v==='llamada'?PhoneCall:MessageCircle;return <button key={v} type="button" onClick={()=>{setCanal(v);if(['no_contesta','pendiente_respuesta'].includes(resultado))setResultado(v==='llamada'?'no_contesta':'pendiente_respuesta')}} className={`${campoSeg} justify-center ${canal===v?(v==='llamada'?'border-cyan-300':'border-green-400'):''}`}><Icon className={`h-4 w-4 ${v==='llamada'?'text-cyan-300':'text-green-400'}`}/>{v==='llamada'?'Llamada':'WhatsApp'}</button>})}</div></div></div>
          <div><span className={labelSeg}>Resultado de la gestión</span><SelectorSeg valor={resultado} cambiar={v=>{setResultado(v);setContacto('');setFechaContacto('');setFinanciacion(false);setValoracion(false);setMotivoCierre('');setOtroCierre('')}} placeholder="Seleccionar resultado" opciones={[canal==='llamada'?'no_contesta':'pendiente_respuesta','valorando_presupuesto','ha_cogido_cita','no_continua'].map(v=>({value:v,...resultadosSeg[v]}))}/></div>
          {resultado==='valorando_presupuesto'&&<><div><span className={labelSeg}>Acciones realizadas</span><div className="flex flex-wrap gap-2">{[['Financiación ofrecida',financiacion,setFinanciacion],['Nueva cita de valoración propuesta',valoracion,setValoracion]].map(([t,a,f])=>{const activo=Boolean(a);const Icon=activo?Check:Plus;return <button key={String(t)} type="button" onClick={()=> (f as (v:boolean)=>void)(!activo)} className={`${botonSeg} !text-[10px] ${activo?'border-cyan-300 bg-cyan-400/20':''}`}><Icon className="h-3 w-3 text-cyan-300"/>{String(t)}</button>})}</div></div><div><span className={labelSeg}>¿Acepta próximo contacto?</span><div className="flex flex-wrap gap-2">{capsula('Sí',contacto==='si',()=>setContacto('si'),'bg-green-400')}{capsula('Contactará el paciente',contacto==='paciente',()=>setContacto('paciente'),'bg-yellow-400')}{capsula('No',contacto==='no',()=>setContacto('no'),'bg-red-500')}</div></div></>}
          {necesitaFecha&&<div><span className={labelSeg}>Fecha del próximo contacto</span><CalendarioSeg valor={fechaContacto} cambiar={setFechaContacto} min={fechaGestion}/></div>}
          {resultado==='no_continua'&&<div><span className={labelSeg}>Motivo de cierre</span><SelectorSeg valor={motivoCierre} cambiar={setMotivoCierre} placeholder="Seleccionar motivo" opciones={['Motivos económicos','Ha elegido otra clínica','Otro motivo'].map(v=>({value:v,label:v}))}/>{motivoCierre==='Otro motivo'&&<input className={`${inputSeg} mt-2`} value={otroCierre} onChange={e=>setOtroCierre(e.target.value)} placeholder="Especificar motivo"/>}</div>}
          <div><span className={labelSeg}>Observaciones (opcional)</span><textarea rows={2} className={inputSeg} value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Añadir observaciones…"/></div><div className="flex items-center justify-end gap-3 border-t border-cyan-400/25 pt-2"><button type="button" className="text-xs lg:text-sm text-slate-400" onClick={()=>{setFormulario(false);resetFormulario()}}>Cancelar</button><button type="button" disabled={Boolean(guardando)} className={botonSeg} onClick={()=>void registrar(r)}><Check className="h-4 w-4"/>{guardando===r.primera.id?'Guardando…':'Guardar gestión'}</button></div></div>}
        {errorGuardar&&<p role="alert" className="text-xs lg:text-sm text-amber-200">{errorGuardar}</p>}
      </div>}
    </div>;
  };
  // En el Dashboard no hay desplegables ni ediciones. La ficha de gestión queda en INSPECCIONAR.
  const filaPrincipal=(r:FilaSeguimiento)=>{
    const estilo=estilosSeg[r.estado];
    const presupuesto=[...r.gestiones].reverse().find(g=>g.presupuesto_entregado!=null);
    const valorPresupuesto=presupuesto?.presupuesto_entregado;
    const aviso=r.estado==='pendiente'
      ? r.alerta?'Nuevo contacto sin realizar':r.fechaContacto?`Volver a contactar ${fechaGestionSeg(r.fechaContacto)}`:r.estadoTexto
      : '';
    return <div key={r.primera.id} className="grid grid-cols-[minmax(0,1fr)_39px_25px_43px_72px] items-center gap-0.5 border-t border-cyan-500/10 px-2 py-3.5 text-[10px] transition-colors hover:bg-cyan-500/[.035] sm:grid-cols-[minmax(0,1.8fr)_80px_100px_75px_minmax(0,1.3fr)] lg:grid-cols-[minmax(0,1.5fr)_minmax(68px,.65fr)_minmax(95px,.8fr)_minmax(65px,.65fr)_minmax(0,1.45fr)] sm:gap-2 sm:px-3 sm:text-xs">
      <span className="min-w-0 truncate font-medium text-white" title={r.primera.nombre_paciente||''}>{r.primera.nombre_paciente||'—'}</span>
      <span className="min-w-0 whitespace-nowrap text-center text-[10px] text-cyan-100/75 sm:text-[11px]" title={fechaCitaSeg(r.primera.fecha_inicio)}><span className="sm:hidden">{r.primera.fecha_inicio?new Date(r.primera.fecha_inicio).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',timeZone:'Europe/Madrid'}):'—'}</span><span className="hidden sm:inline">{fechaCitaSeg(r.primera.fecha_inicio)}</span></span>
      <span className="flex min-w-0 items-center justify-center text-center" title={valorPresupuesto===true?'Entregado':valorPresupuesto===false?'No entregado':'Pendiente de registrar'}>
        <span className="flex items-center justify-center sm:hidden">
          {valorPresupuesto===true?<CircleCheck className="h-4 w-4 shrink-0 text-green-400"/>:valorPresupuesto===false?<CircleX className="h-4 w-4 shrink-0 text-violet-400"/>:<span className="text-[10px] text-white">Pte</span>}
        </span>
        <span className="hidden min-w-0 justify-center sm:flex">{indicadorPresupuesto(valorPresupuesto)}</span>
      </span>
      <span className={`min-w-0 whitespace-nowrap text-[10px] max-sm:text-center sm:text-[11px] lg:text-center ${r.proxima?'text-cyan-100/75':r.estado==='finalizado'?'text-green-300':r.estado==='no_continua'?'text-violet-300':'text-red-300'}`} title={fechaCitaSeg(r.proxima?.fecha_inicio||null)}><span className="sm:hidden">{r.proxima?.fecha_inicio?new Date(r.proxima.fecha_inicio).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',timeZone:'Europe/Madrid'}):'Sin cita'}</span><span className="hidden sm:inline">{fechaCitaSeg(r.proxima?.fecha_inicio||null)}</span></span>
      <span className="min-w-0 max-sm:justify-self-end">
        <span className={`inline-flex max-w-full items-center gap-0.5 rounded-full border px-1 py-1 text-[9px] leading-tight sm:hidden ${estilo.capsula}`} title={aviso||r.estadoTexto}>
          <span className={`h-2 w-2 shrink-0 rounded-full ${estilo.dot}`}/>
          <span>{r.estado==='pendiente'?'Pte gestión':r.estado==='curso'?'En TTO':r.estado==='finalizado'?'Finalizado':'No continúan'}</span>
        </span>
        <span className={`hidden max-w-full items-center gap-1.5 rounded-full border px-2 py-1.5 text-[10px] leading-tight sm:inline-flex lg:flex lg:w-full lg:text-[11px] ${estilo.capsula}`}>
          <span className={`h-2 w-2 shrink-0 rounded-full shadow-[0_0_10px_currentColor] ${estilo.dot}`}/>
          <span className="min-w-0 break-words" title={aviso||r.estadoTexto}>{r.estado==='curso'?'En tratamiento':r.estado==='finalizado'?'TTO finalizado':r.estado==='no_continua'?'No continúan':`Pendiente${aviso?`: ${aviso.charAt(0).toLowerCase()}${aviso.slice(1)}`:''}`}</span>
        </span>
      </span>
    </div>;
  };
  const indicador=(titulo:string,n:number,i:number)=><div key={titulo} className="contents"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:[estilosSeg.pendiente.hex,estilosSeg.curso.hex,estilosSeg.finalizado.hex,estilosSeg.no_continua.hex][i]}}/><span>{titulo}:</span><strong className="text-left font-semibold tabular-nums text-white">{cargandoTodo||errorTodo?'—':n}</strong></div>;
  const opciones=[
    {label:'Año',value:anio,set:setAnio,opts:[{value:'todos',label:'Todos los años'},...anos.map(a=>({value:a,label:a}))]},
    {label:'Mes',value:mes,set:setMes,opts:[{value:'todos',label:'Todo el año'},...Array.from({length:12},(_,i)=>({value:String(i+1),label:new Intl.DateTimeFormat('es-ES',{month:'long'}).format(new Date(2026,i,1))}))]},
    {label:'Situación',value:situacion,set:setSituacion,opts:[{value:'todas',label:'Todas'},{value:'pendiente',label:'Pendientes'},{value:'curso',label:'En tratamiento'},{value:'finalizado',label:'Finalizadas'},{value:'no_continua',label:'No continúan'}]}
  ];
  return <>
    {/* En escritorio la altura de CITAS CREADAS determina la fila del grid.
        El contenido de SEGUIMIENTO no añade altura: solo su tabla desplaza por dentro. */}
    <div className="min-w-0 xl:relative xl:min-h-0">
      <section className="flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-cyan-300/50 bg-[#031B24] p-4 text-white shadow-[0_12px_35px_rgba(0,0,0,.3),0_0_22px_rgba(34,211,238,.11)] sm:p-5 xl:absolute xl:inset-0">
        <div className="flex shrink-0 items-start justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/[.055] shadow-[0_0_22px_rgba(34,211,238,.17)] sm:h-10 sm:w-10"><HeartPulse className="h-5 w-5 text-cyan-300"/></div>
            <h2 className="text-[11px] font-normal uppercase tracking-[.08em] text-cyan-200 sm:text-sm sm:tracking-[.10em]">SEGUIMIENTO</h2>
          </div>
          {/* Ancho común con CITAS CREADAS: 136px CSS, sin depender del texto. */}
         <div className="group w-[136px] shrink-0 rounded-xl border border-cyan-300/45 bg-[#082B35] px-2.5 py-1.5 text-center shadow-[0_0_12px_rgba(34,211,238,.10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/90 hover:bg-[#0A3541] hover:shadow-[0_0_18px_rgba(34,211,238,.40),0_0_30px_rgba(34,211,238,.13)] sm:px-3 sm:py-2">
            <div className="flex items-baseline justify-center gap-2 sm:gap-3"><span className="text-[9px] font-normal uppercase tracking-[.12em] text-cyan-100/70 sm:text-[10px]">TOTAL</span><strong className="text-[26px] font-semibold leading-none tabular-nums text-white sm:text-[30px]">{cargandoTodo?'…':errorTodo?'—':registros.length}</strong></div>
            <div className="mt-1 text-[9px] leading-tight text-cyan-100/65 sm:text-[10px]">Primeras visitas</div>
          </div>
        </div>
        <div aria-hidden="true" className="mt-3 h-px w-full shrink-0 bg-cyan-300/75 shadow-[0_0_10px_rgba(34,211,238,.75)]"/>
        {/* Gráfico relleno de sectores separados, acabado mate + halo propio. Sin caja. */}
        <div className="mt-2 flex min-w-0 shrink-0 items-center justify-center gap-2.5 sm:gap-5">
           <div className="flex shrink-0 items-center justify-center"><DonutSeguimiento valores={cargandoTodo||errorTodo?[0,0,0,0]:historico}/></div>
           <div className="grid min-w-0 shrink-0 grid-cols-[10px_max-content_max-content] items-center gap-x-1.5 gap-y-2 whitespace-nowrap text-[10px] text-cyan-100/85 sm:gap-y-2.5 sm:text-[11px]">
            {indicador('Citas pendientes',historico[0],0)}
            {indicador('En tratamiento',historico[1],1)}
            {indicador('TTO finalizado',historico[2],2)}
            {indicador('No continúan',historico[3],3)}
          </div>
        </div>
        {/* Caja de tabla igual que LABORATORIO: encabezado fijo y filas alineadas. */}
        <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-cyan-400/30 bg-[rgba(5,18,24,.78)]">
          <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_39px_25px_43px_72px] items-center gap-0.5 bg-cyan-500/10 px-2 py-3 text-[9px] uppercase tracking-[.035em] text-cyan-300/90 sm:grid-cols-[minmax(0,1.8fr)_80px_100px_75px_minmax(0,1.3fr)] lg:grid-cols-[minmax(0,1.5fr)_minmax(68px,.65fr)_minmax(95px,.8fr)_minmax(65px,.65fr)_minmax(0,1.45fr)] sm:gap-2 sm:px-3">
            <span>Paciente</span><span className="text-center"><span className="sm:hidden whitespace-nowrap text-[8px]">1ª visita</span><span className="hidden sm:inline">Primera visita</span></span><span className="text-center"><span className="sm:hidden">PTO</span><span className="hidden sm:inline">Presupuesto</span></span><span className="max-sm:text-center max-sm:tracking-normal max-sm:text-[8px] lg:text-center">Próx. cita</span><span className="max-sm:text-right max-sm:pr-1">Estado</span>
          </div>
          <div className={`min-h-0 max-h-[360px] flex-1 overflow-y-auto xl:max-h-none ${scrollSeguimiento}`}>
            {cargandoTodo?<p className="px-3 py-5 text-center text-xs text-cyan-100/55">Cargando seguimiento…</p>:errorTodo?<p className="px-3 py-5 text-center text-xs text-amber-200">No se pudo cargar el seguimiento: {errorTodo}</p>:datosTablaSeguimiento.length?datosTablaSeguimiento.map(filaPrincipal):<p className="px-3 py-5 text-center text-xs text-cyan-100/55">Sin primeras visitas que requieran revisión.</p>}
          </div>
        </div>
        <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-0.5 rounded-full border border-cyan-300/45 bg-[#082B35] p-0.5">
            <button type="button" aria-pressed={filtroTablaSeguimiento==='mes'} onClick={()=>setFiltroTablaSeguimiento('mes')} className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] transition ${filtroTablaSeguimiento==='mes'?'bg-cyan-400/20 text-white':'text-cyan-100/65 hover:text-white'}`}>Mes en curso</button>
            <button type="button" aria-pressed={filtroTablaSeguimiento==='todos'} onClick={()=>setFiltroTablaSeguimiento('todos')} className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] transition ${filtroTablaSeguimiento==='todos'?'bg-cyan-400/20 text-white':'text-cyan-100/65 hover:text-white'}`}>Todos</button>
          </div>
          <button type="button" onClick={()=>{setOrdenPaciente('original');setInspectorAbierto(true)}} className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/45 bg-cyan-400/[.06] px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[.1em] text-cyan-100 shadow-[0_0_11px_rgba(34,211,238,.11)] transition hover:border-cyan-200 hover:bg-cyan-400/20 hover:shadow-[0_0_20px_rgba(34,211,238,.22)]"><ChartNoAxesCombined className="h-3.5 w-3.5 text-cyan-300"/> Inspeccionar</button></div>
      </section>
    </div>
    {inspectorAbierto&&<div role="dialog" aria-modal="true" aria-label="Inspeccionar seguimiento" className={`fixed inset-0 z-[100] overflow-y-auto bg-[#02141B]/95 px-2 py-4 text-white backdrop-blur-lg sm:px-6 sm:py-6 lg:px-10 lg:py-8 ${scrollSeguimiento}`}>
      <div className="mx-auto w-full max-w-6xl space-y-5 pb-0 sm:pb-10 sm:space-y-7 xl:max-w-[1440px] 2xl:max-w-[1800px]">
        <div className="flex items-center justify-between gap-3 border-b border-cyan-300/35 pb-3 shadow-[0_1px_0_rgba(34,211,238,.06)] sm:pb-4"><div className="flex min-w-0 items-center gap-2 sm:gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/[.055] shadow-[0_0_22px_rgba(34,211,238,.17)] sm:h-10 sm:w-10"><ChartNoAxesCombined className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,.75)]"/></span><h2 className="text-base font-normal uppercase tracking-[.08em] text-white sm:text-lg xl:text-xl sm:tracking-[.10em]">INSPECCIONAR SEGUIMIENTO</h2></div><button type="button" onClick={()=>setInspectorAbierto(false)} aria-label="Cerrar Inspeccionar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/[.05] text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,.1)] transition hover:border-cyan-200 hover:bg-cyan-400/15 sm:h-10 sm:w-10"><X className="h-4 w-4 sm:h-5 sm:w-5"/></button></div>
        <section className="relative z-30 rounded-[22px] border border-cyan-400/25 bg-cyan-400/[.035] px-3 py-3 shadow-[0_0_24px_rgba(34,211,238,.065)] sm:px-5 sm:py-3.5"><h3 className="mb-3 text-[11px] font-normal uppercase tracking-[.12em] text-cyan-200 sm:text-xs">FILTROS DE ACTIVIDAD</h3><div className="grid grid-cols-3 gap-2 sm:gap-4">
          {opciones.map(f=><div key={f.label} className="relative min-w-0 text-[11px] text-cyan-100/70 sm:text-xs"><span className="block">{f.label}</span><button type="button" aria-expanded={menuFiltro===f.label} onClick={()=>setMenuFiltro(v=>v===f.label?null:f.label)} className="relative mt-1 flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-cyan-400/30 bg-[#0A303B] px-3 text-left text-xs lg:text-sm text-white transition hover:border-cyan-300/65 hover:bg-[#0C3945] sm:mt-1.5 sm:h-10 sm:text-sm"><span className="min-w-0 truncate">{f.opts.find(o=>o.value===f.value)?.label}</span><ChevronDown className="h-4 w-4 shrink-0 text-cyan-300"/></button>{menuFiltro===f.label&&<><button type="button" onClick={()=>setMenuFiltro(null)} aria-label="Cerrar filtros" className="fixed inset-0 z-40 cursor-default"/><div className={`absolute left-0 top-full z-50 mt-1.5 max-h-52 w-full min-w-[140px] overflow-y-auto rounded-xl border border-cyan-400/45 bg-[#082B36] p-1 shadow-[0_15px_35px_rgba(0,0,0,.60),0_0_20px_rgba(34,211,238,.18)] ${scrollSeguimiento}`}>{f.opts.map(o=><button key={o.value} type="button" onClick={()=>{f.set(o.value);setMenuFiltro(null);}} className="block w-full rounded-lg px-3 py-2 text-left text-xs lg:text-sm text-cyan-50/85 hover:bg-cyan-400/15">{o.label}</button>)}</div></>}</div>)}
        </div></section>
        <div className="mx-auto flex w-fit max-w-full items-center justify-center gap-3 py-2 sm:hidden">
          <div className="flex h-[145px] w-[122px] shrink-0 items-center justify-center border-r border-cyan-400/25 pr-3">
            <div className="flex aspect-square w-full max-w-[110px] flex-col items-center justify-center gap-1 rounded-full border border-cyan-300/35 bg-[radial-gradient(circle_at_50%_35%,#0E3945_0%,#05232D_75%,#031820_100%)] text-center shadow-[0_0_14px_rgba(34,211,238,.08),inset_0_0_14px_rgba(34,211,238,.045)]">
              <strong className="text-[clamp(24px,7vw,32px)] font-semibold leading-none tabular-nums text-white">{cargandoTodo||errorTodo?'—':circulos[0][1]}</strong>
              <span className="text-[10px] font-medium uppercase leading-tight tracking-[.015em] text-cyan-200/80">TOTAL</span>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(2,82px)] justify-items-center gap-x-2 gap-y-2">
            {circulos.slice(1).map(([titulo,numero])=><div key={titulo} className="flex aspect-square w-full max-w-[82px] flex-col items-center justify-center gap-0.5 rounded-full border border-cyan-300/35 bg-[radial-gradient(circle_at_50%_35%,#0E3945_0%,#05232D_75%,#031820_100%)] px-1 text-center shadow-[0_0_14px_rgba(34,211,238,.08),inset_0_0_14px_rgba(34,211,238,.045)]"><strong className="text-[clamp(19px,5.8vw,26px)] font-semibold leading-none tabular-nums text-white">{cargandoTodo||errorTodo?'—':numero}</strong><span className="text-[clamp(7px,2vw,9px)] font-medium uppercase leading-tight tracking-[.015em] text-cyan-200/80">{titulo}</span></div>)}
          </div>
        </div>
        <div className="hidden flex-wrap items-center justify-center gap-3 py-2 sm:flex sm:gap-9 sm:py-3 lg:gap-14">
          {circulos.map(([titulo,numero])=><div key={titulo} className="group flex h-[clamp(65px,20vw,88px)] w-[clamp(65px,20vw,88px)] shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border border-cyan-300/35 bg-[radial-gradient(circle_at_50%_35%,#0E3945_0%,#05232D_75%,#031820_100%)] px-2 text-center shadow-[0_0_14px_rgba(34,211,238,.08),inset_0_0_14px_rgba(34,211,238,.045)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/85 hover:shadow-[0_0_18px_rgba(34,211,238,.38),0_0_38px_rgba(34,211,238,.20),inset_0_0_20px_rgba(34,211,238,.10)] sm:h-[120px] sm:w-[120px] xl:h-[130px] xl:w-[130px]"><strong className="text-[clamp(19px,5.8vw,26px)] font-semibold leading-none tabular-nums text-white sm:text-[31px] xl:text-[34px]">{cargandoTodo||errorTodo?'—':numero}</strong><span className="text-[clamp(6px,1.85vw,8px)] font-medium uppercase leading-tight tracking-[.015em] text-cyan-200/80 sm:text-[9px] xl:text-[11px]">{titulo}</span></div>)}
        </div>
        <section className="overflow-hidden rounded-[26px] border border-cyan-400/30 bg-[#041D26] shadow-[0_0_26px_rgba(34,211,238,.075)]"><div className="flex flex-col gap-3 border-b border-cyan-400/20 bg-[#021820] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"><h3 className="text-xs lg:text-sm font-medium uppercase tracking-[.11em] text-cyan-300 sm:text-sm">DETALLE DE SEGUIMIENTO</h3><label className="flex w-full items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/[.045] px-3 py-2 text-xs lg:text-sm shadow-[0_0_16px_rgba(34,211,238,.09)] sm:w-auto sm:px-4"><Search className="h-4 w-4 shrink-0 text-cyan-300"/><input aria-label="Buscar paciente" value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="Buscar paciente" className="min-w-0 w-full bg-transparent text-white outline-none placeholder:text-cyan-100/40 sm:w-52"/></label></div>
          <div className="grid grid-cols-[minmax(0,1.15fr)_48px_minmax(0,1.4fr)_34px_24px] sm:grid-cols-[minmax(0,1.35fr)_75px_minmax(0,1fr)_84px_28px] lg:grid-cols-[minmax(0,1.5fr)_minmax(125px,.85fr)_minmax(100px,.8fr)_minmax(0,1.65fr)_minmax(125px,.65fr)_32px] 2xl:grid-cols-[minmax(0,1.5fr)_minmax(145px,.9fr)_minmax(120px,.9fr)_minmax(0,1.65fr)_minmax(150px,.65fr)_36px] items-center gap-1.5 bg-[#0B3540] px-2 py-4 text-[9px] font-semibold uppercase tracking-[.035em] text-cyan-200 sm:gap-2 sm:px-3 lg:bg-[#072630] lg:px-4 lg:py-3 lg:text-xs lg:tracking-[.11em] lg:text-[#48B3C4] lg:gap-4 lg:overflow-hidden lg:[scrollbar-gutter:stable] lg:[scrollbar-width:thin] lg:[&::-webkit-scrollbar]:w-1"><span className="min-w-0"><span className="lg:hidden">Paciente</span><button type="button" onClick={()=>setOrdenPaciente(v=>v==='original'?'asc':v==='asc'?'desc':'original')} title={ordenPaciente==='original'?'Ordenar de A a Z':ordenPaciente==='asc'?'Ordenar de Z a A':'Recuperar orden por estado y fecha'} aria-label={ordenPaciente==='original'?'Ordenar pacientes de A a Z':ordenPaciente==='asc'?'Ordenar pacientes de Z a A':'Recuperar orden por estado y fecha'} className="hidden items-center gap-1 uppercase tracking-[inherit] hover:text-cyan-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-cyan-300 lg:inline-flex">Paciente<span aria-hidden="true" className="text-cyan-300">{ordenPaciente==='original'?'↕':ordenPaciente==='asc'?'↑':'↓'}</span></button></span><span className="hidden text-center lg:block">Presupuesto</span><span className="lg:text-center">Próx. cita</span><span>Estado</span><span className="text-center sm:text-left lg:text-center"><span className="sm:hidden">FIN TTO.</span><span className="hidden sm:inline">FIN TRATAMIENTO</span></span><span/></div>
          <div className={`max-h-[360px] overflow-y-auto max-sm:overscroll-contain sm:max-h-[55vh] lg:[scrollbar-gutter:stable] ${scrollSeguimiento}`}>{cargandoTodo?<p className="p-6 text-center text-xs lg:text-sm text-cyan-100/60">Cargando…</p>:errorTodo?<p className="p-6 text-center text-xs lg:text-sm text-amber-200">{errorTodo}</p>:filtrados.length?filtrados.map(r=>fila(r,true)):<p className="p-6 text-center text-xs lg:text-sm text-cyan-100/60">Sin resultados para estos filtros</p>}</div>
        </section>
        {errorGuardar&&<p role="alert" className="text-xs lg:text-sm text-amber-200">No se pudo guardar: {errorGuardar}</p>}
      </div>
    </div>}
  </>;
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
const scrollCyan = '[scrollbar-width:thin] [scrollbar-color:#155365_#031B24] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-[#031B24] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#155365] hover:[&::-webkit-scrollbar-thumb]:bg-[#216D80]';

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
          leerTodas<CitaDB>(supa,'historial_citas','id,patient_id,event_id,calendar_id,profesional,nombre_paciente,motivo,estado,origen,fecha_inicio,fecha_fin,created_at,updated_at'),
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
<div className="group w-[136px] shrink-0 rounded-xl border border-cyan-300/45 bg-[#082B35] px-2.5 py-1.5 text-center shadow-[0_0_12px_rgba(34,211,238,.10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/90 hover:bg-[#0A3541] hover:shadow-[0_0_18px_rgba(34,211,238,.40),0_0_30px_rgba(34,211,238,.13)] sm:px-3 sm:py-2">
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
      <CajaSeguimiento citas={citasUnicas} cargando={cargando} errorDatos={errorDatos}/>
      <CajaLaboratorio/>
      <CajaPendiente titulo="GESTIÓN MARTINA" icono={Bot}/>
    </div>
  );

  // Inspeccionar mantiene los filtros y los cálculos originales. Solo cambia la presentación.
  const inspector = inspeccionar ? (
    <div role="dialog" aria-modal="true" aria-label="Inspeccionar actividad clínica" className={`fixed inset-0 z-[100] overflow-y-auto bg-[#02141B]/95 px-2 py-4 text-white backdrop-blur-lg sm:px-6 sm:py-6 lg:px-10 lg:py-8 ${scrollCyan}`}>
      <div className="mx-auto w-full max-w-6xl space-y-5 pb-10 sm:space-y-7 xl:max-w-[1440px] 2xl:max-w-[1800px]">
        {/* Cabecera idéntica en lenguaje visual a Citas creadas; título blanco. */}
        <div className="flex items-center justify-between gap-3 border-b border-cyan-300/35 pb-3 shadow-[0_1px_0_rgba(34,211,238,.06)] sm:pb-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/[.055] shadow-[0_0_22px_rgba(34,211,238,.17)] sm:h-10 sm:w-10">
              <ChartNoAxesCombined className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,.75)]" />
            </span>
            <h2 className="text-base font-normal uppercase tracking-[.08em] text-white drop-shadow-[0_0_10px_rgba(34,211,238,.20)] sm:text-lg xl:text-xl sm:tracking-[.10em]">INSPECCIONAR</h2>
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
                  className="relative mt-1 flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-cyan-400/30 bg-[#0A303B] pl-3 pr-3 text-left text-xs lg:text-sm text-white shadow-[inset_0_1px_0_rgba(165,243,252,.04)] transition hover:border-cyan-300/65 hover:bg-[#0C3945] focus:border-cyan-300/75 focus:outline-none focus:ring-1 focus:ring-cyan-300/35 sm:mt-1.5 sm:h-10 sm:text-sm"
                >
                  <span className="min-w-0 truncate">{f.options.find(o=>o.value===f.value)?.label||'Seleccionar'}</span>
                  <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-cyan-300 transition-transform ${filtroAbierto===f.label?'rotate-180':''}`}/>
                </button>
                {filtroAbierto===f.label && (
                  <>
                    <button type="button" aria-label="Cerrar menú de filtros" className="fixed inset-0 z-40 cursor-default" onClick={()=>setFiltroAbierto(null)} />
                    <div role="listbox" aria-label={f.label} className={`absolute left-0 top-full z-50 mt-1.5 max-h-52 w-full min-w-[145px] overflow-y-auto rounded-xl border border-cyan-400/45 bg-[#082B36] p-1 shadow-[0_15px_35px_rgba(0,0,0,.60),0_0_20px_rgba(34,211,238,.18)] ${scrollCyan}`}>
                      {f.options.map(o=><button type="button" role="option" aria-selected={o.value===f.value} key={o.value} onClick={()=>{f.change(o.value);setFiltroAbierto(null);}} className={`block w-full rounded-lg px-3 py-2 text-left text-xs lg:text-sm transition sm:text-sm ${o.value===f.value?'bg-cyan-400/20 font-medium text-cyan-100 shadow-[inset_2px_0_0_rgba(103,232,249,.8)]':'text-cyan-50/85 hover:bg-cyan-400/15 hover:text-white'}`}>{o.label}</button>)}
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
            <div key={titulo} className="group flex h-[clamp(65px,20vw,88px)] w-[clamp(65px,20vw,88px)] min-w-0 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border border-cyan-300/35 bg-[radial-gradient(circle_at_50%_35%,#0E3945_0%,#05232D_75%,#031820_100%)] px-2 text-center shadow-[0_0_14px_rgba(34,211,238,.08),inset_0_0_14px_rgba(34,211,238,.045)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/85 hover:shadow-[0_0_18px_rgba(34,211,238,.38),0_0_38px_rgba(34,211,238,.20),inset_0_0_20px_rgba(34,211,238,.10)] sm:h-[120px] sm:w-[120px] xl:h-[130px] xl:w-[130px]">
              <strong className="text-[clamp(19px,5.8vw,26px)] font-semibold leading-none tabular-nums text-white drop-shadow-[0_0_12px_rgba(103,232,249,.15)] sm:text-[31px] xl:text-[34px]">{valor}</strong>
              <span className="max-w-[94px] px-0.5 text-[clamp(6px,1.85vw,8px)] font-medium uppercase leading-tight tracking-[.015em] text-cyan-200/80 group-hover:text-cyan-100 sm:max-w-[112px] sm:text-[9px] xl:text-[11px] sm:tracking-[.035em]">{titulo}</span>
            </div>
          ))}
        </div>

        {/* Cabecera del detalle más oscura que el encabezado de la tabla, estilo barra de acciones. */}
        <section className="overflow-hidden rounded-[26px] border border-cyan-400/30 bg-[#041D26] shadow-[0_0_26px_rgba(34,211,238,.075),inset_0_1px_0_rgba(165,243,252,.05)]">
          <div className="flex flex-col gap-3 border-b border-cyan-400/20 bg-[#021820] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <h3 className="text-xs lg:text-sm font-medium uppercase tracking-[.11em] text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,.55)] sm:text-sm">DETALLE DE CITAS</h3>
            <label className="flex w-full items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/[.045] px-3 py-2 text-xs lg:text-sm shadow-[0_0_16px_rgba(34,211,238,.09)] transition focus-within:border-cyan-200 focus-within:shadow-[0_0_22px_rgba(34,211,238,.18)] sm:w-auto sm:px-4">
              <Search className="h-4 w-4 shrink-0 text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,.65)]" />
              <input aria-label="Buscar paciente o tratamiento" value={buscarInspeccion} onChange={e=>setBuscarInspeccion(e.target.value)} placeholder="Buscar paciente o tratamiento" className="min-w-0 w-full bg-transparent text-white outline-none placeholder:text-cyan-100/40 sm:w-52" />
            </label>
          </div>
          <div className={`max-h-[55vh] overflow-auto ${scrollCyan}`}>
            <table className="w-full min-w-[680px] text-left text-xs lg:text-sm">
              <thead className="sticky top-0 bg-[#0B3540] text-cyan-200 lg:bg-[#072630] lg:text-[#48B3C4]"><tr>{['Fecha','Paciente','Motivo','Profesional','Estado'].map(t=><th key={t} className="px-4 py-4 font-semibold uppercase tracking-[.11em] lg:py-3 lg:text-xs">{t}</th>)}</tr></thead>
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
    <div className={`hidden h-full overflow-y-auto overflow-x-hidden bg-[#02141B] p-8 pb-24 text-white lg:block lg:px-5 xl:px-8 2xl:px-10 ${scrollCyan}`}>
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
    <div className={`h-[calc(100dvh-190px)] overflow-y-auto overflow-x-hidden bg-[#02141B] px-3 pt-6 pb-32 text-white lg:hidden ${scrollCyan}`}>
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
