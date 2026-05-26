import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Martina Assistant',
  description: 'Asistente inteligente para Rambla Vilar Dental',

  manifest: '/manifest.json',

  icons: {
    icon: '/martina-hero-halo.png',
    shortcut: '/martina-hero-halo.png',
    apple: '/martina-hero-halo.png',
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
    </body>
  </html>
);

export default RootLayout;
