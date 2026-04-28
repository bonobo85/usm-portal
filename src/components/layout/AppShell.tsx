'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { ConfigLoader } from '@/components/ui/shared';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/login') {
      router.push('/login');
    }
  }, [status, router, pathname]);

  // Login page renders without shell
  if (pathname === '/login') return <>{children}</>;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src="/logo.png" alt="" className="w-14 h-14 mx-auto mb-4 rounded-xl animate-pulse object-contain" />
          <div className="text-texte-3 text-sm">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <>
      <ConfigLoader />
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          {children}
        </div>
      </main>
    </>
  );
}
