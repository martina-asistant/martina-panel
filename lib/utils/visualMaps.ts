import type { EstadoVisualConv, EstadoRecordatorio, EstadoRecall } from '@/lib/types/db.types';

export const conversacionLabel: Record<EstadoVisualConv, { emoji: string; label: string; color: string }> = {
  nueva:      { emoji: '🤖', label: 'Martina',    color: 'bg-martina-beige text-martina-text' },
  en_curso:   { emoji: '💬', label: 'En curso',   color: 'bg-blue-50 text-blue-900' },
  recepcion:  { emoji: '👩🏽\u200d⚕️', label: 'Recepción',  color: 'bg-amber-50 text-amber-900' },
  gestionada: { emoji: '✅', label: 'Gestionada', color: 'bg-emerald-50 text-emerald-900' },
};

export const recordatorioLabel: Record<EstadoRecordatorio, { emoji: string; label: string; color: string }> = {
  sin_respuesta:     { emoji: '⚪', label: 'Pendiente',    color: 'bg-neutral-100 text-neutral-700' },
  confirmada:        { emoji: '🟢', label: 'Confirmada',       color: 'bg-emerald-50 text-emerald-800' },
  no_podra_asistir:  { emoji: '❌', label: 'No podrá asistir', color: 'bg-rose-50 text-rose-800' },
  cita_modificada:   { emoji: '✔️', label: 'Cita modificada',  color: 'bg-blue-50 text-blue-800' },
  cancelada_recado:  { emoji: '🔴', label: 'Cancelada + recado', color: 'bg-red-50 text-red-800' },
};

export const recallLabel: Record<EstadoRecall, { emoji: string; label: string; color: string }> = {
  pendiente_envio: { emoji: '🔵', label: 'Pendiente envío', color: 'bg-sky-100 text-sky-800' },
  pendiente: { emoji: '🟣', label: 'Pendiente', color: 'bg-violet-100 text-violet-800' },
  confirmada: { emoji: '🟢', label: 'Confirmada', color: 'bg-emerald-100 text-emerald-800' },
  pospuesta: { emoji: '🔴', label: 'Pospuesta', color: 'bg-red-100 text-red-800' },
};
