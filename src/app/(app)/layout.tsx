'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { ConfigLoader } from '@/components/ui/shared';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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
