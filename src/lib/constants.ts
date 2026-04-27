// ============================================================
// CONSTANTS — Static helpers + types
// Ranks & Badges are loaded from Supabase at runtime
// ============================================================

// ─── Fallback ranks (used before DB loads) ───
export const DEFAULT_RANKS = [
  { level: 1, nom: 'BCSO', couleur: '#4A5670' },
  { level: 2, nom: 'USM', couleur: '#6B7B9C' },
  { level: 3, nom: 'USM Confirmé', couleur: '#1B3E7C' },
  { level: 4, nom: 'Formateur', couleur: '#2E5AA8' },
  { level: 5, nom: 'Op. Second', couleur: '#8B6A42' },
  { level: 6, nom: 'Opérateur', couleur: '#A67C4E' },
  { level: 7, nom: 'Co-Leader', couleur: '#D43A4F' },
  { level: 8, nom: 'Leader', couleur: '#B32134' },
  { level: 9, nom: 'Shériff', couleur: '#C9994F' },
];

// ─── Types ───
export interface RankDef {
  level: number;
  nom: string;
  couleur: string;
}

export interface BadgeDef {
  id: string;
  code: string;
  nom: string;
  couleur: string;
  description?: string;
  ordre_affichage: number;
  icone?: string;
}

export interface ReportTemplateDef {
  id: string;
  code: string;
  nom: string;
  description?: string;
  sections: any;
  is_active: boolean;
}

export interface USMUser {
  id: string;
  discord_id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  rank_level: number;
  statut: string;
  is_active: boolean;
  surnom?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  telephone?: string;
  photo_profil_url?: string;
  derniere_connexion?: string;
  badges: string[];
  permissions: string[];
}

// ─── Dynamic helpers (accept loaded data) ───
export const getRank = (level: number, ranks?: RankDef[]): RankDef => {
  const list = ranks || DEFAULT_RANKS;
  return list.find(r => r.level === level) || list[0] || { level: 0, nom: '???', couleur: '#666' };
};

export const trierBadges = (userBadgeCodes: string[], allBadges?: BadgeDef[]) => {
  if (!allBadges?.length) return [...userBadgeCodes];
  return [...userBadgeCodes].sort((a, b) => {
    const oa = allBadges.find(bd => bd.code === a)?.ordre_affichage ?? 99;
    const ob = allBadges.find(bd => bd.code === b)?.ordre_affichage ?? 99;
    return oa - ob;
  });
};

// ─── Permission helpers ───
export const estOpSecondMin = (r: number) => r >= 5;
export const estOperateurMin = (r: number) => r >= 6;
export const estColeadMin = (r: number) => r >= 7;
export const estLeadMin = (r: number) => r >= 8;
export const estSheriff = (r: number) => r >= 9;

export const peutVoirCrash = (rang: number, badges: string[]) =>
  estColeadMin(rang) || badges.includes('CRASH');

export const peutVoirFormateurs = (rang: number, badges: string[]) =>
  estColeadMin(rang) || badges.includes('FORMATEUR');

export const peutAttribuerRang = (monRang: number, cibleRang: number) =>
  cibleRang < monRang;

/** Can this user manage config (ranks, badges, templates)? Shériff or dev only. */
export const peutGererConfig = (rang: number, permissions: string[]) =>
  estSheriff(rang) || permissions.includes('dev');

// ─── Color helpers ───
export function contrastText(hex: string): string {
  if (!hex || hex.length < 7) return '#fff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#0B1221' : '#FFFFFF';
}

// ─── Date helpers ───
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return `Il y a ${Math.floor(hrs / 24)}j`;
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatDateTime(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Status / Priority labels ───
export const STATUS_LABELS: Record<string, string> = {
  ouvert: 'Ouvert', en_cours: 'En cours', applique: 'Appliqué', resolu: 'Résolu',
  rejete: 'Rejeté', ferme: 'Fermé', draft: 'Brouillon', submitted: 'Soumis',
  published: 'Publié', validated: 'Validé', rejected: 'Rejeté', planifie: 'Planifié',
  termine: 'Terminé', annule: 'Annulé', ouverte: 'Ouverte', cloturee: 'Clôturée',
  admis: 'Admis', refuse: 'Refusé', a_repasser: 'À repasser',
  disponible: 'Disponible', occupe: 'Occupé', absent: 'Absent', hors_ligne: 'Hors ligne',
};

export const PRIORITY_LABELS: Record<string, string> = {
  basse: 'Basse', normale: 'Normale', haute: 'Haute', critique: 'Critique',
};
