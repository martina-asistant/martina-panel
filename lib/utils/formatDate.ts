export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatRelativeOrTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return formatTime(iso);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString('es-ES', { weekday: 'short' });
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

export function lastActivity(c: { ultimo_mensaje_entrante_at: string | null; ultimo_mensaje_saliente_at: string | null; updated_at: string }): string {
  const dates = [c.ultimo_mensaje_entrante_at, c.ultimo_mensaje_saliente_at, c.updated_at].filter(Boolean) as string[];
  if (dates.length === 0) return c.updated_at;
  return dates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
}
