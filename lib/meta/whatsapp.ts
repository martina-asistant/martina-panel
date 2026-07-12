const GRAPH_VERSION = "v23.0";

export type MetaTokenData = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: unknown;
};

export type MetaDebugTokenResponse = {
  data?: {
    app_id?: string;
    type?: string;
    application?: string;
    data_access_expires_at?: number;
    expires_at?: number;
    is_valid?: boolean;
    scopes?: string[];
    granular_scopes?: Array<{
      scope: string;
      target_ids?: string[];
    }>;
    user_id?: string;
  };
  error?: unknown;
};

export type MetaWhatsappPhoneNumber = {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  code_verification_status?: string;
  platform_type?: string;
  name_status?: string;
};

type MetaError = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

type MetaPhoneNumbersResponse = {
  data?: MetaWhatsappPhoneNumber[];
  error?: MetaError;
};

type MetaSubscriptionResponse = {
  success?: boolean;
  error?: MetaError;
};

/**
 * Extrae un mensaje legible de los errores devueltos por Meta.
 */
function getMetaErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Meta devolvió un error desconocido";
}

/**
 * Intercambia un código OAuth por un access token.
 *
 * Se conserva para el callback y posibles reconexiones futuras.
 * La conexión actual utiliza el System User Access Token de Vercel.
 */
export async function exchangeCodeForToken(input: {
  code: string;
  redirectUri: string;
  appId: string;
  appSecret: string;
}): Promise<MetaTokenData> {
  const tokenUrl = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`
  );

  tokenUrl.searchParams.set("client_id", input.appId);
  tokenUrl.searchParams.set("client_secret", input.appSecret);
  tokenUrl.searchParams.set("redirect_uri", input.redirectUri);
  tokenUrl.searchParams.set("code", input.code);

  const response = await fetch(tokenUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const data = (await response.json()) as MetaTokenData;

  if (!response.ok) {
    throw new Error(getMetaErrorMessage(data.error));
  }

  return data;
}

/**
 * Comprueba la validez, permisos y activos de un token de Meta.
 */
export async function debugMetaToken(input: {
  accessToken: string;
  appId: string;
  appSecret: string;
}): Promise<MetaDebugTokenResponse> {
  const debugUrl = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/debug_token`
  );

  debugUrl.searchParams.set("input_token", input.accessToken);
  debugUrl.searchParams.set(
    "access_token",
    `${input.appId}|${input.appSecret}`
  );

  const response = await fetch(debugUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const data = (await response.json()) as MetaDebugTokenResponse;

  if (!response.ok) {
    throw new Error(getMetaErrorMessage(data.error));
  }

  return data;
}

/**
 * Obtiene todos los números vinculados a una WABA.
 *
 * El ID devuelto en cada elemento es el Phone Number ID que se utilizará
 * posteriormente para enviar mensajes mediante Cloud API.
 */
export async function getWhatsappPhoneNumbers(input: {
  wabaId: string;
  accessToken: string;
}): Promise<MetaWhatsappPhoneNumber[]> {
  const url = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/${input.wabaId}/phone_numbers`
  );

  url.searchParams.set(
    "fields",
    [
      "id",
      "display_phone_number",
      "verified_name",
      "quality_rating",
      "code_verification_status",
      "platform_type",
      "name_status",
    ].join(",")
  );

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
    cache: "no-store",
  });

  const data = (await response.json()) as MetaPhoneNumbersResponse;

  if (!response.ok || data.error) {
    throw new Error(getMetaErrorMessage(data.error));
  }

  return data.data || [];
}

/**
 * Suscribe la aplicación de Meta a la WABA para recibir sus eventos
 * mediante el webhook configurado en la aplicación.
 */
export async function subscribeAppToWhatsappWaba(input: {
  wabaId: string;
  accessToken: string;
}): Promise<boolean> {
  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/` +
    `${input.wabaId}/subscribed_apps`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
    cache: "no-store",
  });

  const data = (await response.json()) as MetaSubscriptionResponse;

  if (!response.ok || data.error) {
    throw new Error(getMetaErrorMessage(data.error));
  }

  return data.success === true;
}

/**
 * Normaliza un teléfono dejando únicamente sus dígitos.
 *
 * Ejemplo:
 * "+34 613 19 84 35" → "34613198435"
 */
export function normalizarTelefonoMeta(
  value?: string | null
): string {
  return String(value || "").replace(/\D/g, "");
}

/**
 * Extrae los activos autorizados presentes en un debug_token.
 */
export function getWhatsappTargetIds(
  debugData: MetaDebugTokenResponse
) {
  const scopes = debugData.data?.granular_scopes || [];

  const management = scopes.find(
    (scope) =>
      scope.scope === "whatsapp_business_management"
  );

  const messaging = scopes.find(
    (scope) =>
      scope.scope === "whatsapp_business_messaging"
  );

  return {
    managementTargetIds: management?.target_ids || [],
    messagingTargetIds: messaging?.target_ids || [],
  };
}

/**
 * Calcula una fecha ISO de caducidad a partir de expires_in.
 */
export function getTokenExpiryIso(expiresIn?: number) {
  if (!expiresIn) {
    return null;
  }

  return new Date(
    Date.now() + expiresIn * 1000
  ).toISOString();
}
