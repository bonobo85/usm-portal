'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/useUser';

function ProfilContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const { surnom } = useUser();

  return (
    <div className="pt-8">
      <h1 className="font-display text-3xl tracking-wider uppercase mb-6">PROFIL</h1>
      <div className="card">
        <p className="text-texte-2 text-sm">
          Profil de l&apos;utilisateur {userId || 'moi-même'}
        </p>
      </div>
    </div>
  );
}

export default function ProfilPage() {
  return (
    <Suspense fallback={<div className="pt-8 text-texte-3 text-sm">Chargement...</div>}>
      <ProfilContent />
    </Suspense>
  );
}
