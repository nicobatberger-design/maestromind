import { useApp } from "../context/AppContext";
import { PRODS } from "../data/constants";
import s from "../styles/index";

export default function ShopPage() {
  const { page, store, setStore } = useApp();

  return (
    <div style={{ ...s.page, ...(page === "shop" ? s.pageActive : {}) }}>
      <div style={s.wrap}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 3 }}>Boutique</div>
        <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 16 }}>Matériaux et outils chez nos partenaires</div>
        <div style={s.storeTabs}>
          {["leroy", "casto", "brico"].map(k => (
            <button key={k} style={store === k ? s.stabOn : s.stab} onClick={() => setStore(k)}>{k === "leroy" ? "Leroy Merlin" : k === "casto" ? "Castorama" : "Brico Dépôt"}</button>
          ))}
        </div>
        {PRODS[store].map((p, i) => (
          <div key={i} style={s.pi}>
            <div style={s.piw}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{p.n}</div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>{p.q}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#C9A84C", marginBottom: 4, textAlign: "right" }}>{p.p}</div>
              <button style={s.buyBtn} onClick={() => window.open(p.url || ("https://www." + p.s + "/recherche?q=" + encodeURIComponent(p.n) + "&utm_source=maestromind&utm_medium=app&utm_campaign=shop"), "_blank")}>Acheter</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
