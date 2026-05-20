import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Martina Panel',
  description: 'Panel de gestión clínica dental',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="es">
    <body className="min-h-screen bg-martina-bg text-martina-text">
      {children}
      <Toaster position="top-right" />
    </body>
  </html>
);

export default RootLayout;
