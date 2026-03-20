# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Ce fichier est chargé automatiquement à chaque démarrage. Ne JAMAIS le supprimer.

## Qui est l'utilisateur

**Nico** — PDG et fondateur de MAESTROMIND. Non-développeur. Pilote le produit, valide les orientations, délègue 100% de l'exécution technique à Claude Code. Français exclusivement.

## Règles absolues

1. **Autonomie totale** — Ne JAMAIS demander de validation sauf pour les paiements réels. Exécuter, puis résumer en 2-3 lignes.
2. **Français obligatoire** — Toutes les réponses, commentaires dans le code, messages UI, commits.
3. **Réponses courtes** — Le PDG lit les résultats, pas les explications. Droit au but.
4. **Ne jamais demander au PDG de faire ce que Claude peut faire** — Vérifier les déploiements soi-même, prendre des screenshots, tester, corriger.
5. **Screenshots automatiques** — Après chaque changement visuel : Playwright screenshot → Read image → valider soi-même.
6. **IA dédiée pour chaque besoin** — Chaque feature qui a besoin d'IA = nouvelle IA dans constants.js avec prompt dédié.
7. **Accès web** — WebFetch/WebSearch sont autorisés. Les utiliser pour vérifier déploiements, chercher infos, tester endpoints.
8. **Toujours builder avant de commit** — `npm run build` doit passer sans erreur.
9. **Toujours tester** — `npx playwright test` doit passer (35+ tests).

## Commandes

```bash
npm run dev                              # Dev server (port 5173)
npm run build                            # Build production (OBLIGATOIRE avant commit)
npm run lint                             # ESLint
npx vite preview                         # Preview build locale (port 4173)
npx playwright test                      # Tous les tests E2E (35+)
npx playwright test tests/03-coach.spec.js  # Un seul fichier de test
npx playwright test -g "nom du test"     # Un seul test par nom
npx gh-pages -d dist                     # Déployer frontend (GitHub Pages)
npx vercel --prod --yes                  # Déployer API (Vercel)
```

**Tests** : Les tests Playwright tournent contre `vite preview` (port 4173) avec un viewport mobile 390×844. Toujours faire `npm run build` avant de lancer les tests. Les 7 fichiers de test sont numérotés : `01-onboarding`, `02-navigation`, `03-coach`, `04-outils`, `05-projets`, `06-scanner`, `07-pwa`.

## Architecture

### Vue d'ensemble
App React 19 — IA bâtiment pour particuliers et artisans. PWA installable, dark mode gold, glassmorphism.

### Stack
- React 19 + Vite 8 + HashRouter (pas BrowserRouter — GitHub Pages)
- Claude API (`claude-sonnet-4-20250514`) via proxy serverless Vercel
- jsPDF (lazy loaded) pour exports PDF
- Stripe pour paiements
- Playwright pour tests E2E
- PWA via `vite-plugin-pwa` (service worker Workbox)

### Data flow — comment une requête IA circule
1. Composant (ex: `CoachPage`) appelle `send()` depuis `AppContext`
2. `AppContext` construit le body avec le prompt système de l'IA sélectionnée (`IAS[key].sys` dans `src/data/constants.js`)
3. `streamChat()` dans `src/utils/api.js` fait un fetch SSE vers `apiURL()` :
   - **Dev** : directement `api.anthropic.com` avec clé locale
   - **Prod** : proxy `maestromind.vercel.app/api/anthropic` (serverless function dans `api/anthropic.js`)
4. Les tokens arrivent en streaming et mettent à jour le state via `onToken`

### Structure des fichiers clés

