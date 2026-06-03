'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';

const agendas = [
  { key: 'fede', nombre: 'Agenda Fede' },
  { key: 'celia', nombre: 'Agenda Celia' },
  { key: 'ana', nombre: 'Agenda Ana' },
];

export default function AgendasView() {
  const [agendaActiva, setAgendaActiva] = useState('fede');

  const agenda = agendas.find(a => a.key === agendaActiva);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Agendas
          </h1>

          <p className="text-cyan-300">
            Gestión de citas
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3">
          <CalendarDays className="w-5 h-5 text-cyan-300" />

          <select
            value={agendaActiva}
            onChange={(e) => setAgendaActiva(e.target.value)}
            className="bg-transparent text-white text-sm outline-none"
          >
            {agendas.map((a) => (
              <option key={a.key} value={a.key} className="bg-[#03111A] text-white">
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-6 min-h-[520px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {agenda?.nombre}
            </h2>

            <p className="text-sm text-cyan-100/60 mt-1">
              Vista de calendario pendiente de conexión
            </p>
          </div>

          <button
            className="
              rounded-2xl border border-cyan-400/30 bg-cyan-500/10
              px-5 py-3 text-sm text-cyan-100
              hover:bg-cyan-500/20 hover:border-cyan-300/50
              transition-all
            "
          >
            Insertar cita
          </button>
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
'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';

const agendas = [
  { key: 'fede', nombre: 'Agenda Fede' },
  { key: 'celia', nombre: 'Agenda Celia' },
  { key: 'ana', nombre: 'Agenda Ana' },
];

export default function AgendasView() {
  const [agendaActiva, setAgendaActiva] = useState('fede');

  const agenda = agendas.find(a => a.key === agendaActiva);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <h1
            className="
              text-4xl font-semibold tracking-[-0.015em]
              scale-x-[0.97] origin-left
              bg-gradient-to-r from-white to-cyan-300
              bg-clip-text text-transparent mb-1
            "
          >
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
            className="bg-transparent text-white text-sm outline-none"
          >
            {agendas.map((a) => (
              <option key={a.key} value={a.key} className="bg-[#03111A] text-white">
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-6 min-h-[520px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {agenda?.nombre}
            </h2>

            <p className="text-sm text-cyan-100/60 mt-1">
              Vista de calendario pendiente de conexión
            </p>
          </div>

          <button
            className="
              rounded-2xl border border-cyan-400/30 bg-cyan-500/10
              px-5 py-3 text-sm text-cyan-100
              hover:bg-cyan-500/20 hover:border-cyan-300/50
              transition-all
            "
          >
            Insertar cita
          </button>
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
