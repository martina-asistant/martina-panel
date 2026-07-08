import { NextResponse } from "next/server";

const GRAPH_VERSION = "v23.0";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Falta code" },
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

    const tokenUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`
    );

    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { ok: false, step: "exchange_code", meta: tokenData },
        { status: 400 }
      );
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
      ok: true,
      message: "Code intercambiado correctamente",
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      debug: debugData,
    });
  } catch (error) {
    console.error("Error conectando WhatsApp:", error);

    return NextResponse.json(
      { ok: false, error: "Error interno conectando WhatsApp" },
      { status: 500 }
    );
  }
}
