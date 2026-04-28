'use client';

import { usePathname } from 'next/navigation';

export default function EntrainementPage() {
  const pathname = usePathname();
  const pageName = pathname.split('/').pop() || '';

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
