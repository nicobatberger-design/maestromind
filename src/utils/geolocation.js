/**
 * MAESTROMIND — Géolocalisation contextuelle
 * Récupère la position + enrichit avec les APIs (météo, risques, prix)
 */

import { reverseGeocode, getMeteoChantier, getRisquesByCommune, getPrixMoyenM2 } from "./databases";

const GEO_CACHE_KEY = "mm_geo_cache";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCache() {
  try {
    const c = JSON.parse(localStorage.getItem(GEO_CACHE_KEY));
    if (c && Date.now() - c.timestamp < CACHE_TTL) return c;
  } catch {}
  return null;
}

function setCache(data) {
  localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
}

/**
 * Récupère la position GPS du téléphone
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Géolocalisation non supportée")); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err),
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}

/**
 * Contexte géolocalisé complet — position + météo + risques + prix
 * Utilise le cache pour éviter les appels répétés
 */
export async function getContexteLocal() {
  const cached = getCache();
  if (cached) return cached;

  try {
    const { lat, lon } = await getCurrentPosition();
    const adresse = await reverseGeocode(lat, lon);
    if (!adresse) throw new Error("Adresse introuvable");

    // Appels parallèles
    const [meteo, risques, prix] = await Promise.allSettled([
      getMeteoChantier(lat, lon),
      getRisquesByCommune(adresse.codeInsee),
      getPrixMoyenM2(adresse.codeInsee),
    ]);

    const contexte = {
      position: { lat, lon },
      adresse: adresse.label,
      ville: adresse.ville,
      codePostal: adresse.codePostal,
      codeInsee: adresse.codeInsee,
      meteo: meteo.status === "fulfilled" ? meteo.value : null,
      risques: risques.status === "fulfilled" ? risques.value : null,
      prixM2: prix.status === "fulfilled" ? prix.value : null,
    };

    setCache(contexte);
    return contexte;
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Résumé météo chantier pour les 3 prochains jours
 */
export function resumeMeteo(meteo) {
  if (!meteo?.jours) return null;
  const j3 = meteo.jours.slice(0, 3);
  return j3.map(j => ({
    date: new Date(j.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
    tMin: j.tMin,
    tMax: j.tMax,
    pluie: j.precipitation,
    vent: j.vent,
    ok: j.travailOk,
    alertes: j.alertes,
  }));
}
