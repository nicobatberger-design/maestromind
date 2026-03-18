# AUTO BUILD — Guide d'utilisation
> Système d'amélioration automatique MAESTROMIND · PDG uniquement

---

## Principe

```
PDG analyse → PDG valide → Claude Code exécute
```

1. Le PDG lance `npm run dev:auto` chaque matin
2. Le script analyse l'app, détecte ce qui manque, génère `PDG_DASHBOARD.md`
3. Le PDG choisit les améliorations à valider
4. `npm run build-feature` applique les patches automatiquement

---

## Commandes disponibles

| Commande | Description |
|---|---|
| `npm run dev:auto` | Analyse quotidienne + rapport PDG_DASHBOARD.md + proposition d'améliorations |
| `npm run build-feature` | Menu interactif complet — sélectionner et appliquer feature par feature |
| `npm run dev` | Lancer l'app en développement (localhost:5173) |
| `npm run build` | Build production optimisé |
| `npm run preview` | Prévisualiser le build production |

---

## Workflow PDG quotidien

### Étape 1 — Analyse matinale
```bash
npm run dev:auto
```
→ Génère `PDG_DASHBOARD.md` avec l'état complet
→ Identifie toutes les améliorations disponibles
→ Propose d'appliquer les patches automatiques

### Étape 2 — Validation PDG
Lire `PDG_DASHBOARD.md` et décider quelles features valider.

### Étape 3 — Exécution
```bash
npm run build-feature
```
→ Menu interactif avec toutes les features
→ Sélectionner par numéro ou taper `a` pour tout appliquer
→ Le script patche `App.jsx` automatiquement

### Étape 4 — Vérification
```bash
npm run dev
```
→ Vérifier visuellement les changements sur localhost:5173

---

## Patches automatiques disponibles

| Feature | Description | Impact |
|---|---|---|
| `S1-01` | Hachage PIN PDG (SHA-256) | 🔴 Critique sécurité |
| `S1-02` | Variables d'environnement (.env) | 🔴 Critique sécurité |
| `S1-06` | Bandeau RGPD/CNIL | 🔴 Légal obligatoire |
| `S2-02` | Paywall doux (modal Premium) | 💰 Monétisation |
| `S2-03` | Tracking UTM liens boutique | 💰 Affiliation |
| `S3-01` | Onboarding 3 écrans | 💰 Rétention |
| `S3-07` | Rating réponses IA (👍/👎) | 📈 Qualité |
| `S4-06` | Retry automatique réseau | 📈 Fiabilité |

---

## Features manuelles (développement requis)

Ces features nécessitent du code serveur ou des intégrations externes.
Le script affiche les instructions détaillées pour chacune.

| Feature | Technologie | Effort |
|---|---|---|
| `S1-03` | Backend API Node.js/Express + Vercel | 🏗️ 3-5 jours |
| `S1-04` | Supabase Auth (email + Google OAuth) | 🏗️ 3-4 jours |
| `S2-01` | Stripe Checkout + Webhooks | 🏗️ 2-3 jours |
| `S2-04` | API Boutique partenaires | 🏗️ 5-7 jours |
| `S3-03` | Historique conversations Supabase | 🔧 2-3 jours |
| `S5-01` | Géolocalisation artisans RGE | 🏗️ 5+ jours |

---

## Structure des fichiers système

```
maestromind/
├── scripts/
│   ├── build-feature.js    ← Menu interactif features
│   └── dev-auto.js         ← Analyse quotidienne PDG
├── features-manifest.json   ← État de toutes les features
├── ROADMAP.md               ← Roadmap complète par sprint
├── AUTO_BUILD.md            ← Ce fichier
└── PDG_DASHBOARD.md         ← Rapport généré automatiquement
```

---

## Ajouter une nouvelle feature au système

Éditez `features-manifest.json` et ajoutez une entrée :

```json
{
  "id": "S3-08",
  "sprint": 3,
  "priority": "P1",
  "title": "Nom de la feature",
  "description": "Description détaillée",
  "complexity": "facile|moyen|complexe",
  "impact": "critique|fort|moyen|faible",
  "status": "pending",
  "autoPatch": false,
  "files": ["src/App.jsx"]
}
```

Si `autoPatch: true`, ajoutez la fonction correspondante dans `scripts/build-feature.js` dans l'objet `patches["S3-08"] = function() {...}`.

---

*MAESTROMIND — Système auto-build v0.9.0*
