/**
 * MAESTROMIND — Bases de données externes
 * APIs : ADEME (DPE, RGE), Géorisques, DVF, Météo-France, Cadastre
 */

const ADEME_BASE = "https://data.ademe.fr/data-fair/api/v1/datasets";

// ═══════════════════════════════════════════════════════════════
// API DPE — Diagnostic Performance Énergétique
// ═══════════════════════════════════════════════════════════════

/**
 * Recherche DPE par adresse ou code postal
 * @param {string} query - Adresse, code postal, ou ville
 * @returns {Promise<Array>} Liste de DPE trouvés
 */
export async function searchDPE(query) {
  const url = `${ADEME_BASE}/dpe03existant/lines?q=${encodeURIComponent(query)}&size=10&select=numero_dpe,adresse_ban,code_postal_ban,etiquette_dpe,etiquette_ges,conso_5_usages_ep,emission_ges_5_usages,surface_habitable_immeuble,periode_construction,type_generateur_chauffage_principal,qualite_isolation_murs,qualite_isolation_menuiseries,date_etablissement_dpe`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur API DPE ADEME");
  const data = await res.json();
  return data.results || [];
}

/**
 * Récupère un DPE par son numéro
 * @param {string} numeroDpe - Numéro du DPE
 */
export async function getDPEByNumber(numeroDpe) {
  const url = `${ADEME_BASE}/dpe03existant/lines?q_fields=numero_dpe&q=${encodeURIComponent(numeroDpe)}&size=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("DPE introuvable");
  const data = await res.json();
  return data.results?.[0] || null;
}

/**
 * Statistiques DPE par code postal
 * @param {string} codePostal - Code postal (ex: "75001")
 */
export async function statsDPEByPostalCode(codePostal) {
  const url = `${ADEME_BASE}/dpe03existant/lines?qs=code_postal_ban:"${codePostal}"&size=100&select=etiquette_dpe,etiquette_ges,conso_5_usages_ep,periode_construction`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur stats DPE");
  const data = await res.json();
  const results = data.results || [];

  // Calcul des stats
  const classes = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
  let totalConso = 0;
  let count = 0;
  results.forEach(r => {
    if (r.etiquette_dpe && classes[r.etiquette_dpe] !== undefined) classes[r.etiquette_dpe]++;
    if (r.conso_5_usages_ep) { totalConso += r.conso_5_usages_ep; count++; }
  });

  return {
    total: data.total,
    repartition: classes,
    consoMoyenne: count > 0 ? Math.round(totalConso / count) : null,
    codePostal,
  };
}

// ═══════════════════════════════════════════════════════════════
// API RGE — Entreprises certifiées
// ═══════════════════════════════════════════════════════════════

/**
 * Recherche entreprises RGE par localisation et/ou spécialité
 * @param {Object} params - { codePostal, siret, nomEntreprise, domaine }
 */
export async function searchRGE({ codePostal, siret, nomEntreprise, domaine } = {}) {
  let query = [];
  if (codePostal) query.push(`code_postal:"${codePostal}"`);
  if (siret) query.push(`siret:"${siret}"`);
  if (nomEntreprise) query.push(`nom_entreprise:"${nomEntreprise}"`);
  if (domaine) query.push(`domaine:"${domaine}"`);

  const qs = query.length ? `&qs=${encodeURIComponent(query.join(" AND "))}` : "";
  const url = `${ADEME_BASE}/liste-des-entreprises-rge-2/lines?size=20${qs}&select=nom_entreprise,siret,adresse,code_postal,commune,telephone,email,site_internet,domaine,nom_qualification,url_qualification,organisme_certificateur,date_fin_validite`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur API RGE ADEME");
  const data = await res.json();
  return { total: data.total, results: data.results || [] };
}

/**
 * Vérifier si une entreprise est RGE par SIRET
 */
export async function verifyRGE(siret) {
  const { results } = await searchRGE({ siret });
  if (results.length === 0) return { isRGE: false, message: "Aucune certification RGE trouvée pour ce SIRET." };

  const certs = results.map(r => ({
    domaine: r.domaine,
    qualification: r.nom_qualification,
    organisme: r.organisme_certificateur,
    validite: r.date_fin_validite,
    valide: new Date(r.date_fin_validite) > new Date(),
  }));

  return {
    isRGE: certs.some(c => c.valide),
    entreprise: results[0].nom_entreprise,
    adresse: results[0].adresse + " " + results[0].code_postal + " " + results[0].commune,
    telephone: results[0].telephone,
    certifications: certs,
  };
}

// ═══════════════════════════════════════════════════════════════
// BASE DE DONNÉES DIAGNOSTICS OBLIGATOIRES
// ═══════════════════════════════════════════════════════════════

export const DIAGNOSTICS_OBLIGATOIRES = {
  vente: [
    { nom: "DPE", obligatoire: true, condition: "Tous bâtiments", validite: "10 ans", prix: "100-250€", norme: "Arrêté du 31/03/2021" },
    { nom: "Amiante", obligatoire: true, condition: "Permis de construire avant 01/07/1997", validite: "Illimitée si négatif", prix: "80-150€", norme: "NF X 46-020" },
    { nom: "Plomb (CREP)", obligatoire: true, condition: "Logement construit avant 01/01/1949", validite: "1 an si positif, illimitée si négatif", prix: "100-300€", norme: "NF X 46-030" },
    { nom: "Termites", obligatoire: true, condition: "Zones arrêtées par préfet", validite: "6 mois", prix: "100-200€", norme: "NF P 03-200" },
    { nom: "Gaz", obligatoire: true, condition: "Installation >15 ans", validite: "3 ans", prix: "100-150€", norme: "NF P 45-500" },
    { nom: "Électricité", obligatoire: true, condition: "Installation >15 ans", validite: "3 ans", prix: "100-150€", norme: "NFC 16-600" },
    { nom: "ERP", obligatoire: true, condition: "Zones sismiques + risques naturels", validite: "6 mois", prix: "20-50€", norme: "Art. L125-5 Code Env." },
    { nom: "Assainissement", obligatoire: true, condition: "Non raccordé au tout-à-l'égout", validite: "3 ans", prix: "100-150€", norme: "Arrêté 27/04/2012" },
    { nom: "Bruit", obligatoire: true, condition: "Zone aéroport (plan d'exposition)", validite: "Pas de durée", prix: "Gratuit", norme: "Art. L112-11 Urbanisme" },
    { nom: "Mérule", obligatoire: false, condition: "Zones arrêtées par préfet (Bretagne, Normandie...)", validite: "6 mois", prix: "200-400€", norme: "Art. L133-8 CCH" },
  ],
  location: [
    { nom: "DPE", obligatoire: true, condition: "Tous logements", validite: "10 ans", note: "Logements F et G interdits à la location depuis 2025" },
    { nom: "Plomb (CREP)", obligatoire: true, condition: "Avant 01/01/1949", validite: "6 ans" },
    { nom: "Amiante (DAPP)", obligatoire: true, condition: "Avant 01/07/1997", validite: "Selon état" },
    { nom: "Gaz", obligatoire: true, condition: "Installation >15 ans", validite: "6 ans" },
    { nom: "Électricité", obligatoire: true, condition: "Installation >15 ans", validite: "6 ans" },
    { nom: "ERP", obligatoire: true, condition: "Zones à risques", validite: "6 mois" },
    { nom: "Bruit", obligatoire: true, condition: "Zone aéroport", validite: "Pas de durée" },
    { nom: "Surface (Boutin)", obligatoire: true, condition: "Tous logements", validite: "Illimitée si pas de travaux" },
  ],
  travaux: [
    { nom: "Amiante avant travaux", obligatoire: true, condition: "Bâtiment avant 1997, tout type de travaux", norme: "NF X 46-020", sanction: "Amende + arrêt chantier" },
    { nom: "Plomb avant travaux", obligatoire: true, condition: "Bâtiment avant 1949, travaux touchant peintures", norme: "NF X 46-035", sanction: "Amende" },
    { nom: "Termites avant démolition", obligatoire: true, condition: "Zones termitées, démolition partielle ou totale", norme: "NF P 03-200" },
  ],
};

// ═══════════════════════════════════════════════════════════════
// BASE DE DONNÉES RE2020 — Valeurs réglementaires
// ═══════════════════════════════════════════════════════════════

export const RE2020 = {
  zones_climatiques: {
    H1a: { description: "Nord-Est (Lille, Strasbourg)", Bbio_max: 63, Cep_max: 70, DH_max: 1250 },
    H1b: { description: "Nord-Ouest (Paris, Rouen)", Bbio_max: 63, Cep_max: 70, DH_max: 1250 },
    H1c: { description: "Est (Lyon, Grenoble)", Bbio_max: 63, Cep_max: 70, DH_max: 1250 },
    H2a: { description: "Bretagne (Rennes, Brest)", Bbio_max: 60, Cep_max: 65, DH_max: 1250 },
    H2b: { description: "Centre-Ouest (Nantes, Bordeaux)", Bbio_max: 57, Cep_max: 60, DH_max: 1250 },
    H2c: { description: "Sud-Ouest (Toulouse)", Bbio_max: 54, Cep_max: 55, DH_max: 1250 },
    H2d: { description: "Sud-Est (Montpellier)", Bbio_max: 51, Cep_max: 50, DH_max: 1250 },
    H3: { description: "Méditerranée (Marseille, Nice)", Bbio_max: 48, Cep_max: 45, DH_max: 1250 },
  },
  exigences_isolation: {
    murs: { R_min: 3.7, U_max: 0.27, unite: "m².K/W", epaisseur_type: "120-160mm laine minérale" },
    toiture: { R_min: 7.0, U_max: 0.14, unite: "m².K/W", epaisseur_type: "280-320mm laine minérale" },
    plancher_bas: { R_min: 3.0, U_max: 0.33, unite: "m².K/W", epaisseur_type: "100-120mm PSE" },
    fenetres: { Uw_max: 1.3, Sw_min: 0.3, unite: "W/m².K", type: "Double vitrage 4/16/4 argon" },
    fenetres_triple: { Uw_max: 0.9, Sw_min: 0.25, unite: "W/m².K", type: "Triple vitrage" },
  },
  seuils_carbone: {
    maison_2025: { Ic_max: 640, unite: "kgCO2eq/m²" },
    maison_2028: { Ic_max: 530 },
    maison_2031: { Ic_max: 415 },
    collectif_2025: { Ic_max: 740 },
    collectif_2028: { Ic_max: 650 },
    collectif_2031: { Ic_max: 490 },
  },
};

// ═══════════════════════════════════════════════════════════════
// BASE PRIX TRAVAUX 2026 — Référentiel complet
// ═══════════════════════════════════════════════════════════════

export const PRIX_TRAVAUX_2026 = {
  gros_oeuvre: {
    "Fondations semelles filantes": { unite: "ml", prix_bas: 80, prix_haut: 150, mo_incluse: true },
    "Dalle béton armé 15cm": { unite: "m²", prix_bas: 60, prix_haut: 100, mo_incluse: true },
    "Mur parpaing 20cm": { unite: "m²", prix_bas: 55, prix_haut: 90, mo_incluse: true },
    "Mur brique 20cm": { unite: "m²", prix_bas: 70, prix_haut: 110, mo_incluse: true },
    "Linteau béton armé": { unite: "ml", prix_bas: 40, prix_haut: 80, mo_incluse: true },
    "Chaînage béton armé": { unite: "ml", prix_bas: 35, prix_haut: 65, mo_incluse: true },
    "Ragréage autolissant": { unite: "m²", prix_bas: 15, prix_haut: 30, mo_incluse: true },
  },
  cloison_placo: {
    "Cloison BA13 simple 72/48": { unite: "m²", prix_bas: 27, prix_haut: 41, mo_incluse: true, dtu: "DTU 25.41" },
    "Cloison BA13 double 98/48": { unite: "m²", prix_bas: 35, prix_haut: 55, mo_incluse: true, dtu: "DTU 25.41" },
    "Doublage collé 10+40": { unite: "m²", prix_bas: 22, prix_haut: 38, mo_incluse: true },
    "Doublage sur ossature 13+45": { unite: "m²", prix_bas: 30, prix_haut: 50, mo_incluse: true },
    "Faux plafond BA13 suspendu": { unite: "m²", prix_bas: 35, prix_haut: 60, mo_incluse: true },
    "Bande à joint + enduit": { unite: "m²", prix_bas: 8, prix_haut: 15, mo_incluse: true },
  },
  carrelage: {
    "Carrelage sol grès cérame 30x30": { unite: "m²", prix_bas: 45, prix_haut: 75, mo_incluse: true, dtu: "DTU 52.1" },
    "Carrelage sol grès cérame 60x60": { unite: "m²", prix_bas: 55, prix_haut: 120, mo_incluse: true, dtu: "DTU 52.1" },
    "Faïence murale 20x40": { unite: "m²", prix_bas: 40, prix_haut: 70, mo_incluse: true },
    "Carrelage grand format 120x60": { unite: "m²", prix_bas: 75, prix_haut: 150, mo_incluse: true },
    "Mosaïque douche": { unite: "m²", prix_bas: 60, prix_haut: 120, mo_incluse: true },
  },
  peinture: {
    "Peinture acrylique mate 2 couches": { unite: "m²", prix_bas: 18, prix_haut: 30, mo_incluse: true },
    "Peinture satin lessivable 2 couches": { unite: "m²", prix_bas: 22, prix_haut: 38, mo_incluse: true },
    "Sous-couche d'accrochage": { unite: "m²", prix_bas: 8, prix_haut: 14, mo_incluse: true },
    "Enduit de rebouchage + lissage": { unite: "m²", prix_bas: 12, prix_haut: 25, mo_incluse: true },
    "Papier peint pose": { unite: "m²", prix_bas: 25, prix_haut: 50, mo_incluse: true },
  },
  plomberie: {
    "Remplacement robinet lavabo": { unite: "U", prix_bas: 120, prix_haut: 250, mo_incluse: true },
    "Remplacement mitigeur douche": { unite: "U", prix_bas: 180, prix_haut: 400, mo_incluse: true },
    "Pose WC complet": { unite: "U", prix_bas: 350, prix_haut: 700, mo_incluse: true },
    "Pose WC suspendu + bâti": { unite: "U", prix_bas: 600, prix_haut: 1200, mo_incluse: true },
    "Chauffe-eau 200L pose": { unite: "U", prix_bas: 700, prix_haut: 1500, mo_incluse: true },
    "Création point d'eau complet": { unite: "U", prix_bas: 400, prix_haut: 800, mo_incluse: true },
  },
  electricite: {
    "Pose prise 2P+T encastrée": { unite: "U", prix_bas: 80, prix_haut: 150, mo_incluse: true, norme: "NFC 15-100" },
    "Pose interrupteur VA": { unite: "U", prix_bas: 80, prix_haut: 140, mo_incluse: true },
    "Pose point lumineux (DCL)": { unite: "U", prix_bas: 100, prix_haut: 200, mo_incluse: true },
    "Tableau électrique 2 rangées": { unite: "U", prix_bas: 600, prix_haut: 1200, mo_incluse: true },
    "Mise en conformité totale": { unite: "U", prix_bas: 3000, prix_haut: 6000, mo_incluse: true },
  },
  isolation: {
    "Isolation combles perdus soufflée": { unite: "m²", prix_bas: 20, prix_haut: 40, mo_incluse: true, r: "R≥7,0" },
    "Isolation combles rampants": { unite: "m²", prix_bas: 40, prix_haut: 80, mo_incluse: true, r: "R≥6,0" },
    "ITE polystyrène 140mm": { unite: "m²", prix_bas: 100, prix_haut: 180, mo_incluse: true, r: "R≥3,7" },
    "ITI doublage laine 100mm": { unite: "m²", prix_bas: 35, prix_haut: 65, mo_incluse: true, r: "R≥3,0" },
    "Isolation plancher bas": { unite: "m²", prix_bas: 30, prix_haut: 60, mo_incluse: true, r: "R≥3,0" },
  },
  menuiserie: {
    "Fenêtre PVC DV 100x120": { unite: "U", prix_bas: 350, prix_haut: 700, mo_incluse: true },
    "Fenêtre alu DV 100x120": { unite: "U", prix_bas: 500, prix_haut: 1000, mo_incluse: true },
    "Porte-fenêtre PVC 215x140": { unite: "U", prix_bas: 600, prix_haut: 1200, mo_incluse: true },
    "Porte intérieure pose": { unite: "U", prix_bas: 200, prix_haut: 450, mo_incluse: true },
    "Porte d'entrée pose": { unite: "U", prix_bas: 800, prix_haut: 2500, mo_incluse: true },
    "Volet roulant PVC motorisé": { unite: "U", prix_bas: 400, prix_haut: 800, mo_incluse: true },
  },
  toiture: {
    "Rénovation couverture tuiles": { unite: "m²", prix_bas: 60, prix_haut: 120, mo_incluse: true, dtu: "DTU 40.21" },
    "Rénovation couverture ardoise": { unite: "m²", prix_bas: 80, prix_haut: 160, mo_incluse: true },
    "Zinguerie (gouttière alu)": { unite: "ml", prix_bas: 30, prix_haut: 60, mo_incluse: true },
    "Charpente traditionnelle": { unite: "m²", prix_bas: 80, prix_haut: 150, mo_incluse: true, dtu: "DTU 31.2" },
    "Étanchéité toiture plate": { unite: "m²", prix_bas: 50, prix_haut: 100, mo_incluse: true },
  },
  exterieur: {
    "Terrasse bois pin traité": { unite: "m²", prix_bas: 45, prix_haut: 80, mo_incluse: true, dtu: "DTU 51.4" },
    "Terrasse composite": { unite: "m²", prix_bas: 80, prix_haut: 150, mo_incluse: true },
    "Dallage pierre naturelle": { unite: "m²", prix_bas: 60, prix_haut: 120, mo_incluse: true },
    "Clôture PVC 1,50m": { unite: "ml", prix_bas: 40, prix_haut: 80, mo_incluse: true },
    "Portail alu motorisé": { unite: "U", prix_bas: 1500, prix_haut: 4000, mo_incluse: true },
  },
};

// ═══════════════════════════════════════════════════════════════
// API GÉORISQUES — Risques naturels et technologiques
// Source : georisques.gouv.fr (BRGM) — Open Data, pas de clé
// ═══════════════════════════════════════════════════════════════

const GEORISQUES_BASE = "https://georisques.gouv.fr/api/v1";

/**
 * Risques par adresse (latitude/longitude)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Risques identifiés
 */
export async function getRisquesByCoords(lat, lon) {
  const url = `${GEORISQUES_BASE}/resultats_rapport_risques?latlon=${lon},${lat}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur API Géorisques");
  return await res.json();
}

