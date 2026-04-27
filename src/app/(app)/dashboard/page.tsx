'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import { createClient } from '@/lib/supabase-browser';
import { RankBadge, StatusTag, BadgesRow, EmptyState } from '@/components/ui/shared';
import Avatar from '@/components/ui/Avatar';
import { timeAgo, formatDateTime } from '@/lib/constants';

export default function DashboardPage() {
  const router = useRouter();
  const { user, surnom } = useUser();
  const [stats, setStats] = useState({ members: 0, rc: 0, reports: 0, sessions: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      // Members count
      const { count: memberCount } = await supabase
        .from('users').select('*', { count: 'exact', head: true }).eq('is_active', true);

      // Planned sessions
      const { data: sessions } = await supabase
        .from('training_sessions').select('*').eq('statut', 'planifie').order('date_session').limit(5);

      // Recent announcements
      const { data: annonces } = await supabase
        .from('announcements').select('*').order('created_at', { ascending: false }).limit(10);

      // My drafts
      const { data: myDrafts } = await supabase
        .from('reports').select('*').eq('auteur_id', user?.id).eq('statut', 'draft').limit(5);

      // RC count
      const { count: rcCount } = await supabase
        .from('recrutements').select('*', { count: 'exact', head: true }).in('statut', ['planifie', 'en_cours']);

      // Reports count
      const { count: reportCount } = await supabase
        .from('reports').select('*', { count: 'exact', head: true });

      // All users for reference
      const { data: allUsers } = await supabase
        .from('users').select('id, surnom, username, rank_level, avatar_url, statut');

      setStats({
        members: memberCount || 0,
        rc: rcCount || 0,
        reports: reportCount || 0,
        sessions: sessions?.length || 0,
      });
      setAnnouncements(annonces || []);
      setUpcomingSessions(sessions || []);
      setDrafts(myDrafts || []);
      setUsers(allUsers || []);
    }

    if (user) load();

    // Realtime subscriptions
    const channel = supabase.channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const findUser = (id: string) => users.find(u => u.id === id);

  return (
    <div>
      <div className="flex items-center justify-between mb-7 pt-8">
        <h1 className="font-display text-3xl tracking-wider">TABLEAU DE BORD</h1>
        <div className="text-sm text-texte-3">
          Bienvenue, <span className="text-or">{surnom}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {[
          { val: stats.members, label: 'Membres actifs', href: '/personnel' },
          { val: stats.rc, label: 'RC à faire', href: '/formateurs' },
          { val: stats.reports, label: 'Rapports', href: '/rapports' },
          { val: stats.sessions, label: 'Entraînements', href: '/entrainement' },
        ].map(s => (
          <div key={s.label} className="stat-card" onClick={() => router.push(s.href)}>
            <div className="font-display text-[42px] text-or leading-none">{s.val}</div>
            <div className="text-xs text-texte-3 mt-1.5 font-bold uppercase tracking-[0.1em]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[5fr_3fr] gap-6 max-lg:grid-cols-1">
        {/* Announcements feed */}
        <div className="card !p-0">
          <div className="px-6 py-4 border-b border-border font-display text-or tracking-[0.08em]">
            📢 ANNONCES
          </div>
          {announcements.length === 0 && (
            <div className="p-6 text-center text-texte-3 text-sm">Aucune annonce</div>
          )}
          {announcements.map(a => {
            const target = findUser(a.cible_user_id);
            const author = findUser(a.auteur_id);
            return (
              <div key={a.id} className="px-6 py-5 border-b border-border last:border-b-0">
                {a.type === 'promotion' && target ? (
                  <div className="bg-or/[0.06] border border-or/15 rounded-lg p-4 flex items-center gap-4">
                    <Avatar user={target} size="md" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">
                        {target.surnom || target.username}{' '}
                        <span className="text-texte-3 font-normal">a été promu(e)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <RankBadge level={a.rank_from} />
                        <span className="text-or font-display text-lg">→</span>
                        <RankBadge level={a.rank_to} />
                      </div>
                    </div>
                    <div className="text-[11px] text-texte-3">{timeAgo(a.created_at)}</div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-semibold">{a.titre}</span>
                      <span className="text-[11px] text-texte-3">{timeAgo(a.created_at)}</span>
                    </div>
                    <div className="text-[13px] text-texte-2 leading-relaxed">{a.contenu}</div>
                    {author && (
                      <div className="text-[11px] text-texte-3 mt-1.5">— {author.surnom || author.username}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar widgets */}
        <div className="flex flex-col gap-5">
          <div className="card">
            <div className="font-display text-sm tracking-[0.08em] text-or mb-4">📅 PROCHAINS ENTRAÎNEMENTS</div>
            {upcomingSessions.map(s => (
              <div key={s.id} className="py-2.5 border-b border-border last:border-b-0 cursor-pointer" onClick={() => router.push('/entrainement')}>
                <div className="text-[13px] font-semibold">{s.titre}</div>
                <div className="text-[11px] text-texte-3 mt-1">{formatDateTime(s.date_session)}</div>
              </div>
            ))}
            {!upcomingSessions.length && <div className="text-[13px] text-texte-3">Aucun</div>}
          </div>

          <div className="card">
            <div className="font-display text-sm tracking-[0.08em] text-or mb-4">📝 MES BROUILLONS</div>
            {drafts.map(r => (
              <div key={r.id} className="py-2.5 border-b border-border last:border-b-0 cursor-pointer" onClick={() => router.push('/rapports')}>
                <div className="text-[13px] font-semibold">{r.titre}</div>
                <div className="text-[11px] text-texte-3 mt-1">{timeAgo(r.created_at)}</div>
              </div>
            ))}
            {!drafts.length && <div className="text-[13px] text-texte-3">Aucun brouillon</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
