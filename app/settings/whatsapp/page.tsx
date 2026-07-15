"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (options: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: MetaLoginResponse) => void,
        options: Record<string, unknown>
      ) => void;
    };
  }
}

type MetaLoginResponse = {
  authResponse?: {
    code?: string;
  } | null;
  status?: string;
};

type EmbeddedSignupSession = {
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
};

type EmbeddedSignupMessage = {
  type?: string;
  event?: string;
  data?: EmbeddedSignupSession | Record<string, unknown>;
};

type ConnectBackendResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  step?: string;
  meta?: unknown;
  debug?: unknown;

  waba_id?: string | null;
  phone_number_id?: string | null;
  display_phone_number?: string | null;
  verified_name?: string | null;
  quality_rating?: string | null;
  subscribed?: boolean;
  saved_in_supabase?: boolean;
};

const APP_ID = "977693254901935";
const CONFIG_ID = "3881222728839399";

export default function SettingsWhatsAppPage() {
  const [sdkReady, setSdkReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState(
    "Esperando para conectar"
  );

  const codeRef = useRef<string | null>(null);
  const sessionRef =
    useRef<EmbeddedSignupSession | null>(null);

  const procesandoRef = useRef(false);

  const enviarConexionAlBackend = useCallback(
    async (
      code: string,
      session: EmbeddedSignupSession
    ) => {
      setStatus(
        "Procesando la conexión completa en el servidor..."
      );

      const response = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          waba_id: session.waba_id,
          phone_number_id: session.phone_number_id,
          business_id: session.business_id || null,
        }),
      });

      const result =
        (await response.json()) as ConnectBackendResponse;

      console.log(
        "========== RESPUESTA DEL BACKEND =========="
      );
      console.log(result);
      console.log(
        "==========================================="
      );

      if (!response.ok || !result.ok) {
        const errorMessage =
          result.error ||
          result.message ||
          "El servidor no pudo procesar la conexión";

        throw new Error(errorMessage);
      }

      return result;
    },
    []
  );

  const completarConexionSiEstaLista =
    useCallback(async () => {
      const code = codeRef.current;
      const session = sessionRef.current;

      if (
        !code ||
        !session?.waba_id ||
        !session?.phone_number_id
      ) {
        console.log(
          "Esperando datos del Embedded Signup:",
          {
            code_recibido: Boolean(code),
            waba_id: session?.waba_id || null,
            phone_number_id:
              session?.phone_number_id || null,
            business_id: session?.business_id || null,
          }
        );

        return;
      }

      if (procesandoRef.current) {
        return;
      }

      procesandoRef.current = true;

      console.log(
        "========== COEXISTENCE COMPLETADO =========="
      );
      console.log("Código recibido:", true);
      console.log("Sesión de WhatsApp:", session);
      console.log(
        "============================================"
      );

      try {
        const backendResult =
          await enviarConexionAlBackend(code, session);

        console.log(
          "Conexión procesada por el backend:",
          backendResult
        );

        setStatus("WhatsApp conectado correctamente");
        setConnecting(false);
      } catch (error) {
        console.error(
          "Error procesando la conexión en el backend:",
          error
        );

        setStatus(
          error instanceof Error
            ? `Error: ${error.message}`
            : "Error procesando la conexión"
        );

        setConnecting(false);
        procesandoRef.current = false;
      }
    }, [enviarConexionAlBackend]);

 useEffect(() => {
  const handleEmbeddedSignupMessage = (
    event: MessageEvent
  ) => {
    // DEBUG: ver TODOS los postMessage que llegan
    console.log("========== POSTMESSAGE RECIBIDO ==========");
    console.log("Origin:", event.origin);
    console.log("Data:", event.data);
    console.log("==========================================");

    if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }

      let message: EmbeddedSignupMessage;

      try {
        message =
          typeof event.data === "string"
            ? JSON.parse(event.data)
            : event.data;
      } catch {
        return;
      }

      if (message?.type !== "WA_EMBEDDED_SIGNUP") {
        return;
      }

      console.log(
        "========== WA_EMBEDDED_SIGNUP =========="
      );
      console.log(message);
      console.log(
        "========================================"
      );

      if (
        message.event === "FINISH" ||
        message.event ===
          "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"
      ) {
        const session =
          (message.data as EmbeddedSignupSession) || null;

        if (
          !session?.waba_id ||
          !session?.phone_number_id
        ) {
          console.error(
            "Meta devolvió FINISH sin los identificadores necesarios:",
            message.data
          );

          setStatus(
            "Meta finalizó el proceso, pero no devolvió los identificadores de WhatsApp"
          );
          setConnecting(false);
          return;
        }

        sessionRef.current = session;

        console.log(
          "Sesión recibida por postMessage:",
          sessionRef.current
        );

        setStatus(
          codeRef.current
            ? "Sesión recibida. Finalizando conexión..."
            : "Sesión recibida. Esperando autorización de Meta..."
        );

        void completarConexionSiEstaLista();
        return;
      }

      if (message.event === "CANCEL") {
        console.warn(
          "Embedded Signup cancelado:",
          message.data
        );

        setStatus("Conexión cancelada");
        setConnecting(false);
        procesandoRef.current = false;
        return;
      }

      if (message.event === "ERROR") {
        console.error(
          "Error en Embedded Signup:",
          message.data
        );

        setStatus(
          "Meta devolvió un error durante la conexión"
        );
        setConnecting(false);
        procesandoRef.current = false;
      }
    };

    window.addEventListener(
      "message",
      handleEmbeddedSignupMessage
    );

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: APP_ID,
        cookie: true,
        xfbml: true,
        version: "v23.0",
      });

      setSdkReady(true);
      setStatus("Meta cargado");
    };

    const existingScript =
      document.getElementById("facebook-jssdk");

    if (!existingScript) {
      const script = document.createElement("script");

      script.id = "facebook-jssdk";
      script.src =
        "https://connect.facebook.net/es_ES/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";

      document.body.appendChild(script);
    } else if (window.FB) {
      setSdkReady(true);
      setStatus("Meta cargado");
    }

    return () => {
      window.removeEventListener(
        "message",
        handleEmbeddedSignupMessage
      );
    };
  }, [completarConexionSiEstaLista]);

  const launchSignup = () => {
    if (!window.FB || !sdkReady) {
      alert(
        "Meta todavía se está cargando. Espera unos segundos y vuelve a intentarlo."
      );
      return;
    }

    setConnecting(true);
    setStatus("Abriendo el onboarding de WhatsApp...");

    codeRef.current = null;
    sessionRef.current = null;
    procesandoRef.current = false;

    window.FB.login(
      (response: MetaLoginResponse) => {
        console.log(
          "========== META LOGIN RESPONSE =========="
        );
        console.log(response);
        console.log(
          "========================================="
        );

        const code = response.authResponse?.code;

        if (!code) {
          console.error(
            "Meta no devolvió el código de autorización."
          );

          setStatus(
            "Meta no devolvió el código de autorización"
          );
          setConnecting(false);
          return;
        }

        codeRef.current = code;

        console.log(
          "Código recibido correctamente:",
          true
        );
        console.log(
          "Sesión disponible en este momento:",
          sessionRef.current
        );

        setStatus(
          sessionRef.current
            ? "Autorización recibida. Finalizando conexión..."
            : "Autorización recibida. Esperando la sesión final de WhatsApp..."
        );

        void completarConexionSiEstaLista();
      },
      {
        config_id: CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType:
            "whatsapp_business_app_onboarding",
          sessionInfoVersion: "3",
          version: "v3",
        },
      }
    );
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>Conectar WhatsApp</h1>

      <p>
        Conecta el WhatsApp Business de Rambla Vilar
        Dental manteniendo la aplicación instalada en el
        móvil.
      </p>

      <button
        type="button"
        onClick={launchSignup}
        disabled={!sdkReady || connecting}
      >
        {connecting
          ? "Conectando..."
          : sdkReady
            ? "Conectar WhatsApp"
            : "Cargando Meta..."}
      </button>

      <p style={{ marginTop: 16 }}>
        Estado: {status}
      </p>
    </main>
  );
}
