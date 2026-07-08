"use client";

const APP_ID = "977693254901935";
const CONFIG_ID = "3881222728839399";

const REDIRECT_URI =
  "https://martina-panel-sage.vercel.app/api/whatsapp/callback";

export default function SettingsWhatsAppPage() {
  const launchSignup = () => {
    const url = new URL("https://www.facebook.com/v23.0/dialog/oauth");

    url.searchParams.set("client_id", APP_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("config_id", CONFIG_ID);
    url.searchParams.set("override_default_response_type", "true");

    url.searchParams.set(
      "extras",
      JSON.stringify({
        setup: {},
        featureType: "whatsapp_business_app_onboarding",
        sessionInfoVersion: 3,
      })
    );

    window.location.href = url.toString();
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Conectar WhatsApp</h1>

      <p>
        Pulsa el botón para iniciar la conexión oficial con Meta. No completes el
        flujo si aparece algo que no entiendas.
      </p>

      <button onClick={launchSignup}>Conectar WhatsApp</button>
    </div>
  );
}
