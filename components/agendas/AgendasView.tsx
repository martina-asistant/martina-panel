'use client';

import { CalendarDays } from 'lucide-react';

const agendas = [
  {
    nombre: 'Agenda Fede',
    descripcion: 'Odontología general, cirugía, implantes y revisiones',
  },
  {
    nombre: 'Agenda Celia',
    descripcion: 'Higienes, mantenimientos y revisiones de higiene',
  },
  {
    nombre: 'Agenda Ana',
    descripcion: 'Agenda preparada para futura incorporación',
  },
];

export default function AgendasView() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-white mb-2">
        Agendas
      </h1>

      <p className="text-cyan-300 mb-10">
        Selecciona una agenda para gestionarla manualmente.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agendas.map((agenda) => (
          <button
            key={agenda.nombre}
            className="
              text-left
              rounded-3xl
              border
              border-cyan-400/20
              bg-cyan-500/5
              p-6
              hover:bg-cyan-500/10
              hover:border-cyan-400/40
              hover:shadow-[0_0_30px_rgba(34,211,238,.15)]
              transition-all
            "
          >
            <CalendarDays className="w-10 h-10 text-cyan-300 mb-4" />

            <h2 className="text-2xl font-semibold text-white mb-2">
              {agenda.nombre}
            </h2>

            <p className="text-gray-400 text-sm">
              {agenda.descripcion}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
