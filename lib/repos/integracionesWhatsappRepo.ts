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

const DEFAULT_CLIENTE_ID = "rambla-vilar-dental";
const DEFAULT_NOMBRE_CLINICA = "Rambla Vilar Dental";

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    console.error("Error leyendo integracion WhatsApp:", error);
    throw error;
  }

  return data as IntegracionWhatsapp | null;
}

export async function upsertIntegracionWhatsapp(input: {
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
}): Promise<IntegracionWhatsapp> {
  const supabase = getSupabaseAdmin();

  const payload = {
    cliente_id: input.cliente_id || DEFAULT_CLIENTE_ID,
    nombre_clinica: input.nombre_clinica || DEFAULT_NOMBRE_CLINICA,
    proveedor: "meta",
    estado: input.estado || "pendiente",
    waba_id: input.waba_id ?? null,
    phone_number_id: input.phone_number_id ?? null,
    display_phone_number: input.display_phone_number ?? null,
    access_token: input.access_token ?? null,
    token_expires_at: input.token_expires_at ?? null,
    business_id: input.business_id ?? null,
    config_id: input.config_id ?? null,
    ultimo_error: input.ultimo_error ?? null,
    webhook_verify_token: input.webhook_verify_token ?? null,
    webhook_secret: input.webhook_secret ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("integraciones_whatsapp")
    .upsert(payload, { onConflict: "cliente_id" })
    .select("*")
    .single();

  if (error) {
    console.error("Error guardando integracion WhatsApp:", error);
    throw error;
  }

  return data as IntegracionWhatsapp;
}

export async function marcarWhatsappConectado(input: {
  cliente_id?: string;
  nombre_clinica?: string;
  waba_id: string;
  phone_number_id: string;
  display_phone_number?: string | null;
  access_token: string;
  token_expires_at?: string | null;
  business_id?: string | null;
  config_id?: string | null;
}) {
  return upsertIntegracionWhatsapp({
    ...input,
    estado: "conectada",
    ultimo_error: null,
  });
}

export async function marcarWhatsappError(input: {
  cliente_id?: string;
  ultimo_error: string;
}) {
  const actual = await getIntegracionWhatsapp(input.cliente_id);

  return upsertIntegracionWhatsapp({
    cliente_id: input.cliente_id,
    nombre_clinica: actual?.nombre_clinica || DEFAULT_NOMBRE_CLINICA,
    waba_id: actual?.waba_id,
    phone_number_id: actual?.phone_number_id,
    display_phone_number: actual?.display_phone_number,
    access_token: actual?.access_token,
    token_expires_at: actual?.token_expires_at,
    business_id: actual?.business_id,
    config_id: actual?.config_id,
    webhook_verify_token: actual?.webhook_verify_token,
    webhook_secret: actual?.webhook_secret,
    estado: "error",
    ultimo_error: input.ultimo_error,
  });
}
