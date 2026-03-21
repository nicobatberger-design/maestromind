import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { IAS, DIVISIONS } from "../data/constants";
import { PRIX_TRAVAUX_2026, DIAGNOSTICS_OBLIGATOIRES, RE2020, AIDES_2026 } from "../utils/databases";
import { safeSetItem } from "../utils/storage";
import s from "../styles/index";

const RECENT_KEY = "mm_recent_searches";
const MAX_RECENT = 5;

// Index de recherche — construit une fois
const SEARCH_INDEX = (() => {
  const items = [];

  // IA spécialisées
  Object.entries(IAS).forEach(([key, ia]) => {
    items.push({
      type: "ia", key, title: ia.name, sub: ia.st, color: ia.color,
      nameLower: ia.name.toLowerCase(),
      divisionLower: (ia.division || "").toLowerCase(),
      chipsLower: (ia.chips || []).map(c => c.toLowerCase()),
      keywordsLower: [ia.st, ...(ia.chips || [])].join(" ").toLowerCase()
    });
  });

  // Prix travaux
  Object.entries(PRIX_TRAVAUX_2026).forEach(([cat, travaux]) => {
    Object.entries(travaux).forEach(([nom, data]) => {
      items.push({
        type: "prix", title: nom, sub: `${data.prix_bas}-${data.prix_haut}€/${data.unite}`, color: "#52C37A",
        nameLower: nom.toLowerCase(),
        divisionLower: cat.toLowerCase(),
        chipsLower: [],
        keywordsLower: [nom, cat, data.dtu || ""].join(" ").toLowerCase(),
        data
      });
    });
  });

  // Diagnostics
  DIAGNOSTICS_OBLIGATOIRES.vente.forEach(d => {
    items.push({
      type: "diagnostic", title: d.nom, sub: `${d.obligatoire ? "Obligatoire" : "Optionnel"} — ${d.prix}`, color: "#E8873A",
      nameLower: d.nom.toLowerCase(),
      divisionLower: "",
      chipsLower: [],
      keywordsLower: [d.nom, d.condition, d.norme || ""].join(" ").toLowerCase()
    });
  });

  // RE2020
  Object.entries(RE2020.exigences_isolation).forEach(([key, data]) => {
    const title = `Isolation ${key} — RE2020`;
    items.push({
      type: "norme", title, sub: `R min ${data.R_min || data.Uw_max} ${data.unite}`, color: "#5290E0",
      nameLower: title.toLowerCase(),
      divisionLower: "",
      chipsLower: [],
      keywordsLower: ["re2020", "isolation", key, data.epaisseur_type || data.type || ""].join(" ").toLowerCase()
    });
  });

  // Aides
  Object.entries(AIDES_2026.maprimerenov.montants).forEach(([key, data]) => {
    const title = `MaPrimeRénov' — ${key.replace(/_/g, " ")}`;
    items.push({
      type: "aide", title, sub: `Jusqu'à ${data.bleu}${data.unite}`, color: "#52C37A",
      nameLower: title.toLowerCase(),
      divisionLower: "",
      chipsLower: [],
      keywordsLower: ["aide", "maprimerenov", "prime", key.replace(/_/g, " ")].join(" ").toLowerCase()
    });
  });

  // Divisions
  Object.entries(DIVISIONS).forEach(([div, info]) => {
    items.push({
      type: "division", title: `Division ${div}`, sub: `${info.ias.length} IA spécialisées`, color: info.color,
      nameLower: `division ${div}`.toLowerCase(),
      divisionLower: div.toLowerCase(),
      chipsLower: [],
      keywordsLower: [div, ...info.ias.map(k => IAS[k]?.name || k)].join(" ").toLowerCase(),
      key: div
    });
  });

  return items;
})();

// Algorithme de scoring amélioré
function searchItems(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  return SEARCH_INDEX
    .map(item => {
      let score = 0;
      words.forEach(w => {
        // Nom : 3 points (6 si mot exact)
        if (item.nameLower.includes(w)) {
          const exact = item.nameLower.split(/\s+/).some(nw => nw === w);
          score += exact ? 6 : 3;
        }
        // Division : 2 points (4 si exact)
        if (item.divisionLower && item.divisionLower.includes(w)) {
          const exact = item.divisionLower.split(/\s+/).some(dw => dw === w);
          score += exact ? 4 : 2;
        }
        // Chips : 1 point (2 si exact)
        if (item.chipsLower.some(c => c.includes(w))) {
          const exact = item.chipsLower.some(c => c.split(/\s+/).some(cw => cw === w));
          score += exact ? 2 : 1;
        }
        // Mots-clés généraux : 1 point (2 si exact)
        if (item.keywordsLower.includes(w)) {
          const exact = item.keywordsLower.split(/\s+/).some(kw => kw === w);
          score += exact ? 2 : 1;
        }
      });
      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
}

// Récupérer les recherches récentes
function getRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// Sauvegarder une recherche récente
function saveRecentSearch(query) {
  const q = query.trim();
  if (!q || q.length < 2) return;
  const recent = getRecentSearches().filter(s => s !== q);
  recent.unshift(q);
  safeSetItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

// Trouver les IA les plus utilisées via l'historique chat
function getMostUsedIAs() {
  const counts = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith("bl_chat_")) continue;
      const iaKey = key.replace("bl_chat_", "");
      if (!IAS[iaKey]) continue;
      try {
        const msgs = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(msgs) && msgs.length > 0) {
          counts[iaKey] = msgs.length;
        }
      } catch { /* données invalides */ }
    }
  } catch { /* localStorage indisponible */ }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => ({ key, ...IAS[key] }));
}

