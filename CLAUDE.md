# MAESTROMIND — Instructions Claude Code

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

## Le projet MAESTROMIND

**App React 19 — IA bâtiment pour particuliers et artisans.**

### Stack technique
- React 19 + Vite 8 + HashRouter
- Claude API (claude-sonnet-4-20250514) via proxy serverless
- jsPDF (lazy loaded) pour les exports PDF
- Stripe pour les paiements
- Playwright pour les tests E2E
- PWA (manifest, service worker, install prompt)

### Hébergement (mars 2026)
- **Frontend prod** : GitHub Pages → `nicobatberger-design.github.io/maestromind/`
- **API proxy** : Vercel → `maestromind.vercel.app` (serverless functions)
- **Repo** : `nicobatberger-design/maestromind` (privé)
- **Netlify** : ABANDONNÉ (crédits épuisés)

### Déploiement
- Frontend : `npm run build` puis `npx gh-pages -d dist`
- API : `npx vercel --prod --yes` (ou auto sur push master)

### Architecture
- 22 composants React dans `src/components/`
- State global : `src/context/AppContext.jsx` (hub) + 4 hooks dédiés
- 33 IA spécialisées dans `src/data/constants.js`
- Styles inline centralisés dans `src/styles/index.js`
- Code splitting avec React.lazy() sur toutes les pages
- API backend : `api/anthropic.js`, `api/stripe-checkout.js`, `api/stripe-webhook.js`
- Netlify functions en backup : `netlify/functions/`

### Pages (8)
Home, Coach (32 IA), Scanner, Shop, Cert (DTU), Outils (12 onglets), Projets, Dashboard

### Outils (12 onglets)
Devis, Matériaux, Primes, Artisan RGE, DPE, Planning, Devis Pro, Rentabilité, Béton, Escalier, Tuyauterie, Sécurité

### Features clés
- 33 IA spécialisées en 11 divisions
- Input vocal (SpeechRecognition) + synthèse vocale (TTS)
- Scanner photo IA (caméra native + vision API)
- Contre-devis IA négocié
- Certificats DTU PDF (jsPDF dark gold)
- Simulateur DPE + aides 2026
- Calcul matériaux avancé (50+ types de travaux, tous corps de métier)
- Onboarding 5 écrans (plus de PIN bloquant)
- Paywall doux (tous les 5 messages) + Stripe checkout
- Streaming SSE temps réel sur tous les chats
- Rating réponses IA
- Dashboard PDG
- PWA installable
- Projets chantier + CR PDF
- Mode Chantier (gros boutons)
- Rappels chantier programmables

### Commandes utiles
```bash
npm run dev          # Dev server (port 5173)
npm run build        # Build production
npx vite preview     # Preview build (port 4173)
npx playwright test  # Tests E2E (35+ tests)
npx gh-pages -d dist # Déployer frontend
npx vercel --prod    # Déployer API
```

### Design tokens
- Background : `#06080D`
- Gold accent : `#C9A84C`
- Gradient gold : `linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)`
- Text : `#F0EDE6`
- Green : `#52C37A`
- Orange : `#E8873A`
- Red : `#E05252`
- Blue : `#5290E0`
- Font titre : Syne (700-800)
- Font body : DM Sans (300-500)
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
