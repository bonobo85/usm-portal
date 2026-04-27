import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'U.S. Marshal — Portail Interne',
  description: 'Bureau du Comté de Blaine — Gestion du personnel et des opérations',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  manifest: '/site.webmanifest',
  themeColor: '#C4973B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
