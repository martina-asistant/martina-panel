'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  MessageCircle, PhoneCall, CalendarCheck2, ChevronLeft, ChevronRight,
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
  return <section className="flex min-h-[280px] flex-col rounded-3xl border border-cyan-500/20 bg-[rgba(5,28,37,.85)] p-5 shadow-[0_0_24px_rgba(34,211,238,.045)]">
    <div className="flex items-center gap-2 text-cyan-200"><Icon className="h-5 w-5"/><h2 className="text-sm font-semibold tracking-[.14em]">{titulo}</h2></div>
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400"><ClipboardList className="h-9 w-9 text-cyan-300/35"/><span className="text-sm">En desarrollo</span></div>
  </section>;
}

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

  const contenido = <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
    <section className="rounded-3xl border border-cyan-500/25 bg-[rgba(5,28,37,.9)] p-4 text-white shadow-[0_0_30px_rgba(34,211,238,.06)]">
      <div className="flex items-start justify-between gap-3">
        <div><div className="flex items-center gap-2 text-cyan-200"><CalendarCheck2 className="h-5 w-5"/><h2 className="text-sm font-semibold tracking-[.14em]">CITAS CREADAS</h2></div><p className="mt-1 text-xs text-cyan-100/65">Actividad de Martina</p></div>
        <div className="min-w-[98px] rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-center"><div className="text-[10px] tracking-[.12em] text-cyan-100/75">MARTINA · TOTAL</div><div className="mt-0.5 text-2xl font-semibold tabular-nums">{cargando?'…':martina.length}</div><div className="mt-1 text-[10px] text-cyan-100/60">Citas gestionadas</div></div>
      </div>
      <div className="my-3 border-t border-cyan-500/20"/>
      <div className="flex items-center justify-center gap-3">
        <button type="button" aria-label="Semana anterior" onClick={()=>setDesplazamiento(n=>n-1)} className="rounded-xl border border-cyan-500/30 p-2 text-cyan-200 hover:bg-cyan-500/15"><ChevronLeft className="h-4 w-4"/></button>
        <div className="min-w-[167px] text-center text-sm font-semibold tabular-nums">{mesES.format(lunes)} – {mesES.format(dias[dias.length-1])}</div>
        <button type="button" aria-label="Semana siguiente" disabled={desplazamiento>=0} onClick={()=>setDesplazamiento(n=>Math.min(0,n+1))} className="rounded-xl border border-cyan-500/30 p-2 text-cyan-200 hover:bg-cyan-500/15 disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button>
      </div>
      <button type="button" onClick={()=>setMostrarFinde(v=>!v)} className="mx-auto mt-2 block text-[11px] text-cyan-200/70 underline underline-offset-4 hover:text-cyan-100">{mostrarFinde?'Mostrar lunes a viernes':'Ver también sábado y domingo'}</button>
      <div className="mt-3 rounded-2xl border border-cyan-500/15 bg-cyan-950/30 px-4 py-3">
        <div className="mb-3 text-xs text-cyan-100/70">Citas de Martina · por día de cita</div>
        <div className="flex h-[130px] items-end gap-3">
          {dias.map((d,i)=><div key={claveLocal(d)} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[11px] tabular-nums text-cyan-100/80">{barras[i]}</span><div className="flex h-[94px] w-full items-end justify-center"><div className="w-full max-w-9 rounded-t-md bg-cyan-400/75" style={{height:`${barras[i]===0 ? 0 : Math.max(3,barras[i]/mayorBarra*100)}%`}} /></div><span className="text-xs text-cyan-100/75">{['L','M','X','J','V','S','D'][i]}</span></div>)}
        </div>
      </div>
      <div className="mt-4 border-t border-cyan-500/20 pt-3">
        <div className="mb-2 flex justify-between gap-2 text-[11px] font-medium tracking-[.09em] text-cyan-200/80"><span>TOTAL CITAS CLÍNICA</span><span className="tracking-normal">{anioActual}</span></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-cyan-500/20 px-3 py-2"><div className="text-xs text-white">Dr. Federico</div><div className="mt-1 text-lg font-semibold tabular-nums">{cargando?'…':errorDatos?'—':totalFede}</div></div>
          <div className="rounded-xl border border-cyan-500/20 px-3 py-2"><div className="text-xs text-white">Dra. Ana</div><div className="mt-1 text-lg font-semibold tabular-nums">{cargando?'…':errorDatos?'—':totalAna}</div></div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-b border-cyan-500/20 pb-2 text-xs"><strong>Citas de Martina</strong><span className="text-cyan-100/60">{citasSemana.length} en la semana</span></div>
      <div className="mt-2 h-[135px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-cyan-950/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-600/65 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400">
        {citasSemana.length===0?<p className="flex h-full items-center justify-center text-center text-xs text-cyan-100/50">Sin citas de Martina para esta semana</p>:
          citasSemana.map(c=><div key={c.id} className="grid grid-cols-[1.4fr_1fr_.65fr] gap-2 border-b border-cyan-500/10 py-2 text-xs"><span className="truncate" title={c.paciente}>{c.paciente}</span><span className="truncate text-cyan-100/70" title={c.motivo}>{c.motivo}</span><span className="truncate text-right text-cyan-100/60">{c.calendar_id==='ana'?'Ana':'Federico'}</span></div>)}
      </div>
      {errorDatos?<p className="mt-2 flex gap-1 text-xs text-amber-200"><AlertCircle className="h-4 w-4 shrink-0"/>{errorDatos}. El histórico verificado de Martina sigue disponible.</p>:null}
      <button type="button" onClick={()=>setInspeccionar(true)} className="mt-3 ml-auto flex items-center gap-2 rounded-xl border border-cyan-400/35 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/10"><ChartNoAxesCombined className="h-4 w-4"/> Inspeccionar</button>
    </section>
    <CajaPendiente titulo="SEGUIMIENTO" icono={HeartPulse}/>
    <CajaPendiente titulo="LABORATORIO" icono={FlaskConical}/>
    <CajaPendiente titulo="GESTIÓN MARTINA" icono={Bot}/>
  </div>;

  const inspector = inspeccionar ? <div role="dialog" aria-modal="true" aria-label="Inspeccionar actividad clínica" className="fixed inset-0 z-[100] overflow-y-auto bg-[#02141B]/95 p-4 text-white backdrop-blur-lg lg:p-10">
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4"><div><h2 className="flex items-center gap-2 text-2xl font-semibold"><ChartNoAxesCombined className="text-cyan-300"/> Inspeccionar</h2><p className="mt-1 text-xs text-cyan-200/70">Actividad clínica · auditoría de citas por profesional</p></div><button type="button" onClick={()=>setInspeccionar(false)} aria-label="Cerrar" className="rounded-xl border border-cyan-400/30 p-3 hover:bg-cyan-500/10"><X/></button></div>
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-cyan-500/20 bg-[#082C36] p-4 md:grid-cols-5">
        <label className="space-y-1 text-xs text-cyan-100/70">Año<select value={anioInspeccion} onChange={e=>setAnioInspeccion(e.target.value)} className="w-full rounded-lg bg-[#123F4A] p-2 text-white">{opcionesAnios.map(y=><option key={y} value={y}>{y}</option>)}</select></label>
        <label className="space-y-1 text-xs text-cyan-100/70">Mes<select value={mesInspeccion} onChange={e=>setMesInspeccion(e.target.value)} className="w-full rounded-lg bg-[#123F4A] p-2 text-white"><option value="todos">Todo el año</option>{Array.from({length:12},(_,i)=><option key={i} value={String(i+1)}>{new Intl.DateTimeFormat('es-ES',{month:'long'}).format(new Date(2026,i,1))}</option>)}</select></label>
        <label className="space-y-1 text-xs text-cyan-100/70">Profesional<select value={profInspeccion} onChange={e=>setProfInspeccion(e.target.value)} className="w-full rounded-lg bg-[#123F4A] p-2 text-white"><option value="todos">Todos</option><option value="fede">Dr. Federico</option><option value="ana">Dra. Ana</option></select></label>
        <label className="space-y-1 text-xs text-cyan-100/70">Estado<select value={estadoInspeccion} onChange={e=>setEstadoInspeccion(e.target.value)} className="w-full rounded-lg bg-[#123F4A] p-2 text-white"><option value="vigentes">Vigentes</option><option value="finalizada">Finalizadas</option><option value="pendiente">Pendientes</option><option value="no_ha_venido">No asistió</option><option value="cancelada">Canceladas</option><option value="todos">Todos los estados</option></select></label>
        <label className="space-y-1 text-xs text-cyan-100/70">Tipo<select value={motivoInspeccion} onChange={e=>setMotivoInspeccion(e.target.value)} className="w-full rounded-lg bg-[#123F4A] p-2 text-white"><option value="todos">Todos</option><option value="primera">Primeras visitas</option><option value="otras">Otros tratamientos</option></select></label>
      </div>
      <div className="my-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['TOTAL FILTRADO',inspeccion.length],['DR. FEDERICO',inspeccion.filter(c=>profesionalGrupo(c)==='fede').length],['DRA. ANA',inspeccion.filter(c=>profesionalGrupo(c)==='ana').length],['PRIMERAS VISITAS',primerasVisitasPeriodo]].map(([titulo,valor])=><div key={String(titulo)} className="rounded-2xl border border-cyan-500/20 bg-[#082C36] p-4"><div className="text-[10px] tracking-wider text-cyan-200/75">{titulo}</div><div className="mt-2 text-3xl font-semibold tabular-nums">{valor}</div></div>)}
      </div>
      <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#082C36]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 p-4"><h3 className="text-sm font-semibold">Detalle verificable de citas</h3><label className="flex items-center gap-2 rounded-lg border border-cyan-500/30 px-3 py-2 text-xs"><Search className="h-4 w-4 text-cyan-200"/><input aria-label="Buscar paciente o tratamiento" value={buscarInspeccion} onChange={e=>setBuscarInspeccion(e.target.value)} placeholder="Buscar paciente o tratamiento" className="w-48 bg-transparent text-white outline-none placeholder:text-cyan-100/40"/></label></div>
        <div className="max-h-[55vh] overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-cyan-950/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-600/65"><table className="w-full min-w-[680px] text-left text-xs"><thead className="sticky top-0 bg-[#0D3742] text-cyan-100/80"><tr><th className="p-3">Fecha</th><th className="p-3">Paciente</th><th className="p-3">Motivo</th><th className="p-3">Profesional</th><th className="p-3">Estado</th></tr></thead><tbody>{inspeccion.map(c=><tr key={c.id} className="border-t border-cyan-500/10"><td className="p-3">{c.fecha_inicio?fechaCorta.format(new Date(c.fecha_inicio)):'—'}</td><td className="p-3">{c.nombre_paciente||'—'}</td><td className="p-3">{c.motivo||'—'}</td><td className="p-3">{profesionalGrupo(c)==='ana'?'Dra. Ana':profesionalGrupo(c)==='fede'?'Dr. Federico':'Otro'}</td><td className="p-3"><EstadoConPunto estado={c.estado}/></td></tr>)}{inspeccion.length===0?<tr><td className="p-5 text-center text-cyan-100/50" colSpan={5}>{cargando?'Cargando…':'Sin citas para estos filtros'}</td></tr>:null}</tbody></table></div>
      </div>
    </div>
  </div>:null;


return (
  <>
    {/* DESKTOP */}
    <div className="hidden lg:block h-full overflow-y-auto p-8 pb-24 bg-[#02141B] text-white">
      <div className="mb-10 flex items-center justify-between gap-8">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-bold text-white mb-4">
            ¡Hola {nombreUsuario || '...'}!

            <span className="text-cyan-300 text-3xl drop-shadow-[0_0_12px_rgba(34,211,238,.8)]">
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

