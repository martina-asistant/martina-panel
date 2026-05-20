# Martina Panel

Panel de gestión para clínica dental. Construido con **Next.js 14 (App Router) + TypeScript + Tailwind + Supabase**.

Diseño minimalista (blanco / beige / negro) inspirado en WhatsApp Web.

## Funcionalidad

- 🔐 Login email/password con Supabase Auth
- 📊 Dashboard con métricas en tiempo real
- 💬 Conversaciones tipo WhatsApp Web (filtros, búsqueda, paciente lateral)
- 📞 Recalls con filtros por estado
- 🔔 Recordatorios con filtros por estado
- ⚡ Supabase Realtime para `conversaciones_whatsapp`, `mensajes_whatsapp`, `recordatorios_cita`, `recalls`
- 🧪 Modo demo con datos mock (sin claves de Supabase)

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena con tus claves:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> ⚠️ **Nunca** uses la `service_role` key en este panel. Toda la seguridad debe basarse en RLS de Supabase.

## Tablas usadas (no se crean nuevas)

- `patients` · lectura + UPDATE solo de `notas_internas`
- `conversaciones_whatsapp` · lectura + UPDATE solo de `modo_atencion`, `estado_visual`, `asignado_a`, `notas_internas`
- `mensajes_whatsapp` · solo lectura
- `recalls` · solo lectura
- `recordatorios_cita` · solo lectura

## Acciones sobre conversaciones

| Botón | modo_atencion | estado_visual | asignado_a |
|---|---|---|---|
| Tomar conversación | `recepcion` | `recepcion` | email usuario |
| Devolver a Martina | `martina` | `en_curso` | `null` |
| Cerrar gestión | `martina` | `gestionada` | `null` |

## Desarrollo local

```bash
yarn install
yarn dev
```

## Despliegue en Vercel

1. Sube el repo a GitHub.
2. Conecta el repo en Vercel.
3. Añade las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Project Settings → Environment Variables.
4. Deploy.

## Compatibilidad con n8n

Este panel **no toca** ninguna columna gestionada por n8n (citas, event_id, calendar_id, fechas, etiquetas automáticas, estado de recalls/recordatorios). Solo edita los campos de gestión humana arriba indicados.
