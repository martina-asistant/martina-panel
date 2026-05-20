import type { EstadoVisualConv, EstadoRecordatorio, EstadoRecall } from '@/lib/types/db.types';

export const conversacionLabel: Record<EstadoVisualConv, { emoji: string; label: string; color: string }> = {
  nueva:      { emoji: '🤖', label: 'Martina',    color: 'bg-martina-beige text-martina-text' },
  en_curso:   { emoji: '💬', label: 'En curso',   color: 'bg-blue-50 text-blue-900' },
  recepcion:  { emoji: '👩🏽\u200d⚕️', label: 'Recepción',  color: 'bg-amber-50 text-amber-900' },
  gestionada: { emoji: '✅', label: 'Gestionada', color: 'bg-emerald-50 text-emerald-900' },
};

export const recordatorioLabel: Record<EstadoRecordatorio, { emoji: string; label: string; color: string }> = {
  sin_respuesta:     { emoji: '⚪', label: 'Sin respuesta',    color: 'bg-neutral-100 text-neutral-700' },
  confirmada:        { emoji: '🟢', label: 'Confirmada',       color: 'bg-emerald-50 text-emerald-800' },
  no_podra_asistir:  { emoji: '❌', label: 'No podrá asistir', color: 'bg-rose-50 text-rose-800' },
  cita_modificada:   { emoji: '✔️', label: 'Cita modificada',  color: 'bg-blue-50 text-blue-800' },
  cancelada_recado:  { emoji: '🔴', label: 'Cancelada + recado', color: 'bg-red-50 text-red-800' },
};

export const recallLabel: Record<EstadoRecall, { emoji: string; label: string; color: string }> = {
  enviado:        { emoji: '⚪', label: 'Enviado',          color: 'bg-neutral-100 text-neutral-700' },
  sin_respuesta:  { emoji: '⚪', label: 'Sin respuesta',    color: 'bg-neutral-100 text-neutral-700' },
  quiere_cita:    { emoji: '🟢', label: 'Quiere cita',      color: 'bg-emerald-50 text-emerald-800' },
  cita_agendada:  { emoji: '✅', label: 'Cita agendada',    color: 'bg-emerald-100 text-emerald-900' },
  pospuesto:      { emoji: '🔴', label: 'Más adelante',     color: 'bg-red-50 text-red-800' },
};