```
src/
├── main.jsx                  # Point d'entrée : HashRouter + ErrorBoundary
├── App.jsx                   # Code splitting (React.lazy) de toutes les pages
├── context/
│   ├── AppContext.jsx         # Hub state global : navigation, chat, IA, envoi API
│   ├── useUserState.js        # Profil utilisateur, onboarding, préférences
│   ├── useChatState.js        # Historique chat, messages, streaming
│   ├── useToolsState.js       # État des 12 onglets outils
│   ├── useDiagnosticState.js  # Scanner et diagnostics photo
│   └── useAuthState.js        # Authentification Supabase
├── data/
│   ├── constants.js           # 33+ IAs avec prompts systèmes dédiés (IAS object)
│   └── index.js               # Bases de données locales (prix, DTU, etc.)
├── utils/
│   ├── api.js                 # apiURL(), apiHeaders(), streamChat(), withRetry()
│   ├── pdf.js                 # Export PDF (jsPDF) — certificats, devis, CR
│   ├── tts.js                 # Synthèse vocale
│   ├── stripe.js              # Checkout Stripe
│   ├── geolocation.js         # Géoloc contextuelle
│   ├── databases.js           # Accès bases de données enrichies
│   └── supabase.js            # Client Supabase
├── styles/
│   └── index.js               # Tous les styles inline centralisés (objet `s`)
├── components/                # 26 composants (pages + UI)
api/                           # Serverless functions Vercel
├── anthropic.js               # Proxy Claude API
├── stripe-checkout.js         # Création session Stripe
└── stripe-webhook.js          # Webhook Stripe
tests/                         # 7 fichiers Playwright E2E
```

### Pages (10)
Home, Coach (33 IA), Scanner, Shop, Cert (DTU), Outils (12 onglets), Projets, Dashboard, Auth, Settings

### Navigation
Pas de React Router classique — navigation gérée manuellement dans `AppContext` via `page` state + `goPage()`. Les routes (`ROUTE_TO_PAGE`/`PAGE_TO_ROUTE`) synchronisent l'URL mais le rendu est conditionnel dans `App.jsx` (tous les composants sont montés, visibilité contrôlée par CSS).

### Styles
Pas de CSS modules ni styled-components. Tout est dans `src/styles/index.js` comme objet JS exporté `s`. Utiliser `style={s.xxx}` dans les composants.

### Ajout d'une nouvelle IA
Ajouter une entrée dans `IAS` dans `src/data/constants.js` avec : `name`, `division`, `rang`, `st` (sous-titre), `color`, `sys` (prompt système complet), `chips` (suggestions particulier), `chipsPro` (suggestions pro).

### Hébergement
- **Frontend prod** : GitHub Pages → `nicobatberger-design.github.io/maestromind/`
- **API proxy** : Vercel → `maestromind.vercel.app` (serverless functions)
- **Netlify** : ABANDONNÉ (crédits épuisés) — ne jamais proposer

### Design tokens
- Background : `#06080D` · Gold : `#C9A84C` · Gradient gold : `linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)`
- Text : `#F0EDE6` · Green : `#52C37A` · Orange : `#E8873A` · Red : `#E05252` · Blue : `#5290E0`
- Font titre : Syne (700-800) · Font body : DM Sans (300-500)
- Style : Glassmorphism dark mode gold

## Au démarrage de chaque conversation

1. Lire ce fichier (automatique)
2. Vérifier `git status` et `git log` pour comprendre l'état actuel
3. Continuer le travail là où on s'est arrêtés — ne PAS demander "que voulez-vous faire ?"
4. Si le PDG dit "continue" → analyser les fichiers et reprendre

## Problèmes déjà résolus (ne JAMAIS réintroduire)
- Caméra mobile : 5 tentatives custom échouées → `input capture="environment"` uniquement
- AR Live 3D : supprimé définitivement (non fonctionnel en web mobile)
- Netlify : abandonné (300 crédits épuisés), ne plus proposer
- Race condition sendWithPhoto : guard loading ajouté
- Fuite mémoire Speech Recognition : abort avant nouvelle instance
- Paywall hackable : compteur obfusqué base64
- PIN bloquant : supprimé de l'entrée app (reste en overlay PDG)
- BrowserRouter sur GitHub Pages : remplacé par HashRouter
- Vercel Deployment Protection : résolu
- react-webcam : écran noir sur mobile → supprimé, utiliser input natif

## Décisions techniques définitives
- Mesures en millimètres (standard bâtiment français)
- App adaptative : contenu adapté au profil (Particulier = simple, Pro = technique)
- Simple > complexe : toujours la solution la plus simple qui marche
- Chaque IA a un prompt dédié ultra-qualifié (pas de prompt générique)
- Objectif final : Play Store + App Store (PWA wrappée)
