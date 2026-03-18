# MAESTROMIND — ROADMAP PRODUIT

> Plateforme IA Expertise Bâtiment · 32 Intelligences Spécialisées
> Version actuelle : **0.9.0** · Dernière mise à jour : Mars 2026

---

## État actuel (v0.9.0)

| Fonctionnalité | Statut |
|---|---|
| 32 IA avec system prompts distincts | ✅ Livré |
| Chat conversationnel Anthropic (claude-sonnet-4) | ✅ Livré |
| Scanner IA photo (caméra + vision API) | ✅ Livré |
| Certificats DTU PDF téléchargeables (jsPDF) | ✅ Livré |
| Simulateur DPE + calcul aides | ✅ Livré |
| Boutique produits 3 partenaires (UI mockée) | ✅ Livré |
| Interface PDG sécurisée PIN 6 chiffres | ✅ Livré |
| Design glassmorphism dark mode gold | ✅ Livré |
| Animations (page transitions, orbes, pulse) | ✅ Livré |
| Navigation bottom bar 5 pages | ✅ Livré |

---

## Légende

| Indicateur | Signification |
|---|---|
| 🔴 P0 | Bloquant — requis avant lancement public |
| 🟠 P1 | Haute priorité — requis dans les 60 jours |
| 🟡 P2 | Moyen terme — requis dans les 120 jours |
| 🟢 P3 | Amélioration continue — roadmap long terme |
| ⚡ Facile | < 4h de développement |
| 🔧 Moyen | 1–3 jours de développement |
| 🏗️ Complexe | > 3 jours, dépendances externes |
| 💰 Fort | ROI direct (revenus, rétention, acquisition) |
| 📈 Moyen | Impact indirect sur la croissance |
| 🎨 Faible | UX / polish, sans impact revenus direct |

---

## Sprint 1 — Fondations Sécurité & Auth
**Durée estimée : 2 semaines · Objectif : Version production-ready**

