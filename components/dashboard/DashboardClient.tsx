'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

import {
MessageCircle,
LoaderCircle,
Building2,
Check,
ClipboardPen,
CalendarDays,
Bell,
Phone,
CircleCheck,
CircleX,
RefreshCcw,
Ban
} from 'lucide-react';

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
icon: Icon,
label,
value
}:{
icon:any;
label:string;
value:number;
}) => (

<Card
className="
group
rounded-3xl
border
border-cyan-500/20
bg-[rgba(5,18,24,.78)]
backdrop-blur-xl
p-5
hover:border-cyan-400/40
transition-all
duration-500
hover:shadow-[0_0_25px_rgba(34,211,238,.25)]
"
>

<div className="flex justify-between items-center">

<div>

<div
className="
text-xs
uppercase
tracking-[0.22em]
text-cyan-300/70
mb-3
"
>
{label}
</div>

<div className="text-5xl font-bold text-white">
{value}
</div>

</div>

<div
className="
w-14
h-14
rounded-2xl
bg-cyan-500/10
flex
items-center
justify-center
shadow-[0_0_20px_rgba(34,211,238,.18)]
"
>

<Icon
className="
w-7
h-7
text-cyan-300
"
/>

</div>

</div>

</Card>

);

const DashboardClient = ({
initialConvs=[],
initialRecs=[],
initialRecalls=[]
}:Props)=>{

const [convs,setConvs]=useState(initialConvs);
const [recs,setRecs]=useState(initialRecs);
const [recalls,setRecalls]=useState(initialRecalls);

useEffect(()=>{

(async()=>{

const [c,r,rc]=await Promise.all([
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

return()=>{

supa.removeChannel(ch);

};

},[]);

const today=new Date();

today.setHours(0,0,0,0);

const isToday=(iso:string|null)=>
iso?new Date(iso)>=today:false;

const nuevas=convs.filter(c=>c.estado_visual==='nueva').length;
const enCurso=convs.filter(c=>c.estado_visual==='en_curso').length;
const recepcion=convs.filter(c=>c.estado_visual==='recepcion').length;
const gestion=convs.filter(c=>c.estado_visual==='gestionada').length;
const recados=convs.filter(c=>(c.notas_internas||'').trim().length>0).length;

const recallsHoy=recalls.filter(r=>isToday(r.fecha_envio)).length;
const recordatoriosHoy=recs.filter(r=>isToday(r.created_at)).length;
const citasHoy=convs.filter(
c=>c.estado_cita==='creada'
&& isToday(c.updated_at)
).length;

const recConf=recs.filter(r=>r.estado==='confirmada').length;
const recNo=recs.filter(r=>r.estado==='no_podra_asistir').length;
const recMod=recs.filter(r=>r.estado==='cita_modificada').length;
const recCancel=recs.filter(r=>r.estado==='cancelada_recado').length;

return(

<div className="min-h-full p-8 bg-[#02141B] text-white">

<div className="mb-10">

<h1
className="
text-5xl
font-bold
bg-gradient-to-r
from-white
to-cyan-300
bg-clip-text
text-transparent
mb-3
"
>

Hola Sheila

</h1>

<p className="text-cyan-100/60 text-lg">

Martina está gestionando la actividad en tiempo real.

</p>

</div>

<div className="space-y-10">

<section>

<h2 className="mb-4 uppercase tracking-[0.22em] text-cyan-300/70">

Conversaciones

</h2>

<div className="grid lg:grid-cols-5 gap-4">

<Metric icon={MessageCircle} label="Nuevas" value={nuevas}/>
<Metric icon={LoaderCircle} label="En curso" value={enCurso}/>
<Metric icon={Building2} label="Recepción" value={recepcion}/>
<Metric icon={Check} label="Gestionadas" value={gestion}/>
<Metric icon={ClipboardPen} label="Recados" value={recados}/>

</div>

</section>

<section>

<h2 className="mb-4 uppercase tracking-[0.22em] text-cyan-300/70">

Actividad de hoy

</h2>

<div className="grid lg:grid-cols-3 gap-4">

<Metric icon={CalendarDays} label="Citas creadas" value={citasHoy}/>
<Metric icon={Bell} label="Recordatorios" value={recordatoriosHoy}/>
<Metric icon={Phone} label="Recalls" value={recallsHoy}/>

</div>

</section>

<section>

<h2 className="mb-4 uppercase tracking-[0.22em] text-cyan-300/70">

Estado recordatorios

</h2>

<div className="grid lg:grid-cols-4 gap-4">

<Metric icon={CircleCheck} label="Confirmadas" value={recConf}/>
<Metric icon={CircleX} label="No asistirá" value={recNo}/>
<Metric icon={RefreshCcw} label="Modificadas" value={recMod}/>
<Metric icon={Ban} label="Canceladas" value={recCancel}/>

</div>

</section>

</div>

</div>

);

};

export default DashboardClient;
