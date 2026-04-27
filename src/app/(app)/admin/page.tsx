'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from './lib/useUser';
import { createClient } from './lib/supabase-browser';
import {
  getRank, contrastText, peutGererConfig, peutAttribuerRang,
  timeAgo, DEFAULT_RANKS,
  type RankDef, type BadgeDef, type ReportTemplateDef,
} from './lib/constants';
import Avatar from './components/ui/Avatar';
import { RankBadge, StatusTag, EmptyState, MemberRow } from './components/ui/shared';
import { useConfigStore } from './lib/store';
import {
  Star, Award, FileText, Users, Shield, BarChart3, Plus,
  Pencil, Trash2, X, Check, AlertTriangle, GripVertical,
} from 'lucide-react';

// ─── Small helper components ───
function ConfirmDialog({ open, title, message, danger, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[600] flex items-center justify-center p-5 animate-fade-in"
      onClick={onCancel}>
      <div className="bg-fond-1 border border-border-2 rounded-2xl w-[420px] animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-rouge/20 text-rouge' : 'bg-or/20 text-or'}`}>
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-display text-lg">{title}</h3>
          </div>
          <p className="text-sm text-texte-2 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button className="btn btn-secondary text-sm" onClick={onCancel}>Annuler</button>
          <button className={`btn text-sm ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
      />
      <input
        className="input font-mono text-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="#FFFFFF"
        maxLength={7}
      />
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[700] px-5 py-3 rounded-xl text-sm font-medium shadow-lg animate-slide-up
      ${type === 'success' ? 'bg-green-600 text-white' : 'bg-rouge text-white'}`}>
      {message}
    </div>
  );
}

