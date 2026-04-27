'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase-browser';
import type { RankDef, BadgeDef, ReportTemplateDef } from '@/lib/constants';
import { DEFAULT_RANKS } from '@/lib/constants';

interface ConfigStore {
  ranks: RankDef[];
  badges: BadgeDef[];
  templates: ReportTemplateDef[];
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  reload: () => Promise<void>;

  // Helpers
  getRank: (level: number) => RankDef;
  getBadge: (code: string) => BadgeDef | undefined;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  ranks: DEFAULT_RANKS.map(r => ({ ...r })),
  badges: [],
  templates: [],
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });

    const supabase = createClient();

    const [ranksRes, badgesRes, templatesRes] = await Promise.all([
      supabase.from('ranks').select('*').order('level'),
      supabase.from('badges').select('*').order('ordre_affichage'),
      supabase.from('report_templates').select('*').order('code'),
    ]);

    set({
      ranks: ranksRes.data?.length ? ranksRes.data : DEFAULT_RANKS.map(r => ({ ...r })),
      badges: badgesRes.data || [],
      templates: templatesRes.data || [],
      loaded: true,
      loading: false,
    });
  },

  reload: async () => {
    set({ loaded: false, loading: false });
    await get().load();
  },

  getRank: (level: number) => {
    const { ranks } = get();
    return ranks.find(r => r.level === level) || ranks[0] || { level: 0, nom: '???', couleur: '#666' };
  },

  getBadge: (code: string) => {
    return get().badges.find(b => b.code === code);
  },
}));
