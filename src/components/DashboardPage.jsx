import { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { IAS, DIVISIONS, getCustomPrompts, saveCustomPrompt, resetCustomPrompt } from "../data/constants";
import s from "../styles/index";

export default function DashboardPage() {
  const { page, projets, userType } = useApp();
  const [stats, setStats] = useState(null);
  const [editIA, setEditIA] = useState(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [customPrompts, setCustomPrompts] = useState({});

  const [trends, setTrends] = useState({});
  const [recentConvs, setRecentConvs] = useState([]);

  useEffect(() => {
    if (page !== "dashboard") return;
    // Collecter les stats depuis localStorage
    const msgCount = parseInt(localStorage.getItem("bl_msg_count") || "0");
    let ratings = [];
    try { ratings = JSON.parse(localStorage.getItem("bl_ratings") || "[]"); } catch {}
    const positives = ratings.filter(r => r.rating === 1).length;
    const negatives = ratings.filter(r => r.rating === -1).length;
    const satisfaction = ratings.length > 0 ? Math.round((positives / ratings.length) * 100) : 0;

    // IA les plus utilisées
    const iaUsage = {};
    ratings.forEach(r => { iaUsage[r.ia] = (iaUsage[r.ia] || 0) + 1; });
    const topIAs = Object.entries(iaUsage).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Conversations sauvegardées
    let convCount = 0;
    let totalMsgs = 0;
    Object.keys(IAS).forEach(k => {
      try { const c = JSON.parse(localStorage.getItem("mm_chat_" + k) || "[]"); if (c.length > 1) { convCount++; totalMsgs += c.length; } } catch {}
    });

    const currentStats = { msgCount, satisfaction, convCount, projetsCount: projets.length };

    // Tendances vs dernier snapshot
    try {
      const prev = JSON.parse(localStorage.getItem("mm_dash_snapshot") || "null");
      if (prev) {
        const t = {};
        for (const k of Object.keys(currentStats)) {
          if (currentStats[k] > prev[k]) t[k] = "up";
          else if (currentStats[k] < prev[k]) t[k] = "down";
        }
        setTrends(t);
      }
    } catch {}
    localStorage.setItem("mm_dash_snapshot", JSON.stringify(currentStats));

    // Dernière activité — 3 conversations les plus récentes
    const convs = [];
    const chatPrefixes = ["bl_chat_", "mm_chat_"];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!chatPrefixes.some(p => key.startsWith(p))) continue;
      try {
        const msgs = JSON.parse(localStorage.getItem(key) || "[]");
        if (!Array.isArray(msgs) || msgs.length < 2) continue;
        const lastMsg = msgs[msgs.length - 1];
        const iaKey = key.replace("bl_chat_", "").replace("mm_chat_", "");
        const text = lastMsg.text || lastMsg.content || "";
        const ts = lastMsg.ts || lastMsg.timestamp || Date.now();
        convs.push({ iaKey, text: text.slice(0, 30), ts });
      } catch {}
    }
    convs.sort((a, b) => b.ts - a.ts);
    setRecentConvs(convs.slice(0, 3));

    setStats({ msgCount, positives, negatives, satisfaction, topIAs, convCount, totalMsgs, projetsCount: projets.length });
    setCustomPrompts(getCustomPrompts());
  }, [page, projets]);

  const openEditIA = useCallback((iaKey) => {
    const custom = getCustomPrompts();
    setEditIA(iaKey);
    setEditPrompt(custom[iaKey] || IAS[iaKey]?.sys || "");
  }, []);

  const saveEditIA = useCallback(() => {
    if (!editIA) return;
    saveCustomPrompt(editIA, editPrompt);
    setCustomPrompts(getCustomPrompts());
    setEditIA(null);
  }, [editIA, editPrompt]);

  const resetEditIA = useCallback(() => {
    if (!editIA) return;
    resetCustomPrompt(editIA);
    setEditPrompt(IAS[editIA]?.sys || "");
    setCustomPrompts(getCustomPrompts());
  }, [editIA]);

  if (!stats) return null;

  const isEmpty = stats.msgCount === 0 && stats.convCount === 0 && stats.projetsCount === 0;

  const relativeDate = (ts) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return "il y a " + mins + "min";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return "il y a " + hrs + "h";
    const days = Math.floor(hrs / 24);
    if (days === 1) return "hier";
    if (days < 7) return "il y a " + days + "j";
    return "il y a " + Math.floor(days / 7) + " sem.";
  };

  const StatCard = ({ label, value, color = "#C9A84C", sub, trend }) => (
    <div style={{ ...s.sc, textAlign: "left", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color }}>{value}</div>
        {trend === "up" && <span style={{ fontSize: 14, color: "#52C37A", fontWeight: 700 }}>↑</span>}
        {trend === "down" && <span style={{ fontSize: 14, color: "#E05252", fontWeight: 700 }}>↓</span>}
      </div>
      <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "rgba(240,237,230,0.3)", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ ...s.page, ...(page === "dashboard" ? s.pageActive : {}) }}>
      <div style={s.wrap}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 3 }}>Dashboard PDG</div>
        <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 16 }}>Métriques d'usage — {userType}</div>

        {isEmpty && (
          <div style={{ ...s.card, textAlign: "center", padding: "32px 20px", marginBottom: 16 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><path d="M3 3v18h18"/><path d="M18 9l-5 5-2-2-4 4"/></svg>
            <div style={{ fontSize: 13, color: "rgba(240,237,230,0.6)", lineHeight: 1.6 }}>Commencez à utiliser MAESTROMIND pour voir vos statistiques ici.</div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <StatCard label="Messages envoyés" value={stats.msgCount} trend={trends.msgCount} />
          <StatCard label="Satisfaction" value={stats.satisfaction + "%"} color={stats.satisfaction >= 70 ? "#52C37A" : stats.satisfaction >= 40 ? "#E8873A" : "#E05252"} sub={stats.positives + " \u{1F44D} / " + stats.negatives + " \u{1F44E}"} trend={trends.satisfaction} />
          <StatCard label="Conversations" value={stats.convCount} color="#5290E0" sub={stats.totalMsgs + " messages total"} trend={trends.convCount} />
          <StatCard label="Projets actifs" value={stats.projetsCount} color="#52C37A" trend={trends.projetsCount} />
        </div>

        {stats.topIAs.length > 0 && <>
          <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>IA les plus utilisées</div>
          {stats.topIAs.map(([ia, count], i) => (
            <div key={ia} style={{ ...s.card, marginBottom: 7, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: (IAS[ia]?.color || "#C9A84C") + "22", border: "0.5px solid " + (IAS[ia]?.color || "#C9A84C") + "44", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 800, color: IAS[ia]?.color || "#C9A84C", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{IAS[ia]?.name || ia}</div>
                <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)" }}>{count} interactions</div>
              </div>
              <div style={{ height: 6, width: 60, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ width: Math.round((count / stats.topIAs[0][1]) * 100) + "%", height: "100%", borderRadius: 3, background: IAS[ia]?.color || "#C9A84C" }} />
              </div>
            </div>
          ))}
        </>}

        {recentConvs.length > 0 && <>
          <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 16, marginBottom: 10 }}>Dernière activité</div>
          {recentConvs.map((c, i) => (
            <div key={i} style={{ ...s.card, marginBottom: 7, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: (IAS[c.iaKey]?.color || "#C9A84C") + "22", border: "0.5px solid " + (IAS[c.iaKey]?.color || "#C9A84C") + "44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{IAS[c.iaKey]?.icon || "\u{1F4AC}"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: IAS[c.iaKey]?.color || "#C9A84C" }}>{IAS[c.iaKey]?.name || c.iaKey}</div>
                <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.text || "..."}</div>
              </div>
              <div style={{ fontSize: 9, color: "rgba(240,237,230,0.3)", flexShrink: 0, whiteSpace: "nowrap" }}>{relativeDate(c.ts)}</div>
            </div>
          ))}
        </>}

        <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 16, marginBottom: 10 }}>Divisions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {Object.entries(DIVISIONS).map(([div, info]) => (
            <div key={div} style={{ background: "rgba(15,19,28,0.6)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: info.color }}>{info.ias.length}</div>
              <div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", marginTop: 2 }}>{div}</div>
            </div>
          ))}
        </div>

        {/* Éditeur System Prompts */}
        <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 20, marginBottom: 10 }}>Éditeur IA — System Prompts</div>
        <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", marginBottom: 10 }}>{"Modifiez les prompts des " + Object.keys(IAS).length + " IA en temps réel"}. Les changements sont appliqués immédiatement.</div>

        {editIA ? (
          <div style={{ ...s.card, border: "0.5px solid rgba(201,168,76,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: IAS[editIA]?.color || "#C9A84C" }}>{IAS[editIA]?.name}</div>
              {customPrompts[editIA] && <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 10, background: "rgba(82,195,122,0.1)", color: "#52C37A", border: "0.5px solid rgba(82,195,122,0.3)" }}>personnalisé</span>}
            </div>
            <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} style={{ ...s.inp, minHeight: 160, resize: "vertical", lineHeight: 1.5, fontSize: 10 }} />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={saveEditIA} style={{ flex: 1, padding: 10, borderRadius: 10, fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(82,195,122,0.08)", border: "0.5px solid rgba(82,195,122,0.4)", color: "#52C37A" }}>Sauvegarder</button>
              <button onClick={resetEditIA} style={{ padding: 10, borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(224,82,82,0.06)", border: "0.5px solid rgba(224,82,82,0.25)", color: "#E05252" }}>Reset</button>
              <button onClick={() => setEditIA(null)} style={{ padding: 10, borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "transparent", border: "0.5px solid rgba(255,255,255,0.08)", color: "rgba(240,237,230,0.4)" }}>Fermer</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {Object.entries(DIVISIONS).map(([div, info]) => (
              <div key={div}>
                <div style={{ fontSize: 9, color: info.color, fontWeight: 700, marginTop: 8, marginBottom: 4 }}>{div}</div>
                {info.ias.map(k => (
                  <button key={k} onClick={() => openEditIA(k)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 8, marginBottom: 3, cursor: "pointer", background: customPrompts[k] ? "rgba(82,195,122,0.04)" : "rgba(15,19,28,0.5)", border: customPrompts[k] ? "0.5px solid rgba(82,195,122,0.2)" : "0.5px solid rgba(255,255,255,0.05)", textAlign: "left" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: IAS[k]?.color || "#C9A84C", flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 11, color: "rgba(240,237,230,0.7)", fontWeight: 500 }}>{IAS[k]?.name}</div>
                    {customPrompts[k] && <span style={{ fontSize: 7, color: "#52C37A" }}>modifié</span>}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.2)" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
