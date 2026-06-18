import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Control de Gastos',
  description: 'Seguimiento de gastos quincenales',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
