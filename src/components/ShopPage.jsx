import { useState, useMemo, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { PRODS } from "../data/constants";
import s from "../styles/index";
import { safeSetItem } from "../utils/storage";

export default function ShopPage() {
  const { page, store, setStore } = useApp();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Tout");
  const [favoris, setFavoris] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mm_shop_favoris")) || []; } catch { return []; }
  });

  const toggleFavori = useCallback((nom) => {
    setFavoris(prev => {
      const next = prev.includes(nom) ? prev.filter(f => f !== nom) : [...prev, nom];
      safeSetItem("mm_shop_favoris", JSON.stringify(next));
      return next;
    });
  }, []);

  // Catégories disponibles pour le magasin actif
  const categories = useMemo(() => {
    const cats = new Set(PRODS[store].map(p => p.cat));
    return ["Tout", ...Array.from(cats).sort()];
  }, [store]);

  // Filtrage produits
  const filtered = useMemo(() => {
    let items = PRODS[store];
    if (catFilter !== "Tout") items = items.filter(p => p.cat === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(p => p.n.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q));
    }
    return items;
  }, [store, catFilter, search]);

  return (
    <div style={{ ...s.page, ...(page === "shop" ? s.pageActive : {}) }}>
      <div style={s.wrap}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 3 }}>Boutique</div>
        <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 12 }}>Matériaux et outils chez nos partenaires</div>

        {/* Recherche */}
        <input type="text" placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...s.inp, marginBottom: 10 }} />

        {/* Onglets magasins */}
        <div style={s.storeTabs}>
          {["leroy", "casto", "brico"].map(k => (
            <button key={k} style={store === k ? s.stabOn : s.stab} onClick={() => { setStore(k); setCatFilter("Tout"); }}>{k === "leroy" ? "Leroy Merlin" : k === "casto" ? "Castorama" : "Brico Dépôt"}</button>
          ))}
        </div>

        {/* Filtres catégories */}
        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2, marginBottom: 10, scrollbarWidth: "none" }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              flexShrink: 0, padding: "5px 10px", borderRadius: 20, fontSize: 9, fontWeight: 600, cursor: "pointer",
              border: catFilter === c ? "0.5px solid #C9A84C" : "0.5px solid rgba(255,255,255,0.07)",
              background: catFilter === c ? "rgba(201,168,76,0.12)" : "transparent",
              color: catFilter === c ? "#C9A84C" : "rgba(240,237,230,0.45)",
              whiteSpace: "nowrap",
            }}>{c}</button>
          ))}
        </div>

        {/* Résultats */}
        <div style={{ fontSize: 9, color: "rgba(240,237,230,0.3)", marginBottom: 6 }}>{filtered.length} produit{filtered.length > 1 ? "s" : ""}</div>

        {filtered.map((p, i) => (
          <div key={i} style={{ ...s.pi, position: "relative" }}>
            <button onClick={() => toggleFavori(p.n)} style={{ position: "absolute", top: 6, right: 6, background: "none", border: "none", padding: 0, fontSize: 14, cursor: "pointer", color: favoris.includes(p.n) ? "#C9A84C" : "rgba(240,237,230,0.3)", lineHeight: 1 }} title={favoris.includes(p.n) ? "Retirer des favoris" : "Ajouter aux favoris"}>{favoris.includes(p.n) ? "★" : "☆"}</button>
            <div style={s.piw}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{p.n}</div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>{p.q}</span>
                <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 10, background: "rgba(201,168,76,0.08)", color: "#C9A84C", border: "0.5px solid rgba(201,168,76,0.15)" }}>{p.cat}</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#C9A84C", marginBottom: 4, textAlign: "right" }}>{p.p}</div>
              <button style={s.buyBtn} onClick={() => window.open(p.url || ("https://www." + p.s + "/recherche?q=" + encodeURIComponent(p.n) + "&utm_source=maestromind&utm_medium=app&utm_campaign=shop"), "_blank")}>Acheter</button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 16px", color: "rgba(240,237,230,0.3)", fontSize: 11 }}>
            Aucun produit trouvé. Essayez un autre terme de recherche.
          </div>
        )}
      </div>
    </div>
  );
}
