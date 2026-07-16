import { NextResponse } from "next/server";

import {
  marcarWhatsappConectado,
  marcarWhatsappError,
} from "@/lib/repos/integracionesWhatsappRepo";

const GRAPH_VERSION = "v23.0";
const WABA_ID = "1781228559216594";
const CONFIG_ID = "3881222728839399";
const TELEFONO_ESPERADO = "34613198435";

type ConnectRequestBody = {
  code?: string;
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string | null;
};

type MetaPhoneNumber = {
  id: string;
  display_phone_number?: string;
 verified_name?: string;
  quality_rating?: string;

  code_verification_status?: string;
  platform_type?: string;
  name_status?: string;
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

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as ConnectRequestBody;

    const code = body.code?.trim();
    const sessionWabaId = body.waba_id?.trim();
    const sessionPhoneNumberId =
      body.phone_number_id?.trim();
    const sessionBusinessId =
      body.business_id?.trim() || null;

    if (!code) {
      return NextResponse.json(
        {
          ok: false,
          step: "validate_embedded_signup",
          error:
            "Meta no devolvió el código de autorización",
        },
        { status: 400 }
      );
    }

    if (!sessionWabaId || !sessionPhoneNumberId) {
      return NextResponse.json(
        {
          ok: false,
          step: "validate_embedded_signup",
          error:
            "Falta la sesión final del Embedded Signup con waba_id y phone_number_id",
        },
        { status: 400 }
      );
    }

    if (sessionWabaId !== WABA_ID) {
      const errorMessage =
        "La WABA devuelta por Meta no coincide con la WABA de Rambla Vilar Dental";

      await marcarWhatsappError({
        ultimo_error: errorMessage,
      });

      return NextResponse.json(
        {
          ok: false,
          step: "validate_waba",
          error: errorMessage,
          debug: {
            expected_waba_id: WABA_ID,
            received_waba_id: sessionWabaId,
          },
        },
        { status: 400 }
      );
    }

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

    // 1. Obtener los números asociados a la WABA.
    const phoneNumbersUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/${WABA_ID}/phone_numbers`
    );

    phoneNumbersUrl.searchParams.set(
      "fields",
      "id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,name_status"
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

    if (
      !phoneNumbersResponse.ok ||
      phoneNumbersData.error
    ) {
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

    const phoneNumber = (
      phoneNumbersData.data || []
    ).find(
      (phone) =>
        phone.id === sessionPhoneNumberId &&
        normalizarTelefono(
          phone.display_phone_number
        ) === TELEFONO_ESPERADO
    );

    if (!phoneNumber) {
      const errorMessage =
        "El teléfono devuelto por Embedded Signup no coincide con el número de Rambla Vilar Dental dentro de la WABA";

      await marcarWhatsappError({
        ultimo_error: errorMessage,
      });

      return NextResponse.json(
        {
          ok: false,
          step: "validate_phone_number",
          error: errorMessage,
          debug: {
            received_phone_number_id:
              sessionPhoneNumberId,
            expected_phone:
              TELEFONO_ESPERADO,
            phone_numbers_found:
              phoneNumbersData.data || [],
          },
        },
        { status: 400 }
      );
    }

    console.log("========== ESTADO DEL NÚMERO ==========");
console.log({
  phone_number_id: phoneNumber.id,
  display_phone_number: phoneNumber.display_phone_number,
  verified_name: phoneNumber.verified_name,
  quality_rating: phoneNumber.quality_rating,
  code_verification_status:
    phoneNumber.code_verification_status,
  platform_type: phoneNumber.platform_type,
  name_status: phoneNumber.name_status,
});
console.log("=======================================");
    
    // 2. Suscribir la aplicación a la WABA para recibir webhooks.
    const subscribeUrl =
      `https://graph.facebook.com/${GRAPH_VERSION}/` +
      `${WABA_ID}/subscribed_apps`;

    const subscribeResponse = await fetch(
      subscribeUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const subscribeData =
      (await subscribeResponse.json()) as MetaSubscribeResponse;

    if (
      !subscribeResponse.ok ||
      subscribeData.error
    ) {
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

    if (subscribeData.success !== true) {
      const errorMessage =
        "Meta no confirmó la suscripción de la aplicación a la WABA";

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

    // 3. Guardar la integración solamente después de validar
    // la sesión final y la suscripción.
    const integracion =
      await marcarWhatsappConectado({
        waba_id: WABA_ID,
        phone_number_id: phoneNumber.id,
        display_phone_number:
          displayPhoneNumber,
        config_id: CONFIG_ID,
        business_id: sessionBusinessId,
      });

    return NextResponse.json({
      ok: true,
      message:
        "WhatsApp conectado correctamente con Martina",

      waba_id: integracion.waba_id,
      phone_number_id:
        integracion.phone_number_id,
      display_phone_number:
        integracion.display_phone_number,

      business_id:
        integracion.business_id,

      verified_name:
        phoneNumber.verified_name || null,

      quality_rating:
        phoneNumber.quality_rating || null,

      subscribed: true,
      saved_in_supabase: true,

      debug: {
        authorization_code_received: true,
        embedded_signup_session_received: true,
        session_waba_matches: true,
        session_phone_number_matches: true,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error interno conectando WhatsApp";

    console.error(
      "Error conectando WhatsApp:",
      error
    );

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
