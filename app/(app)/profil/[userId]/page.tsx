'use client';

import { useUser } from '@/lib/useUser';

export default function ProfilPage({ params }: { params: { userId: string } }) {
  const { surnom } = useUser();
  
  return (
    <div className="pt-8">
      <h1 className="font-display text-3xl tracking-wider mb-6">PROFIL</h1>
      <div className="card">
        <p className="text-texte-2 text-sm">Profil de l'utilisateur {params.userId}</p>
      </div>
    </div>
  );
}
