"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

const APP_ID = "977693254901935";
const CONFIG_ID = "3881222728839399";

export default function SettingsWhatsAppPage() {
  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: APP_ID,
        cookie: true,
        xfbml: true,
        version: "v23.0",
      });
    };

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/es_ES/sdk.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const listener = (event: MessageEvent) => {
      console.log("========== META EVENT ==========");
      console.log("Origin:", event.origin);
      console.log("Data:", event.data);
      console.log("================================");
    };

    window.addEventListener("message", listener);

    return () => {
      window.removeEventListener("message", listener);
    };
  }, []);

  const launchSignup = () => {
    if (!window.FB) {
      console.error("Facebook SDK todavía no está cargado");
      return;
    }

    window.FB.login(
      (response: any) => {
        console.log("========== META RESPONSE ==========");
        console.log(response);
        console.log(JSON.stringify(response, null, 2));
        console.log("===================================");
      },
      {
        config_id: CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      }
    );
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Conectar WhatsApp (modo prueba)</h1>

      <p>
        Pulsa el botón y observa qué pantalla abre Meta. No completes el flujo
        si tienes dudas — puedes cerrar el popup en cualquier momento.
      </p>

      <button onClick={launchSignup}>Conectar WhatsApp</button>
    </div>
  );
}
