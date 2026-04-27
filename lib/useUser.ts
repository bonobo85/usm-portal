'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import {
  estOpSecondMin, estOperateurMin, estColeadMin, estLeadMin,
  peutVoirCrash, peutVoirFormateurs,
} from './constants';

export function useUser() {
  const { data: session, status } = useSession();
  const user = (session?.user as any) || null;

  return useMemo(() => ({
    user,
    rang: user?.rank_level ?? 0,
    rangNom: user?.rank_nom ?? '',
    permissions: user?.permissions ?? [],
    badges: user?.badges ?? [],
    surnom: user?.surnom ?? user?.username ?? '',
    estConnecte: !!user,
    estEnChargement: status === 'loading',
    estActif: user?.is_active ?? false,

    // Rank checks
    hasRang: (min: number) => (user?.rank_level ?? 0) >= min,
    hasPermission: (perm: string) => user?.permissions?.includes(perm) ?? false,
    hasBadge: (code: string) => user?.badges?.includes(code) ?? false,

    // Visibility checks
    peutVoirCrash: () => peutVoirCrash(user?.rank_level ?? 0, user?.badges ?? []),
    peutVoirFormateurs: () => peutVoirFormateurs(user?.rank_level ?? 0, user?.badges ?? []),
    estOpSecondMin: () => estOpSecondMin(user?.rank_level ?? 0),
    estOperateurMin: () => estOperateurMin(user?.rank_level ?? 0),
    estColeadMin: () => estColeadMin(user?.rank_level ?? 0),
    estLeadMin: () => estLeadMin(user?.rank_level ?? 0),
  }), [user, status]);
}