// ============================================================
// MAIN ADMIN PAGE
// ============================================================
export default function AdminPage() {
  const { user, rang, badges: userBadges } = useUser();
  const permissions = (user as any)?.permissions || [];
  const [tab, setTab] = useState('rangs');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const reloadConfig = useConfigStore(s => s.reload);

  const canManage = peutGererConfig(rang, permissions);
  const isCoLead = rang >= 7;

  if (!isCoLead) {
    return (
      <div className="pt-8">
        <EmptyState icon="🔒" text="Accès réservé aux Co-Leaders et au-dessus" />
      </div>
    );
  }

  const tabs = [
    { id: 'rangs', label: 'Grades', icon: <Star size={16} /> },
    { id: 'badges', label: 'Badges', icon: <Award size={16} /> },
    { id: 'templates', label: 'Templates', icon: <FileText size={16} /> },
    { id: 'connectes', label: 'Connectés', icon: <Users size={16} /> },
    { id: 'permissions', label: 'Permissions', icon: <Shield size={16} /> },
    { id: 'stats', label: 'Stats', icon: <BarChart3 size={16} /> },
  ];

  return (
    <div className="pt-8">
      <div className="flex items-center justify-between mb-7">
        <h1 className="font-display text-3xl tracking-wider">ADMINISTRATION</h1>
        {canManage && (
          <span className="tag bg-or/15 text-or">🔧 Config activée</span>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(t => (
          <div key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </div>
        ))}
      </div>

      {tab === 'rangs' && <RanksTab canManage={canManage} onToast={setToast} reloadConfig={reloadConfig} />}
      {tab === 'badges' && <BadgesTab canManage={canManage} onToast={setToast} reloadConfig={reloadConfig} />}
      {tab === 'templates' && <TemplatesTab canManage={canManage} onToast={setToast} reloadConfig={reloadConfig} />}
      {tab === 'connectes' && <ConnectedTab />}
      {tab === 'permissions' && <PermissionsTab canManage={rang >= 9 || permissions.includes('dev')} />}
      {tab === 'stats' && <StatsTab />}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ============================================================
// TAB: RANKS MANAGEMENT
// ============================================================
function RanksTab({ canManage, onToast, reloadConfig }: { canManage: boolean; onToast: (t: any) => void; reloadConfig: () => Promise<void> }) {
  const [ranks, setRanks] = useState<RankDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ nom: '', couleur: '' });
  const [creating, setCreating] = useState(false);
  const [newData, setNewData] = useState({ level: 0, nom: '', couleur: '#666666' });
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/ranks');
    const data = await res.json();
    if (Array.isArray(data)) setRanks(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newData.level || !newData.nom) return;
    const res = await fetch('/api/admin/ranks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    });
    if (res.ok) {
      onToast({ message: `Grade "${newData.nom}" créé`, type: 'success' });
      setCreating(false);
      setNewData({ level: 0, nom: '', couleur: '#666666' });
      load();
      reloadConfig();
    } else {
      const err = await res.json();
      onToast({ message: err.error, type: 'error' });
    }
  };

  const handleUpdate = async (level: number) => {
    const res = await fetch('/api/admin/ranks', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, ...editData }),
    });
    if (res.ok) {
      onToast({ message: 'Grade mis à jour', type: 'success' });
      setEditId(null);
      load();
      reloadConfig();
    } else {
      const err = await res.json();
      onToast({ message: err.error, type: 'error' });
    }
  };

  const handleDelete = async (level: number) => {
    const res = await fetch('/api/admin/ranks', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
    });
    if (res.ok) {
      onToast({ message: 'Grade supprimé', type: 'success' });
      setConfirmDelete(null);
      load();
      reloadConfig();
    } else {
      const err = await res.json();
      onToast({ message: err.error, type: 'error' });
      setConfirmDelete(null);
    }
  };

  if (loading) return <div className="text-texte-3 text-sm py-8 text-center">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-texte-3">{ranks.length} grade(s) configuré(s)</p>
        {canManage && (
          <button className="btn btn-primary text-sm" onClick={() => setCreating(true)}>
            <Plus size={16} /> Nouveau grade
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="card mb-5 border-or/30">
          <h3 className="font-display text-base mb-4">NOUVEAU GRADE</h3>
          <div className="grid grid-cols-[100px_1fr_1fr] gap-4 items-end">
            <div>
              <label className="form-label mb-1 block">Niveau</label>
              <input className="input text-center" type="number" min={1} max={20}
                value={newData.level || ''} onChange={e => setNewData(d => ({ ...d, level: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="form-label mb-1 block">Nom</label>
              <input className="input" value={newData.nom} onChange={e => setNewData(d => ({ ...d, nom: e.target.value }))}
                placeholder="Ex: Lieutenant" />
            </div>
            <div>
              <label className="form-label mb-1 block">Couleur</label>
              <ColorPicker value={newData.couleur} onChange={v => setNewData(d => ({ ...d, couleur: v }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button className="btn btn-ghost text-sm" onClick={() => setCreating(false)}>Annuler</button>
            <button className="btn btn-primary text-sm" onClick={handleCreate}
              disabled={!newData.level || !newData.nom}>Créer</button>
          </div>
        </div>
      )}

      {/* Ranks list */}
      <div className="card !p-0">
        {ranks.map(r => (
          <div key={r.level} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-fond-hover/50 transition-all"
            style={{ borderLeft: `4px solid ${r.couleur}` }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-display text-lg"
              style={{ background: r.couleur, color: contrastText(r.couleur) }}>
              {r.level}
            </div>

            {editId === r.level ? (
              <div className="flex-1 flex items-center gap-3">
                <input className="input text-sm flex-1" value={editData.nom}
                  onChange={e => setEditData(d => ({ ...d, nom: e.target.value }))} />
                <ColorPicker value={editData.couleur} onChange={v => setEditData(d => ({ ...d, couleur: v }))} />
                <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(r.level)}><Check size={14} /></button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}><X size={14} /></button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{r.nom}</div>
                  <div className="text-xs text-texte-3 font-mono">{r.couleur}</div>
                </div>
                <div className="w-6 h-6 rounded" style={{ background: r.couleur }} />
                {canManage && (
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-fond-3 text-texte-3 hover:text-texte transition-all"
                      onClick={() => { setEditId(r.level); setEditData({ nom: r.nom, couleur: r.couleur }); }}>
                      <Pencil size={14} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-rouge/20 text-texte-3 hover:text-rouge transition-all"
                      onClick={() => setConfirmDelete(r.level)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer ce grade"
        message={`Êtes-vous sûr de vouloir supprimer le grade niveau ${confirmDelete} ? Cette action est irréversible. Les membres ayant ce grade doivent d'abord être réassignés.`}
        danger
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ============================================================
// TAB: BADGES MANAGEMENT
// ============================================================
function BadgesTab({ canManage, onToast, reloadConfig }: { canManage: boolean; onToast: (t: any) => void; reloadConfig: () => Promise<void> }) {
  const [badges, setBadges] = useState<BadgeDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ nom: '', couleur: '', icone: '', description: '' });
  const [newData, setNewData] = useState({ code: '', nom: '', couleur: '#3B82F6', icone: '🏷', description: '' });
  const [confirmDelete, setConfirmDelete] = useState<BadgeDef | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/badges');
    const data = await res.json();
    if (Array.isArray(data)) setBadges(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newData.code || !newData.nom) return;
    const res = await fetch('/api/admin/badges', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    });
    if (res.ok) {
      onToast({ message: `Badge "${newData.nom}" créé`, type: 'success' });
      setCreating(false);
      setNewData({ code: '', nom: '', couleur: '#3B82F6', icone: '🏷', description: '' });
      load();
      reloadConfig();
    } else {
      const err = await res.json();
      onToast({ message: err.error, type: 'error' });
    }
  };

  const handleUpdate = async (id: string) => {
    const res = await fetch('/api/admin/badges', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editData }),
    });
    if (res.ok) {
      onToast({ message: 'Badge mis à jour', type: 'success' });
      setEditId(null);
      load();
      reloadConfig();
    } else {
      const err = await res.json();
      onToast({ message: err.error, type: 'error' });
    }
  };

  const handleDelete = async (badge: BadgeDef) => {
    const res = await fetch('/api/admin/badges', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: badge.id }),
    });
    const result = await res.json();
    if (res.ok) {
      onToast({
        message: `Badge "${badge.nom}" supprimé${result.revoked_from ? ` (retiré de ${result.revoked_from} membre(s))` : ''}`,
        type: 'success',
      });
      setConfirmDelete(null);
      load();
      reloadConfig();
    } else {
      onToast({ message: result.error, type: 'error' });
      setConfirmDelete(null);
    }
  };

  if (loading) return <div className="text-texte-3 text-sm py-8 text-center">Chargement...</div>;

  const emojiOptions = ['🏷','💥','🎓','📘','🤝','🎯','🛸','🔒','📎','🦅','⚡','🔥','🏅','🎖','🛡','💎','🔫','🚁','📡','🕵️'];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-texte-3">{badges.length} badge(s) configuré(s)</p>
        {canManage && (
          <button className="btn btn-primary text-sm" onClick={() => setCreating(true)}>
            <Plus size={16} /> Nouveau badge
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="card mb-5 border-or/30">
          <h3 className="font-display text-base mb-4">NOUVEAU BADGE</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label mb-1 block">Code (unique, MAJUSCULE)</label>
              <input className="input uppercase" value={newData.code}
                onChange={e => setNewData(d => ({ ...d, code: e.target.value.toUpperCase().replace(/\s/g, '_') }))}
                placeholder="Ex: SNIPER" />
            </div>
            <div>
              <label className="form-label mb-1 block">Nom affiché</label>
              <input className="input" value={newData.nom} onChange={e => setNewData(d => ({ ...d, nom: e.target.value }))}
                placeholder="Ex: Tireur d'élite" />
            </div>
            <div>
              <label className="form-label mb-1 block">Couleur</label>
              <ColorPicker value={newData.couleur} onChange={v => setNewData(d => ({ ...d, couleur: v }))} />
            </div>
            <div>
              <label className="form-label mb-1 block">Icône</label>
              <div className="flex flex-wrap gap-1.5">
                {emojiOptions.map(em => (
                  <button key={em}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all
                      ${newData.icone === em ? 'bg-or/20 ring-2 ring-or' : 'bg-fond hover:bg-fond-hover'}`}
                    onClick={() => setNewData(d => ({ ...d, icone: em }))}>
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="form-label mb-1 block">Description (optionnel)</label>
              <input className="input" value={newData.description}
                onChange={e => setNewData(d => ({ ...d, description: e.target.value }))}
                placeholder="Ex: Certifié tir de précision longue distance" />
            </div>
          </div>
          {/* Preview */}
          <div className="mt-4 p-3 bg-fond rounded-lg flex items-center gap-3">
            <span className="text-xs text-texte-3">Aperçu :</span>
            <span className="tag rounded" style={{ background: newData.couleur, color: contrastText(newData.couleur) }}>
              {newData.icone} {newData.nom || '...'}
            </span>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button className="btn btn-ghost text-sm" onClick={() => setCreating(false)}>Annuler</button>
            <button className="btn btn-primary text-sm" onClick={handleCreate}
              disabled={!newData.code || !newData.nom}>Créer</button>
          </div>
        </div>
      )}

      {/* Badges list */}
      <div className="grid grid-cols-1 gap-3">
        {badges.map(b => (
          <div key={b.id}
            className="card flex items-center gap-4 !py-4 hover:border-border-2 transition-all">
            <div className="text-2xl w-10 text-center">{b.icone}</div>

            {editId === b.id ? (
              <div className="flex-1 grid grid-cols-[1fr_200px_auto] gap-3 items-center">
                <input className="input text-sm" value={editData.nom}
                  onChange={e => setEditData(d => ({ ...d, nom: e.target.value }))} />
                <ColorPicker value={editData.couleur} onChange={v => setEditData(d => ({ ...d, couleur: v }))} />
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(b.id)}><Check size={14} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}><X size={14} /></button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="tag rounded" style={{ background: b.couleur, color: contrastText(b.couleur) }}>
                      {b.icone} {b.nom}
                    </span>
                    <span className="text-xs text-texte-3 font-mono">{b.code}</span>
                  </div>
                  {b.description && <div className="text-xs text-texte-3 mt-1">{b.description}</div>}
                </div>
                <div className="text-xs text-texte-3">#{b.ordre_affichage}</div>
                {canManage && (
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-fond-3 text-texte-3 hover:text-texte transition-all"
                      onClick={() => { setEditId(b.id); setEditData({ nom: b.nom, couleur: b.couleur, icone: b.icone || '', description: b.description || '' }); }}>
                      <Pencil size={14} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-rouge/20 text-texte-3 hover:text-rouge transition-all"
                      onClick={() => setConfirmDelete(b)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {!badges.length && <EmptyState icon="🏅" text="Aucun badge configuré" />}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer ce badge"
        message={`Supprimer "${confirmDelete?.nom}" ? Le badge sera automatiquement retiré de tous les membres qui le possèdent.`}
        danger
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ============================================================
// TAB: TEMPLATES MANAGEMENT
// ============================================================
function TemplatesTab({ canManage, onToast, reloadConfig }: { canManage: boolean; onToast: (t: any) => void; reloadConfig: () => Promise<void> }) {
  const [templates, setTemplates] = useState<ReportTemplateDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newData, setNewData] = useState({ code: '', nom: '', description: '' });
  const [confirmDelete, setConfirmDelete] = useState<ReportTemplateDef | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/templates');
    const data = await res.json();
    if (Array.isArray(data)) setTemplates(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newData.code || !newData.nom) return;
    const res = await fetch('/api/admin/templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    });
    if (res.ok) {
      onToast({ message: `Template "${newData.nom}" créé`, type: 'success' });
      setCreating(false);
      setNewData({ code: '', nom: '', description: '' });
      load();
      reloadConfig();
    } else {
      const err = await res.json();
      onToast({ message: err.error, type: 'error' });
    }
  };

  const toggleActive = async (tmpl: ReportTemplateDef) => {
    const res = await fetch('/api/admin/templates', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tmpl.id, is_active: !tmpl.is_active }),
    });
    if (res.ok) {
      onToast({ message: `Template ${tmpl.is_active ? 'désactivé' : 'activé'}`, type: 'success' });
      load();
      reloadConfig();
    }
  };

  const handleDelete = async (tmpl: ReportTemplateDef) => {
    const res = await fetch('/api/admin/templates', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tmpl.id }),
    });
    if (res.ok) {
      onToast({ message: `Template "${tmpl.nom}" supprimé`, type: 'success' });
      setConfirmDelete(null);
      load();
      reloadConfig();
    } else {
      const err = await res.json();
      onToast({ message: err.error, type: 'error' });
      setConfirmDelete(null);
    }
  };

  if (loading) return <div className="text-texte-3 text-sm py-8 text-center">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-texte-3">{templates.length} template(s) de rapport</p>
        {canManage && (
          <button className="btn btn-primary text-sm" onClick={() => setCreating(true)}>
            <Plus size={16} /> Nouveau template
          </button>
        )}
      </div>

      {creating && (
        <div className="card mb-5 border-or/30">
          <h3 className="font-display text-base mb-4">NOUVEAU TEMPLATE DE RAPPORT</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label mb-1 block">Code (unique)</label>
              <input className="input" value={newData.code}
                onChange={e => setNewData(d => ({ ...d, code: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                placeholder="Ex: perquisition" />
            </div>
            <div>
              <label className="form-label mb-1 block">Nom affiché</label>
              <input className="input" value={newData.nom} onChange={e => setNewData(d => ({ ...d, nom: e.target.value }))}
                placeholder="Ex: Perquisition" />
            </div>
            <div className="col-span-2">
              <label className="form-label mb-1 block">Description</label>
              <input className="input" value={newData.description}
                onChange={e => setNewData(d => ({ ...d, description: e.target.value }))}
                placeholder="Ex: Rapport de perquisition domiciliaire" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button className="btn btn-ghost text-sm" onClick={() => setCreating(false)}>Annuler</button>
            <button className="btn btn-primary text-sm" onClick={handleCreate}
              disabled={!newData.code || !newData.nom}>Créer</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {templates.map(t => (
          <div key={t.id} className={`card flex items-center gap-4 !py-4 ${!t.is_active ? 'opacity-50' : ''}`}>
            <div className="text-2xl">📄</div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{t.nom}</span>
                <span className="text-xs text-texte-3 font-mono">{t.code}</span>
                {!t.is_active && <span className="tag bg-fond-3 text-texte-3">Désactivé</span>}
              </div>
              {t.description && <div className="text-xs text-texte-3 mt-1">{t.description}</div>}
            </div>
            {canManage && (
              <div className="flex gap-2">
                <button
                  className={`btn btn-sm ${t.is_active ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => toggleActive(t)}>
                  {t.is_active ? 'Désactiver' : 'Activer'}
                </button>
                <button className="p-2 rounded-lg hover:bg-rouge/20 text-texte-3 hover:text-rouge transition-all"
                  onClick={() => setConfirmDelete(t)}>
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!templates.length && <EmptyState icon="📄" text="Aucun template configuré" />}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer ce template"
        message={`Supprimer le template "${confirmDelete?.nom}" ? Les rapports existants utilisant ce template ne seront pas affectés.`}
        danger
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ============================================================
// TAB: CONNECTED USERS
// ============================================================
function ConnectedTab() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('users').select('*').eq('is_active', true)
      .order('derniere_connexion', { ascending: false })
      .then(({ data }) => setUsers(data || []));
  }, []);

  return (
    <div className="card !p-2">
      {users.map(u => {
        const rank = getRank(u.rank_level);
        const diff = Date.now() - new Date(u.derniere_connexion).getTime();
        const dotClass = diff < 300000 ? 'bg-green-500' : diff < 3600000 ? 'bg-yellow-500' : 'bg-gray-500';
        return (
          <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-fond-hover/50 transition-all"
            style={{ borderLeft: `4px solid ${rank.couleur}` }}>
            <Avatar user={u} size="sm" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                <span className="text-sm font-semibold">{u.surnom || u.username}</span>
              </div>
              <RankBadge level={u.rank_level} />
            </div>
            <span className="text-xs text-texte-3">{timeAgo(u.derniere_connexion)}</span>
          </div>
        );
      })}
      {!users.length && <EmptyState icon="👤" text="Aucun membre" />}
    </div>
  );
}

// ============================================================
// TAB: PERMISSIONS
// ============================================================
function PermissionsTab({ canManage }: { canManage: boolean }) {
  if (!canManage) return <EmptyState icon="🔑" text="Réservé au Shériff ou permission dev" />;

  const [users, setUsers] = useState<any[]>([]);
  const [perms, setPerms] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('users').select('*').eq('is_active', true).order('rank_level', { ascending: false }),
      supabase.from('user_permissions').select('*'),
    ]).then(([{ data: u }, { data: p }]) => {
      setUsers(u || []);
      const map: Record<string, string[]> = {};
      (p || []).forEach((perm: any) => {
        if (!map[perm.user_id]) map[perm.user_id] = [];
        map[perm.user_id].push(perm.permission);
      });
      setPerms(map);
    });
  }, []);

  return (
    <div>
      <p className="text-sm text-texte-3 mb-5">Permissions disponibles : <code className="text-or">dev</code>, <code className="text-or">admin_panel</code>, <code className="text-or">super_admin</code></p>
      <div className="card !p-2">
        {users.map(u => {
          const rank = getRank(u.rank_level);
          const userPerms = perms[u.id] || [];
          return (
            <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-b-0"
              style={{ borderLeft: `4px solid ${rank.couleur}` }}>
              <Avatar user={u} size="sm" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{u.surnom || u.username}</div>
                <div className="flex gap-1.5 mt-1">
                  <RankBadge level={u.rank_level} />
                  {userPerms.map(p => (
                    <span key={p} className="tag bg-or/15 text-or">{p}</span>
                  ))}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm">Gérer</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// TAB: STATS
// ============================================================
function StatsTab() {
  const [stats, setStats] = useState({ total: 0, disponibles: 0, archives: 0, byRank: [] as { level: number; nom: string; couleur: string; count: number }[] });

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('statut', 'disponible'),
      supabase.from('archives').select('*', { count: 'exact', head: true }),
      supabase.from('ranks').select('*').order('level', { ascending: false }),
      supabase.from('users').select('rank_level').eq('is_active', true),
    ]).then(([total, dispo, archives, ranks, allUsers]) => {
      const byRank = (ranks.data || []).map((r: any) => ({
        ...r,
        count: (allUsers.data || []).filter((u: any) => u.rank_level === r.level).length,
      }));
      setStats({
        total: total.count || 0,
        disponibles: dispo.count || 0,
        archives: archives.count || 0,
        byRank,
      });
    });
  }, []);

  return (
    <div>
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="stat-card"><div className="font-display text-4xl text-or">{stats.total}</div><div className="text-xs text-texte-3 mt-1 font-bold uppercase tracking-wider">Actifs</div></div>
        <div className="stat-card"><div className="font-display text-4xl text-or">{stats.disponibles}</div><div className="text-xs text-texte-3 mt-1 font-bold uppercase tracking-wider">Disponibles</div></div>
        <div className="stat-card"><div className="font-display text-4xl text-or">{stats.archives}</div><div className="text-xs text-texte-3 mt-1 font-bold uppercase tracking-wider">Archivés</div></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {stats.byRank.map(r => (
          <div key={r.level} className="card flex items-center justify-between" style={{ borderLeft: `4px solid ${r.couleur}` }}>
            <div>
              <div className="text-xs text-texte-3">{r.nom}</div>
              <div className="text-sm text-texte-3 font-mono">Niv. {r.level}</div>
            </div>
            <div className="font-display text-2xl" style={{ color: r.couleur }}>{r.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