const TYPE_LABELS = { ia: "IA", prix: "Prix", diagnostic: "Diag", norme: "Norme", aide: "Aide", division: "Division" };

// Styles pilules recherches récentes
const pillStyle = {
  display: "inline-block", margin: "0 6px 6px 0", padding: "7px 12px",
  borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer",
  background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.15)",
  color: "rgba(201,168,76,0.7)"
};

export default function SearchOverlay({ visible, onClose, onSelectIA }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);

  // IA les plus utilisées — calculé à l'ouverture
  const mostUsed = useMemo(() => visible ? getMostUsedIAs() : [], [visible]);

  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
      setRecentSearches(getRecentSearches());
    }
    if (!visible) { setQuery(""); setResults([]); }
  }, [visible]);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    setResults(searchItems(q));
  }, []);

  const handleSelect = useCallback((item) => {
    // Sauvegarder la recherche si query non vide
    if (query.trim().length >= 2) saveRecentSearch(query.trim());
    if (item.type === "ia") { onSelectIA?.(item.key); onClose(); }
    else if (item.type === "division") { onSelectIA?.(item.key, true); onClose(); }
    else { onClose(); }
  }, [onSelectIA, onClose, query]);

  // Effacer les recherches récentes
  const clearRecent = useCallback(() => {
    localStorage.removeItem(RECENT_KEY);
    setRecentSearches([]);
  }, []);

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,13,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 1000, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 0", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input ref={inputRef} type="text" value={query} onChange={e => handleSearch(e.target.value)} placeholder="Rechercher IA, normes, prix, aides..." style={{ ...s.inp, borderRadius: 14, padding: "14px 16px 14px 40px", fontSize: 14 }} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(240,237,230,0.4)", fontSize: 14, cursor: "pointer", padding: "8px" }}>Annuler</button>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {/* Aucun résultat */}
        {query.length > 0 && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(240,237,230,0.25)", fontSize: 12 }}>Aucun résultat pour "{query}"</div>
        )}

        {/* État vide : recherches récentes + suggestions dynamiques */}
        {query.length === 0 && (
          <>
            {/* Recherches récentes */}
            {recentSearches.length > 0 && (
              <div style={{ padding: "12px 0 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 9, color: "rgba(240,237,230,0.25)", letterSpacing: 2, textTransform: "uppercase" }}>Récentes</span>
                  <button onClick={clearRecent} style={{ background: "transparent", border: "none", color: "rgba(201,168,76,0.4)", fontSize: 10, cursor: "pointer", padding: "2px 6px" }}>Effacer</button>
                </div>
                {recentSearches.map(rs => (
                  <button key={rs} onClick={() => handleSearch(rs)} style={pillStyle}>{rs}</button>
                ))}
              </div>
            )}

            {/* IA les plus utilisées (dynamique) */}
            {mostUsed.length > 0 && (
              <div style={{ padding: "12px 0 8px" }}>
                <div style={{ fontSize: 9, color: "rgba(240,237,230,0.25)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Les plus utilisées</div>
                {mostUsed.map(ia => (
                  <div key={ia.key} onClick={() => { onSelectIA?.(ia.key); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", cursor: "pointer", borderBottom: "0.5px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: (ia.color || "#C9A84C") + "12", border: "0.5px solid " + (ia.color || "#C9A84C") + "28", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 7, fontWeight: 800, color: ia.color || "#C9A84C", letterSpacing: 0.5 }}>IA</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ia.name}</div>
                      <div style={{ fontSize: 9, color: "rgba(240,237,230,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ia.st}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions statiques (fallback si pas d'historique) */}
            {mostUsed.length === 0 && (
              <div style={{ padding: "12px 0" }}>
                <div style={{ fontSize: 9, color: "rgba(240,237,230,0.25)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Suggestions</div>
                {["isolation combles", "fissure mur", "prix carrelage", "artisan RGE", "MaPrimeRénov", "DTU placo", "diagnostic amiante", "fenêtre double vitrage"].map(sg => (
                  <button key={sg} onClick={() => handleSearch(sg)} style={{ ...pillStyle, color: "rgba(240,237,230,0.5)" }}>{sg}</button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Résultats */}
        {results.map((item, i) => (
          <div key={i} onClick={() => handleSelect(item)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: "pointer", borderBottom: "0.5px solid rgba(255,255,255,0.03)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: item.color + "12", border: "0.5px solid " + item.color + "28", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 8, fontWeight: 800, color: item.color, letterSpacing: 0.5 }}>{TYPE_LABELS[item.type]}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.sub}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.15)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>
    </div>
  );
}
