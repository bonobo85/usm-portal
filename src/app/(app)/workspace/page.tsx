'use client';

import { useUser } from '@/lib/useUser';

// TODO: Implement full page — see spec in README
export default function PagePlaceholder() {
  const { surnom } = useUser();
  const pageName = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';
  
  return (
    <div className="pt-8">
      <h1 className="font-display text-3xl tracking-wider uppercase mb-6">{pageName}</h1>
      <div className="card">
        <p className="text-texte-2 text-sm">
          Page en cours de développement. Voir le README pour la spec complète.
        </p>
      </div>
    </div>
  );
}
