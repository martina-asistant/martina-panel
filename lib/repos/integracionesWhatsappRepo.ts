import { createClient } from "@supabase/supabase-js";

export type EstadoIntegracionWhatsapp =
  | "pendiente"
  | "conectada"
  | "error"
  | "desconectada";

export type IntegracionWhatsapp = {
  id: string;
  cliente_id: string;
  nombre_clinica: string;
  waba_id: string | null;
  phone_number_id: string | null;
  display_phone_number: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  estado: EstadoIntegracionWhatsapp;
  proveedor: string;
  business_id: string | null;
  config_id: string | null;
  ultimo_error: string | null;
  webhook_verify_token: string | null;
  webhook_secret: string | null;
  created_at: string;
  updated_at: string;
};

export type UpsertIntegracionWhatsappInput = {
  cliente_id?: string;
  nombre_clinica?: string;
  waba_id?: string | null;
  phone_number_id?: string | null;
  display_phone_number?: string | null;
  access_token?: string | null;
  token_expires_at?: string | null;
  estado?: EstadoIntegracionWhatsapp;
  business_id?: string | null;
  config_id?: string | null;
  ultimo_error?: string | null;
  webhook_verify_token?: string | null;
  webhook_secret?: string | null;
};

const DEFAULT_CLIENTE_ID = "rambla-vilar-dental";
const DEFAULT_NOMBRE_CLINICA = "Rambla Vilar Dental";

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getIntegracionWhatsapp(
  clienteId = DEFAULT_CLIENTE_ID
): Promise<IntegracionWhatsapp | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("integraciones_whatsapp")
    .select("*")
    .eq("cliente_id", clienteId)
    .maybeSingle();

  if (error) {
    console.error(
      "Error leyendo integración WhatsApp:",
      error
    );
    throw error;
  }

  return data as IntegracionWhatsapp | null;
}

export async function upsertIntegracionWhatsapp(
  input: UpsertIntegracionWhatsappInput
): Promise<IntegracionWhatsapp> {
  const supabase = getSupabaseAdmin();

  const clienteId =
    input.cliente_id || DEFAULT_CLIENTE_ID;

  const actual =
    await getIntegracionWhatsapp(clienteId);

  const payload = {
    cliente_id: clienteId,

    nombre_clinica:
      input.nombre_clinica ??
      actual?.nombre_clinica ??
      DEFAULT_NOMBRE_CLINICA,

    proveedor:
      actual?.proveedor ?? "meta",

    estado:
      input.estado ??
      actual?.estado ??
      "pendiente",

    waba_id:
      input.waba_id !== undefined
        ? input.waba_id
        : actual?.waba_id ?? null,

    phone_number_id:
      input.phone_number_id !== undefined
        ? input.phone_number_id
        : actual?.phone_number_id ?? null,

    display_phone_number:
      input.display_phone_number !== undefined
        ? input.display_phone_number
        : actual?.display_phone_number ?? null,

    access_token:
      input.access_token !== undefined
        ? input.access_token
        : actual?.access_token ?? null,

    token_expires_at:
      input.token_expires_at !== undefined
        ? input.token_expires_at
        : actual?.token_expires_at ?? null,

    business_id:
      input.business_id !== undefined
        ? input.business_id
        : actual?.business_id ?? null,

    config_id:
      input.config_id !== undefined
        ? input.config_id
        : actual?.config_id ?? null,

    ultimo_error:
      input.ultimo_error !== undefined
        ? input.ultimo_error
        : actual?.ultimo_error ?? null,

    webhook_verify_token:
      input.webhook_verify_token !== undefined
        ? input.webhook_verify_token
        : actual?.webhook_verify_token ?? null,

    webhook_secret:
      input.webhook_secret !== undefined
        ? input.webhook_secret
        : actual?.webhook_secret ?? null,

    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("integraciones_whatsapp")
    .upsert(payload, {
      onConflict: "cliente_id",
    })
    .select("*")
    .single();

  if (error) {
    console.error(
      "Error guardando integración WhatsApp:",
      error
    );
    throw error;
  }

  return data as IntegracionWhatsapp;
}

export async function marcarWhatsappConectado(input: {
  cliente_id?: string;
  nombre_clinica?: string;
  waba_id: string;
  phone_number_id: string;
  display_phone_number: string;
  business_id?: string | null;
  config_id?: string | null;
}) {
  return upsertIntegracionWhatsapp({
    ...input,

    // El token permanente está protegido en Vercel.
    access_token: null,
    token_expires_at: null,

    estado: "conectada",
    ultimo_error: null,
  });
}

export async function marcarWhatsappError(input: {
  cliente_id?: string;
  ultimo_error: string;
}) {
  return upsertIntegracionWhatsapp({
    cliente_id: input.cliente_id,
    estado: "error",
    ultimo_error: input.ultimo_error,
  });
}
