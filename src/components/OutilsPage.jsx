import { useApp } from "../context/AppContext";
import { genererOutilPDF } from "../utils/pdf";
import MesureAssistant from "./MesureAssistant";
import ChecklistChantier from "./ChecklistChantier";
import Tooltip from "./Tooltip";
import s from "../styles/index";

export default function OutilsPage() {
  const {
    page,
    toolTab, setToolTab,
    devisText, setDevisText, devisResult, devisLoading,
    counterDevis, setCounterDevis, counterLoading,
    calcType, setCalcType, calcSurface, setCalcSurface, calcHauteur, setCalcHauteur, calcPente, setCalcPente, calcLongueur, setCalcLongueur, calcResult, calcLoading,
    primesRev, setPrimesRev, primesTrav, setPrimesTrav, primesSurf, setPrimesSurf, primesResult, primesLoading,
    artisanNom, setArtisanNom, artisanSpec, setArtisanSpec, artisanResult, artisanLoading,
    dpeS, setDpeS, dpeT, setDpeT, dpeC, setDpeC, dpeRes, dpeRevenu, setDpeRevenu, dpeTravaux, setDpeTravaux,
    planningType, setPlanningType, planningBudget, setPlanningBudget, planningResult, planningLoading,
    devisProDesc, setDevisProDesc, devisProClient, setDevisProClient, devisProSurface, setDevisProSurface, devisProResult, devisProLoading,
    rentaSurface, setRentaSurface, rentaTaux, setRentaTaux, rentaMat, setRentaMat, rentaDep, setRentaDep, rentaResult, rentaType, setRentaType, rentaStatut, setRentaStatut,
    analyserDevis, genererContreDevis, calculerMateriaux, calculerPrimes, verifierArtisan,
    planifierChantier, genererDevisPro, calculerRentabilite, calcDPE, genererDevisProPDF,
    // Nouveaux calculateurs
    betonLongueur, setBetonLongueur, betonLargeur, setBetonLargeur, betonEpaisseur, setBetonEpaisseur, betonType, setBetonType, betonResult, calculerBeton,
    escalierHauteur, setEscalierHauteur, escalierLongueur, setEscalierLongueur, escalierResult, calculerEscalier,
    tuyauDebit, setTuyauDebit, tuyauLongueur, setTuyauLongueur, tuyauMateriau, setTuyauMateriau, tuyauResult, calculerTuyauterie,
    // Sécurité
    securiteType, setSecuriteType, securiteChecks, toggleSecuriteCheck, showSOS, setShowSOS,
  } = useApp();

  return (
    <div style={{ ...s.page, ...(page === "outils" ? s.pageActive : {}) }}>
      <div style={s.wrap}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Outils IA</div>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", gap: 5, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none", paddingRight: 40 }}>
            {[["checklist", "Checklist"], ["devis", "Devis"], ["mat", "Matériaux"], ["primes", "Primes"], ["rge", "Artisan RGE"], ["dpe", "DPE"], ["planning", "Planning"], ["devis_pro", "Devis Pro"], ["rentabilite", "Rentabilité"], ["beton", "Béton"], ["escalier", "Escalier"], ["tuyau", "Tuyauterie"], ["securite", "Sécurité"]].map(([k, l]) => (
              <button key={k} onClick={() => setToolTab(k)} style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: toolTab === k ? "linear-gradient(135deg,#EDD060,#C9A84C,#9A7228)" : "rgba(15,19,28,0.7)", color: toolTab === k ? "#06080D" : "rgba(240,237,230,0.5)", transition: "all 0.2s" }}>{l}</button>
            ))}
          </div>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 16, width: 40, background: "linear-gradient(to right, transparent, var(--bg-primary))", pointerEvents: "none", zIndex: 1 }} />
          <Tooltip id="outils-tabs" text="Collez un devis, calculez des matériaux ou simulez vos aides" />
        </div>

        {toolTab === "checklist" && <ChecklistChantier />}

        {toolTab === "devis" && <div>
          <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Coller votre devis ici</div>
          <textarea style={{ ...s.ci, width: "100%", minHeight: 160, borderRadius: 12, padding: "12px 14px", marginBottom: 10, lineHeight: 1.6 }} value={devisText} onChange={e => setDevisText(e.target.value)} placeholder={"Exemple :\nPose carrelage sol 12m\u00B2 gr\u00E8s c\u00E9rame 60\u00D760\nFourniture : 35\u20AC/m\u00B2 = 420\u20AC\nMain d'\u0153uvre : 55\u20AC/m\u00B2 = 660\u20AC\nTotal TTC : 1 080\u20AC"} />
          <button style={devisLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={analyserDevis} disabled={devisLoading}>{devisLoading ? "Analyse en cours..." : "\u{1F50D} Analyser le devis"}</button>
          {!devisResult && !devisLoading && <div style={{ fontSize: 10, color: "rgba(240,237,230,0.3)", marginTop: 20, textAlign: "center", padding: 16 }}>{"\u{1F4CA}"} L'IA vérifie les prix, la TVA, les anomalies et génère un contre-devis</div>}
          {devisResult && <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: devisResult.verdict === "CORRECT" ? "rgba(82,195,122,0.15)" : devisResult.verdict === "ÉLEVÉ" ? "rgba(232,135,58,0.15)" : "rgba(224,82,82,0.15)", color: devisResult.verdict === "CORRECT" ? "#52C37A" : devisResult.verdict === "ÉLEVÉ" ? "#E8873A" : "#E05252", border: "0.5px solid currentColor" }}>{devisResult.verdict}</span>
              <div style={{ fontSize: 12, color: "rgba(240,237,230,0.75)", flex: 1 }}>{devisResult.resume}</div>
            </div>
            {devisResult.points.map((p, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}><div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "0.5px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#C9A84C", flexShrink: 0 }}>{i + 1}</div><div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)", lineHeight: 1.5 }}>{p}</div></div>)}
            {devisResult.conseil && <div style={{ ...s.card, marginTop: 10, borderColor: "rgba(82,195,122,0.2)", background: "rgba(82,195,122,0.05)" }}><div style={{ fontSize: 10, color: "#52C37A", fontWeight: 700, marginBottom: 4 }}>CONSEIL</div><div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)" }}>{devisResult.conseil}</div></div>}
            <button style={{ ...s.dlBtn, marginTop: 10 }} onClick={() => genererOutilPDF({ titre: "ANALYSE DE DEVIS", sousTitre: "Verdict : " + devisResult.verdict, accentColor: devisResult.verdict === "CORRECT" ? [82,195,122] : devisResult.verdict === "ÉLEVÉ" ? [232,135,58] : [224,82,82], sections: [{ label: "Verdict", items: [{ label: "Résultat", value: devisResult.verdict, color: devisResult.verdict === "CORRECT" ? [82,195,122] : [224,82,82] }, { label: "Résumé", value: devisResult.resume }] }, { label: "Points d'analyse", items: devisResult.points.map((p, i) => ({ label: "Point " + (i+1), value: p })) }, ...(devisResult.conseil ? [{ label: "Conseil", text: devisResult.conseil }] : [])] })}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Télécharger le PDF</button>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: "#52C37A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Dimensions</div>
            <MesureAssistant context={calcType} onResult={(m) => { if (m.surface && !isNaN(parseFloat(m.surface))) setCalcSurface(m.surface); if (m.hauteur && !isNaN(parseFloat(m.hauteur))) setCalcHauteur(m.hauteur); if (m.pente && !isNaN(parseFloat(m.pente))) setCalcPente(m.pente); if (m.longueur && !isNaN(parseFloat(m.longueur))) setCalcLongueur(m.longueur); }} />
            <div style={{ fontSize: 9, color: "rgba(240,237,230,0.3)", flex: 1 }}>Pas sûr des mesures ? Le Métreur IA vous guide</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Type de travaux</div><select style={s.inp} value={calcType} onChange={e => setCalcType(e.target.value)}>{[
  "── MURS ──", "Peinture", "Carrelage mural", "Enduit", "Placo BA13", "Cloison BA13", "Doublage BA13+isolant", "Crépi façade", "Bardage", "Parement pierre",
  "── SOLS ──", "Carrelage sol", "Parquet", "Parquet stratifié", "Sol vinyle/PVC", "Béton ciré", "Ragréage", "Béton dalle", "Chape",
  "── PLAFONDS ──", "Faux plafond BA13", "Faux plafond suspendu (dalles)", "Peinture plafond", "Lambris plafond", "Plafond tendu",
  "── ISOLATION ──", "Isolation murs (ITI)", "Isolation murs (ITE)", "Isolation combles perdus", "Isolation combles aménagés", "Isolation rampants", "Isolation plancher bas", "Isolation phonique",
  "── TOITURE ──", "Toiture tuiles", "Toiture ardoise", "Toiture bac acier", "Étanchéité toiture terrasse", "Gouttières/descentes", "Charpente",
  "── EXTÉRIEUR ──", "Terrasse bois", "Terrasse carrelée", "Terrasse béton", "Clôture", "Portail",
  "── MENUISERIE ──", "Fenêtres PVC", "Fenêtres alu", "Porte intérieure", "Porte d'entrée", "Volets roulants",
  "── PLOMBERIE ──", "Salle de bain complète", "Cuisine (plomberie)", "WC suspendu", "Chauffe-eau",
  "── ÉLECTRICITÉ ──", "Tableau électrique", "Prises + interrupteurs", "Éclairage LED", "VMC simple flux", "VMC double flux",
].map(t => t.startsWith("──") ? <option key={t} disabled style={{ fontWeight: 700, color: "#C9A84C" }}>{t}</option> : <option key={t}>{t}</option>)}</select></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Surface m²</div><input style={s.inp} type="number" inputMode="decimal" value={calcSurface} onChange={e => setCalcSurface(e.target.value)} placeholder="20" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Hauteur m</div><input style={s.inp} type="number" inputMode="decimal" step="0.01" value={calcHauteur} onChange={e => setCalcHauteur(e.target.value)} placeholder="2.50" /></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Pente °</div><input style={s.inp} type="number" inputMode="decimal" value={calcPente} onChange={e => setCalcPente(e.target.value)} placeholder="0" /></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Longueur ml</div><input style={s.inp} type="number" inputMode="decimal" value={calcLongueur} onChange={e => setCalcLongueur(e.target.value)} placeholder="—" /></div>
          </div>
          {parseFloat(calcPente) > 0 && <div style={{ background: "rgba(232,135,58,0.08)", border: "0.5px solid rgba(232,135,58,0.25)", borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 10, color: "#E8873A", lineHeight: 1.6 }}>{"\u26A0\uFE0F"} Pente {calcPente}° — l'IA calculera la surface réelle en rampant et adaptera les dimensions des matériaux.</div>}
          {parseFloat(calcHauteur) > 2.5 && ["Placo BA13", "Cloison BA13", "Doublage BA13+isolant"].includes(calcType) && <div style={{ background: "rgba(82,144,224,0.08)", border: "0.5px solid rgba(82,144,224,0.25)", borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 10, color: "#5290E0", lineHeight: 1.6 }}>{"\u2139\uFE0F"} Hauteur {calcHauteur}m — plaques et montants adaptés (hors standard 2.50m).</div>}
          <button style={calcLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={calculerMateriaux} disabled={calcLoading}>{calcLoading ? "Calcul en cours..." : "\u{1F4D0} Calculer les matériaux"}</button>
          {!calcResult && !calcLoading && <div style={{ fontSize: 10, color: "rgba(240,237,230,0.3)", marginTop: 20, textAlign: "center", padding: 16 }}>{"\u{1F4D0}"} Quantités exactes + prix 2026 + liens d'achat directs</div>}
          {calcResult && <div style={{ marginTop: 12 }}>
            {calcResult.materiaux.map((m, i) => <div key={i} style={{ ...s.pi, marginBottom: 8 }}><div style={s.piw}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></div><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{m.nom}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)" }}>{m.quantite} · {m.conseil}</div></div><div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#C9A84C" }}>{m.prixEstime}</div><button onClick={() => window.open("https://www.leroymerlin.fr/recherche?q=" + encodeURIComponent(m.nom) + "&utm_source=maestromind&utm_medium=app&utm_campaign=materiaux", "_blank")} style={{ fontSize: 9, padding: "4px 10px", borderRadius: 8, background: "linear-gradient(135deg,#EDD060,#C9A84C)", color: "#06080D", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Acheter</button></div></div>)}
            <div style={{ ...s.card, background: "rgba(201,168,76,0.06)", borderColor: "rgba(201,168,76,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)" }}>Total estimé</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#C9A84C" }}>{calcResult.total}</div></div>
            <button onClick={() => window.open("https://www.leroymerlin.fr/recherche?q=" + encodeURIComponent(calcResult.materiaux.map(m => m.nom).join(" + ")) + "&utm_source=maestromind&utm_medium=app&utm_campaign=materiaux", "_blank")} style={{ width: "100%", marginTop: 10, padding: "12px 16px", borderRadius: 12, background: "linear-gradient(135deg,#EDD060,#C9A84C,#9A7228)", color: "#06080D", border: "none", fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06080D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> Commander tout chez Leroy Merlin</button>
            {calcResult.conseil && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", marginTop: 8, lineHeight: 1.6 }}>{"\u{1F4A1}"} {calcResult.conseil}</div>}
            <button style={{ ...s.dlBtn, marginTop: 10 }} onClick={() => genererOutilPDF({ titre: "CALCUL MATÉRIAUX", sousTitre: calcType + " — " + calcSurface + " m²", accentColor: [201,168,76], sections: [{ label: "Matériaux nécessaires", items: calcResult.materiaux.map(m => ({ label: m.nom, value: m.quantite + " — " + m.prixEstime })) }, { label: "Total estimé", items: [{ label: "Total", value: calcResult.total, color: [201,168,76] }] }, ...(calcResult.conseil ? [{ label: "Conseil", text: calcResult.conseil }] : [])] })}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Télécharger le PDF</button>
          </div>}
        </div>}

        {toolTab === "primes" && <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <MesureAssistant context="calcul des aides/primes" onResult={(m) => { if (m.surface) setPrimesSurf(m.surface); }} />
            <div style={{ fontSize: 9, color: "rgba(240,237,230,0.3)" }}>Métreur IA</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Revenus du foyer</div><select style={s.inp} value={primesRev} onChange={e => setPrimesRev(e.target.value)}>{["Très modeste", "Modeste", "Intermédiaire", "Supérieur"].map(r => <option key={r}>{r}</option>)}</select></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Surface m²</div><input style={s.inp} type="number" inputMode="decimal" value={primesSurf} onChange={e => setPrimesSurf(e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 12 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Type de travaux</div><select style={s.inp} value={primesTrav} onChange={e => setPrimesTrav(e.target.value)}>{["Isolation combles", "Isolation murs", "Pompe à chaleur", "Chaudière gaz à condensation", "Poêle à granulés", "VMC double flux", "Fenêtres double vitrage", "Rénovation globale"].map(t => <option key={t}>{t}</option>)}</select></div>
          <button style={primesLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={calculerPrimes} disabled={primesLoading}>{primesLoading ? "Calcul en cours..." : "\u{1F4B0} Calculer mes aides 2026"}</button>
          {primesResult && <div style={{ marginTop: 12 }}>
            {primesResult.aides.map((a, i) => <div key={i} style={{ ...s.card, marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: "#F0EDE6", flex: 1, marginRight: 8 }}>{a.nom}</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "#52C37A", flexShrink: 0 }}>{a.montant}</div></div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)", marginBottom: 3 }}>{a.condition}</div><div style={{ fontSize: 10, color: "rgba(82,195,122,0.7)" }}>{"\u2192"} {a.demarche}</div></div>)}
            <div style={{ ...s.card, background: "rgba(82,195,122,0.06)", borderColor: "rgba(82,195,122,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={{ fontSize: 12 }}>Total aides estimées</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#52C37A" }}>{primesResult.total}</div></div>
            {primesResult.attention && <div style={{ ...s.errBox, borderColor: "rgba(232,135,58,0.3)", background: "rgba(232,135,58,0.05)", color: "#E8873A" }}>{"\u26A0\uFE0F"} {primesResult.attention}</div>}
            {primesResult.conseil && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", lineHeight: 1.6 }}>{"\u{1F4A1}"} {primesResult.conseil}</div>}
            <button style={{ ...s.dlBtn, marginTop: 10 }} onClick={() => genererOutilPDF({ titre: "SIMULATEUR PRIMES & AIDES", sousTitre: primesTrav + " — Revenus " + primesRev, accentColor: [82,195,122], sections: [{ label: "Aides disponibles", items: primesResult.aides.map(a => ({ label: a.nom + (a.condition ? " (" + a.condition + ")" : ""), value: a.montant, color: [82,195,122] })) }, { label: "Total estimé", items: [{ label: "Total aides", value: primesResult.total, color: [82,195,122] }] }, ...(primesResult.attention ? [{ label: "Attention", text: primesResult.attention }] : []), ...(primesResult.conseil ? [{ label: "Conseil", text: primesResult.conseil }] : [])] })}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Télécharger le PDF</button>
          </div>}
        </div>}

        {toolTab === "rge" && <div>
          <div style={{ marginBottom: 8 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Nom de l'artisan ou entreprise</div><input style={s.inp} value={artisanNom} onChange={e => setArtisanNom(e.target.value)} placeholder="Ex: Plomberie Durand, SAS Martin BTP..." /></div>
          <div style={{ marginBottom: 12 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Spécialité</div><select style={s.inp} value={artisanSpec} onChange={e => setArtisanSpec(e.target.value)}>{["Maçonnerie", "Plomberie", "Électricité", "Isolation", "Chauffage", "Charpente", "Couverture", "Carrelage", "Peinture", "Menuiserie"].map(t => <option key={t}>{t}</option>)}</select></div>
          <button style={artisanLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={verifierArtisan} disabled={artisanLoading}>{artisanLoading ? "Vérification en cours..." : "\u{1F6E1}\uFE0F Vérifier cet artisan"}</button>
          {artisanResult && <div style={{ marginTop: 12 }}>
            {(() => { const score = Math.min(100, Math.round((artisanResult.checks?.length || 0) * 12.5)); const color = score >= 75 ? "#52C37A" : score >= 50 ? "#E8873A" : "#E05252"; const label = score >= 75 ? "\u2705 Artisan fiable" : score >= 50 ? "\u26A0\uFE0F Vérifications requises" : "\u{1F6AB} Risque élevé"; return (<div style={{ ...s.card, textAlign: "center", marginBottom: 12 }}><div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 10px" }}><svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" /><circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="7" strokeDasharray={score * 2.136 + " " + 213.6} strokeDashoffset="53.4" strokeLinecap="round" /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color }}>{score}%</div></div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color }}>{label}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)", marginTop: 3 }}>{artisanResult.checks?.length || 0} points vérifiés</div></div>); })()}
            {artisanResult.alertes?.length > 0 && <div style={{ marginBottom: 10 }}>{artisanResult.alertes.map((a, i) => <div key={i} style={{ ...s.errBox, marginBottom: 6 }}>{"\u26A0\uFE0F"} {a}</div>)}</div>}
            {artisanResult.checks?.map((c, i) => <div key={i} style={{ ...s.card, marginBottom: 7 }}><div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(82,195,122,0.1)", border: "0.5px solid rgba(82,195,122,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#52C37A", flexShrink: 0 }}>{"\u2713"}</div><div><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{c.label}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)", lineHeight: 1.5 }}>{c.comment}</div>{c.url && c.url !== "" && <div style={{ fontSize: 10, color: "#5290E0", marginTop: 3 }}>{"\u2192"} {c.url}</div>}</div></div></div>)}
            {artisanResult.conseils && <div style={{ ...s.card, background: "rgba(201,168,76,0.05)", borderColor: "rgba(201,168,76,0.2)", marginTop: 4 }}><div style={{ fontSize: 10, color: "#C9A84C", fontWeight: 700, marginBottom: 4 }}>CONSEIL GLOBAL</div><div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)", lineHeight: 1.6 }}>{artisanResult.conseils}</div></div>}
            <button style={{ ...s.dlBtn, marginTop: 10 }} onClick={() => { const score = Math.min(100, Math.round((artisanResult.checks?.length || 0) * 12.5)); genererOutilPDF({ titre: "VÉRIFICATION ARTISAN", sousTitre: artisanNom + " — " + artisanSpec, accentColor: score >= 75 ? [82,195,122] : score >= 50 ? [232,135,58] : [224,82,82], sections: [{ label: "Score de fiabilité", items: [{ label: "Score", value: score + "% — " + (score >= 75 ? "Artisan fiable" : score >= 50 ? "Vérifications requises" : "Risque élevé"), color: score >= 75 ? [82,195,122] : score >= 50 ? [232,135,58] : [224,82,82] }] }, ...(artisanResult.alertes?.length > 0 ? [{ label: "Alertes", items: artisanResult.alertes.map(a => ({ label: "Alerte", value: a, color: [224,82,82] })) }] : []), { label: "Points vérifiés", items: (artisanResult.checks || []).map(c => ({ label: c.label, value: c.comment })) }, ...(artisanResult.conseils ? [{ label: "Conseil global", text: artisanResult.conseils }] : [])] }); }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Télécharger le PDF</button>
          </div>}
        </div>}

        {toolTab === "dpe" && <div>
          <div style={s.card}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 11 }}>
              <div><div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 6, textTransform: "uppercase" }}>Type de bien</div><select style={s.inp} value={dpeT} onChange={e => setDpeT(e.target.value)}><option>Appartement</option><option>Maison</option></select></div>
              <div><div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 6, textTransform: "uppercase" }}>Surface m²</div><input style={s.inp} type="number" inputMode="decimal" value={dpeS} onChange={e => setDpeS(parseInt(e.target.value) || 75)} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 11 }}>
              <div><div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 6, textTransform: "uppercase" }}>Revenus du foyer</div><select style={s.inp} value={dpeRevenu} onChange={e => setDpeRevenu(e.target.value)}>{["Très modeste", "Modeste", "Intermédiaire", "Aisé"].map(r => <option key={r}>{r}</option>)}</select></div>
              <div><div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 6, textTransform: "uppercase" }}>Chauffage actuel</div><select style={s.inp} value={dpeC} onChange={e => setDpeC(e.target.value)}><option>Gaz naturel</option><option>Électricité</option><option>Fioul</option><option>Bois / Granulés</option><option>PAC</option></select></div>
            </div>
            <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 6, textTransform: "uppercase" }}>Travaux envisagés</div><select style={s.inp} value={dpeTravaux} onChange={e => setDpeTravaux(e.target.value)}>{["Isolation combles", "Isolation murs (ITI/ITE)", "Isolation plancher bas", "PAC air/eau", "PAC géothermique", "VMC double flux", "Fenêtres / Vitrages", "Chauffe-eau thermodynamique", "Poêle à granulés"].map(t => <option key={t}>{t}</option>)}</select></div>
            <button style={s.greenBtn} onClick={calcDPE}>Calculer mes aides 2026</button>
          </div>
          {dpeRes && <div style={s.card}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Vos aides estimées (barèmes 2026)</div>
            <div style={s.aides}>{[["MaPrimeRénov'", dpeRes.prime], ["CEE", dpeRes.cee], ["Total aides", dpeRes.total], ["Économies/an", dpeRes.eco]].map(([l, v]) => (<div key={l} style={s.aideC}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#52C37A" }}>{v.toLocaleString("fr-FR")}{"\u20AC"}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 2 }}>{l}</div></div>))}</div>
            {dpeRes.alerte_ite && <div style={{ ...s.errBox, borderColor: "rgba(232,135,58,0.3)", background: "rgba(232,135,58,0.05)", color: "#E8873A", marginTop: 10 }}>{"\u26A0\uFE0F"} {dpeRes.alerte_ite}</div>}
            <div style={{ background: "rgba(82,144,224,0.06)", border: "0.5px solid rgba(82,144,224,0.2)", borderRadius: 10, padding: "8px 12px", marginTop: 10, fontSize: 10, color: "#5290E0", lineHeight: 1.6 }}>{"\u2139\uFE0F"} {dpeRes.alerte_rdv}</div>
            <button style={{ ...s.dlBtn, marginTop: 12 }} onClick={() => genererOutilPDF({ titre: "SIMULATEUR AIDES DPE 2026", sousTitre: dpeT + " — " + dpeS + " m² — " + (dpeRes.travaux || dpeTravaux) + " — Revenus " + (dpeRes.revenu || dpeRevenu), accentColor: [82,195,122], sections: [{ label: "Aides estimées (barèmes 2026)", items: [{ label: "MaPrimeRénov'", value: dpeRes.prime.toLocaleString("fr-FR") + "\u20AC", color: [82,195,122] }, { label: "CEE", value: dpeRes.cee.toLocaleString("fr-FR") + "\u20AC", color: [82,195,122] }, { label: "Total aides", value: dpeRes.total.toLocaleString("fr-FR") + "\u20AC", color: [82,195,122] }, { label: "Économies/an", value: dpeRes.eco.toLocaleString("fr-FR") + "\u20AC", color: [201,168,76] }] }, { label: "Information", text: "RDV France Rénov' obligatoire avant dépôt MaPrimeRénov' 2026 — 0 808 800 700" }] })}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Télécharger le PDF</button>
          </div>}
        </div>}

        {toolTab === "planning" && <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Type de projet</div><select style={s.inp} value={planningType} onChange={e => setPlanningType(e.target.value)}>{["Rénovation salle de bain", "Rénovation cuisine", "Isolation combles", "Isolation murs", "Pose carrelage", "Cloison BA13", "Peinture appartement", "Rénovation complète", "Installation électrique", "Plomberie sanitaires"].map(t => <option key={t}>{t}</option>)}</select></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Budget {"\u20AC"}</div><input style={s.inp} type="number" inputMode="decimal" value={planningBudget} onChange={e => setPlanningBudget(e.target.value)} /></div>
          </div>
          <button style={planningLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={planifierChantier} disabled={planningLoading}>{planningLoading ? "Planification en cours..." : "\u{1F4C5} Générer le planning chantier"}</button>
          {planningResult && <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800 }}>{planningResult.duree_totale}</div><div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)" }}>· {planningType}</div></div>
            {planningResult.semaines.map((sem, i) => (<div key={i} style={{ ...s.card, marginBottom: 9, borderLeft: "2.5px solid #C9A84C" }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: "linear-gradient(135deg,#EDD060,#C9A84C)", color: "#06080D", fontWeight: 800 }}>S{sem.numero}</span><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700 }}>{sem.titre}</div></div>{sem.taches.map((t, j) => <div key={j} style={{ display: "flex", gap: 7, marginBottom: 5 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(82,195,122,0.1)", border: "0.5px solid rgba(82,195,122,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#52C37A", flexShrink: 0 }}>{"\u2713"}</div><div style={{ fontSize: 11, color: "rgba(240,237,230,0.6)" }}>{t}</div></div>)}{sem.materiaux_a_commander?.length > 0 && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "0.5px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, marginBottom: 4 }}>{"\u{1F6D2}"} À COMMANDER</div>{sem.materiaux_a_commander.map((m, j) => <div key={j} style={{ fontSize: 10, color: "rgba(240,237,230,0.45)", marginBottom: 2 }}>{"\u2192"} {m}</div>)}</div>}{sem.attention && <div style={{ marginTop: 8, padding: "6px 9px", borderRadius: 8, background: "rgba(232,135,58,0.08)", border: "0.5px solid rgba(232,135,58,0.25)", fontSize: 10, color: "#E8873A" }}>{"\u26A0\uFE0F"} {sem.attention}</div>}</div>))}
            {planningResult.ordre_metiers?.length > 0 && <div style={{ ...s.card, marginBottom: 9 }}><div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, marginBottom: 8 }}>ORDRE DES CORPS DE MÉTIER</div>{planningResult.ordre_metiers.map((m, i) => <div key={i} style={{ fontSize: 11, color: "rgba(240,237,230,0.6)", marginBottom: 4 }}>{m}</div>)}</div>}
            {planningResult.budget_detail && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", marginBottom: 8, lineHeight: 1.6 }}>{"\u{1F4B6}"} {planningResult.budget_detail}</div>}
            {planningResult.conseils && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", lineHeight: 1.6 }}>{"\u{1F4A1}"} {planningResult.conseils}</div>}
            <button style={{ ...s.dlBtn, marginTop: 10 }} onClick={() => genererOutilPDF({ titre: "PLANNING CHANTIER", sousTitre: planningType + " — Budget " + planningBudget + "\u20AC", accentColor: [201,168,76], sections: [{ label: "Durée totale", items: [{ label: "Durée", value: planningResult.duree_totale, color: [201,168,76] }] }, ...planningResult.semaines.map(sem => ({ label: "Semaine " + sem.numero + " — " + sem.titre, items: sem.taches.map(t => ({ label: t, value: "" })) })), ...(planningResult.ordre_metiers?.length > 0 ? [{ label: "Ordre des corps de métier", items: planningResult.ordre_metiers.map((m, i) => ({ label: (i+1) + ".", value: m })) }] : []), ...(planningResult.budget_detail ? [{ label: "Budget", text: planningResult.budget_detail }] : []), ...(planningResult.conseils ? [{ label: "Conseils", text: planningResult.conseils }] : [])] })}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Télécharger le PDF</button>
          </div>}
        </div>}

        {toolTab === "devis_pro" && <div>
          <div style={{ fontSize: 9, color: "#E8873A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>GÉNÉRATEUR DEVIS ARTISAN</div>
          <div style={{ marginBottom: 8 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Décrivez les travaux</div><textarea style={{ ...s.ci, width: "100%", minHeight: 100, borderRadius: 12, padding: "10px 14px", marginBottom: 0, lineHeight: 1.6 }} value={devisProDesc} onChange={e => setDevisProDesc(e.target.value)} placeholder="Ex: Pose carrelage salle de bain 8m²..." /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Client</div><input style={s.inp} value={devisProClient} onChange={e => setDevisProClient(e.target.value)} placeholder="Nom du client" /></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Surface m²</div><input style={s.inp} type="number" inputMode="decimal" value={devisProSurface} onChange={e => setDevisProSurface(e.target.value)} /></div>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Type de travaux</div><select style={s.inp} value={rentaType} onChange={e => setRentaType(e.target.value)}>{["Peinture", "Carrelage", "Placo / Cloison BA13", "Enduit / Ragréage", "Isolation murs (ITI)", "Isolation combles", "Parquet / Sol stratifié", "Plomberie", "Électricité", "Maçonnerie", "Couverture / Toiture", "Menuiserie", "Façade / Ravalement"].map(t => <option key={t}>{t}</option>)}</select></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Statut juridique</div><select style={s.inp} value={rentaStatut} onChange={e => setRentaStatut(e.target.value)}>{["Micro-entreprise", "Auto-entrepreneur", "EIRL", "SARL / SAS", "Entreprise individuelle"].map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[["Surface chantier m²", rentaSurface, setRentaSurface], ["Taux horaire \u20AC/h", rentaTaux, setRentaTaux], ["Coût matériaux \u20AC", rentaMat, setRentaMat], ["Déplacements \u20AC", rentaDep, setRentaDep]].map(([label, val, set]) => (
              <div key={label}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>{label}</div><input style={s.inp} type="number" inputMode="decimal" value={val} onChange={e => set(e.target.value)} /></div>
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
              {[["Main d'œuvre (" + rentaResult.heures + "h × " + rentaTaux + "\u20AC/h)", rentaResult.mo + "\u20AC", "rgba(240,237,230,0.7)"], ["Matériaux", rentaMat + "\u20AC", "rgba(240,237,230,0.5)"], ["Déplacements", rentaDep + "\u20AC", "rgba(240,237,230,0.5)"], ["Charges sociales (" + (rentaResult.taux_charges_pct || 22) + "% " + (rentaResult.statut || "") + ")", "-" + rentaResult.charges + "\u20AC", "#E05252"], ["Frais généraux (10%)", "-" + (rentaResult.frais_generaux || 0) + "\u20AC", "#E8873A"], ["Bénéfice net", "\u2192 " + rentaResult.benef + "\u20AC", rentaResult.benef > 0 ? "#52C37A" : "#E05252"]].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><div style={{ fontSize: 11, color: "rgba(240,237,230,0.55)" }}>{l}</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: c }}>{v}</div></div>
              ))}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
              <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}><div style={{ width: Math.max(0, Math.min(rentaResult.marge, 100)) + "%", height: "100%", borderRadius: 4, background: rentaResult.marge > 25 ? "linear-gradient(90deg,#52C37A,#C9A84C)" : rentaResult.marge > 10 ? "#E8873A" : "#E05252", transition: "width 0.6s ease" }} /></div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", marginTop: 4 }}>Marge : {rentaResult.marge}% {rentaResult.marge < 15 ? "\u26A0\uFE0F Insuffisante" : rentaResult.marge > 30 ? "\u2705 Excellente" : ""}</div>
            </div>
            <button style={{ ...s.dlBtn, marginTop: 10 }} onClick={() => genererOutilPDF({ titre: "ANALYSE RENTABILITÉ", sousTitre: (rentaResult.type_travaux || rentaType) + " — " + rentaSurface + " m² — " + (rentaResult.statut || rentaStatut), accentColor: rentaResult.marge > 25 ? [82,195,122] : rentaResult.marge > 10 ? [232,135,58] : [224,82,82], sections: [{ label: "Indicateurs clés", items: [{ label: "CA Total", value: rentaResult.ca_total + "\u20AC", color: [201,168,76] }, { label: "Bénéfice net", value: rentaResult.benef + "\u20AC", color: rentaResult.benef > 0 ? [82,195,122] : [224,82,82] }, { label: "Marge", value: rentaResult.marge + "%", color: rentaResult.marge > 25 ? [82,195,122] : rentaResult.marge > 10 ? [232,135,58] : [224,82,82] }, { label: "Prix/m²", value: rentaResult.prix_m2 + "\u20AC", color: [82,144,224] }] }, { label: "Détail", items: [{ label: "Type travaux", value: rentaResult.type_travaux || rentaType }, { label: "Statut juridique", value: rentaResult.statut || rentaStatut }, { label: "Main d'oeuvre (" + rentaResult.heures + "h \u00D7 " + rentaTaux + "\u20AC/h)", value: rentaResult.mo + "\u20AC" }, { label: "Matériaux", value: rentaMat + "\u20AC" }, { label: "Déplacements", value: rentaDep + "\u20AC" }, { label: "Charges sociales (" + (rentaResult.taux_charges_pct || 22) + "%)", value: "-" + rentaResult.charges + "\u20AC", color: [224,82,82] }, { label: "Frais généraux (10%)", value: "-" + (rentaResult.frais_generaux || 0) + "\u20AC", color: [232,135,58] }, { label: "Bénéfice net", value: rentaResult.benef + "\u20AC", color: rentaResult.benef > 0 ? [82,195,122] : [224,82,82] }] }] })}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Télécharger le PDF</button>
          </div>}
        </div>}

        {toolTab === "beton" && <div>
          <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>CALCULATEUR BÉTON</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Longueur m</div><input style={s.inp} type="number" inputMode="decimal" value={betonLongueur} onChange={e => setBetonLongueur(e.target.value)} placeholder="4" /></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Largeur m</div><input style={s.inp} type="number" inputMode="decimal" value={betonLargeur} onChange={e => setBetonLargeur(e.target.value)} placeholder="3" /></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Épaisseur m</div><input style={s.inp} type="number" inputMode="decimal" value={betonEpaisseur} onChange={e => setBetonEpaisseur(e.target.value)} placeholder="0.15" /></div>
          </div>
          <div style={{ marginBottom: 10 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Type de béton</div><select style={s.inp} value={betonType} onChange={e => setBetonType(e.target.value)}><option value="C20">C20 (dosage léger)</option><option value="C25">C25 (standard)</option><option value="C30">C30 (renforcé)</option></select></div>
          <button style={s.greenBtn} onClick={calculerBeton}>{"\u{1F9F1}"} Calculer le béton</button>
          {betonResult && <div style={{ marginTop: 12 }}>
            <div style={{ ...s.card, background: "rgba(201,168,76,0.06)", borderColor: "rgba(201,168,76,0.2)" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Volume : {betonResult.volume} m³ ({betonResult.type})</div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", marginBottom: 8 }}>Quantités avec +10% pertes incluses</div>
              {[
                ["Ciment", betonResult.cimentKg + " kg (" + betonResult.sacsCiment + " sacs de 35kg)", betonResult.prixCiment + "\u20AC"],
                ["Sable", betonResult.sableKg + " kg (" + betonResult.sacsSable + " sacs de 35kg)", betonResult.prixSable + "\u20AC"],
                ["Gravier", betonResult.gravierKg + " kg (" + betonResult.sacsGravier + " sacs de 25kg)", betonResult.prixGravier + "\u20AC"],
                ["Eau", betonResult.eauL + " litres", "—"],
              ].map(([nom, qte, prix], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, color: "rgba(240,237,230,0.7)" }}>{nom}</div>
                  <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", textAlign: "right" }}>{qte}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: "#C9A84C", minWidth: 50, textAlign: "right" }}>{prix}</div>
                </div>
              ))}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12 }}>Total estimé matériaux</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#C9A84C" }}>{betonResult.prixTotal}{"\u20AC"}</div>
              </div>
            </div>
          </div>}
        </div>}

        {toolTab === "escalier" && <div>
          <div style={{ fontSize: 9, color: "#5290E0", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>CALCULATEUR ESCALIER (LOI DE BLONDEL)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Hauteur étage cm</div><input style={s.inp} type="number" inputMode="decimal" value={escalierHauteur} onChange={e => setEscalierHauteur(e.target.value)} placeholder="270" /></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Longueur dispo cm</div><input style={s.inp} type="number" inputMode="decimal" value={escalierLongueur} onChange={e => setEscalierLongueur(e.target.value)} placeholder="400" /></div>
          </div>
          <div style={{ background: "rgba(82,144,224,0.06)", border: "0.5px solid rgba(82,144,224,0.2)", borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 10, color: "#5290E0", lineHeight: 1.6 }}>{"\u2139\uFE0F"} Loi de Blondel : 2h + g = 60 à 64 cm. Hauteur de marche idéale : 17-18 cm. Emmarchement min : 80 cm (90 cm confort).</div>
          <button style={{ ...s.greenBtn, borderColor: "rgba(82,144,224,0.45)", color: "#5290E0" }} onClick={calculerEscalier}>{"\u{1FA9C}"} Calculer l'escalier</button>
          {escalierResult && <div style={{ marginTop: 12 }}>
            <div style={{ ...s.card, borderColor: escalierResult.blondelOk ? "rgba(82,195,122,0.2)" : "rgba(224,82,82,0.2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[
                  ["Nb marches", escalierResult.nbMarches, "#C9A84C"],
                  ["Hauteur marche", escalierResult.hauteurMarche + " cm", "#5290E0"],
                  ["Giron", escalierResult.giron + " cm", "#5290E0"],
                  ["Blondel", escalierResult.blondel + " cm", escalierResult.blondelOk ? "#52C37A" : "#E05252"],
                ].map(([label, val, color], i) => (
                  <div key={i} style={{ ...s.sc, textAlign: "left", padding: "10px 12px" }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color }}>{val}</div>
                    <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 12px", borderRadius: 10, background: escalierResult.blondelOk ? "rgba(82,195,122,0.08)" : "rgba(224,82,82,0.08)", border: "0.5px solid " + (escalierResult.blondelOk ? "rgba(82,195,122,0.25)" : "rgba(224,82,82,0.25)"), fontSize: 11, color: escalierResult.blondelOk ? "#52C37A" : "#E05252", lineHeight: 1.6 }}>
                {escalierResult.blondelOk ? "\u2705" : "\u26A0\uFE0F"} {escalierResult.conseil}
              </div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", marginTop: 8, lineHeight: 1.6 }}>Angle : {escalierResult.angleDeg}° | Emmarchement min : {escalierResult.emmarchementMin} cm (confort : {escalierResult.emmarchementConfort} cm) | Réchappement min : 190 cm</div>
            </div>
          </div>}
        </div>}

        {toolTab === "tuyau" && <div>
          <div style={{ fontSize: 9, color: "#52C37A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>CALCULATEUR TUYAUTERIE</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Débit L/min</div><input style={s.inp} type="number" inputMode="decimal" value={tuyauDebit} onChange={e => setTuyauDebit(e.target.value)} placeholder="12" /></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Longueur m</div><input style={s.inp} type="number" inputMode="decimal" value={tuyauLongueur} onChange={e => setTuyauLongueur(e.target.value)} placeholder="15" /></div>
          </div>
          <div style={{ marginBottom: 10 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Matériau</div><select style={s.inp} value={tuyauMateriau} onChange={e => setTuyauMateriau(e.target.value)}><option value="cuivre">Cuivre</option><option value="PER">PER</option><option value="multicouche">Multicouche</option></select></div>
          <button style={s.greenBtn} onClick={calculerTuyauterie}>{"\u{1F6BF}"} Calculer le diamètre</button>
          {tuyauResult && <div style={{ marginTop: 12 }}>
            <div style={{ ...s.card, borderColor: tuyauResult.vitesseOk ? "rgba(82,195,122,0.2)" : "rgba(224,82,82,0.2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[
                  ["Diamètre min calculé", tuyauResult.diametreMinCalcule + " mm", "#5290E0"],
                  ["Diamètre recommandé", tuyauResult.recommande + " mm", "#52C37A"],
                  ["Vitesse réelle", tuyauResult.vitesseReelle + " m/s", tuyauResult.vitesseOk ? "#52C37A" : "#E05252"],
                  ["Perte de charge", tuyauResult.perteCharge + " mCE", "#C9A84C"],
                ].map(([label, val, color], i) => (
                  <div key={i} style={{ ...s.sc, textAlign: "left", padding: "10px 12px" }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color }}>{val}</div>
                    <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 12px", borderRadius: 10, background: tuyauResult.vitesseOk ? "rgba(82,195,122,0.08)" : "rgba(224,82,82,0.08)", border: "0.5px solid " + (tuyauResult.vitesseOk ? "rgba(82,195,122,0.25)" : "rgba(224,82,82,0.25)"), fontSize: 11, color: tuyauResult.vitesseOk ? "#52C37A" : "#E05252", lineHeight: 1.6 }}>
                {tuyauResult.vitesseOk ? "\u2705" : "\u26A0\uFE0F"} {tuyauResult.conseil}
              </div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", marginTop: 8, lineHeight: 1.6 }}>Matériau : {tuyauResult.materiau} | Diamètres disponibles : {tuyauResult.diametresDispos.join(", ")} mm | Vitesse max : 2 m/s</div>
            </div>
          </div>}
        </div>}

        {toolTab === "securite" && <div>
          <div style={{ fontSize: 9, color: "#E05252", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>SÉCURITÉ CHANTIER</div>
          <div style={{ marginBottom: 10 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Type de chantier</div><select style={s.inp} value={securiteType} onChange={e => setSecuriteType(e.target.value)}>{["Gros œuvre", "Électricité", "Plomberie", "Couverture/Hauteur", "Démolition", "Peinture/Finitions"].map(t => <option key={t}>{t}</option>)}</select></div>
          <div style={{ marginBottom: 12 }}>
            {({
              "Gros œuvre": ["Casque de chantier", "Chaussures de sécurité S3", "Gants de manutention", "Lunettes anti-projection", "Gilet haute visibilité", "Balisage zone de travail", "Vérification étais/coffrages", "Point d'eau à proximité"],
              "Électricité": ["Gants isolants classe 0", "Chaussures isolantes", "VAT (vérificateur absence tension)", "Consignation tableau", "Lunettes de protection", "Tapis isolant", "Extincteur CO2 à proximité", "Habilitation électrique valide"],
              "Plomberie": ["Gants de protection", "Lunettes de protection", "Chaussures de sécurité", "Ventilation espace confiné", "Détecteur de gaz si gaz", "Clé d'arrêt eau accessible", "Seau/bâche de protection", "Témoin pression manomètre"],
              "Couverture/Hauteur": ["Harnais EN 361", "Point d'ancrage vérifié", "Ligne de vie EN 354", "Filet de sécurité", "Garde-corps périmétrique", "Casque avec jugulaire", "Chaussures antidérapantes", "Vérification météo (vent <60km/h)"],
              "Démolition": ["Masque FFP3", "Lunettes étanches", "Gants anti-coupure", "Combinaison jetable", "Diagnostic amiante vérifié", "Balisage zone exclusion", "Arrosage anti-poussière", "Étaiement structures adjacentes"],
              "Peinture/Finitions": ["Masque FFP2 ou A1", "Gants nitrile", "Lunettes de protection", "Ventilation du local", "Bâches de protection sol", "Extincteur à proximité", "Produits étiquetés FDS", "Pas de source de chaleur"],
            }[securiteType] || []).map((item, i) => {
              const checks = securiteChecks[securiteType] || [];
              const checked = checks[i] || false;
              return (
                <div key={i} onClick={() => toggleSecuriteCheck(securiteType, i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 5, borderRadius: 10, background: checked ? "rgba(82,195,122,0.06)" : "rgba(15,19,28,0.5)", border: "0.5px solid " + (checked ? "rgba(82,195,122,0.2)" : "rgba(255,255,255,0.06)"), cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: checked ? "rgba(82,195,122,0.2)" : "rgba(255,255,255,0.04)", border: "0.5px solid " + (checked ? "rgba(82,195,122,0.5)" : "rgba(255,255,255,0.12)"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#52C37A", flexShrink: 0 }}>{checked ? "\u2713" : ""}</div>
                  <div style={{ fontSize: 12, color: checked ? "rgba(240,237,230,0.4)" : "rgba(240,237,230,0.7)", textDecoration: checked ? "line-through" : "none" }}>{item}</div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setShowSOS(true)} style={{ width: "100%", background: "rgba(224,82,82,0.12)", border: "0.5px solid rgba(224,82,82,0.5)", borderRadius: 14, padding: 14, fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: "#E05252", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{"\u{1F6A8}"} SOS URGENCE</button>
          {showSOS && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowSOS(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "rgba(15,19,28,0.95)", border: "0.5px solid rgba(224,82,82,0.3)", borderRadius: 20, padding: "24px 20px", maxWidth: 360, width: "100%" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#E05252", textAlign: "center", marginBottom: 16 }}>{"\u{1F6A8}"} NUMÉROS D'URGENCE</div>
              {[
                ["Pompiers", "18", "#E05252"],
                ["SAMU", "15", "#5290E0"],
                ["Urgences Europe", "112", "#C9A84C"],
                ["Centre Antipoison", "0800 59 59 59", "#52C37A"],
              ].map(([nom, tel, color], i) => (
                <a key={i} href={"tel:" + tel.replace(/ /g, "")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", marginBottom: 8, borderRadius: 12, background: color + "12", border: "0.5px solid " + color + "44", textDecoration: "none" }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color }}>{nom}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color }}>{tel}</div>
                </a>
              ))}
              <button onClick={() => setShowSOS(false)} style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(240,237,230,0.5)", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Fermer</button>
            </div>
          </div>}
        </div>}

      </div>
    </div>
  );
}
