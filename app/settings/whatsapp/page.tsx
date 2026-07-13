"use client";

import { useEffect, useRef, useState } from "react";

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

  // Evita procesar dos veces si code y session llegan casi juntos.
  const processingRef = useRef(false);

  const enviarConexionAlBackend = async (
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
        session,
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
  };

  const finalizarConexionSiCompleta = async () => {
    const code = codeRef.current;
    const session = sessionRef.current;

    if (
      processingRef.current ||
      !code ||
      !session?.waba_id ||
      !session?.phone_number_id
    ) {
      return;
    }

    processingRef.current = true;

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
        "Conexión completa procesada por el backend:",
        backendResult
      );

      setStatus("WhatsApp conectado correctamente");
      setConnecting(false);
    } catch (error) {
      console.error(
        "Error procesando la conexión completa:",
        error
      );

      setStatus(
        error instanceof Error
          ? `Error: ${error.message}`
          : "Error procesando la conexión"
      );

      setConnecting(false);
      processingRef.current = false;
    }
  };

  useEffect(() => {
    const handleEmbeddedSignupMessage = (
      event: MessageEvent
    ) => {
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

        sessionRef.current = session;

        console.log(
          "Sesión recibida por postMessage:",
          sessionRef.current
        );

        setStatus(
          codeRef.current
            ? "Código y sesión de WhatsApp recibidos"
            : "Sesión recibida; esperando el código"
        );

        void finalizarConexionSiCompleta();
        return;
      }

      if (message.event === "CANCEL") {
        console.warn(
          "Embedded Signup cancelado:",
          message.data
        );

        setStatus("Conexión cancelada");
        setConnecting(false);
        processingRef.current = false;
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
        processingRef.current = false;
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
  }, []);

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
    processingRef.current = false;

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
            ? "Código y sesión de WhatsApp recibidos"
            : "Código recibido; esperando la sesión de WhatsApp"
        );

        void finalizarConexionSiCompleta();
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
