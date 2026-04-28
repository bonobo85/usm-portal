# 🌟 U.S. Marshal — Portail GTA RP

Portail web interne pour l'unité United States Marshal (BCSO) sur serveur GTA RP.  
Gestion du personnel, entraînements, rapports, sanctions, recrutements et espace personnel.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase)
![Discord](https://img.shields.io/badge/Discord-OAuth-5865F2?logo=discord)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)

---

## 🚀 Déploiement rapide

### 1. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor** → coller le contenu de `supabase/migration.sql` → **Run**
3. Aller dans **Storage** → créer 3 buckets :
   - `avatars` (public)
   - `documents-prives` (private)
   - `rapports` (private, auth required)
4. Récupérer les clés dans **Settings > API** :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Discord OAuth

1. Aller sur [Discord Developer Portal](https://discord.com/developers/applications)
2. **New Application** → nommer "USM Portal"
3. Onglet **OAuth2** :
   - Copier **Client ID** → `DISCORD_CLIENT_ID`
   - Copier **Client Secret** → `DISCORD_CLIENT_SECRET`
   - Ajouter les **Redirects** :
     - `http://localhost:3000/api/auth/callback/discord` (dev)
     - `https://votre-domaine.vercel.app/api/auth/callback/discord` (prod)

### 3. Variables d'environnement

Copier `.env.example` → `.env.local` et remplir toutes les valeurs.

Générer le secret NextAuth :
```bash
openssl rand -base64 32
```

### 4. Installation locale

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

### 5. Déployer sur Vercel

1. Push le repo sur GitHub
2. Aller sur [vercel.com](https://vercel.com) → **Import Project**
3. Sélectionner le repo
4. Ajouter toutes les variables d'environnement (`.env.example`)
5. **Deploy** !
6. Ajouter l'URL Vercel dans les redirects Discord OAuth

---

## 📁 Structure du projet

```
src/
├── app/
│   ├── (app)/              # Routes authentifiées (avec sidebar)
│   │   ├── dashboard/      # Tableau de bord
│   │   ├── personnel/      # Liste + organigramme
│   │   ├── profil/[userId]/ # Profil membre
│   │   ├── badges/         # Gestion des badges
│   │   ├── entrainement/   # Planning + sessions
│   │   ├── formateurs/     # RC + résultats + attestations
│   │   ├── rapports/       # Rapports par template
│   │   ├── sanctions/      # Helpdesk retour & sanction
│   │   ├── crash/          # Unité CRASH
│   │   ├── archives/       # Membres archivés + casier
│   │   ├── workspace/      # Espace personnel (fiches)
│   │   ├── admin/          # Administration
│   │   └── layout.tsx      # Layout avec sidebar
│   ├── api/
│   │   ├── auth/[...nextauth]/ # Discord OAuth
│   │   ├── rang/           # POST: modifier rang
│   │   ├── sanctions/      # POST: créer sanction
│   │   └── archiver/       # POST: archiver membre
│   ├── login/              # Page de connexion
│   ├── layout.tsx          # Root layout
│   └── providers.tsx       # NextAuth provider
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx     # Sidebar navigation
│   └── ui/
│       ├── Avatar.tsx      # Avatar component
│       └── shared.tsx      # RankBadge, BadgeTag, Modal, Tabs...
├── lib/
│   ├── auth.ts             # NextAuth config + Supabase JWT
│   ├── constants.ts        # Ranks, badges, helpers, types
│   ├── supabase-browser.ts # Client-side Supabase
│   ├── supabase-server.ts  # Server-side Supabase (admin)
│   └── useUser.ts          # Hook client pour l'utilisateur
├── styles/
│   └── globals.css         # Tailwind + custom styles
├── types/
│   └── next-auth.d.ts      # Type augmentation
└── middleware.ts            # Auth middleware
```

---

## 🔐 Hiérarchie & Permissions

| Niv | Rang | Accès |
|-----|------|-------|
| 9 | Shériff | Tout + permissions |
| 8 | Leader | Tout |
| 7 | Co-Leader | Admin, archives (écriture), sanctions (appliquer), workspace (voir tous) |
| 6 | Opérateur | Archives (lecture) |
| 5 | Op. Second | Badges, sanctions (créer), rapports (publier) |
| 4 | Formateur | Créer sessions d'entraînement |
| 3 | USM Confirmé | Standard |
| 2 | USM | Standard |
| 1 | BCSO | Standard |

---

## 💡 Suggestions d'améliorations

### 🔴 Priorité haute

1. **Notifications temps réel** — Utiliser Supabase Realtime + Web Push pour notifier les promotions, nouveaux tickets, sessions. Ajouter une cloche dans la sidebar avec compteur.

2. **Système de logs d'activité** — Table `activity_logs` qui trace chaque action (connexion, modification, sanction). Afficher un fil d'activité dans le dashboard admin.

3. **Export PDF des fiches** — Générer des PDF officiels depuis les fiches de l'espace personnel avec en-tête USM, numéro de dossier et signature.

4. **Recherche globale (Cmd+K)** — Modale de recherche universelle : chercher un membre, un rapport, une fiche, une session. Très utile pour les grosses bases.

### 🟡 Priorité moyenne

5. **Dashboard personnalisé par rang** — Les stats et widgets affichés changent selon le grade. Un BCSO voit ses propres stats, un Co-Leader voit les KPIs globaux.

6. **Système de favoris** — Permettre d'épingler des fiches, rapports ou dossiers en favori pour un accès rapide.

7. **Calendrier visuel** — Remplacer la simple liste d'entraînements par un vrai calendrier mensuel/hebdo avec drag & drop.

8. **Tags personnalisés sur les fiches** — Ajouter des tags libres (ex: "suspect", "témoin", "informateur") aux fiches de l'espace personnel pour filtrer plus facilement.

9. **Thème clair optionnel** — Certains jouent en journée, un toggle light/dark dans la sidebar serait bienvenu.

10. **Mode mobile natif** — La sidebar se transforme en bottom tab bar sur mobile. Les modales deviennent des pages pleines.

### 🟢 Nice-to-have

11. **Statistiques avancées** — Graphiques d'activité : rapports/semaine, sanctions/mois, courbe de croissance des membres. Utiliser Recharts.

12. **Templates de fiche personnalisables** — Permettre aux co-leaders de créer des modèles de fiche (ex: "Fiche véhicule", "Fiche lieu") avec des champs prédéfinis.

13. **Système de notes rapides** — Un mini bloc-notes accessible depuis n'importe quelle page (drawer latéral).

14. **Historique de conversation par ticket** — Ajouter du threading (réponses à une réponse) dans les tickets helpdesk.

15. **Audit trail complet** — Qui a vu quoi, quand. Table `audit_trail` avec IP, user-agent, action.

16. **Multi-langue** — Supporter l'anglais pour les serveurs internationaux (i18n avec next-intl).

17. **Mode hors-ligne** — Service worker pour consulter les fiches en cache même sans connexion.

18. **Intégration Discord Webhooks** — Envoyer automatiquement les promotions, nouveaux rapports et sanctions dans un channel Discord dédié.

---

## 🎨 Design

- **Palette** : Fond noir-bleu marine (#070D18), accents or (#C4973B), rouge USM (#B32134)
- **Typo** : Bebas Neue (titres) + DM Sans (corps)
- **Layout** : Sidebar fixe 260px + contenu principal scrollable
- **Composants** : Cards avec border-left coloré par grade, tags uppercase, avatars avec initiales

---

## 📋 Base de données

18 tables principales, triggers pour :
- Promotion auto → annonce
- `updated_at` automatique
- Expiration des suspensions

RLS (Row Level Security) activée sur toutes les tables :
- Lecture : authentifié
- Workspace : propriétaire OU co-leader+
- Écriture : vérifiée côté API routes

Voir `supabase/migration.sql` pour le schéma complet.

---

## 📜 License

Projet privé — Usage interne serveur GTA RP uniquement.
