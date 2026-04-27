'use client';

import { ReactNode, useEffect } from 'react';
import { contrastText, STATUS_LABELS, PRIORITY_LABELS, trierBadges } from '@/lib/constants';
import { useConfigStore } from '@/lib/store';
import { X } from 'lucide-react';

// ─── Config loader: call once in layout ───
export function ConfigLoader() {
  const load = useConfigStore(s => s.load);
  useEffect(() => { load(); }, [load]);
  return null;
}

// ─── Rank Badge ───
export function RankBadge({ level }: { level: number }) {
  const getRank = useConfigStore(s => s.getRank);
  const r = getRank(level);
  return (
    <span className="tag rank-tag" style={{ borderColor: r.couleur, color: r.couleur }}>
      {r.nom}
    </span>
  );
}

// ─── Badge Tag ───
export function BadgeTag({ code, onRemove }: { code: string; onRemove?: (code: string) => void }) {
  const getBadge = useConfigStore(s => s.getBadge);
  const d = getBadge(code);
  if (!d) return (
    <span className="tag rounded bg-fond-3 text-texte-3">{code}</span>
  );
  return (
    <span className="tag rounded" style={{ background: d.couleur, color: contrastText(d.couleur) }}>
      {d.icone} {d.nom}
      {onRemove && (
        <span onClick={e => { e.stopPropagation(); onRemove(code); }}
          className="ml-1 cursor-pointer opacity-70 hover:opacity-100">✕</span>
      )}
    </span>
  );
}

// ─── Badges Row ───
export function BadgesRow({ badges, onRemove }: { badges: string[]; onRemove?: (code: string) => void }) {
  const allBadges = useConfigStore(s => s.badges);
  const sorted = trierBadges(badges || [], allBadges);
  if (!sorted.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map(c => <BadgeTag key={c} code={c} onRemove={onRemove} />)}
    </div>
  );
}

// ─── Status Tag ───
export function StatusTag({ statut }: { statut: string }) {
  return <span className={`tag st-${statut}`}>{STATUS_LABELS[statut] || statut}</span>;
}

// ─── Priority Tag ───
export function PriorityTag({ priorite }: { priorite: string }) {
  return <span className={`tag pri-${priorite}`}>{PRIORITY_LABELS[priorite] || priorite}</span>;
}

// ─── Modal ───
export function Modal({
  isOpen, onClose, title, size = 'md', children, footer,
}: {
  isOpen: boolean; onClose: () => void; title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl'; children: ReactNode; footer?: ReactNode;
}) {
  if (!isOpen) return null;
  const widths = { sm: 'w-[420px]', md: 'w-[580px]', lg: 'w-[740px]', xl: 'w-[920px]' };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${widths[size]}`} onClick={e => e.stopPropagation()}>
        <div className="px-7 py-5 border-b border-border flex items-center justify-between">
          <span className="font-display text-xl tracking-wider">{title}</span>
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center text-texte-3 hover:bg-fond-hover hover:text-texte transition-all"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-7">{children}</div>
        {footer && <div className="px-7 py-4 border-t border-border flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Tabs ───
export function Tabs({
  tabs, active, onChange,
}: {
  tabs: { id: string; label: string; icon?: string; count?: number }[];
  active: string; onChange: (id: string) => void;
}) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <div key={t.id} className={`tab ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          {t.icon && <span>{t.icon}</span>}
          {t.label}
          {t.count != null && <span className="ml-2 text-[10px] font-bold bg-bleu text-white px-1.5 py-0.5 rounded-full">{t.count}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Search Bar ───
export function SearchBar({ value, onChange, placeholder = 'Rechercher...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-texte-3 text-sm">🔍</span>
      <input className="input pl-10" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

// ─── Empty State ───
export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-14 text-texte-3">
      <div className="text-5xl mb-4 opacity-25">{icon}</div>
      <div className="text-sm">{text}</div>
    </div>
  );
}

// ─── Permission Gate ───
export function PermissionGate({ children, fallback, show }: {
  children: ReactNode; fallback?: ReactNode; show: boolean;
}) {
  if (!show) return fallback ? <>{fallback}</> : <EmptyState icon="🔒" text="Accès non autorisé" />;
  return <>{children}</>;
}

// ─── Member Row ───
export function MemberRow({ user, onClick, extra, borderColor }: {
  user: any; onClick?: () => void; extra?: ReactNode; borderColor?: string;
}) {
  const getRank = useConfigStore(s => s.getRank);
  const rank = getRank(user.rank_level);
  return (
    <div
      className="member-row"
      style={{ borderLeftColor: borderColor || rank.couleur }}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{user.surnom || user.username}</div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <RankBadge level={user.rank_level} />
          <BadgesRow badges={user.badges || []} />
        </div>
      </div>
      {extra}
    </div>
  );
}
