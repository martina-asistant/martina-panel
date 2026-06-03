'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';

const agendas = [
  { key: 'fede', nombre: 'Agenda Fede' },
  { key: 'celia', nombre: 'Agenda Celia' },
  { key: 'ana', nombre: 'Agenda Ana' },
];

const acciones = [
  'Insertar cita',
  'Modificar cita',
  'Cancelar cita',
  'Agregar recall',
];

export default function AgendasView() {
  const [agendaActiva, setAgendaActiva] = useState('fede');

  const agenda = agendas.find(a => a.key === agendaActiva);

  return (
    <div className="min-h-full overflow-y-auto p-8 bg-[#02141B] text-white">
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="inline-block text-2xl font-semibold tracking-[-0.015em] bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent mb-1">
            Agendas
          </h1>

          <p className="text-sm text-cyan-100/55">
            Gestión de citas
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3">
          <CalendarDays className="w-5 h-5 text-cyan-300" />

          <select
            value={agendaActiva}
            onChange={(e) => setAgendaActiva(e.target.value)}
            className="bg-transparent text-white text-sm font-medium outline-none"
          >
            {agendas.map((a) => (
              <option key={a.key} value={a.key} className="bg-[#03111A] text-white">
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-[rgba(5,18,24,.78)] backdrop-blur-xl p-6 min-h-[520px] shadow-[0_0_35px_rgba(34,211,238,.10)]">
        <div className="flex items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="text-[12px] tracking-[0.38em] text-cyan-300 font-semibold">
              {agenda?.nombre.toUpperCase()}
            </h2>

            <p className="text-sm text-cyan-100/55 mt-2">
              Calendario de citas
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {acciones.map((accion) => (
              <button
                key={accion}
                className="
                  rounded-2xl border border-cyan-400/30 bg-cyan-500/10
                  px-4 py-2.5 text-sm text-cyan-100
                  hover:bg-cyan-500/20 hover:border-cyan-300/50
                  hover:shadow-[0_0_18px_rgba(34,211,238,.18)]
                  transition-all whitespace-nowrap
                "
              >
                {accion}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 text-sm text-cyan-100/60">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((dia) => (
            <div
              key={dia}
              className="rounded-2xl border border-cyan-400/10 bg-[#03111A]/70 p-4 min-h-[420px]"
            >
              <div className="font-medium text-cyan-200 mb-4">
                {dia}
              </div>

              <div className="space-y-2">
                {['09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00'].map((hora) => (
                  <button
                    key={hora}
                    className="
                      w-full rounded-xl border border-cyan-400/10
                      bg-white/5 px-3 py-2 text-left
                      hover:bg-cyan-500/10 hover:text-white
                      transition-all
                    "
                  >
                    {hora}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
