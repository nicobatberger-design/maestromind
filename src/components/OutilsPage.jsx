import { useApp } from "../context/AppContext";
import s from "../styles/index";

export default function OutilsPage() {
  const {
    page,
    toolTab, setToolTab,
    devisText, setDevisText, devisResult, devisLoading,
    counterDevis, setCounterDevis, counterLoading,
    calcType, setCalcType, calcSurface, setCalcSurface, calcResult, calcLoading,
    primesRev, setPrimesRev, primesTrav, setPrimesTrav, primesSurf, setPrimesSurf, primesResult, primesLoading,
    artisanNom, setArtisanNom, artisanSpec, setArtisanSpec, artisanResult, artisanLoading,
    dpeS, setDpeS, dpeT, setDpeT, dpeC, setDpeC, dpeRes,
    planningType, setPlanningType, planningBudget, setPlanningBudget, planningResult, planningLoading,
    devisProDesc, setDevisProDesc, devisProClient, setDevisProClient, devisProSurface, setDevisProSurface, devisProResult, devisProLoading,
    rentaSurface, setRentaSurface, rentaTaux, setRentaTaux, rentaMat, setRentaMat, rentaDep, setRentaDep, rentaResult,
    analyserDevis, genererContreDevis, calculerMateriaux, calculerPrimes, verifierArtisan,
    planifierChantier, genererDevisPro, calculerRentabilite, calcDPE, genererDevisProPDF,
  } = useApp();

  return (
    <div style={{ ...s.page, ...(page === "outils" ? s.pageActive : {}) }}>
      <div style={s.wrap}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 3 }}>Outils IA</div>
        <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 12 }}>Devis · Matériaux · Primes · Artisans · DPE</div>
        <div style={{ display: "flex", gap: 5, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
          {[["devis", "Devis"], ["mat", "Matériaux"], ["primes", "Primes"], ["rge", "Artisan RGE"], ["dpe", "DPE"], ["planning", "Planning"], ["devis_pro", "Devis Pro"], ["rentabilite", "Rentabilité"]].map(([k, l]) => (
            <button key={k} onClick={() => setToolTab(k)} style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: toolTab === k ? "linear-gradient(135deg,#EDD060,#C9A84C,#9A7228)" : "rgba(15,19,28,0.7)", color: toolTab === k ? "#06080D" : "rgba(240,237,230,0.5)", transition: "all 0.2s" }}>{l}</button>
          ))}
        </div>

        {toolTab === "devis" && <div>
          <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Coller votre devis ici</div>
          <textarea style={{ ...s.ci, width: "100%", minHeight: 160, borderRadius: 12, padding: "12px 14px", marginBottom: 10, lineHeight: 1.6 }} value={devisText} onChange={e => setDevisText(e.target.value)} placeholder={"Posez carrelage salle de bain 8m²... fourniture et pose... 1 200€\nEvacuations sanitaires... 350€\n..."} />
          <button style={devisLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={analyserDevis} disabled={devisLoading}>{devisLoading ? "Analyse en cours..." : "\u{1F50D} Analyser le devis"}</button>
          {devisResult && <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: devisResult.verdict === "CORRECT" ? "rgba(82,195,122,0.15)" : devisResult.verdict === "ÉLEVÉ" ? "rgba(232,135,58,0.15)" : "rgba(224,82,82,0.15)", color: devisResult.verdict === "CORRECT" ? "#52C37A" : devisResult.verdict === "ÉLEVÉ" ? "#E8873A" : "#E05252", border: "0.5px solid currentColor" }}>{devisResult.verdict}</span>
              <div style={{ fontSize: 12, color: "rgba(240,237,230,0.75)", flex: 1 }}>{devisResult.resume}</div>
            </div>
            {devisResult.points.map((p, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}><div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "0.5px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#C9A84C", flexShrink: 0 }}>{i + 1}</div><div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)", lineHeight: 1.5 }}>{p}</div></div>)}
            {devisResult.conseil && <div style={{ ...s.card, marginTop: 10, borderColor: "rgba(82,195,122,0.2)", background: "rgba(82,195,122,0.05)" }}><div style={{ fontSize: 10, color: "#52C37A", fontWeight: 700, marginBottom: 4 }}>CONSEIL</div><div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)" }}>{devisResult.conseil}</div></div>}
          </div>}
          {devisResult && !counterDevis && (<button style={counterLoading ? { ...s.greenBtn, opacity: 0.5, borderColor: "rgba(232,135,58,0.4)", color: "#E8873A" } : { ...s.greenBtn, borderColor: "rgba(232,135,58,0.45)", color: "#E8873A" }} onClick={genererContreDevis} disabled={counterLoading}>{counterLoading ? "Génération en cours..." : "\u270D\uFE0F Négocier ce devis (contre-devis IA)"}</button>)}
          {counterDevis && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 9, color: "#E8873A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>CONTRE-DEVIS NÉGOCIÉ</div>
              {counterDevis.lignes.map((l, i) => (<div key={i} style={{ ...s.card, marginBottom: 7, borderColor: "rgba(232,135,58,0.15)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}><div style={{ fontSize: 12, fontWeight: 600, flex: 1, marginRight: 8 }}>{l.poste}</div><div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontSize: 10, color: "rgba(240,237,230,0.35)", textDecoration: "line-through" }}>{l.prix_demande}</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: "#52C37A" }}>{l.prix_negocie}</div></div></div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", lineHeight: 1.5 }}>{"\u{1F4AC}"} {l.argument}</div></div>))}
              <div style={{ ...s.card, background: "rgba(82,195,122,0.06)", borderColor: "rgba(82,195,122,0.2)", marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: 12, color: "rgba(240,237,230,0.7)" }}>Économie potentielle</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#52C37A" }}>{counterDevis.economie_totale}</div></div></div>
              <div style={{ ...s.card, background: "rgba(82,144,224,0.05)", borderColor: "rgba(82,144,224,0.2)", marginBottom: 10 }}><div style={{ fontSize: 10, color: "#5290E0", fontWeight: 700, marginBottom: 6 }}>MESSAGE À ENVOYER À L'ARTISAN</div><div style={{ fontSize: 12, color: "rgba(240,237,230,0.7)", lineHeight: 1.7, fontStyle: "italic" }}>"{counterDevis.message_negociation}"</div></div>
              {counterDevis.conseil && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", lineHeight: 1.6, marginBottom: 8 }}>{"\u{1F4A1}"} {counterDevis.conseil}</div>}
              <button onClick={() => { setCounterDevis(null); }} style={{ ...s.greenBtn, background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(240,237,230,0.4)" }}>{"\u2190"} Nouvelle analyse</button>
            </div>
          )}
        </div>}

        {toolTab === "mat" && <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Type de travaux</div><select style={s.inp} value={calcType} onChange={e => setCalcType(e.target.value)}>{["Peinture", "Carrelage", "Parquet", "Placo BA13", "Enduit", "Isolation murs", "Isolation combles", "Toiture", "Béton dalle", "Ragréage"].map(t => <option key={t}>{t}</option>)}</select></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Surface m²</div><input style={s.inp} type="number" value={calcSurface} onChange={e => setCalcSurface(e.target.value)} /></div>
          </div>
          <button style={calcLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={calculerMateriaux} disabled={calcLoading}>{calcLoading ? "Calcul en cours..." : "\u{1F4D0} Calculer les matériaux"}</button>
          {calcResult && <div style={{ marginTop: 12 }}>
            {calcResult.materiaux.map((m, i) => <div key={i} style={{ ...s.pi, marginBottom: 8 }}><div style={s.piw}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></div><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{m.nom}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)" }}>{m.quantite} · {m.conseil}</div></div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#C9A84C" }}>{m.prixEstime}</div></div>)}
            <div style={{ ...s.card, background: "rgba(201,168,76,0.06)", borderColor: "rgba(201,168,76,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)" }}>Total estimé</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#C9A84C" }}>{calcResult.total}</div></div>
            {calcResult.conseil && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", marginTop: 8, lineHeight: 1.6 }}>{"\u{1F4A1}"} {calcResult.conseil}</div>}
          </div>}
        </div>}

        {toolTab === "primes" && <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Revenus du foyer</div><select style={s.inp} value={primesRev} onChange={e => setPrimesRev(e.target.value)}>{["Très modeste", "Modeste", "Intermédiaire", "Supérieur"].map(r => <option key={r}>{r}</option>)}</select></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Surface m²</div><input style={s.inp} type="number" value={primesSurf} onChange={e => setPrimesSurf(e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 12 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Type de travaux</div><select style={s.inp} value={primesTrav} onChange={e => setPrimesTrav(e.target.value)}>{["Isolation combles", "Isolation murs", "Pompe à chaleur", "Chaudière gaz à condensation", "Poêle à granulés", "VMC double flux", "Fenêtres double vitrage", "Rénovation globale"].map(t => <option key={t}>{t}</option>)}</select></div>
          <button style={primesLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={calculerPrimes} disabled={primesLoading}>{primesLoading ? "Calcul en cours..." : "\u{1F4B0} Calculer mes aides 2025"}</button>
          {primesResult && <div style={{ marginTop: 12 }}>
            {primesResult.aides.map((a, i) => <div key={i} style={{ ...s.card, marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: "#F0EDE6", flex: 1, marginRight: 8 }}>{a.nom}</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "#52C37A", flexShrink: 0 }}>{a.montant}</div></div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)", marginBottom: 3 }}>{a.condition}</div><div style={{ fontSize: 10, color: "rgba(82,195,122,0.7)" }}>{"\u2192"} {a.demarche}</div></div>)}
            <div style={{ ...s.card, background: "rgba(82,195,122,0.06)", borderColor: "rgba(82,195,122,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={{ fontSize: 12 }}>Total aides estimées</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#52C37A" }}>{primesResult.total}</div></div>
            {primesResult.attention && <div style={{ ...s.errBox, borderColor: "rgba(232,135,58,0.3)", background: "rgba(232,135,58,0.05)", color: "#E8873A" }}>{"\u26A0\uFE0F"} {primesResult.attention}</div>}
            {primesResult.conseil && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", lineHeight: 1.6 }}>{"\u{1F4A1}"} {primesResult.conseil}</div>}
          </div>}
        </div>}

        {toolTab === "rge" && <div>
          <div style={{ marginBottom: 8 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Nom de l'artisan ou entreprise</div><input style={s.inp} value={artisanNom} onChange={e => setArtisanNom(e.target.value)} placeholder="Ex: Plomberie Durand, SAS Martin BTP..." /></div>
          <div style={{ marginBottom: 12 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Spécialité</div><select style={s.inp} value={artisanSpec} onChange={e => setArtisanSpec(e.target.value)}>{["Maçonnerie", "Plomberie", "Électricité", "Isolation", "Chauffage", "Charpente", "Couverture", "Carrelage", "Peinture", "Menuiserie"].map(t => <option key={t}>{t}</option>)}</select></div>
          <button style={artisanLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={verifierArtisan} disabled={artisanLoading}>{artisanLoading ? "Vérification en cours..." : "\u{1F6E1}\uFE0F Vérifier cet artisan"}</button>
          {artisanResult && <div style={{ marginTop: 12 }}>
            {(() => { const score = Math.min(100, Math.round((artisanResult.checks?.length || 0) * 12.5)); const color = score >= 75 ? "#52C37A" : score >= 50 ? "#E8873A" : "#E05252"; const label = score >= 75 ? "\u2705 Artisan fiable" : score >= 50 ? "\u26A0\uFE0F Vérifications requises" : "\u{1F6AB} Risque élevé"; return (<div style={{ ...s.card, textAlign: "center", marginBottom: 12 }}><div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 10px" }}><svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" /><circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="7" strokeDasharray={score * 2.136 + " " + 213.6} strokeDashoffset="53.4" strokeLinecap="round" /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color }}>{score}%</div></div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color }}>{label}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)", marginTop: 3 }}>{artisanResult.checks?.length || 0} points vérifiés</div></div>); })()}
            {artisanResult.alertes?.length > 0 && <div style={{ marginBottom: 10 }}>{artisanResult.alertes.map((a, i) => <div key={i} style={{ ...s.errBox, marginBottom: 6 }}>{"\u26A0\uFE0F"} {a}</div>)}</div>}
            {artisanResult.checks?.map((c, i) => <div key={i} style={{ ...s.card, marginBottom: 7 }}><div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(82,195,122,0.1)", border: "0.5px solid rgba(82,195,122,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#52C37A", flexShrink: 0 }}>{"\u2713"}</div><div><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{c.label}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)", lineHeight: 1.5 }}>{c.comment}</div>{c.url && c.url !== "" && <div style={{ fontSize: 10, color: "#5290E0", marginTop: 3 }}>{"\u2192"} {c.url}</div>}</div></div></div>)}
            {artisanResult.conseils && <div style={{ ...s.card, background: "rgba(201,168,76,0.05)", borderColor: "rgba(201,168,76,0.2)", marginTop: 4 }}><div style={{ fontSize: 10, color: "#C9A84C", fontWeight: 700, marginBottom: 4 }}>CONSEIL GLOBAL</div><div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)", lineHeight: 1.6 }}>{artisanResult.conseils}</div></div>}
          </div>}
        </div>}

        {toolTab === "dpe" && <div>
          <div style={s.card}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 11 }}>
              <div><div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 6, textTransform: "uppercase" }}>Type de bien</div><select style={s.inp} value={dpeT} onChange={e => setDpeT(e.target.value)}><option>Appartement</option><option>Maison</option></select></div>
              <div><div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 6, textTransform: "uppercase" }}>Surface m²</div><input style={s.inp} type="number" value={dpeS} onChange={e => setDpeS(parseInt(e.target.value) || 75)} /></div>
            </div>
            <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 6, textTransform: "uppercase" }}>Chauffage actuel</div>
            <select style={{ ...s.inp, marginBottom: 12 }} value={dpeC} onChange={e => setDpeC(e.target.value)}><option>Gaz naturel</option><option>Électrique</option><option>Fioul</option><option>Pompe à chaleur</option></select>
            <button style={s.greenBtn} onClick={calcDPE}>Calculer mes aides</button>
          </div>
          {dpeRes && <div style={s.card}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Vos aides estimées</div>
            <div style={s.aides}>{[["MaPrimeRénov", dpeRes.prime], ["CEE", dpeRes.cee], ["Total aides", dpeRes.total], ["Économies/an", dpeRes.eco]].map(([l, v]) => (<div key={l} style={s.aideC}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#52C37A" }}>{v.toLocaleString("fr-FR")}{"\u20AC"}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 2 }}>{l}</div></div>))}</div>
          </div>}
        </div>}

        {toolTab === "planning" && <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Type de projet</div><select style={s.inp} value={planningType} onChange={e => setPlanningType(e.target.value)}>{["Rénovation salle de bain", "Rénovation cuisine", "Isolation combles", "Isolation murs", "Pose carrelage", "Cloison BA13", "Peinture appartement", "Rénovation complète", "Installation électrique", "Plomberie sanitaires"].map(t => <option key={t}>{t}</option>)}</select></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Budget {"\u20AC"}</div><input style={s.inp} type="number" value={planningBudget} onChange={e => setPlanningBudget(e.target.value)} /></div>
          </div>
          <button style={planningLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={planifierChantier} disabled={planningLoading}>{planningLoading ? "Planification en cours..." : "\u{1F4C5} Générer le planning chantier"}</button>
          {planningResult && <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800 }}>{planningResult.duree_totale}</div><div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)" }}>· {planningType}</div></div>
            {planningResult.semaines.map((sem, i) => (<div key={i} style={{ ...s.card, marginBottom: 9, borderLeft: "2.5px solid #C9A84C" }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: "linear-gradient(135deg,#EDD060,#C9A84C)", color: "#06080D", fontWeight: 800 }}>S{sem.numero}</span><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700 }}>{sem.titre}</div></div>{sem.taches.map((t, j) => <div key={j} style={{ display: "flex", gap: 7, marginBottom: 5 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(82,195,122,0.1)", border: "0.5px solid rgba(82,195,122,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#52C37A", flexShrink: 0 }}>{"\u2713"}</div><div style={{ fontSize: 11, color: "rgba(240,237,230,0.6)" }}>{t}</div></div>)}{sem.materiaux_a_commander?.length > 0 && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "0.5px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, marginBottom: 4 }}>{"\u{1F6D2}"} À COMMANDER</div>{sem.materiaux_a_commander.map((m, j) => <div key={j} style={{ fontSize: 10, color: "rgba(240,237,230,0.45)", marginBottom: 2 }}>{"\u2192"} {m}</div>)}</div>}{sem.attention && <div style={{ marginTop: 8, padding: "6px 9px", borderRadius: 8, background: "rgba(232,135,58,0.08)", border: "0.5px solid rgba(232,135,58,0.25)", fontSize: 10, color: "#E8873A" }}>{"\u26A0\uFE0F"} {sem.attention}</div>}</div>))}
            {planningResult.ordre_metiers?.length > 0 && <div style={{ ...s.card, marginBottom: 9 }}><div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, marginBottom: 8 }}>ORDRE DES CORPS DE MÉTIER</div>{planningResult.ordre_metiers.map((m, i) => <div key={i} style={{ fontSize: 11, color: "rgba(240,237,230,0.6)", marginBottom: 4 }}>{m}</div>)}</div>}
            {planningResult.budget_detail && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", marginBottom: 8, lineHeight: 1.6 }}>{"\u{1F4B6}"} {planningResult.budget_detail}</div>}
            {planningResult.conseils && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", lineHeight: 1.6 }}>{"\u{1F4A1}"} {planningResult.conseils}</div>}
          </div>}
        </div>}

        {toolTab === "devis_pro" && <div>
          <div style={{ fontSize: 9, color: "#E8873A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>GÉNÉRATEUR DEVIS ARTISAN</div>
          <div style={{ marginBottom: 8 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Décrivez les travaux</div><textarea style={{ ...s.ci, width: "100%", minHeight: 100, borderRadius: 12, padding: "10px 14px", marginBottom: 0, lineHeight: 1.6 }} value={devisProDesc} onChange={e => setDevisProDesc(e.target.value)} placeholder="Ex: Pose carrelage salle de bain 8m²..." /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Client</div><input style={s.inp} value={devisProClient} onChange={e => setDevisProClient(e.target.value)} placeholder="Nom du client" /></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Surface m²</div><input style={s.inp} type="number" value={devisProSurface} onChange={e => setDevisProSurface(e.target.value)} /></div>
          </div>
          <button style={devisProLoading ? { ...s.greenBtn, opacity: 0.5, borderColor: "rgba(232,135,58,0.4)", color: "#E8873A" } : { ...s.greenBtn, borderColor: "rgba(232,135,58,0.45)", color: "#E8873A" }} onClick={genererDevisPro} disabled={devisProLoading}>{devisProLoading ? "Génération en cours..." : "\u{1F4C4} Générer le devis professionnel"}</button>
          {devisProResult && <div style={{ marginTop: 12 }}>
            <div style={{ ...s.card, background: "rgba(201,168,76,0.05)", borderColor: "rgba(201,168,76,0.25)", marginBottom: 10 }}>
              {(devisProResult.lignes || []).map((l, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "7px 0", borderBottom: i < devisProResult.lignes.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}><div style={{ flex: 1, marginRight: 10 }}><div style={{ fontSize: 11, fontWeight: 500 }}>{l.description}</div>{l.dtu && <div style={{ fontSize: 9, color: "#C9A84C", marginTop: 1 }}>{l.dtu}</div>}<div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)" }}>{l.quantite} {l.unite} × {l.prix_unitaire}</div></div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#C9A84C", flexShrink: 0 }}>{l.total}</div></div>)}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 6, borderTop: "0.5px solid rgba(201,168,76,0.2)" }}><div style={{ fontSize: 12, color: "rgba(240,237,230,0.5)" }}>Total TTC</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#C9A84C" }}>{devisProResult.total_ttc}</div></div>
            </div>
            <button style={s.dlBtn} onClick={genererDevisProPDF}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Télécharger le devis PDF</button>
            <button onClick={() => { setDevisProDesc(""); }} style={{ ...s.greenBtn, marginTop: 8, background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(240,237,230,0.4)" }}>{"\u2190"} Nouveau devis</button>
          </div>}
        </div>}

        {toolTab === "rentabilite" && <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[["Surface chantier m²", rentaSurface, setRentaSurface], ["Taux horaire \u20AC/h", rentaTaux, setRentaTaux], ["Coût matériaux \u20AC", rentaMat, setRentaMat], ["Déplacements \u20AC", rentaDep, setRentaDep]].map(([label, val, set]) => (
              <div key={label}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div><input style={s.inp} type="number" value={val} onChange={e => set(e.target.value)} /></div>
            ))}
          </div>
          <button style={s.greenBtn} onClick={calculerRentabilite}>{"\u{1F4CA}"} Calculer ma rentabilité</button>
          {rentaResult && <div style={{ marginTop: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              {[["CA Total", rentaResult.ca_total + "\u20AC", "#C9A84C"], ["Bénéfice net", rentaResult.benef + "\u20AC", rentaResult.benef > 0 ? "#52C37A" : "#E05252"], ["Marge", rentaResult.marge + "%", rentaResult.marge > 25 ? "#52C37A" : rentaResult.marge > 10 ? "#E8873A" : "#E05252"], ["Prix/m²", rentaResult.prix_m2 + "\u20AC", "#5290E0"]].map(([l, v, c]) => (
                <div key={l} style={{ ...s.sc, textAlign: "left", padding: "12px 14px" }}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: c }}>{v}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 3 }}>{l}</div></div>
              ))}
            </div>
            <div style={s.card}>
              <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>DÉTAIL</div>
              {[["Main d'œuvre (" + rentaResult.heures + "h × " + rentaTaux + "\u20AC/h)", rentaResult.mo + "\u20AC", "rgba(240,237,230,0.7)"], ["Matériaux", rentaMat + "\u20AC", "rgba(240,237,230,0.5)"], ["Déplacements", rentaDep + "\u20AC", "rgba(240,237,230,0.5)"], ["Charges sociales (45%)", "-" + rentaResult.charges + "\u20AC", "#E05252"], ["Bénéfice net", "\u2192 " + rentaResult.benef + "\u20AC", rentaResult.benef > 0 ? "#52C37A" : "#E05252"]].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><div style={{ fontSize: 11, color: "rgba(240,237,230,0.55)" }}>{l}</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: c }}>{v}</div></div>
              ))}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
              <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}><div style={{ width: Math.max(0, Math.min(rentaResult.marge, 100)) + "%", height: "100%", borderRadius: 4, background: rentaResult.marge > 25 ? "linear-gradient(90deg,#52C37A,#C9A84C)" : rentaResult.marge > 10 ? "#E8873A" : "#E05252", transition: "width 0.6s ease" }} /></div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", marginTop: 4 }}>Marge : {rentaResult.marge}% {rentaResult.marge < 15 ? "\u26A0\uFE0F Insuffisante" : rentaResult.marge > 30 ? "\u2705 Excellente" : ""}</div>
            </div>
          </div>}
        </div>}

      </div>
    </div>
  );
}
