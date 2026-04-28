'use client';

import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useUser } from '@/lib/useUser';
import {
  LayoutDashboard, Users, Target, GraduationCap, Award, Zap,
  FileText, Scale, Archive, Shield, FolderOpen, Settings, LogOut, ChevronDown,
} from 'lucide-react';
import Avatar from './Avatar';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, surnom, rang, badges, peutVoirCrash, peutVoirFormateurs, estOpSecondMin, estOperateurMin, estColeadMin } = useUser();

  if (!user) return null;

  const nav = (href: string) => router.push(href);
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const mainLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/personnel', label: 'Personnel', icon: Users },
    { href: '/entrainement', label: 'Entraînement', icon: Target },
  ];

  const roleLinks = [
    ...(peutVoirFormateurs() ? [{ href: '/formateurs', label: 'Formateurs', icon: GraduationCap }] : []),
    ...(estOpSecondMin() ? [{ href: '/badges', label: 'Badges', icon: Award }] : []),
    ...(peutVoirCrash() ? [{ href: '/crash', label: 'CRASH', icon: Zap }] : []),
  ];

  const toolLinks = [
    { href: '/workspace', label: 'Mon espace', icon: FolderOpen },
    { href: '/rapports', label: 'Rapports', icon: FileText },
    ...(estOpSecondMin() ? [{ href: '/sanctions', label: 'Retour & Sanction', icon: Scale }] : []),
    ...(estOperateurMin() ? [{ href: '/archives', label: 'Archives', icon: Archive }] : []),
  ];

  const adminLinks = estColeadMin() ? [
    { href: '/admin', label: 'Administration', icon: Settings },
  ] : [];

  function LinkGroup({ label, links }: { label: string; links: typeof mainLinks }) {
    if (!links.length) return null;
    return (
      <div className="sidebar-section">
        <div className="sidebar-label">{label}</div>
        {links.map(l => (
          <div
            key={l.href}
            className={`sidebar-link relative ${isActive(l.href) ? 'active' : ''}`}
            onClick={() => nav(l.href)}
          >
            <l.icon size={18} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand" onClick={() => nav('/dashboard')}>
        <img src="/logo.png" alt="USM" className="w-10 h-10 rounded-lg object-contain" />
        <div>
          <div className="font-display text-or text-lg tracking-[0.1em] leading-tight">U.S. MARSHAL</div>
          <div className="text-[9px] text-texte-3 tracking-[0.15em] uppercase">Comté de Blaine</div>
        </div>
      </div>

      {/* Navigation */}
      <LinkGroup label="Navigation" links={mainLinks} />
      <LinkGroup label="Unités" links={roleLinks} />
      <LinkGroup label="Outils" links={toolLinks} />
      <LinkGroup label="Admin" links={adminLinks} />

      {/* Footer: User profile */}
      <div className="sidebar-footer">
        <div
          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-fond-hover"
          onClick={() => nav(`/profil?id=${user.id}`)}
        >
          <Avatar user={user} size="sm" showStatus />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{surnom}</div>
            <div className="text-[11px] text-texte-3">{user.rank_nom}</div>
          </div>
          <button
            className="p-1.5 rounded-md hover:bg-fond-3 text-texte-3 hover:text-texte transition-all"
            onClick={(e) => { e.stopPropagation(); signOut({ callbackUrl: '/login' }); }}
            title="Déconnexion"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
