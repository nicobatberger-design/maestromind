import { useState, useCallback } from "react";
import { apiURL, apiHeaders, withRetry } from "../utils/api";

function parseAIJson(text) {
  const clean = (text || "").replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error("R\u00e9ponse IA invalide. R\u00e9essayez.");
}

export function useToolsState({ apiKey, profilIA }) {
  // ── Outils ────────────────────────────────────────────────────
  const [toolTab, setToolTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "devis";
  });
  const [devisText, setDevisText] = useState("");
  const [devisResult, setDevisResult] = useState(null);
  const [devisLoading, setDevisLoading] = useState(false);
  const [calcType, setCalcType] = useState("Peinture");
  const [calcSurface, setCalcSurface] = useState("20");
  const [calcHauteur, setCalcHauteur] = useState("2.50");
  const [calcPente, setCalcPente] = useState("");
  const [calcLongueur, setCalcLongueur] = useState("");
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [artisanNom, setArtisanNom] = useState("");
  const [artisanSpec, setArtisanSpec] = useState("Ma\u00e7onnerie");
  const [artisanResult, setArtisanResult] = useState(null);
  const [artisanLoading, setArtisanLoading] = useState(false);
  const [primesRev, setPrimesRev] = useState("Modeste");
  const [primesTrav, setPrimesTrav] = useState("Isolation combles");
  const [primesSurf, setPrimesSurf] = useState("80");
  const [primesResult, setPrimesResult] = useState(null);
  const [primesLoading, setPrimesLoading] = useState(false);
  const [counterDevis, setCounterDevis] = useState(null);
  const [counterLoading, setCounterLoading] = useState(false);
  const [planningType, setPlanningType] = useState("R\u00e9novation salle de bain");
  const [planningBudget, setPlanningBudget] = useState("5000");
  const [planningResult, setPlanningResult] = useState(null);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [devisProDesc, setDevisProDesc] = useState("");
  const [devisProClient, setDevisProClient] = useState("");
  const [devisProSurface, setDevisProSurface] = useState("20");
  const [devisProResult, setDevisProResult] = useState(null);
  const [devisProLoading, setDevisProLoading] = useState(false);
  const [rentaSurface, setRentaSurface] = useState("50");
  const [rentaTaux, setRentaTaux] = useState("45");
  const [rentaMat, setRentaMat] = useState("3000");
  const [rentaDep, setRentaDep] = useState("150");
  const [rentaResult, setRentaResult] = useState(null);
  const [rentaType, setRentaType] = useState("Peinture");
  const [rentaStatut, setRentaStatut] = useState("Micro-entreprise");

  // ── Analyser Devis ────────────────────────────────────────────
  const analyserDevis = useCallback(async () => {
    if (!devisText.trim()) return;
    setDevisLoading(true); setDevisResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `${profilIA()}\nTu es un expert en tarifs de travaux en France 2026, certifi\u00e9 m\u00e9treur-v\u00e9rificateur. PRIX DE R\u00c9F\u00c9RENCE MO 2026 TTC : Ma\u00e7on 42-68\u20ac/h \u00b7 Plombier 68-100\u20ac/h \u00b7 \u00c9lectricien 62-90\u20ac/h \u00b7 Plaquiste/peintre 38-58\u20ac/h \u00b7 Couvreur 48-75\u20ac/h \u00b7 Menuisier 48-68\u20ac/h. MAJORATION R\u00c9GIONALE : IDF +20% \u00b7 PACA/Rh\u00f4ne-Alpes +10% \u00b7 Province base. V\u00e9rifie : coh\u00e9rence quantitatifs vs surface, prix unitaires vs march\u00e9, TVA applicable (5.5% r\u00e9no \u00e9nerg\u00e9tique, 10% r\u00e9no standard, 20% neuf), mentions l\u00e9gales obligatoires (assurance d\u00e9cennale, date validit\u00e9, d\u00e9lai ex\u00e9cution). Analyse ce devis et r\u00e9ponds UNIQUEMENT en JSON valide : {"verdict":"CORRECT","resume":"1 phrase synth\u00e8se","points":["point 1","point 2","point 3"],"anomalies":["anomalie d\u00e9tect\u00e9e ou vide"],"conseil":"conseil pratique","tva_correcte":"oui/non + explication"}. Verdict possible : CORRECT, \u00c9LEV\u00c9, SUSPECT, INCOMPLET.`,
          messages: [{ role: "user", content: "Analyse ce devis :\n\n" + devisText }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setDevisResult(parseAIJson(data?.content?.[0]?.text));
    } catch (e) { setDevisResult({ verdict: "ERREUR", resume: e.message, points: [], conseil: "" }); }
    finally { setDevisLoading(false); }
  }, [devisText, apiKey, profilIA]);

  // ── Contre-Devis ──────────────────────────────────────────────
  const genererContreDevis = useCallback(async () => {
    if (!devisResult || !devisText.trim()) return;
    setCounterLoading(true); setCounterDevis(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1400,
          system: `Tu es un expert en n\u00e9gociation de travaux en France 2026, m\u00e9treur-v\u00e9rificateur certifi\u00e9. ${profilIA()} PRIX R\u00c9F\u00c9RENCE MO 2026 TTC : Ma\u00e7on 42-68\u20ac/h \u00b7 Plombier 68-100\u20ac/h \u00b7 \u00c9lectricien 62-90\u20ac/h \u00b7 Plaquiste/peintre 38-58\u20ac/h \u00b7 Couvreur 48-75\u20ac/h. MAJORATION IDF +20%, Sud-Est +10%. Mat\u00e9riaux : BA13 7-9\u20ac/plaque \u00b7 Carrelage gr\u00e8s 10-35\u20ac/m\u00b2 \u00b7 Peinture acrylique 4-8\u20ac/m\u00b2 \u00b7 Mortier-colle C2 14-20\u20ac/sac 25kg. G\u00e9n\u00e8re un contre-devis argument\u00e9 en citant les prix de r\u00e9f\u00e9rence march\u00e9. R\u00e9ponds UNIQUEMENT en JSON valide : {"lignes":[{"poste":"nom","prix_demande":"X\u20ac","prix_marche":"X\u20ac (r\u00e9f\u00e9rence march\u00e9 2026)","prix_negocie":"X\u20ac","argument":"court argument avec r\u00e9f\u00e9rence prix"}],"economie_totale":"X\u20ac","pourcentage_economie":"X%","message_negociation":"message poli \u00e0 envoyer \u00e0 l artisan en 2-3 phrases","conseil":"conseil final"}`,
          messages: [{ role: "user", content: "Devis original :\n" + devisText + "\n\nAnalyse :\n" + JSON.stringify(devisResult) + "\n\nG\u00e9n\u00e8re le contre-devis." }] })}));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setCounterDevis(parseAIJson(data?.content?.[0]?.text));
    } catch (e) { setCounterDevis({ lignes: [], economie_totale: "0\u20ac", message_negociation: e.message, conseil: "" }); }
    finally { setCounterLoading(false); }
  }, [devisResult, devisText, apiKey, profilIA]);

  // ── Calculer Mat\u00e9riaux ──────────────────────────────────────────
  const calculerMateriaux = useCallback(async () => {
    setCalcLoading(true); setCalcResult(null);
    const hauteur = parseFloat(calcHauteur) || 2.5;
    const pente = parseFloat(calcPente) || 0;
    const longueur = parseFloat(calcLongueur) || 0;
    let dims = `Surface : ${calcSurface}m\u00b2. Hauteur sous plafond : ${hauteur}m.`;
    if (pente > 0) dims += ` ATTENTION : toit/plafond en pente \u00e0 ${pente}\u00b0 \u2014 la hauteur varie. Calcule la surface r\u00e9elle en tenant compte de la pente (surface rampant = surface au sol / cos(pente)). Adapte les longueurs de plaques/rails en cons\u00e9quence.`;
    if (longueur > 0) dims += ` Longueur lin\u00e9aire de la cloison/mur : ${longueur}m.`;
    const typesAvecHauteur = ["Placo BA13", "Peinture", "Carrelage", "Enduit", "Isolation murs"];
    if (typesAvecHauteur.includes(calcType)) dims += ` La hauteur impacte le choix des plaques (standard 2.50m, haute 2.60m, 2.70m, 3m). Si hauteur > 2.50m, pr\u00e9cise qu'il faut des plaques plus grandes et adapte les quantit\u00e9s de rails/montants.`;
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200,
          system: `${profilIA()}\nTu es un expert en quantitatifs mat\u00e9riaux b\u00e2timent France 2026. Tu connais parfaitement les dimensions standard des mat\u00e9riaux (plaques BA13 : 1200x2500, 1200x2600, 1200x2700, 1200x3000 ; rails R48/R70 en 3m ; montants M48/M70 en 2.50/2.60/2.70/3m ; etc.). IMPORTANT : adapte tes recommandations \u00e0 la HAUTEUR et \u00e0 la PENTE indiqu\u00e9es. PRIX R\u00c9F\u00c9RENCE 2026 (sources prix-travaux-m2.com/allotravaux.com) : BA13 standard fourniture 2,50-9\u20ac/plaque \u00b7 BA13 fourni-pos\u00e9 27-41\u20ac/m\u00b2 \u00b7 Carrelage gr\u00e8s c\u00e9rame pos\u00e9 55-120\u20ac/m\u00b2 \u00b7 Carrelage standard pos\u00e9 60-75\u20ac/m\u00b2 \u00b7 Isolation fourniture seule 5-60\u20ac/m\u00b2 \u00b7 Isolation fourni-pos\u00e9 25-120\u20ac/m\u00b2. R\u00e9ponds UNIQUEMENT en JSON valide : {"materiaux":[{"nom":"Produit pr\u00e9cis avec dimensions","quantite":"X unit\u00e9s (d\u00e9tail calcul)","prixEstime":"X\u20ac","conseil":"marque/ref recommand\u00e9e"}],"total":"X\u20ac","conseil":"conseil pratique incluant mise en oeuvre"}`,
          messages: [{ role: "user", content: `Calcule les mat\u00e9riaux pour ${calcType}. ${dims} Inclus pertes standards (10-15%). Prix march\u00e9 France 2026 actualis\u00e9s. Produits disponibles Leroy Merlin/Castorama/Brico D\u00e9p\u00f4t. D\u00e9taille chaque produit avec ses dimensions exactes et la marque recommand\u00e9e.` }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setCalcResult(parseAIJson(data?.content?.[0]?.text));
    } catch (e) { setCalcResult({ materiaux: [], total: "0\u20ac", conseil: e.message }); }
    finally { setCalcLoading(false); }
  }, [apiKey, profilIA, calcType, calcSurface, calcHauteur, calcPente, calcLongueur]);

  // ── Calculer Primes ───────────────────────────────────────────
  const calculerPrimes = useCallback(async () => {
    setPrimesLoading(true); setPrimesResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `${profilIA()}\nTu es un expert certifi\u00e9 en aides r\u00e9novation France 2026 (MaPrimeR\u00e9nov', CEE, \u00e9co-PTZ, TVA 5.5%, Anah). NOUVEAUT\u00c9S 2026 (sources hellio.com/effy.fr/quelleenergie.fr) : RDV France R\u00e9nov' OBLIGATOIRE avant d\u00e9p\u00f4t MaPrimeR\u00e9nov'. Parcours accompagn\u00e9 recentr\u00e9 sur E/F/G uniquement (C/D exclus). ITE+ITI+chaudi\u00e8res biomasse SUPPRIM\u00c9S en monog\u00e8ste. Profil Rose (revenus sup\u00e9rieurs) EXCLU du parcours par geste. Plafond 20 000\u20ac sur 5 ans. BAR\u00c8MES PAR GESTE (Bleu/Jaune/Violet \u2014 Rose exclu) : PAC air/eau 5 000/4 000/3 000\u20ac \u00b7 PAC g\u00e9o 11 000/9 000/6 000\u20ac \u00b7 Fen\u00eatres 100/80/40\u20ac/\u00e9quip. \u00b7 Isolation combles 25/20/15\u20ac/m\u00b2 \u00b7 Toiture terrasse 75/60/40\u20ac/m\u00b2 \u00b7 Po\u00eale \u00e0 bois 1 250/800/400\u20ac \u00b7 VMC DF 2 500/2 000/1 500\u20ac. CEE revaloris\u00e9es : PAC air/eau +1 000\u20ac, PAC g\u00e9o +2 000\u20ac, isol. combles ~10-15\u20ac/m\u00b2, murs ~15-25\u20ac/m\u00b2. PLAFONDS REVENUS 2026 (1 pers IDF/Province) : Tr\u00e8s modeste \u226423 541\u20ac/\u226417 009\u20ac \u00b7 Modeste \u226428 657\u20ac/\u226421 805\u20ac \u00b7 Interm\u00e9diaire \u226440 018\u20ac/\u226430 549\u20ac. Artisan RGE OBLIGATOIRE. \u00c9co-PTZ : 1 geste=15k\u20ac, 2-3 gestes=30k\u20ac, 4+=50k\u20ac \u00e0 0%, max 20 ans. TVA 5.5% r\u00e9no \u00e9nerg\u00e9tique, 10% r\u00e9no standard, logement >2 ans. Cumul optimal : MPR+CEE+\u00e9co-PTZ+TVA 5.5%+aides locales = jusqu'\u00e0 90% tr\u00e8s modestes. R\u00e9ponds UNIQUEMENT en JSON valide : {"aides":[{"nom":"Aide","montant":"X\u20ac","condition":"condition courte","demarche":"comment faire en 1 phrase"}],"total":"X\u20ac","reste_a_charge":"X\u20ac","conseil":"conseil pratique","attention":"point important","rdv_france_renov":"obligatoire avant d\u00e9p\u00f4t \u2014 0 808 800 700"}`,
          messages: [{ role: "user", content: `Foyer ${primesRev}, travaux : ${primesTrav}, surface : ${primesSurf}m\u00b2. Quelles aides suis-je \u00e9ligible en 2026 ? Calcule les montants exacts selon les bar\u00e8mes 2026.` }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setPrimesResult(parseAIJson(data?.content?.[0]?.text));
    } catch (e) { setPrimesResult({ aides: [], total: "0\u20ac", conseil: e.message, attention: "" }); }
    finally { setPrimesLoading(false); }
  }, [apiKey, profilIA, primesRev, primesTrav, primesSurf]);

  // ── V\u00e9rifier Artisan ──────────────────────────────────────────
  const verifierArtisan = useCallback(async () => {
    if (!artisanNom.trim()) return;
    setArtisanLoading(true); setArtisanResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 900,
          system: `${profilIA()}\nTu es un expert en v\u00e9rification d'artisans RGE France 2026. SITES OFFICIELS DE V\u00c9RIFICATION : 1-Kbis/SIRET \u2192 infogreffe.fr ou societe.com 2-Assurance d\u00e9cennale \u2192 agira.fr (v\u00e9rification par n\u00b0 SIRET) 3-Certification RGE \u2192 france-renov.gouv.fr/annuaire-rge ou rge-artisan.fr 4-Qualibat \u2192 qualibat.com/certification 5-Qualifelec \u2192 qualifelec.com 6-QualiPAC \u2192 qualit-enr.org 7-Qualigaz \u2192 qualigaz.com (installations gaz). CHECKLIST 8 POINTS : Kbis r\u00e9cent, d\u00e9cennale valide, RGE en cours, RC pro, devis conforme, r\u00e9f\u00e9rences v\u00e9rifiables, pas d'acompte >30%, adresse fixe. SIGNAUX D'ALARME : paiement cash only, pas de devis avant travaux, pression urgence, prix anormalement bas, sous-traitance non d\u00e9clar\u00e9e, acompte >50%. G\u00e9n\u00e8re une checklist compl\u00e8te. R\u00e9ponds UNIQUEMENT en JSON valide : {"checks":[{"label":"V\u00e9rification","comment":"comment v\u00e9rifier","url":"site officiel","obligatoire":true}],"alertes":["alerte 1"],"signaux_alarme":["signal 1"],"conseils":"conseil global"}`,
          messages: [{ role: "user", content: `Je veux v\u00e9rifier l'artisan "${artisanNom}" sp\u00e9cialis\u00e9 en ${artisanSpec}. Checklist de v\u00e9rification RGE, assurance d\u00e9cennale, existence l\u00e9gale.` }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setArtisanResult(parseAIJson(data?.content?.[0]?.text));
    } catch (e) { setArtisanResult({ checks: [], alertes: [e.message], conseils: "" }); }
    finally { setArtisanLoading(false); }
  }, [apiKey, profilIA, artisanNom, artisanSpec]);

  // ── Planifier Chantier ────────────────────────────────────────
  const planifierChantier = useCallback(async () => {
    setPlanningLoading(true); setPlanningResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1400,
          system: `Tu es expert certifi\u00e9 en planification de chantier b\u00e2timent France 2026. ${profilIA()} DUR\u00c9ES R\u00c9ALISTES (1 artisan qualifi\u00e9) : d\u00e9pose/d\u00e9molition = 1j/pi\u00e8ce \u00b7 gros \u0153uvre/ragr\u00e9age = 2-3j (+ s\u00e9chage b\u00e9ton 28j) \u00b7 plomberie brute = 1-2j \u00b7 \u00e9lectricit\u00e9 brute = 1-2j \u00b7 isolation murs = 1j/50m\u00b2 \u00b7 cloisons placo = 1j/25m\u00b2 \u00b7 carrelage = 1j/8-12m\u00b2 \u00b7 peinture 2 couches = 1j/40m\u00b2 \u00b7 menuiseries = 0.5j/unit\u00e9 \u00b7 sanitaires = 0.5j/appareil. ORDRE IMP\u00c9RATIF DES LOTS (NE JAMAIS INVERSER) : 1-D\u00e9pose/d\u00e9molition 2-Gros \u0153uvre 3-Plomberie brute 4-\u00c9lectricit\u00e9 brute 5-Isolation 6-Cloisons/doublages 7-Enduits/ragr\u00e9ages (s\u00e9chage 7-28j) 8-Carrelage/parquet 9-Peintures 10-Menuiseries 11-Sanitaires/appareillage 12-Nettoyage/r\u00e9ception. ERREURS FATALES : carrelage sur b\u00e9ton frais (<28j) \u00b7 peinture sur enduit humide (<48h) \u00b7 parquet avant carrelage SDB \u00b7 branchement sous tension. R\u00e9ponds UNIQUEMENT en JSON valide : {"duree_totale":"X semaines","semaines":[{"numero":1,"titre":"Titre court","taches":["t\u00e2che 1","t\u00e2che 2"],"materiaux_a_commander":["mat\u00e9riau 1"],"attention":"point critique","nb_artisans":"X"}],"ordre_metiers":["1. Corps de m\u00e9tier"],"chemin_critique":"\u00e9tapes limitantes","conseils":"conseil global","budget_detail":"r\u00e9partition budget par poste"}`,
          messages: [{ role: "user", content: "Projet : " + planningType + ", budget " + planningBudget + "\u20ac. Planning complet semaine par semaine." }] })}));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setPlanningResult(parseAIJson(data?.content?.[0]?.text));
    } catch (e) { setPlanningResult({ duree_totale: "?", semaines: [], ordre_metiers: [], conseils: e.message, budget_detail: "" }); }
    finally { setPlanningLoading(false); }
  }, [apiKey, profilIA, planningType, planningBudget]);

  // ── G\u00e9n\u00e9rer Devis Pro ───────────────────────────────────────
  const genererDevisPro = useCallback(async () => {
    if (!devisProDesc.trim()) return;
    setDevisProLoading(true); setDevisProResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1600,
          system: `Tu es expert en r\u00e9daction de devis travaux France 2026, m\u00e9treur certifi\u00e9. ${profilIA()} PRIX MO 2026 TTC (sources obat.fr/habitatpresto.com, +3.2% CAPEB) : Ma\u00e7on 35-70\u20ac/h \u00b7 Carreleur 35-55\u20ac/h \u00b7 Plombier 40-65\u20ac/h \u00b7 \u00c9lectricien 40-65\u20ac/h \u00b7 Plaquiste 30-50\u20ac/h \u00b7 Peintre 30-40\u20ac/h \u00b7 Couvreur 45-70\u20ac/h \u00b7 Charpentier 40-60\u20ac/h \u00b7 Menuisier 40-60\u20ac/h \u00b7 Terrassier 60-80\u20ac/h. IDF +20-30%, PACA +10%. PRIX MAT\u00c9RIAUX 2026 : BA13 2,50-9\u20ac/plaque \u00b7 BA13 fourni-pos\u00e9 27-41\u20ac/m\u00b2 \u00b7 Rail R48 2.30\u20ac/ml \u00b7 Carrelage gr\u00e8s c\u00e9rame pos\u00e9 55-120\u20ac/m\u00b2 \u00b7 Carrelage standard pos\u00e9 60-75\u20ac/m\u00b2 \u00b7 Peinture acrylique 4-8\u20ac/m\u00b2 \u00b7 Isolation fourni-pos\u00e9 25-120\u20ac/m\u00b2. TVA : 5.5% r\u00e9novation \u00e9nerg\u00e9tique (art. 278-0 bis A CGI) \u00b7 10% r\u00e9novation standard (art. 279-0 bis CGI) \u00b7 20% construction neuve. Logement doit avoir >2 ans pour TVA r\u00e9duite. G\u00e9n\u00e8re un devis professionnel conforme aux obligations l\u00e9gales. R\u00e9ponds UNIQUEMENT en JSON valide : {"lignes":[{"description":"description pr\u00e9cise","unite":"m\u00b2 ou U ou ml ou forfait","quantite":"X","prix_unitaire":"X\u20ac","total":"X\u20ac","dtu":"DTU ou norme ou vide"}],"sous_total_ht":"X\u20ac","tva_taux":"10%","tva":"X\u20ac","total_ttc":"X\u20ac","validite":"30 jours","garanties":"d\u00e9cennale 10 ans + parfait ach\u00e8vement 1 an","mentions":"TVA applicable selon art. 279-0 bis du CGI \u2014 logement >2 ans","conditions_paiement":"30% commande, 40% avancement, 30% r\u00e9ception"}`,
          messages: [{ role: "user", content: "Travaux : " + devisProDesc + "\nSurface : " + devisProSurface + "m\u00b2\nClient : " + (devisProClient || "\u00c0 compl\u00e9ter") + "\nG\u00e9n\u00e8re le devis complet prix France 2026 avec prix MO et mat\u00e9riaux actualis\u00e9s." }] })}));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setDevisProResult(parseAIJson(data?.content?.[0]?.text));
    } catch (e) { setDevisProResult({ lignes: [], sous_total_ht: "0\u20ac", tva_taux: "10%", tva: "0\u20ac", total_ttc: "0\u20ac", validite: "30 jours", garanties: "", mentions: "" }); }
    finally { setDevisProLoading(false); }
  }, [apiKey, profilIA, devisProDesc, devisProSurface, devisProClient]);

  // ── Rentabilit\u00e9 ────────────────────────────────────────────────
  const calculerRentabilite = useCallback(() => {
    const surf = parseFloat(rentaSurface) || 0, taux = parseFloat(rentaTaux) || 0;
    const mat = parseFloat(rentaMat) || 0, dep = parseFloat(rentaDep) || 0;

    const TEMPS_PAR_TYPE = {
      "Peinture": 0.3, "Carrelage": 0.8, "Placo / Cloison BA13": 0.5,
      "Enduit / Ragr\u00e9age": 0.4, "Isolation murs (ITI)": 0.45, "Isolation combles": 0.25,
      "Parquet / Sol stratifi\u00e9": 0.35, "Plomberie": 0, "\u00c9lectricit\u00e9": 0,
      "Ma\u00e7onnerie": 0.6, "Couverture / Toiture": 0.7, "Menuiserie": 0,
      "Fa\u00e7ade / Ravalement": 0.5,
    };
    const FORFAITS = { "Plomberie": 8, "\u00c9lectricit\u00e9": 8, "Menuiserie": 4 };

    const tempsM2 = TEMPS_PAR_TYPE[rentaType] ?? 0.5;
    const heures = tempsM2 > 0 ? surf * tempsM2 : (FORFAITS[rentaType] || 8);
    const mo = heures * taux;

    const TAUX_CHARGES = {
      "Micro-entreprise": 0.22, "Auto-entrepreneur": 0.22, "EIRL": 0.35,
      "SARL / SAS": 0.45, "Entreprise individuelle": 0.40,
    };
    const tauxCharges = TAUX_CHARGES[rentaStatut] ?? 0.22;

    const ca_total = mo + mat + dep;
    const charges = mo * tauxCharges;
    const fraisGeneraux = ca_total * 0.10;
    const benef = ca_total - mat - dep - charges - fraisGeneraux;
    const marge = ca_total > 0 ? Math.round((benef / ca_total) * 100) : 0;

    setRentaResult({
      heures: Math.round(heures * 10) / 10,
      mo: Math.round(mo),
      ca_total: Math.round(ca_total),
      charges: Math.round(charges),
      frais_generaux: Math.round(fraisGeneraux),
      benef: Math.round(benef),
      marge,
      prix_m2: surf > 0 ? Math.round(ca_total / surf) : 0,
      type_travaux: rentaType,
      statut: rentaStatut,
      taux_charges_pct: Math.round(tauxCharges * 100),
    });
  }, [rentaSurface, rentaTaux, rentaMat, rentaDep, rentaType, rentaStatut]);

  return {
    toolTab, setToolTab,
    devisText, setDevisText, devisResult, devisLoading,
    calcType, setCalcType, calcSurface, setCalcSurface, calcHauteur, setCalcHauteur, calcPente, setCalcPente, calcLongueur, setCalcLongueur, calcResult, calcLoading,
    artisanNom, setArtisanNom, artisanSpec, setArtisanSpec, artisanResult, artisanLoading,
    primesRev, setPrimesRev, primesTrav, setPrimesTrav, primesSurf, setPrimesSurf, primesResult, primesLoading,
    counterDevis, setCounterDevis, counterLoading,
    planningType, setPlanningType, planningBudget, setPlanningBudget, planningResult, planningLoading,
    devisProDesc, setDevisProDesc, devisProClient, setDevisProClient, devisProSurface, setDevisProSurface, devisProResult, devisProLoading,
    rentaSurface, setRentaSurface, rentaTaux, setRentaTaux, rentaMat, setRentaMat, rentaDep, setRentaDep, rentaResult, rentaType, setRentaType, rentaStatut, setRentaStatut,
    analyserDevis, genererContreDevis, calculerMateriaux, calculerPrimes, verifierArtisan,
    planifierChantier, genererDevisPro, calculerRentabilite,
  };
}
