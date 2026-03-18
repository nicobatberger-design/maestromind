import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { IAS, DIVISIONS } from "../data/constants";
import s from "../styles/index";

export default function DashboardPage() {
  const { page, projets, userType } = useApp();
  const [stats, setStats] = useState(null);

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

    setStats({ msgCount, positives, negatives, satisfaction, topIAs, convCount, totalMsgs, projetsCount: projets.length });
  }, [page, projets]);

  if (!stats) return null;

  const StatCard = ({ label, value, color = "#C9A84C", sub }) => (
    <div style={{ ...s.sc, textAlign: "left", padding: "14px 16px" }}>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "rgba(240,237,230,0.3)", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ ...s.page, ...(page === "dashboard" ? s.pageActive : {}) }}>
      <div style={s.wrap}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 3 }}>Dashboard PDG</div>
        <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 16 }}>Métriques d'usage — {userType}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <StatCard label="Messages envoyés" value={stats.msgCount} />
          <StatCard label="Satisfaction" value={stats.satisfaction + "%"} color={stats.satisfaction >= 70 ? "#52C37A" : stats.satisfaction >= 40 ? "#E8873A" : "#E05252"} sub={stats.positives + " \u{1F44D} / " + stats.negatives + " \u{1F44E}"} />
          <StatCard label="Conversations" value={stats.convCount} color="#5290E0" sub={stats.totalMsgs + " messages total"} />
          <StatCard label="Projets actifs" value={stats.projetsCount} color="#52C37A" />
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

        <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 16, marginBottom: 10 }}>Divisions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {Object.entries(DIVISIONS).map(([div, info]) => (
            <div key={div} style={{ background: "rgba(15,19,28,0.6)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: info.color }}>{info.ias.length}</div>
              <div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", marginTop: 2 }}>{div}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
