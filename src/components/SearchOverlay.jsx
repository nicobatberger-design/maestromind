import { useState, useCallback, useRef, useEffect } from "react";
import { IAS, DIVISIONS } from "../data/constants";
import { PRIX_TRAVAUX_2026, DIAGNOSTICS_OBLIGATOIRES, RE2020, AIDES_2026 } from "../utils/databases";
import s from "../styles/index";

// Index de recherche — construit une fois
const SEARCH_INDEX = (() => {
  const items = [];

  // IA spécialisées
  Object.entries(IAS).forEach(([key, ia]) => {
    items.push({ type: "ia", key, title: ia.name, sub: ia.st, color: ia.color, keywords: [ia.name, ia.st, ia.division, ...(ia.chips || [])].join(" ") });
  });

  // Prix travaux
  Object.entries(PRIX_TRAVAUX_2026).forEach(([cat, travaux]) => {
    Object.entries(travaux).forEach(([nom, data]) => {
      items.push({ type: "prix", title: nom, sub: `${data.prix_bas}-${data.prix_haut}€/${data.unite}`, color: "#52C37A", keywords: [nom, cat, data.dtu || ""].join(" "), data });
    });
  });

  // Diagnostics
  DIAGNOSTICS_OBLIGATOIRES.vente.forEach(d => {
    items.push({ type: "diagnostic", title: d.nom, sub: `${d.obligatoire ? "Obligatoire" : "Optionnel"} — ${d.prix}`, color: "#E8873A", keywords: [d.nom, d.condition, d.norme || ""].join(" ") });
  });

  // RE2020
  Object.entries(RE2020.exigences_isolation).forEach(([key, data]) => {
    items.push({ type: "norme", title: `Isolation ${key} — RE2020`, sub: `R min ${data.R_min || data.Uw_max} ${data.unite}`, color: "#5290E0", keywords: ["re2020", "isolation", key, data.epaisseur_type || data.type || ""].join(" ") });
  });

  // Aides
  Object.entries(AIDES_2026.maprimerenov.montants).forEach(([key, data]) => {
    items.push({ type: "aide", title: `MaPrimeRénov' — ${key.replace(/_/g, " ")}`, sub: `Jusqu'à ${data.bleu}${data.unite}`, color: "#52C37A", keywords: ["aide", "maprimerenov", "prime", key.replace(/_/g, " ")].join(" ") });
  });

  // Divisions
  Object.entries(DIVISIONS).forEach(([div, info]) => {
    items.push({ type: "division", title: `Division ${div}`, sub: `${info.ias.length} IA spécialisées`, color: info.color, keywords: [div, ...info.ias.map(k => IAS[k]?.name || k)].join(" ") });
  });

  return items;
})();

function searchItems(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  return SEARCH_INDEX
    .map(item => {
      const kw = item.keywords.toLowerCase();
      const title = item.title.toLowerCase();
      let score = 0;
      words.forEach(w => {
        if (title.includes(w)) score += 3;
        if (kw.includes(w)) score += 1;
      });
      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
}

const TYPE_LABELS = { ia: "IA", prix: "Prix", diagnostic: "Diag", norme: "Norme", aide: "Aide", division: "Division" };

export default function SearchOverlay({ visible, onClose, onSelectIA, onSelectTool }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
    if (!visible) { setQuery(""); setResults([]); }
  }, [visible]);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    setResults(searchItems(q));
  }, []);

  const handleSelect = useCallback((item) => {
    if (item.type === "ia") { onSelectIA?.(item.key); onClose(); }
    else if (item.type === "division") { onSelectIA?.(item.key, true); onClose(); }
    else { onClose(); }
  }, [onSelectIA, onClose]);

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

      {/* Results */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {query.length > 0 && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(240,237,230,0.25)", fontSize: 12 }}>Aucun résultat pour "{query}"</div>
        )}

        {query.length === 0 && (
          <div style={{ padding: "20px 0" }}>
            <div style={{ fontSize: 9, color: "rgba(240,237,230,0.25)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Suggestions</div>
            {["isolation combles", "fissure mur", "prix carrelage", "artisan RGE", "MaPrimeRénov", "DTU placo", "diagnostic amiante", "fenêtre double vitrage"].map(s => (
              <button key={s} onClick={() => handleSearch(s)} style={{ display: "inline-block", margin: "0 6px 6px 0", padding: "7px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer", background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.15)", color: "rgba(240,237,230,0.5)" }}>{s}</button>
            ))}
          </div>
        )}

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
