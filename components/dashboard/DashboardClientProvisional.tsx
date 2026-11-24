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

/**
 * MARTINA PANEL — DashboardClientProvisional (vista independiente de prueba, 24/11/2026).
 * 1. Los encabezados del Dashboard original se han conservado literalmente.
 * 2. Ninguna escritura a Supabase/Google Calendar desde las estadísticas.
 * 3. Los 21 eventos históricos tienen fechas de cita y creación verificadas
 *    en el JSON de Google Calendar facilitado el 23/11/2026.
 * 4. Las modificaciones de Martina se leen de historial_citas_cambios si
 *    han quedado registradas. Las anteriores que no tengan trazabilidad
 *    no se inventan.
 * 5. Inspeccionar es una vista local operativa, no requiere una ruta nueva.
 *    En el futuro puede trasladarse a /dashboard/inspeccionar.
 */

const MARTINA_HISTORICA: CitaMartina[] = [
  {
    "id": "fede:dr0c4iu02712r2ksrsl3t17sg0",
    "event_id": "dr0c4iu02712r2ksrsl3t17sg0",
    "calendar_id": "fede",
    "paciente": "Maricarmen Germán Mateo",
    "motivo": "primera visita",
    "fechaActividad": "2026-07-23T07:43:42.000Z",
    "fechaCita": "2026-08-05T10:00:00+02:00"
  },
  {
    "id": "fede:o0pp96kh55fmm7f29lkok0n8tc",
    "event_id": "o0pp96kh55fmm7f29lkok0n8tc",
    "calendar_id": "fede",
    "paciente": "Victoria Balaguer Babiloni",
    "motivo": "revisión general",
    "fechaActividad": "2026-07-24T08:37:28.000Z",
    "fechaCita": "2026-07-31T09:30:00+02:00"
  },
  {
    "id": "fede:b7oh3lqg7ipt82asecsvooll9o",
    "event_id": "b7oh3lqg7ipt82asecsvooll9o",
    "calendar_id": "fede",
    "paciente": "Nongo Nong",
    "motivo": "primera visita",
    "fechaActividad": "2026-07-25T09:07:18.000Z",
    "fechaCita": "2026-07-27T13:30:00+02:00"
  },
  {
    "id": "fede:dgk2mf57vo5lbfonlsmjrl2jhk",
    "event_id": "dgk2mf57vo5lbfonlsmjrl2jhk",
    "calendar_id": "fede",
    "paciente": "Martín Sánchez Fernández",
    "motivo": "revisión general",
    "fechaActividad": "2026-07-27T09:19:56.000Z",
    "fechaCita": "2026-07-29T11:00:00+02:00"
  },
  {
    "id": "fede:0drvlu2sdlds1am7tdncu3bp0g",
    "event_id": "0drvlu2sdlds1am7tdncu3bp0g",
    "calendar_id": "fede",
    "paciente": "Sara Toran Rosario",
    "motivo": "primera visita",
    "fechaActividad": "2026-07-27T16:24:14.000Z",
    "fechaCita": "2026-07-31T10:00:00+02:00"
  },
  {
    "id": "fede:mm9sv9qh2p5gf6hbs2q24rhde4",
    "event_id": "mm9sv9qh2p5gf6hbs2q24rhde4",
    "calendar_id": "fede",
    "paciente": "Raúl Ibáñez Jiménez",
    "motivo": "revision general",
    "fechaActividad": "2026-07-31T08:59:10.000Z",
    "fechaCita": "2026-08-03T12:30:00+02:00"
  },
  {
    "id": "fede:9oh74iu7jnbqtdo4t7kh5d1214",
    "event_id": "9oh74iu7jnbqtdo4t7kh5d1214",
    "calendar_id": "fede",
    "paciente": "Carlos López Ciprés",
    "motivo": "revisión general",
    "fechaActividad": "2026-08-10T07:14:11.000Z",
    "fechaCita": "2026-08-11T10:30:00+02:00"
  },
  {
    "id": "fede:8bc00id9bo1ll32ceqc8r20474",
    "event_id": "8bc00id9bo1ll32ceqc8r20474",
    "calendar_id": "fede",
    "paciente": "Andrea Díaz Martínez",
    "motivo": "primera visita",
    "fechaActividad": "2026-08-10T10:25:10.000Z",
    "fechaCita": "2026-08-11T12:15:00+02:00"
  },
  {
    "id": "fede:k7sonu6m43ubldrpoh9kjla7ms",
    "event_id": "k7sonu6m43ubldrpoh9kjla7ms",
    "calendar_id": "fede",
    "paciente": "Erick Mattei Gramada",
    "motivo": "primera visita",
    "fechaActividad": "2026-08-11T14:39:54.000Z",
    "fechaCita": "2026-08-12T10:30:00+02:00"
  },
  {
    "id": "fede:d883v7giii451pkksp79plqdg4",
    "event_id": "d883v7giii451pkksp79plqdg4",
    "calendar_id": "fede",
    "paciente": "Raquel Sáenz Elipe",
    "motivo": "primera visita",
    "fechaActividad": "2026-08-11T17:17:30.000Z",
    "fechaCita": "2026-08-12T11:15:00+02:00"
  },
  {
    "id": "fede:up7c0ff8c3vec4oec8bp9o3u30",
    "event_id": "up7c0ff8c3vec4oec8bp9o3u30",
    "calendar_id": "fede",
    "paciente": "Blas Punzano Gil",
    "motivo": "Primera visita",
    "fechaActividad": "2026-09-02T08:16:48.000Z",
    "fechaCita": "2026-09-02T15:30:00+02:00"
  },
  {
    "id": "fede:0bnk53ui10l3lcqaqdr8oam0co",
    "event_id": "0bnk53ui10l3lcqaqdr8oam0co",
    "calendar_id": "fede",
    "paciente": "Chimo Rambla Barrachina",
    "motivo": "primera visita",
    "fechaActividad": "2026-09-07T08:22:57.000Z",
    "fechaCita": "2026-09-08T18:15:00+02:00"
  },
  {
    "id": "fede:sbiln80vlah5r8mb2gbl4v5lt4",
    "event_id": "sbiln80vlah5r8mb2gbl4v5lt4",
    "calendar_id": "fede",
    "paciente": "Paola Valero Darmaz",
    "motivo": "primera visita",
    "fechaActividad": "2026-09-25T11:40:54.000Z",
    "fechaCita": "2026-09-30T15:00:00+02:00"
  },
  {
    "id": "fede:8a1912fdvjcnhc7q9cvdcdnh9k",
    "event_id": "8a1912fdvjcnhc7q9cvdcdnh9k",
    "calendar_id": "fede",
    "paciente": "Joel Borreguero Hernández",
    "motivo": "primera visita",
    "fechaActividad": "2026-09-25T19:46:02.000Z",
    "fechaCita": "2026-09-30T15:45:00+02:00"
  },
  {
    "id": "fede:u9k990na0h8m4bppb6jbb284tk",
    "event_id": "u9k990na0h8m4bppb6jbb284tk",
    "calendar_id": "fede",
    "paciente": "Josefina Blanco Tomaselo",
    "motivo": "primera visita",
    "fechaActividad": "2026-10-16T11:45:07.000Z",
    "fechaCita": "2026-10-19T13:45:00+02:00"
  },
  {
    "id": "fede:8g4mfn79m4nlj89hd4md718820",
    "event_id": "8g4mfn79m4nlj89hd4md718820",
    "calendar_id": "fede",
    "paciente": "Roberto Sandoval Moraga",
    "motivo": "Revisión general",
    "fechaActividad": "2026-10-22T09:15:57.000Z",
    "fechaCita": "2026-11-09T09:00:00+01:00"
  },
  {
    "id": "fede:gb8sp6qsga4bhrrhtdesjn63ms",
    "event_id": "gb8sp6qsga4bhrrhtdesjn63ms",
    "calendar_id": "fede",
    "paciente": "Chimo Dols Tarragón",
    "motivo": "revisión general",
    "fechaActividad": "2026-10-30T16:05:24.000Z",
    "fechaCita": "2026-11-02T15:30:00+01:00"
  },
  {
    "id": "fede:9ohvhrr0akvv1rdvi13q5f7s8c",
    "event_id": "9ohvhrr0akvv1rdvi13q5f7s8c",
    "calendar_id": "fede",
    "paciente": "Joel Borreguero Hernández",
    "motivo": "Revisión general",
    "fechaActividad": "2026-11-07T21:04:33.000Z",
    "fechaCita": "2026-11-09T14:00:00+01:00"
  },
  {
    "id": "fede:0mdbt59oqbvt5ca8q28p4j5c3s",
    "event_id": "0mdbt59oqbvt5ca8q28p4j5c3s",
    "calendar_id": "fede",
    "paciente": "Lautaro Lavia",
    "motivo": "revisión general",
    "fechaActividad": "2026-11-10T07:16:04.000Z",
    "fechaCita": "2026-11-12T15:00:00+01:00"
  },
  {
    "id": "fede:22qm4f8srjqbsuii359osig214",
    "event_id": "22qm4f8srjqbsuii359osig214",
    "calendar_id": "fede",
    "paciente": "Enrique Soto Saravia",
    "motivo": "Primera visita",
    "fechaActividad": "2026-11-18T17:25:35.000Z",
    "fechaCita": "2026-11-24T18:45:00+01:00"
  },
  {
    "id": "fede:fvakvvpteajgndl6a2fms8r6fg",
    "event_id": "fvakvvpteajgndl6a2fms8r6fg",
    "calendar_id": "fede",
    "paciente": "Carlos López Ciprés",
    "motivo": "revisión general",
    "fechaActividad": "2026-11-23T18:53:27.000Z",
    "fechaCita": "2026-11-25T16:00:00+01:00"
  }
];

