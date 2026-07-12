import { NextResponse } from "next/server";

import {
  marcarWhatsappConectado,
  marcarWhatsappError,
} from "@/lib/repos/integracionesWhatsappRepo";

const GRAPH_VERSION = "v23.0";
const WABA_ID = "1781228559216594";
const CONFIG_ID = "3881222728839399";
const TELEFONO_ESPERADO = "34613198435";

type MetaPhoneNumber = {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
};

type MetaPhoneNumbersResponse = {
  data?: MetaPhoneNumber[];
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

type MetaSubscribeResponse = {
  success?: boolean;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

const normalizarTelefono = (value?: string | null) =>
  String(value || "").replace(/\D/g, "");

const getMetaErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Meta devolvió un error desconocido";
};

export async function POST() {
  try {
    const accessToken =
      process.env.META_SYSTEM_USER_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta META_SYSTEM_USER_ACCESS_TOKEN en las variables de Vercel",
        },
        { status: 500 }
      );
    }

    // 1. Obtener los números asociados a la WABA conectada
    const phoneNumbersUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/${WABA_ID}/phone_numbers`
    );

    phoneNumbersUrl.searchParams.set(
      "fields",
      "id,display_phone_number,verified_name,quality_rating"
    );

    const phoneNumbersResponse = await fetch(
      phoneNumbersUrl.toString(),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const phoneNumbersData =
      (await phoneNumbersResponse.json()) as MetaPhoneNumbersResponse;

    if (!phoneNumbersResponse.ok || phoneNumbersData.error) {
      const errorMessage = getMetaErrorMessage(
        phoneNumbersData.error
      );

      await marcarWhatsappError({
        ultimo_error: errorMessage,
      });

      return NextResponse.json(
        {
          ok: false,
          step: "get_phone_numbers",
          error: errorMessage,
          meta: phoneNumbersData,
        },
        { status: 400 }
      );
    }

    const phoneNumber = (phoneNumbersData.data || []).find(
      (phone) =>
        normalizarTelefono(phone.display_phone_number) ===
        TELEFONO_ESPERADO
    );

    if (!phoneNumber) {
      const errorMessage =
        "Meta no devolvió el número +34 613 19 84 35 dentro de la WABA conectada";

      await marcarWhatsappError({
        ultimo_error: errorMessage,
      });

      return NextResponse.json(
        {
          ok: false,
          step: "find_phone_number",
          error: errorMessage,
          phone_numbers_found: phoneNumbersData.data || [],
        },
        { status: 404 }
      );
    }

    // 2. Suscribir la aplicación a la WABA para recibir webhooks
    const subscribeUrl =
      `https://graph.facebook.com/${GRAPH_VERSION}/` +
      `${WABA_ID}/subscribed_apps`;

    const subscribeResponse = await fetch(subscribeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const subscribeData =
      (await subscribeResponse.json()) as MetaSubscribeResponse;

    if (!subscribeResponse.ok || subscribeData.error) {
      const errorMessage = getMetaErrorMessage(
        subscribeData.error
      );

      await marcarWhatsappError({
        ultimo_error: errorMessage,
      });

      return NextResponse.json(
        {
          ok: false,
          step: "subscribe_app",
          error: errorMessage,
          meta: subscribeData,
        },
        { status: 400 }
      );
    }

    const displayPhoneNumber =
      phoneNumber.display_phone_number ||
      "+34 613 19 84 35";

    // 3. Guardar la integración conectada en Supabase
    const integracion = await marcarWhatsappConectado({
      waba_id: WABA_ID,
      phone_number_id: phoneNumber.id,
      display_phone_number: displayPhoneNumber,
      config_id: CONFIG_ID,
      business_id: null,
    });

    return NextResponse.json({
      ok: true,
      message: "WhatsApp conectado correctamente con Martina",
      waba_id: integracion.waba_id,
      phone_number_id: integracion.phone_number_id,
      display_phone_number:
        integracion.display_phone_number,
      verified_name: phoneNumber.verified_name || null,
      quality_rating: phoneNumber.quality_rating || null,
      subscribed: subscribeData.success === true,
      saved_in_supabase: true,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error interno conectando WhatsApp";

    console.error("Error conectando WhatsApp:", error);

    try {
      await marcarWhatsappError({
        ultimo_error: errorMessage,
      });
    } catch (supabaseError) {
      console.error(
        "No se pudo guardar el error en Supabase:",
        supabaseError
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
