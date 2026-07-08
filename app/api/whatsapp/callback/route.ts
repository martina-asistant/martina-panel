import { NextResponse } from "next/server";

const GRAPH_VERSION = "v23.0";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "Meta no devolvió code" },
      { status: 400 }
    );
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.json(
      { ok: false, error: "Faltan META_APP_ID o META_APP_SECRET" },
      { status: 500 }
    );
  }

  const redirectUri =
    "https://martina-panel-sage.vercel.app/api/whatsapp/callback";

  const tokenUrl = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`
  );

  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const tokenResponse = await fetch(tokenUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    return NextResponse.json({
      ok: false,
      step: "callback_exchange_code",
      meta: tokenData,
    });
  }

  const accessToken = tokenData.access_token;

  const debugUrl = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/debug_token`
  );

  debugUrl.searchParams.set("input_token", accessToken);
  debugUrl.searchParams.set("access_token", `${appId}|${appSecret}`);

  const debugResponse = await fetch(debugUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const debugData = await debugResponse.json();

  return NextResponse.json({
    ok: debugResponse.ok,
    step: "debug_token",
    token_received: true,
    expires_in: tokenData.expires_in,
    debug: debugData,
  });
}
