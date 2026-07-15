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

export type MetaRegisterPhoneResponse = {
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
 * Solo debe usarse cuando redirectUri coincida exactamente con el
 * redirect_uri empleado por Meta al generar el código.
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
  tokenUrl.searchParams.set(
    "client_secret",
    input.appSecret
  );
  tokenUrl.searchParams.set(
    "redirect_uri",
    input.redirectUri
  );
  tokenUrl.searchParams.set("code", input.code);

  const response = await fetch(tokenUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const data = (await response.json()) as MetaTokenData;

  if (!response.ok || data.error) {
    throw new Error(getMetaErrorMessage(data.error));
  }

  if (!data.access_token) {
    throw new Error(
      "Meta no devolvió un access token al intercambiar el código OAuth"
    );
  }

  return data;
}

/**
 * Comprueba la validez, permisos y activos asociados a un token.
 */
export async function debugMetaToken(input: {
  accessToken: string;
  appId: string;
  appSecret: string;
}): Promise<MetaDebugTokenResponse> {
  const debugUrl = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/debug_token`
  );

  debugUrl.searchParams.set(
    "input_token",
    input.accessToken
  );

  debugUrl.searchParams.set(
    "access_token",
    `${input.appId}|${input.appSecret}`
  );

  const response = await fetch(debugUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const data =
    (await response.json()) as MetaDebugTokenResponse;

  if (!response.ok || data.error) {
    throw new Error(getMetaErrorMessage(data.error));
  }

  return data;
}

/**
 * Obtiene todos los números vinculados a una WABA.
 *
 * El campo id es el Phone Number ID utilizado en las llamadas
 * posteriores de WhatsApp Cloud API.
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

  const data =
    (await response.json()) as MetaPhoneNumbersResponse;

  if (!response.ok || data.error) {
    throw new Error(getMetaErrorMessage(data.error));
  }

  return data.data || [];
}

/**
 * Obtiene un número concreto de una WABA.
 */
export async function getWhatsappPhoneNumber(input: {
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
}): Promise<MetaWhatsappPhoneNumber | null> {
  const phoneNumbers =
    await getWhatsappPhoneNumbers({
      wabaId: input.wabaId,
      accessToken: input.accessToken,
    });

  return (
    phoneNumbers.find(
      (phone) => phone.id === input.phoneNumberId
    ) || null
  );
}

/**
 * Suscribe la aplicación de Meta a la WABA para recibir
 * mensajes, estados y demás eventos mediante webhooks.
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

  const data =
    (await response.json()) as MetaSubscriptionResponse;

  if (!response.ok || data.error) {
    throw new Error(getMetaErrorMessage(data.error));
  }

  return data.success === true;
}

/**
 * Registra un Phone Number ID para utilizarlo con Cloud API.
 *
 * ATENCIÓN:
 * Esta función queda preparada, pero NO debe llamarse
 * automáticamente durante vuestro flujo actual de Coexistence.
 *
 * Antes de utilizarla con un número que debe permanecer activo
 * en WhatsApp Business App, hay que confirmar que el número ha
 * completado correctamente el onboarding específico de
 * Coexistence.
 *
 * El pin es el PIN de verificación en dos pasos asociado al
 * número de WhatsApp, no un código OAuth ni el código recibido
 * en el callback del Embedded Signup.
 */
export async function registerWhatsappPhoneNumber(input: {
  phoneNumberId: string;
  accessToken: string;
  pin: string;
}): Promise<boolean> {
  const phoneNumberId = input.phoneNumberId.trim();
  const accessToken = input.accessToken.trim();
  const pin = input.pin.trim();

  if (!phoneNumberId) {
    throw new Error(
      "Falta el Phone Number ID que se debe registrar"
    );
  }

  if (!accessToken) {
    throw new Error(
      "Falta el access token de Meta"
    );
  }

  if (!/^\d{6}$/.test(pin)) {
    throw new Error(
      "El PIN de verificación en dos pasos debe tener exactamente 6 dígitos"
    );
  }

  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/` +
    `${phoneNumberId}/register`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      pin,
    }),
    cache: "no-store",
  });

  const data =
    (await response.json()) as MetaRegisterPhoneResponse;

  if (!response.ok || data.error) {
    throw new Error(getMetaErrorMessage(data.error));
  }

  if (data.success !== true) {
    throw new Error(
      "Meta no confirmó el registro del número"
    );
  }

  return true;
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
 * Busca un teléfono determinado dentro de una lista de
 * números de WhatsApp devuelta por Meta.
 */
export function findWhatsappPhoneNumber(
  phoneNumbers: MetaWhatsappPhoneNumber[],
  expectedPhoneNumber: string
): MetaWhatsappPhoneNumber | null {
  const normalizedExpected =
    normalizarTelefonoMeta(expectedPhoneNumber);

  return (
    phoneNumbers.find(
      (phone) =>
        normalizarTelefonoMeta(
          phone.display_phone_number
        ) === normalizedExpected
    ) || null
  );
}

/**
 * Extrae los activos autorizados incluidos en granular_scopes.
 */
export function getWhatsappTargetIds(
  debugData: MetaDebugTokenResponse
) {
  const scopes =
    debugData.data?.granular_scopes || [];

  const management = scopes.find(
    (scope) =>
      scope.scope ===
      "whatsapp_business_management"
  );

  const messaging = scopes.find(
    (scope) =>
      scope.scope ===
      "whatsapp_business_messaging"
  );

  return {
    managementTargetIds:
      management?.target_ids || [],
    messagingTargetIds:
      messaging?.target_ids || [],
  };
}

/**
 * Comprueba si el token contiene los permisos principales
 * utilizados por la integración de WhatsApp.
 */
export function getWhatsappTokenPermissions(
  debugData: MetaDebugTokenResponse
) {
  const scopes = new Set(
    debugData.data?.scopes || []
  );

  return {
    isValid: debugData.data?.is_valid === true,

    hasWhatsappBusinessManagement:
      scopes.has(
        "whatsapp_business_management"
      ),

    hasWhatsappBusinessMessaging:
      scopes.has(
        "whatsapp_business_messaging"
      ),

    hasBusinessManagement:
      scopes.has("business_management"),
  };
}

/**
 * Calcula una fecha ISO de caducidad desde expires_in.
 */
export function getTokenExpiryIso(
  expiresIn?: number
): string | null {
  if (!expiresIn) {
    return null;
  }

  return new Date(
    Date.now() + expiresIn * 1000
  ).toISOString();
}
