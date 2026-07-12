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

const APP_ID = "977693254901935";
const CONFIG_ID = "3881222728839399";

export default function SettingsWhatsAppPage() {
  const [sdkReady, setSdkReady] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const sessionRef = useRef<EmbeddedSignupSession | null>(null);

  useEffect(() => {
    const handleEmbeddedSignupMessage = (event: MessageEvent) => {
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

      console.log("========== WA EMBEDDED SIGNUP ==========");
      console.log(message);
      console.log("========================================");

      if (message.event === "FINISH") {
        sessionRef.current =
          (message.data as EmbeddedSignupSession) || null;

        console.log(
          "Embedded Signup finalizado:",
          sessionRef.current
        );
      }

      if (message.event === "CANCEL") {
        console.warn("Embedded Signup cancelado:", message.data);
        setConnecting(false);
      }

      if (message.event === "ERROR") {
        console.error("Error en Embedded Signup:", message.data);
        setConnecting(false);
      }
    };

    window.addEventListener("message", handleEmbeddedSignupMessage);

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: APP_ID,
        cookie: true,
        xfbml: true,
        version: "v23.0",
      });

      setSdkReady(true);
    };

    const existingScript = document.getElementById("facebook-jssdk");

    if (!existingScript) {
      const script = document.createElement("script");

      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/es_ES/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";

      document.body.appendChild(script);
    } else if (window.FB) {
      setSdkReady(true);
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
    sessionRef.current = null;

    window.FB.login(
  (response: MetaLoginResponse) => {
    console.log("========== META LOGIN RESPONSE ==========");
    console.log(response);
    console.log("=========================================");

    const code = response.authResponse?.code;

    if (!code) {
      console.error("Meta no devolvió el código de autorización.");
      setConnecting(false);
      return;
    }

    console.log("Código recibido correctamente:", Boolean(code));
    console.log(
      "Datos de la sesión de WhatsApp:",
      sessionRef.current
    );

    setConnecting(false);
  },
  {
    config_id: CONFIG_ID,
    auth_type: "rerequest",
    response_type: "code",
    override_default_response_type: true,
    extras: {
      setup: {},
      featureType: "whatsapp_business_app_onboarding",
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
        Conecta el WhatsApp Business de Rambla Vilar Dental
        manteniendo la aplicación instalada en el móvil.
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
    </main>
  );
}