| # | Fonctionnalité | Description | Complexité | Impact |
|---|---|---|---|---|
| S1-01 | **Hachage PIN PDG** | Remplacer `PDG_PIN = "123456"` en dur par un hash SHA-256 stocké en variable d'environnement Vite (`VITE_PDG_PIN_HASH`). Jamais de secret en clair dans le code source. | ⚡ Facile | 🔴 Critique |
| S1-02 | **Variables d'environnement** | Migrer la clé API Anthropic vers `.env` (`VITE_ANTHROPIC_KEY`). Supprimer la saisie manuelle pour les environnements de démo. Ajouter `.env.example`. | ⚡ Facile | 🔴 Critique |
| S1-03 | **Backend API Node.js** | Créer un serveur Express minimal qui proxifie les appels Anthropic (évite d'exposer la clé API côté browser). Routes : `POST /api/chat`, `POST /api/scan`. Deploy Vercel/Railway. | 🏗️ Complexe | 🔴 Critique |
| S1-04 | **Authentification utilisateurs** | Intégrer Supabase Auth (email/password + OAuth Google). Remplacer la clé API saisie par l'utilisateur par des crédits gérés côté serveur. | 🏗️ Complexe | 🔴 Critique |
| S1-05 | **Rate limiting & quota IA** | Limiter les appels API par utilisateur (ex : 20 messages/jour en gratuit, illimité en Premium). Stockage quota dans Supabase. | 🔧 Moyen | 🔴 Critique |
| S1-06 | **RGPD — Politique de confidentialité** | Page dédiée CGU/Mentions légales/Politique cookies. Bandeau consentement au premier lancement. Conformité CNIL. | ⚡ Facile | 🔴 Critique |

---

## Sprint 2 — Monétisation
**Durée estimée : 2 semaines · Objectif : Première source de revenus**

| # | Fonctionnalité | Description | Complexité | Impact |
|---|---|---|---|---|
| S2-01 | **Abonnement Stripe Premium** | Intégrer Stripe Checkout pour abonnement mensuel (9,99€/mois). Plan Gratuit : 5 messages/jour, 3 IA. Plan Premium : illimité, 32 IA, scanner. Webhook Supabase pour activer/désactiver. | 🏗️ Complexe | 💰 Fort |
| S2-02 | **Paywall doux (Soft Paywall)** | Afficher un banner "Passez Premium" après 3 messages en mode gratuit. Modal avec avantages listés. Call-to-action Stripe. | ⚡ Facile | 💰 Fort |
| S2-03 | **Liens d'affiliation réels** | Remplacer les liens boutique génériques par des URLs d'affiliation Leroy Merlin (programme Affilae), Castorama, Brico Dépôt avec tracking UTM. | ⚡ Facile | 💰 Fort |
| S2-04 | **API Boutique réelle** | Appel API Leroy Merlin / Google Shopping pour obtenir prix et disponibilité en temps réel (remplace les 9 produits mockés). | 🏗️ Complexe | 💰 Fort |
| S2-05 | **Leads artisans RGE** | Formulaire "Trouver un artisan" → envoie lead qualifié à un réseau d'artisans partenaires RGE (monétisation CPL 5–15€/lead). | 🔧 Moyen | 💰 Fort |
| S2-06 | **Dashboard revenus PDG** | Page analytics PDG (derrière PIN) : revenus Stripe du jour/mois, nb abonnés, nb leads, MRR, ARR, churn. Données Stripe + Supabase. | 🔧 Moyen | 💰 Fort |

---

## Sprint 3 — Engagement & Rétention
**Durée estimée : 2 semaines · Objectif : DAU/MAU > 40%**

| # | Fonctionnalité | Description | Complexité | Impact |
|---|---|---|---|---|
| S3-01 | **Onboarding 3 écrans** | Splash animé au premier lancement : (1) Bienvenue + logo, (2) Choisir son profil (Particulier / Pro / Artisan), (3) Activer les notifications. Skip possible. | ⚡ Facile | 💰 Fort |
| S3-02 | **Profil utilisateur** | Page profil : nom, type de logement (appartement/maison), région, niveau bricolage (débutant/intermédiaire/expert). Ces données personnalisent les system prompts IA. | 🔧 Moyen | 💰 Fort |
| S3-03 | **Historique conversations persistant** | Sauvegarder toutes les conversations en base Supabase par utilisateur. Page "Historique" avec recherche fulltext. Reprendre une conversation existante. | 🔧 Moyen | 💰 Fort |
| S3-04 | **Projets chantier sauvegardés** | Créer un "Projet" avec nom, type (rénovation/construction), adresse, photos, conversations liées, certificats générés. Liste de projets par utilisateur. | 🔧 Moyen | 💰 Fort |
| S3-05 | **Notifications push (PWA)** | Service Worker + Web Push API. Notifications : rappel séchage 24h, alerte artisan disponible, rappel norme expirée. Abonnement opt-in. | 🔧 Moyen | 📈 Moyen |
| S3-06 | **Mode PWA hors-ligne** | Service Worker avec cache des 32 IA (system prompts + UI). Fonctionnement partiel sans internet : consultation normes DTU sauvegardées, lecture historique. | 🔧 Moyen | 📈 Moyen |
| S3-07 | **Rating réponses IA** | Boutons 👍 / 👎 sous chaque réponse IA. Stockage des feedbacks en base. Utilisé pour améliorer les system prompts. Tableau de bord PDG des notes par IA. | ⚡ Facile | 📈 Moyen |

---

## Sprint 4 — Fonctionnalités Métier
**Durée estimée : 2 semaines · Objectif : Valeur ajoutée différenciante**

| # | Fonctionnalité | Description | Complexité | Impact |
|---|---|---|---|---|
| S4-01 | **Calculateur matériaux automatique** | L'IA génère une liste de matériaux avec quantités calculées depuis la surface saisie (ex : BA13 → nb plaques, rails, vis, bande à joint). Export en liste de courses PDF. | 🔧 Moyen | 💰 Fort |
| S4-02 | **Galerie photos chantier** | Espace de stockage photos par projet (Supabase Storage). Upload multi-photos, tag par étape (avant/pendant/après). Visualisation timeline chantier. | 🔧 Moyen | 📈 Moyen |
| S4-03 | **Partage de certificats** | Chaque certificat PDF reçoit une URL unique (ex : `maestromind.fr/cert/BRICOL-2026-XYZ`). Accessible publiquement en lecture. Vérification d'authenticité via QR code. | 🔧 Moyen | 💰 Fort |
| S4-04 | **Simulateur DPE réel** | Remplacer les formules simplifiées par un calcul RE2020 conforme : DPE par bâtiment, DPE par appartement, intégration du moteur de calcul officiel (API ADEME si disponible). | 🏗️ Complexe | 💰 Fort |
| S4-05 | **Rapport de chantier PDF complet** | Générer un rapport PDF multi-pages : récapitulatif projet, toutes les conversations IA, photos chantier, liste matériaux, certificat DTU, estimatif coûts. | 🔧 Moyen | 💰 Fort |
| S4-06 | **Recherche dans les conversations** | Barre de recherche fulltext dans l'historique de toutes les conversations. Filtre par IA, date, projet. | 🔧 Moyen | 📈 Moyen |
| S4-07 | **Mode Expert DTU** | Page dédiée base de données DTU complète (100+ normes). Recherche, filtres par corps d'état, affichage fiche détaillée. Offline-first. | 🔧 Moyen | 📈 Moyen |

---

## Sprint 5 — Expansion Géographique & Artisans
**Durée estimée : 3 semaines · Objectif : Marketplace B2B**

| # | Fonctionnalité | Description | Complexité | Impact |
|---|---|---|---|---|
| S5-01 | **Géolocalisation artisans RGE** | Carte interactive (Mapbox/Google Maps) des artisans RGE certifiés dans un rayon de 30km. Filtre par spécialité (isolation, plomberie, électricité…). Données Qualibat/ADEME. | 🏗️ Complexe | 💰 Fort |
| S5-02 | **Espace Artisan Pro** | Compte artisan séparé : profil, certifications, devis générés par IA, réception de leads qualifiés MAESTROMIND. Abonnement Pro 29,99€/mois. | 🏗️ Complexe | 💰 Fort |
| S5-03 | **Comparateur de devis IA** | L'utilisateur décrit ses travaux → l'IA génère 3 scénarios de devis (éco/standard/premium) avec détail lignes. Export PDF. | 🔧 Moyen | 💰 Fort |
| S5-04 | **Scan QR code produits** | Scan QR/code-barres d'un produit de bricolage → identification automatique + conseils IA d'utilisation + alternatives + prix comparés. | 🔧 Moyen | 📈 Moyen |
| S5-05 | **Intégration Anah / France Rénov'** | Connexion API France Rénov' pour calculer les aides réelles personnalisées (selon revenus, type travaux, zone géographique). Remplace le simulateur DPE simplifié. | 🏗️ Complexe | 💰 Fort |
| S5-06 | **Multi-langue** | Traduction complète EN/ES/DE. Adaptation normes (Building Regulations UK, DIN allemand, CTE espagnol). Interface paramétrable. | 🏗️ Complexe | 💰 Fort |

---

## Sprint 6 — Intelligence & Automatisation
**Durée estimée : 3 semaines · Objectif : Différenciation IA avancée**

| # | Fonctionnalité | Description | Complexité | Impact |
|---|---|---|---|---|
| S6-01 | **IA Vocale** | Reconnaissance vocale (Web Speech API) pour dicter des questions à l'IA. Synthèse vocale pour les réponses (TTS). Mode mains-libres pour le chantier. | 🏗️ Complexe | 📈 Moyen |
| S6-02 | **Fine-tuning system prompts** | Interface PDG pour modifier les system prompts des 32 IA en temps réel depuis l'interface. Sauvegarde en base, versioning, rollback. | 🔧 Moyen | 💰 Fort |
| S6-03 | **Analyse tendances chantiers** | Dashboard PDG : quelles questions sont les plus posées, quelles IA sont les plus utilisées, quels projets reviennent le plus. Clustering NLP des conversations. | 🏗️ Complexe | 💰 Fort |
| S6-04 | **Modèle de recommandation** | Suggestions personnalisées "Vous pourriez aussi avoir besoin de…" basées sur l'historique utilisateur et les patterns d'autres chantiers similaires. | 🏗️ Complexe | 💰 Fort |
| S6-05 | **API MAESTROMIND publique** | Exposer une API REST documentée (OpenAPI 3.0) permettant à des artisans, apps tierces, SaaS bâtiment d'intégrer les 32 IA. Monétisation B2B API keys. | 🏗️ Complexe | 💰 Fort |
| S6-06 | **Réalité augmentée mesures** | Via la caméra, mesure des surfaces par IA (vision + ARCore/ARKit). Calcul automatique surface d'une pièce pour le calculateur matériaux. | 🏗️ Complexe | 📈 Moyen |

---

## Sprint 7+ — Scale & Internationalisation
**Roadmap long terme · Objectif : Leader européen IA bâtiment**

| # | Fonctionnalité | Description | Complexité | Impact |
|---|---|---|---|---|
| S7-01 | **Application mobile native** | React Native ou Flutter. Publication App Store + Google Play. Notifications push natives, accès caméra optimisé, widget écran accueil. | 🏗️ Complexe | 💰 Fort |
| S7-02 | **Marketplace artisans complète** | Place de marché : particuliers publient leur projet, artisans répondent avec devis IA-assisté. Commission MAESTROMIND sur chaque transaction. | 🏗️ Complexe | 💰 Fort |
| S7-03 | **BIM / Plans 2D** | Import plans DWG/PDF → IA extrait les surfaces, génère automatiquement la liste de matériaux, identifie les risques DTU. | 🏗️ Complexe | 💰 Fort |
| S7-04 | **White label B2B** | Version MAESTROMIND en marque blanche pour Leroy Merlin, Castorama, assureurs habitat, banques (crédit travaux). Abonnement B2B 500–5000€/mois. | 🏗️ Complexe | 💰 Fort |
| S7-05 | **Formation professionnelle** | Modules de formation DTU certifiants pour artisans. QCM générés par IA. Attestation de formation PDF. Partenariat OPCO. | 🔧 Moyen | 💰 Fort |
| S7-06 | **IA Prédictive entretien** | Analyse du profil logement + historique → prédiction des travaux d'entretien futurs avec estimatif budget sur 5 ans. | 🏗️ Complexe | 💰 Fort |

---

## Métriques de succès par sprint

| Sprint | KPI Principal | Objectif |
|---|---|---|
| S1 | Sécurité / 0 secret exposé | 100% vars en `.env` |
| S2 | MRR (Monthly Recurring Revenue) | 1 000€/mois |
| S3 | Rétention J7 | > 40% |
| S4 | Score satisfaction IA (feedbacks) | > 4.2/5 |
| S5 | Leads artisans générés/mois | > 200 |
| S6 | B2B API clients | > 5 |
| S7 | ARR (Annual Recurring Revenue) | > 500 000€ |

---

## Architecture cible (fin Sprint 3)

```
maestromind/
├── src/
│   ├── App.jsx                  ← Refactorisé < 300 lignes
│   ├── components/
│   │   ├── PinScreen.jsx
│   │   ├── ChatPage.jsx
│   │   ├── ScannerPage.jsx
│   │   ├── ShopPage.jsx
│   │   ├── CertPage.jsx
│   │   └── DpePage.jsx
│   ├── hooks/
│   │   ├── useChat.js
│   │   ├── useAuth.js
│   │   └── useSubscription.js
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── stripe.js
│   │   └── pdf.js
│   └── constants/
│       ├── ias.js
│       └── styles.js
├── api/                         ← Backend Express (Vercel functions)
│   ├── chat.js
│   ├── scan.js
│   └── webhook-stripe.js
├── scripts/
│   └── build-feature.js        ← Ce script
├── ROADMAP.md
└── features-manifest.json
```

---

## Dette technique à traiter

| # | Problème | Priorité | Effort |
|---|---|---|---|
| DT-01 | `App.jsx` monolithique (900+ lignes) → découper en composants | 🟠 P1 | 🔧 Moyen |
| DT-02 | Clé API Anthropic exposée côté browser → proxy backend | 🔴 P0 | 🏗️ Complexe |
| DT-03 | PIN PDG en clair dans le code source | 🔴 P0 | ⚡ Facile |
| DT-04 | Données boutique mockées (9 produits hardcodés) | 🟠 P1 | 🏗️ Complexe |
| DT-05 | Calcul DPE simplifié (formule linéaire) → moteur RE2020 | 🟡 P2 | 🏗️ Complexe |
| DT-06 | Historique conversations non persistant (perdu au refresh) | 🟠 P1 | 🔧 Moyen |
| DT-07 | Aucune gestion d'erreur réseau (retry, timeout) | 🟠 P1 | ⚡ Facile |
| DT-08 | Styles inline (objet `s`) → CSS Modules ou Tailwind | 🟢 P3 | 🏗️ Complexe |

---

*Généré automatiquement par `npm run build-feature` — MAESTROMIND v0.9.0*