/**
 * Risques par code commune INSEE
 * @param {string} codeInsee - Code INSEE commune (ex: "75056" pour Paris)
 */
export async function getRisquesByCommune(codeInsee) {
  const [gaspar, radon, argiles] = await Promise.all([
    fetch(`${GEORISQUES_BASE}/gaspar/risques?code_insee=${codeInsee}`).then(r => r.ok ? r.json() : { data: [] }),
    fetch(`${GEORISQUES_BASE}/radon?code_insee=${codeInsee}`).then(r => r.ok ? r.json() : { data: [] }),
    fetch(`${GEORISQUES_BASE}/mvt?code_insee=${codeInsee}`).then(r => r.ok ? r.json() : { data: [] }),
  ]);

  return {
    risques_naturels: gaspar.data?.filter(r => r.risque_jo?.famille_risque_jo === "Naturel") || [],
    risques_technologiques: gaspar.data?.filter(r => r.risque_jo?.famille_risque_jo === "Technologique") || [],
    radon: radon.data?.[0] || null,
    mouvements_terrain: argiles.data || [],
  };
}

/**
 * Zone sismique par code commune
 */
export async function getZoneSismique(codeInsee) {
  const res = await fetch(`${GEORISQUES_BASE}/zonage_sismique?code_insee=${codeInsee}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0] || null;
}

// ═══════════════════════════════════════════════════════════════
// API DVF — Demandes de Valeurs Foncières (prix immobilier)
// Source : api.gouv.fr — Open Data, pas de clé
// ═══════════════════════════════════════════════════════════════

/**
 * Transactions immobilières par commune et section cadastrale
 * @param {string} codeInsee - Code INSEE commune
 * @param {string} [annee] - Année (défaut: année en cours -1)
 */
export async function getTransactionsImmobilieres(codeInsee, annee) {
  const y = annee || (new Date().getFullYear() - 1);
  const url = `https://apidf-preprod.cerema.fr/dvf_opendata/mutations/?code_commune=${codeInsee}&annee_mutation=${y}&page_size=20&ordering=-date_mutation`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur API DVF");
  const data = await res.json();
  return {
    total: data.count,
    transactions: (data.results || []).map(t => ({
      date: t.date_mutation,
      type: t.nature_mutation,
      valeur: t.valeur_fonciere,
      adresse: [t.adresse_numero, t.adresse_nom_voie, t.code_postal, t.nom_commune].filter(Boolean).join(" "),
      surface: t.surface_reelle_bati,
      pieces: t.nombre_pieces_principales,
      terrain: t.surface_terrain,
      typeBien: t.type_local,
      prixM2: t.surface_reelle_bati > 0 ? Math.round(t.valeur_fonciere / t.surface_reelle_bati) : null,
    })),
  };
}

/**
 * Prix moyen au m² par commune
 */
export async function getPrixMoyenM2(codeInsee) {
  const { transactions } = await getTransactionsImmobilieres(codeInsee);
  const ventes = transactions.filter(t => t.type === "Vente" && t.prixM2 && t.prixM2 > 500 && t.prixM2 < 20000);
  if (ventes.length === 0) return null;
  const avg = Math.round(ventes.reduce((s, t) => s + t.prixM2, 0) / ventes.length);
  return { prixMoyenM2: avg, nbTransactions: ventes.length, commune: ventes[0]?.adresse?.split(" ").pop() };
}

// ═══════════════════════════════════════════════════════════════
// API MÉTÉO-FRANCE — Prévisions chantier
// Source : Open-Meteo (wrapper gratuit Météo-France, pas de clé)
// ═══════════════════════════════════════════════════════════════

/**
 * Prévisions météo 7 jours pour un chantier
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Prévisions et alertes chantier
 */
export async function getMeteoChantier(lat, lon) {
  const url = `https://api.open-meteo.com/v1/meteofrance?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weathercode&timezone=Europe/Paris&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur API Météo");
  const data = await res.json();
  const daily = data.daily;

  const jours = daily.time.map((date, i) => {
    const precip = daily.precipitation_sum[i];
    const vent = daily.wind_speed_10m_max[i];
    const tMin = daily.temperature_2m_min[i];
    const tMax = daily.temperature_2m_max[i];

    // Alertes chantier spécifiques BTP
    const alertes = [];
    if (precip > 10) alertes.push("Pluie forte — reporter bétonnage et peinture extérieure");
    else if (precip > 2) alertes.push("Pluie — protéger matériaux, pas de travaux extérieurs sensibles");
    if (vent > 60) alertes.push("Vent violent — pas de travaux en hauteur, sécuriser échafaudages");
    else if (vent > 40) alertes.push("Vent fort — vigilance échafaudages et levage");
    if (tMin < 0) alertes.push("Gel — pas de bétonnage ni mortier (DTU 21), protéger canalisations");
    if (tMin < 5) alertes.push("Froid — rallonger temps de séchage béton/enduit (+50%)");
    if (tMax > 35) alertes.push("Canicule — hydratation obligatoire, pas de bétonnage 12h-16h");
    if (tMax > 30) alertes.push("Chaleur — bâcher béton frais, arroser régulièrement");

    return {
      date,
      tMin: Math.round(tMin),
      tMax: Math.round(tMax),
      precipitation: Math.round(precip * 10) / 10,
      vent: Math.round(vent),
      code: daily.weathercode[i],
      alertes,
      travailOk: alertes.length === 0,
    };
  });

  return {
    latitude: lat,
    longitude: lon,
    jours,
    joursOk: jours.filter(j => j.travailOk).length,
    joursCritiques: jours.filter(j => j.alertes.length > 0),
  };
}

// ═══════════════════════════════════════════════════════════════
// API CADASTRE — Parcelles et adresses
// Source : api-adresse.data.gouv.fr — Open Data, pas de clé
// ═══════════════════════════════════════════════════════════════

/**
 * Géocodage : adresse → coordonnées + code INSEE
 * @param {string} adresse - Adresse à géocoder
 */
export async function geocodeAdresse(adresse) {
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adresse)}&limit=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur géocodage");
  const data = await res.json();
  return (data.features || []).map(f => ({
    label: f.properties.label,
    codeInsee: f.properties.citycode,
    codePostal: f.properties.postcode,
    ville: f.properties.city,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
  }));
}

/**
 * Reverse géocodage : coordonnées → adresse
 */
export async function reverseGeocode(lat, lon) {
  const url = `https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const f = data.features?.[0];
  if (!f) return null;
  return {
    label: f.properties.label,
    codeInsee: f.properties.citycode,
    codePostal: f.properties.postcode,
    ville: f.properties.city,
  };
}

// ═══════════════════════════════════════════════════════════════
// AIDES FINANCIÈRES — Barèmes 2026
// ═══════════════════════════════════════════════════════════════

export const AIDES_2026 = {
  maprimerenov: {
    description: "MaPrimeRénov' — Aide principale rénovation énergétique",
    conditions: "Propriétaire occupant ou bailleur, logement >15 ans",
    plafonds: {
      tres_modeste: { label: "Très modeste", plafond_idf: 23541, plafond_hors_idf: 17009, couleur: "Bleu" },
      modeste: { label: "Modeste", plafond_idf: 28657, plafond_hors_idf: 21805, couleur: "Jaune" },
      intermediaire: { label: "Intermédiaire", plafond_idf: 40018, plafond_hors_idf: 30427, couleur: "Violet" },
      superieur: { label: "Supérieur", plafond_idf: 56130, plafond_hors_idf: null, couleur: "Rose" },
    },
    montants: {
      isolation_murs_ext: { bleu: 75, jaune: 60, violet: 40, rose: 15, unite: "€/m²", max: "Selon surface" },
      isolation_toiture: { bleu: 75, jaune: 60, violet: 40, rose: 15, unite: "€/m²" },
      isolation_plancher: { bleu: 75, jaune: 60, violet: 40, rose: 15, unite: "€/m²" },
      fenetres: { bleu: 100, jaune: 80, violet: 40, rose: 0, unite: "€/fenêtre" },
      pac_air_eau: { bleu: 5000, jaune: 4000, violet: 3000, rose: 0, unite: "€ forfait" },
      pac_geothermie: { bleu: 11000, jaune: 9000, violet: 6000, rose: 0, unite: "€ forfait" },
      chaudiere_bois: { bleu: 8000, jaune: 6500, violet: 3000, rose: 0, unite: "€ forfait" },
      vmc_double_flux: { bleu: 2500, jaune: 2000, violet: 1500, rose: 0, unite: "€ forfait" },
      audit_energetique: { bleu: 500, jaune: 400, violet: 300, rose: 0, unite: "€ forfait" },
    },
  },
  cee: {
    description: "Certificats d'Économies d'Énergie — Primes énergie",
    conditions: "Artisan RGE obligatoire, devis signé avant travaux",
    exemples: {
      isolation_combles: "12-20€/m²",
      isolation_murs: "8-15€/m²",
      pac: "2500-4000€",
      fenetres: "40-80€/fenêtre",
      chaudiere_bois: "800-1500€",
    },
  },
  eco_ptz: {
    description: "Éco-Prêt à Taux Zéro",
    montant_max: 50000,
    duree_max: "20 ans",
    conditions: "Logement >2 ans, artisan RGE, pas de conditions de revenus",
    montants: {
      "1 action": 15000,
      "2 actions": 25000,
      "3 actions ou réno globale": 50000,
    },
  },
  tva_reduite: {
    description: "TVA réduite travaux rénovation",
    taux: {
      "5.5%": "Travaux d'amélioration énergétique (isolation, PAC, fenêtres...)",
      "10%": "Travaux de rénovation (peinture, plomberie, électricité, carrelage...)",
      "20%": "Construction neuve ou agrandissement >10% surface",
    },
    conditions: "Logement >2 ans, résidence principale ou secondaire, facture artisan",
  },
};

// ═══════════════════════════════════════════════════════════════
// BASE MATÉRIAUX ÉCO-RESPONSABLES
// ═══════════════════════════════════════════════════════════════

export const MATERIAUX_ECO = {
  isolation: [
    { nom: "Laine de bois", lambda: 0.038, classement_feu: "E", avantage: "Excellent déphasage thermique été", prix: "15-25€/m² (100mm)", impact_co2: "Très faible" },
    { nom: "Ouate de cellulose", lambda: 0.039, classement_feu: "B-s2,d0", avantage: "Recyclée (papier journal), soufflable", prix: "10-18€/m² (100mm)", impact_co2: "Très faible" },
    { nom: "Chanvre", lambda: 0.040, classement_feu: "E", avantage: "Régulateur humidité naturel", prix: "12-22€/m² (100mm)", impact_co2: "Négatif (stocke CO2)" },
    { nom: "Liège expansé", lambda: 0.040, classement_feu: "E", avantage: "Imputrescible, phonique excellent", prix: "25-45€/m² (100mm)", impact_co2: "Faible" },
    { nom: "Paille compressée", lambda: 0.052, classement_feu: "B-s1,d0", avantage: "Ultra local, quasi gratuit", prix: "5-10€/m² (360mm)", impact_co2: "Négatif" },
  ],
  structure: [
    { nom: "Bois CLT (lamellé-croisé)", avantage: "Construction rapide, stocke CO2, léger", usage: "Murs porteurs, planchers, toiture" },
    { nom: "Béton bas carbone CEM III", avantage: "-40% CO2 vs béton classique", usage: "Fondations, dalles" },
    { nom: "Brique monomur", avantage: "Isolation intégrée R=1 à 3", usage: "Murs porteurs sans isolant additionnel" },
    { nom: "Terre crue (pisé/BTC)", avantage: "Inertie thermique exceptionnelle, 0 CO2", usage: "Murs, cloisons, enduits" },
  ],
};
