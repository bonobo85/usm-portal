'use client';

import { contrastText } from '@/lib/constants';
import { useConfigStore } from '@/lib/store';
import Image from 'next/image';

interface AvatarProps {
  user: { surnom?: string; username?: string; rank_level?: number; statut?: string; avatar_url?: string } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-9 h-9 text-sm',
  md: 'w-11 h-11 text-base',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-[88px] h-[88px] text-[32px]',
};

const dotMap = {
  xs: 'w-2 h-2 border',
  sm: 'w-2.5 h-2.5 border-2',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-[2.5px]',
  xl: 'w-4 h-4 border-[3px]',
};

const statusColor: Record<string, string> = {
  disponible: 'bg-green-500',
  occupe: 'bg-yellow-500',
  absent: 'bg-red-500',
  hors_ligne: 'bg-gray-500',
};

export default function Avatar({ user, size = 'md', showStatus = false }: AvatarProps) {
  const storeGetRank = useConfigStore(s => s.getRank);
  const rank = storeGetRank(user?.rank_level || 1);
  const initials = (user?.surnom || user?.username || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className={`rounded-full flex items-center justify-center font-display font-bold tracking-wider flex-shrink-0 relative ${sizeMap[size]}`}
      style={{ background: rank.couleur, color: contrastText(rank.couleur) }}
    >
      {user?.avatar_url ? (
        <Image
          src={user.avatar_url}
          alt=""
          fill
          className="rounded-full object-cover"
        />
      ) : initials}

      {showStatus && user?.statut && (
        <div className={`absolute bottom-0 right-0 rounded-full border-fond-2 ${dotMap[size]} ${statusColor[user.statut] || 'bg-gray-500'}`} />
      )}
    </div>
  );
}
