'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import type {
  ConversacionWhatsapp,
  RecordatorioCita,
  Recall
} from '@/lib/types/db.types';

import { listConversaciones } from '@/lib/repos/conversaciones.repo';
import { listRecordatorios } from '@/lib/repos/recordatorios.repo';
import { listRecalls } from '@/lib/repos/recalls.repo';
import { createClient } from '@/lib/supabase/client';

interface Props {
  initialConvs?: ConversacionWhatsapp[];
  initialRecs?: RecordatorioCita[];
  initialRecalls?: Recall[];
}

const Metric = ({
  icon,
  label,
  value,
  hint
}: {
  icon: string;
  label: string;
  value: number;
  hint?: string;
}) => (

<Card className="
group
relative
overflow-hidden
rounded-3xl
border
border-cyan-500/20
bg-[rgba(5,18,24,.75)]
backdrop-blur-xl
p-5
transition-all
duration-500
hover:scale-[1.03]
hover:border-cyan-400/40
hover:shadow-[0_0_30px_rgba(34,211,238,.35)]
">

<div
className="
absolute
inset-0
opacity-0
group-hover:opacity-100
transition-opacity
duration-700
bg-gradient-to-br
from-cyan-500/10
to-transparent
"
/>

<div className="relative flex items-center justify-between">

<div>

<div className="
text-xs
uppercase
tracking-[0.2em]
text-cyan-300/70
mb-2
">
{label}
</div>

<div className="
text-4xl
font-bold
text-white
">
{value}
</div>

{hint && (

<div className="
text-xs
text-cyan-100/50
mt-2
">
{hint}
</div>

)}

</div>

<div className="
w-14
h-14
rounded-2xl
bg-cyan-500/10
flex
items-center
justify-center
text-2xl
shadow-[0_0_20px_rgba(34,211,238,.25)]
group-hover:scale-110
transition-all
duration-500
">

{icon}

</div>

</div>

</Card>

);

const DashboardClient = ({
  initialConvs = [],
  initialRecs = [],
  initialRecalls = []
}: Props) => {

const [convs,setConvs] =
useState<ConversacionWhatsapp[]>(initialConvs);

const [recs,setRecs] =
useState<RecordatorioCita[]>(initialRecs);

const [recalls,setRecalls] =
useState<Recall[]>(initialRecalls);

useEffect(() => {

(async()=>{

const [c,r,rc] = await Promise.all([
listConversaciones(),
listRecordatorios(),
listRecalls()
]);

setConvs(c);
setRecs(r);
setRecalls(rc);

})();

},[]);

useEffect(()=>{

const supa=createClient();

if(!supa) return;

const ch=supa
.channel('dashboard-realtime')

.on(
'postgres_changes',
{
event:'*',
schema:'public',
table:'conversaciones_whatsapp'
},
async()=>setConvs(await listConversaciones())
)

.on(
'postgres_changes',
{
event:'*',
schema:'public',
table:'recordatorios_cita'
},
async()=>setRecs(await listRecordatorios())
)

.on(
'postgres_changes',
{
event:'*',
schema:'public',
table:'recalls'
},
async()=>setRecalls(await listRecalls())
)

.subscribe();

return ()=>{

supa.removeChannel(ch);

};

},[]);

const today=new Date();
today.setHours(0,0,0,0);

const isToday=(iso:string|null)=>
iso?new Date(iso)>=today:false;

const nuevas=
convs.filter(
c=>c.estado_visual==='nueva'
).length;

const enCurso=
convs.filter(
c=>c.estado_visual==='en_curso'
).length;

const recepcion=
convs.filter(
c=>c.estado_visual==='recepcion'
).length;

const gestion=
convs.filter(
c=>c.estado_visual==='gestionada'
).length;

const recados=
convs.filter(
c=>(c.notas_internas||'').trim().length>0
).length;

const recallsEnviadosHoy=
recalls.filter(
r=>isToday(r.fecha_envio)
).length;

const recordatoriosEnviadosHoy=
recs.filter(
r=>isToday(r.created_at)
).length;

const citasCreadasHoy=
convs.filter(
c=>c.estado_cita==='creada'
&& isToday(c.updated_at)
).length;

const recConf=
recs.filter(
r=>r.estado==='confirmada'
).length;

const recNo=
recs.filter(
r=>r.estado==='no_podra_asistir'
).length;

const recMod=
recs.filter(
r=>r.estado==='cita_modificada'
).length;

const recCancel=
recs.filter(
r=>r.estado==='cancelada_recado'
).length;

return (

<div className="
h-full
overflow-y-auto
p-8
bg-[#02141B]
text-white
">

<h1 className="
text-4xl
font-bold
mb-2
bg-gradient-to-r
from-white
to-cyan-300
bg-clip-text
text-transparent
">

Hola Sheila 👋

</h1>

<p className="
text-cyan-100/60
mb-8
">

Martina está gestionando la actividad en tiempo real.

</p>

<div className="space-y-8">

<section>

<h2 className="text-cyan-300/60 mb-4 uppercase tracking-wider">

Conversaciones

</h2>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

<Metric icon="🤖" label="Nuevas" value={nuevas}/>
<Metric icon="💬" label="En curso" value={enCurso}/>
<Metric icon="👩🏽‍⚕️" label="Recepción" value={recepcion}/>
<Metric icon="✅" label="Gestionadas" value={gestion}/>
<Metric icon="📌" label="Recados" value={recados}/>

</div>

</section>

<section>

<h2 className="text-cyan-300/60 mb-4 uppercase tracking-wider">

Actividad de hoy

</h2>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

<Metric icon="📅" label="Citas creadas" value={citasCreadasHoy}/>
<Metric icon="🔔" label="Recordatorios" value={recordatoriosEnviadosHoy}/>
<Metric icon="📞" label="Recalls" value={recallsEnviadosHoy}/>

</div>

</section>

<section>

<h2 className="text-cyan-300/60 mb-4 uppercase tracking-wider">

Estado recordatorios

</h2>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

<Metric icon="🟢" label="Confirmadas" value={recConf}/>
<Metric icon="❌" label="No asistirá" value={recNo}/>
<Metric icon="✔️" label="Modificadas" value={recMod}/>
<Metric icon="🔴" label="Canceladas" value={recCancel}/>

</div>

</section>

</div>

</div>

);

};

export default DashboardClient;
