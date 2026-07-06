import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Martina Assistant',
  description: 'Asistente inteligente para Rambla Vilar Dental',

  manifest: '/manifest.json',

  icons: {
    icon: '/m-icon.png',
    shortcut: '/m-icon.png',
    apple: '/m-icon.png',
  },
};

const RootLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <html lang="es">
    <body className="min-h-screen bg-martina-bg text-martina-text">
      {children}

      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-8XT7T0MBLB"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-8XT7T0MBLB');
        `}
      </Script>
    </body>
  </html>
);

export default RootLayout;