type CitaDB = {
  id: string; event_id: string | null; calendar_id: string | null;
  profesional: string | null; nombre_paciente: string | null;
  motivo: string | null; estado: string | null; origen: string | null;
  fecha_inicio: string | null; fecha_fin: string | null;
  created_at: string | null; updated_at: string | null;
};
type CambioDB = {
  historial_cita_id: string;
  realizado_por: string | null;
  created_at: string | null;
  tipo_movimiento: string | null;
};
type CitaMartina = {
  id: string; event_id: string; calendar_id: string; paciente: string;
  motivo: string; fechaActividad: string; fechaCita: string | null; estimada?: boolean;
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
function estadoVigente(c: CitaDB) { return normalizar(c.estado)!=='cancelada'; }
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
function compilarMartina(citas:CitaDB[], cambios:CambioDB[]) {
  const registros=new Map<string,CitaMartina>();
  const historico=new Map(MARTINA_HISTORICA.map(c=>[c.id,c]));
  // Snapshot de origen Google Calendar: incluye el registro aún no enlazado a Supabase.
  for(const c of MARTINA_HISTORICA) registros.set(c.id,c);
  const primeraMod=new Map<string,string>();
  for(const m of cambios) {
    if(!esMartina(m.realizado_por)||!m.created_at) continue;
    const previa=primeraMod.get(m.historial_cita_id);
    if(!previa || new Date(m.created_at)<new Date(previa)) primeraMod.set(m.historial_cita_id,m.created_at);
  }
  for(const c of citas) {
    const key=idDeCita(c);
    const esCreacion=esMartina(c.origen);
    const primera=primeraMod.get(c.id);
    if(!esCreacion && !primera && !historico.has(key)) continue;
    const h=historico.get(key);
    // Si fue creada por Martina, su actividad es la creación (fecha GC verificada).
    // En registros posteriores a la extracción, 'created_at' sirve provisionalmente;
    // las importaciones previas no se atribuyen falsamente a noviembre.
    const fechaActividad=h?.fechaActividad || (esCreacion ? c.created_at : primera);
    if(!fechaActividad) continue;
    registros.set(key,{
      id:key,event_id:c.event_id||c.id,calendar_id:normalizar(c.calendar_id),
      paciente:c.nombre_paciente||h?.paciente||'Paciente sin nombre',
      motivo:c.motivo||h?.motivo||'Sin motivo',fechaActividad,
      fechaCita:c.fecha_inicio || h?.fechaCita || null,
      estimada:!h && esCreacion
    });
  }
  return Array.from(registros.values()).sort((a,b)=>new Date(b.fechaActividad).getTime()-new Date(a.fechaActividad).getTime());
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
  const martina=useMemo(()=>compilarMartina(citasUnicas,cambios),[citasUnicas,cambios]);
  const lunes=useMemo(()=>moverDia(fechaBase,desplazamiento*7),[fechaBase,desplazamiento]);
  const dias=useMemo(()=>Array.from({length:mostrarFinde?7:5},(_,i)=>moverDia(lunes,i)),[lunes,mostrarFinde]);
  const diasClave=useMemo(()=>new Set(dias.map(claveLocal)),[dias]);
  const citasSemana=useMemo(()=>martina.filter(c=>diasClave.has(diaMadrid(c.fechaCita))),[martina,diasClave]);
  const barras=useMemo(()=>dias.map(d=>citasSemana.filter(c=>diaMadrid(c.fechaCita)===claveLocal(d)).length),[dias,citasSemana]);
  const mayorBarra=Math.max(5,...barras);
  // Resumen clínico anual: Dr. Federico incluye histórico de Celia internamente.
  // Ningún total operativo incluye canceladas.
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
          <div className="shrink-0 rounded-xl border border-cyan-400/30 bg-[#082B35] px-2.5 py-1.5 text-center shadow-[0_0_14px_rgba(34,211,238,.08)] sm:px-3 sm:py-2">
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
        {errorDatos?<p className="mt-2 flex gap-1 text-xs text-amber-200"><AlertCircle className="h-4 w-4 shrink-0"/>{errorDatos}. El histórico verificado de Martina sigue disponible.</p>:null}
        <div className="mt-2 flex justify-end"><button type="button" onClick={()=>setInspeccionar(true)} className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/45 bg-cyan-400/[.06] px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[.1em] text-cyan-100 shadow-[0_0_11px_rgba(34,211,238,.11)] transition hover:border-cyan-200 hover:bg-cyan-400/20 hover:shadow-[0_0_20px_rgba(34,211,238,.22)]"><ChartNoAxesCombined className="h-3.5 w-3.5 text-cyan-300"/> Inspeccionar</button></div>
      </section>
      <CajaPendiente titulo="SEGUIMIENTO" icono={HeartPulse}/>
      <CajaPendiente titulo="LABORATORIO" icono={FlaskConical}/>
      <CajaPendiente titulo="GESTIÓN MARTINA" icono={Bot}/>
    </div>
  );

  // Inspeccionar mantiene los filtros y los cálculos originales. Solo cambia la presentación.
  const inspector = inspeccionar ? (
    <div role="dialog" aria-modal="true" aria-label="Inspeccionar actividad clínica" className={`fixed inset-0 z-[100] overflow-y-auto bg-[#02141B]/95 px-3 py-4 text-white backdrop-blur-lg sm:px-6 sm:py-6 lg:px-10 lg:py-8 ${scrollCyan}`}>
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

        {/* Filtros más ligeros, similares a las acciones del panel; 2 columnas compactas en móvil. */}
        <section className="rounded-[24px] border border-cyan-400/25 bg-cyan-400/[.035] px-3 py-3 shadow-[0_0_24px_rgba(34,211,238,.065),inset_0_1px_0_rgba(165,243,252,.035)] sm:px-5 sm:py-5">
          <h3 className="mb-3 text-[11px] font-normal uppercase tracking-[.12em] text-cyan-200 sm:mb-4 sm:text-xs">FILTROS DE ACTIVIDAD</h3>
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 sm:gap-4 lg:grid-cols-5">
            {([
              {label:'Año',value:anioInspeccion,change:setAnioInspeccion,options:opcionesAnios.map(y=>({value:y,label:y}))},
              {label:'Mes',value:mesInspeccion,change:setMesInspeccion,options:[{value:'todos',label:'Todo el año'},...Array.from({length:12},(_,i)=>({value:String(i+1),label:new Intl.DateTimeFormat('es-ES',{month:'long'}).format(new Date(2026,i,1))}))]},
              {label:'Profesional',value:profInspeccion,change:setProfInspeccion,options:[{value:'todos',label:'Todos'},{value:'fede',label:'Dr. Federico'},{value:'ana',label:'Dra. Ana'}]},
              {label:'Estado',value:estadoInspeccion,change:setEstadoInspeccion,options:[{value:'vigentes',label:'Vigentes'},{value:'finalizada',label:'Finalizadas'},{value:'pendiente',label:'Pendientes'},{value:'no_ha_venido',label:'No asistió'},{value:'cancelada',label:'Canceladas'},{value:'todos',label:'Todos los estados'}]},
              {label:'Tipo',value:motivoInspeccion,change:setMotivoInspeccion,options:[{value:'todos',label:'Todos'},{value:'primera',label:'Primeras visitas'},{value:'otras',label:'Otros tratamientos'}]},
            ] as {label:string;value:string;change:(v:string)=>void;options:{value:string;label:string}[]}[]).map((f,i)=>(
              <label key={f.label} className={`block min-w-0 text-[11px] text-cyan-100/70 sm:text-xs ${i===4?'col-span-2 lg:col-span-1':''}`}>
                {f.label}
                <span className="relative mt-1 block sm:mt-1.5">
                  <select value={f.value} onChange={e=>f.change(e.target.value)} className="w-full appearance-none rounded-xl border border-cyan-400/25 bg-[#0A303B] py-2 pl-3 pr-9 text-xs text-white shadow-[inset_0_1px_0_rgba(165,243,252,.04)] outline-none transition hover:border-cyan-300/50 focus:border-cyan-300/75 focus:ring-1 focus:ring-cyan-300/35 sm:py-2.5 sm:text-sm">
                    {f.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/85" aria-hidden="true" />
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Cuatro medallones compactos, centrados. Conservamos los indicadores originales. */}
        <div className="grid grid-cols-2 justify-items-center gap-x-2 gap-y-4 py-1 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-6 sm:py-2 lg:gap-10">
          {([['TOTAL FILTRADO',inspeccion.length],['DR. FEDERICO',inspeccion.filter(c=>profesionalGrupo(c)==='fede').length],['DRA. ANA',inspeccion.filter(c=>profesionalGrupo(c)==='ana').length],['PRIMERAS VISITAS',primerasVisitasPeriodo]] as [string,number][]).map(([titulo,valor])=>(
            <div key={titulo} className="flex h-[116px] w-[116px] flex-col items-center justify-center gap-1 rounded-full border border-cyan-300/35 bg-[radial-gradient(circle_at_50%_35%,#0E3945_0%,#05232D_75%,#031820_100%)] px-2 text-center shadow-[0_0_21px_rgba(34,211,238,.10),inset_0_0_14px_rgba(34,211,238,.045)] sm:h-[138px] sm:w-[138px]">
              <strong className="text-[27px] font-semibold leading-none tabular-nums text-white drop-shadow-[0_0_12px_rgba(103,232,249,.15)] sm:text-[34px]">{valor}</strong>
              <span className="max-w-[100px] text-[9px] font-medium uppercase leading-tight tracking-[.045em] text-cyan-200/80 sm:max-w-[120px] sm:text-[10px]">{titulo}</span>
            </div>
          ))}
        </div>

        {/* Cabecera del detalle más oscura que el encabezado de la tabla, estilo barra de acciones. */}
        <section className="overflow-hidden rounded-[26px] border border-cyan-400/30 bg-[#041D26] shadow-[0_0_26px_rgba(34,211,238,.075),inset_0_1px_0_rgba(165,243,252,.05)]">
          <div className="flex flex-col gap-3 border-b border-cyan-400/20 bg-[#021820] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <h3 className="text-xs font-normal uppercase tracking-[.11em] text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,.20)] sm:text-sm">DETALLE DE CITAS</h3>
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
    <div className="lg:hidden h-[calc(100dvh-190px)] overflow-y-auto bg-[#02141B] text-white px-5 pt-6 pb-32 overflow-x-hidden">
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


