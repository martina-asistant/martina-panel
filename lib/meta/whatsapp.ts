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

  return response.json();
}

export async function debugMetaToken(input: {
  accessToken: string;
  appId: string;
  appSecret: string;
}): Promise<MetaDebugTokenResponse> {
  const debugUrl = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/debug_token`
  );

  debugUrl.searchParams.set("input_token", input.accessToken);
  debugUrl.searchParams.set("access_token", `${input.appId}|${input.appSecret}`);

  const response = await fetch(debugUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  return response.json();
}

export function getWhatsappTargetIds(debugData: MetaDebugTokenResponse) {
  const scopes = debugData.data?.granular_scopes || [];

  const management = scopes.find(
    (s) => s.scope === "whatsapp_business_management"
  );

  const messaging = scopes.find(
    (s) => s.scope === "whatsapp_business_messaging"
  );

  return {
    managementTargetIds: management?.target_ids || [],
    messagingTargetIds: messaging?.target_ids || [],
  };
}

export function getTokenExpiryIso(expiresIn?: number) {
  if (!expiresIn) return null;

  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
