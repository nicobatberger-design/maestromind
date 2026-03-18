import { AppProvider, useApp } from "./context/AppContext";
import { IAS, DIVISIONS, PROFILS, PRODS, SHELF_TYPES, getChips } from "./data/constants";
import { drawARScene } from "./utils/ar";
import s from "./styles/index";

function AppContent() {
  const {
    IS_DEV,
    page, apiKey, showKey, keyInput, setKeyInput, keyErr,
    curDiv, curIA, msgs, setMsgs, hist, setHist, input, setInput, loading, errMsg,
    store, setStore,
    dpeS, setDpeS, dpeT, setDpeT, dpeC, setDpeC, dpeRes,
    camActive, photoUrl, scanLoading, scanResult, scanIA, setScanIA, scannerTab, setScannerTab,
    arModeType, setArModeType, arAnchor, setArAnchor, arShelfType, setArShelfType, showArAdvisor, setShowArAdvisor, arAdvInput, setArAdvInput, arAdvResult, arAdvLoading,
    certProjet, setCertProjet, certNorme, setCertNorme, certSurface, setCertSurface, certProp, setCertProp, certArtisan, setCertArtisan,
    rgpdOk, setRgpdOk, showPaywall, setShowPaywall, onboardingDone, setOnboardingDone, onboardingStep, setOnboardingStep, userType, setUserType, pdgUnlocked, pinInput, pinError,
    toolTab, setToolTab, devisText, setDevisText, devisResult, devisLoading, calcType, setCalcType, calcSurface, setCalcSurface, calcResult, calcLoading,
    artisanNom, setArtisanNom, artisanSpec, setArtisanSpec, artisanResult, artisanLoading,
    primesRev, setPrimesRev, primesTrav, setPrimesTrav, primesSurf, setPrimesSurf, primesResult, primesLoading,
    counterDevis, setCounterDevis, counterLoading, planningType, setPlanningType, planningBudget, setPlanningBudget, planningResult, planningLoading,
    devisProDesc, setDevisProDesc, devisProClient, setDevisProClient, devisProSurface, setDevisProSurface, devisProResult, devisProLoading,
    rentaSurface, setRentaSurface, rentaTaux, setRentaTaux, rentaMat, setRentaMat, rentaDep, setRentaDep, rentaResult,
    projets, projetNom, setProjetNom, projetType, setProjetType, projetNotes, setProjetNotes,
    projetChat, setProjetChat, projetChatMsgs, projetChatInput, setProjetChatInput, projetChatLoading, crLoading,
    voiceActive,
    msgsRef, videoRef, canvasRef, arVideoRef, arCanvasRef, arAnchorRef, arModeRef, arShelfTypeRef,
    chips,
    goPage, switchDiv, switchIA, activerIA, send, sendWithPhoto, rateMsg,
    ouvrirCamera, prendrePhoto, importerPhoto, analyserPhoto,
    startVoice, startUrgence, handlePin, handlePinDel,
    analyserDevis, genererContreDevis, calculerMateriaux, calculerPrimes, verifierArtisan,
    planifierChantier, genererDevisPro, calculerRentabilite, calcDPE, suggestShelf,
    ajouterProjet, supprimerProjet, ouvrirProjetChat, sendProjetChat, genererCRChantier,
    exportChatPDF, genererPDF, genererDevisProPDF,
    rangColor, saveConv, welcomeMsg,
  } = useApp();

  const NavIcon = ({ id, label, children }) => (
    <div style={s.ni} onClick={() => goPage(id)}>
      <div style={page === id ? s.niwOn : s.niw}>{children}</div>
      <div style={page === id ? s.nlblOn : s.nlbl}>{label}</div>
    </div>
  );

  // ── Onboarding ──────────────────────────────────────────────────
  if (!onboardingDone) {
    const steps = [
      { title: "Bienvenue sur", highlight: "MAESTROMIND", sub: "32 IA expertes du bâtiment, disponibles 24h/24.", icon: "🏗" },
      { title: "Votre profil ?", highlight: "", sub: "Personnalise vos conseils IA.", icon: "👷", choices: ["Particulier", "Artisan Pro", "Architecte", "Investisseur"] },
      { title: "Vous êtes prêt !", highlight: "", sub: "Activez les notifications pour vos rappels chantier.", icon: "🔔" },
    ];
    const step = steps[onboardingStep];
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 430, margin: "0 auto", background: "#06080D", color: "#F0EDE6", fontFamily: "'DM Sans',sans-serif", alignItems: "center", justifyContent: "center", padding: "0 32px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ fontSize: 56, marginBottom: 24 }}>{step.icon}</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, textAlign: "center", lineHeight: 1.2, marginBottom: 8 }}>{step.title} {step.highlight && <span style={{ color: "#C9A84C" }}>{step.highlight}</span>}</div>
          <div style={{ fontSize: 13, color: "rgba(240,237,230,0.5)", textAlign: "center", lineHeight: 1.7, marginBottom: 36 }}>{step.sub}</div>
          {step.choices && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", marginBottom: 24 }}>{step.choices.map(ch => <button key={ch} onClick={() => setUserType(ch)} style={{ padding: "12px", borderRadius: 12, border: "0.5px solid " + (userType === ch ? "#C9A84C" : "rgba(255,255,255,0.08)"), background: userType === ch ? "rgba(201,168,76,0.12)" : "rgba(15,19,28,0.6)", color: userType === ch ? "#C9A84C" : "rgba(240,237,230,0.6)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{ch}</button>)}</div>}
          <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>{steps.map((_, i) => <div key={i} style={{ width: i === onboardingStep ? 24 : 8, height: 8, borderRadius: 4, background: i === onboardingStep ? "#C9A84C" : "rgba(255,255,255,0.1)", transition: "all 0.3s" }} />)}</div>
          <button onClick={() => { if (onboardingStep < steps.length - 1) { setOnboardingStep(prev => prev + 1); } else { localStorage.setItem("bl_onboarded", "1"); localStorage.setItem("bl_user_type", userType); setOnboardingDone(true); } }} style={{ width: "100%", background: "linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border: "none", borderRadius: 14, padding: "15px", fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: "#06080D", cursor: "pointer", boxShadow: "0 4px 24px rgba(201,168,76,0.35)" }}>
            {onboardingStep < steps.length - 1 ? "Continuer →" : "Commencer maintenant"}
          </button>
          {onboardingStep > 0 && <button onClick={() => setOnboardingStep(prev => prev - 1)} style={{ background: "transparent", border: "none", marginTop: 12, fontSize: 12, color: "rgba(240,237,230,0.3)", cursor: "pointer" }}>← Retour</button>}
        </div>
      </>
    );
  }

  // ── PIN Screen ──────────────────────────────────────────────────
  if (!pdgUnlocked && onboardingDone) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 430, margin: "0 auto", background: "#06080D", color: "#F0EDE6", fontFamily: "'DM Sans',sans-serif", alignItems: "center", justifyContent: "center", padding: "0 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.1) 0%,transparent 68%)", pointerEvents: "none" }} />
        <div style={{ width: 72, height: 72, background: "linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: "0 4px 32px rgba(201,168,76,0.4), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
        </div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>MAESTRO<span style={{ color: "#C9A84C" }}>MIND</span></div>
        <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 }}>Interface PDG</div>
        <div style={{ fontSize: 12, color: "rgba(240,237,230,0.4)", marginBottom: 36, textAlign: "center", lineHeight: 1.6 }}>Entrez votre code confidentiel à 6 chiffres</div>
        <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={i < pinInput.length ? s.pinDotFill : s.pinDot} />
          ))}
        </div>
        <div style={{ height: 24, display: "flex", alignItems: "center", marginBottom: 28 }}>
          {pinError && <div style={{ fontSize: 12, color: "#E05252", textAlign: "center" }}>{pinError}</div>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,72px)", gap: 14 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
            <button key={d} className="bl-pin" style={s.pinKey} onClick={() => handlePin(String(d))}>{d}</button>
          ))}
          <div style={{ width: 72, height: 72 }} />
          <button className="bl-pin" style={s.pinKey} onClick={() => handlePin("0")}>0</button>
          <button className="bl-pin" style={{ ...s.pinKey }} onClick={handlePinDel}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" /><line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" /></svg>
          </button>
        </div>
        <div style={{ fontSize: 11, color: "rgba(240,237,230,0.18)", marginTop: 44 }}>Accès réservé — PDG uniquement</div>
      </div>
    </>
  );

  // ── Main App ────────────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes logoGlow { 0%,100% { box-shadow: 0 2px 14px rgba(201,168,76,0.45); } 50% { box-shadow: 0 2px 28px rgba(201,168,76,0.75), 0 0 48px rgba(201,168,76,0.18); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-18px) scale(1.06); } }
        @keyframes pinSuccess { 0% { transform:scale(1); } 40% { transform:scale(1.18); } 100%{ transform:scale(1); } }
        @keyframes voicePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(224,82,82,0.4); } 50% { box-shadow: 0 0 0 8px rgba(224,82,82,0); } }
        .bl-msg { animation: fadeSlideUp 0.28s cubic-bezier(0.4,0,0.2,1) both; }
        .bl-fc:hover { border-color:rgba(201,168,76,0.28) !important; transform:translateY(-2px); box-shadow:0 6px 24px rgba(201,168,76,0.1), inset 0 1px 0 rgba(255,255,255,0.06) !important; }
        .bl-chip:hover{ background:rgba(201,168,76,0.09) !important; border-color:rgba(201,168,76,0.28) !important; color:#C9A84C !important; }
        .bl-pin:active { transform:scale(0.91) !important; background:rgba(201,168,76,0.18) !important; }
        * { -webkit-tap-highlight-color:transparent; }
        ::-webkit-scrollbar { display:none; }
      `}</style>
      <div style={s.app}>
        {/* Ambient glow orbs */}
        <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.09) 0%,transparent 70%)", pointerEvents: "none", animation: "orbFloat 7s ease-in-out infinite", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: 60, right: -80, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(82,144,224,0.05) 0%,transparent 70%)", pointerEvents: "none", animation: "orbFloat 9s ease-in-out infinite 1.5s", zIndex: 0 }} />

        {IS_DEV && showKey && (
          <div style={s.keyScreen}>
            <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#C9A84C,#7A6030)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>MAESTRO<span style={{ color: "#C9A84C" }}>MIND</span></div>
            <div style={{ fontSize: 12, color: "rgba(240,237,230,0.5)", textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>Mode développement — clé Anthropic pour tester en local.</div>
            <div style={s.keyBox}>
              <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Clé API Anthropic</div>
              <input style={s.keyInp} type="password" placeholder="sk-ant-api03-..." value={keyInput} onChange={e => setKeyInput(e.target.value)} autoComplete="off" onKeyDown={e => e.key === "Enter" && activerIA()} />
              <button style={s.keyBtn} onClick={activerIA}>Activer en local</button>
              {keyErr && <div style={{ fontSize: 12, color: "#E05252", textAlign: "center", marginTop: 10 }}>{keyErr}</div>}
            </div>
            <div style={{ fontSize: 11, color: "rgba(240,237,230,0.22)", textAlign: "center", marginTop: 16 }}>En production Vercel, la clé est sécurisée côté serveur</div>
          </div>
        )}

        {/* ── Header ── */}
        <div style={s.hdr}>
          <div style={s.logo}>
            <div style={s.logoBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2.2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
            </div>
            MAESTRO<span style={{ color: "#C9A84C" }}>MIND</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", background: "rgba(15,19,28,0.8)", border: "0.5px solid rgba(201,168,76,0.15)", borderRadius: 20, padding: 2, gap: 2 }}>
              {["Particulier", "Artisan Pro", "Architecte", "Investisseur"].map(p => (
                <button key={p} onClick={() => { setUserType(p); localStorage.setItem("bl_user_type", p); setMsgs([{ role: "ai", text: PROFILS[p].icon + " Mode " + p + " activé. Je m'adapte à votre profil." }]); setHist([]); }} style={{ padding: "3px 8px", borderRadius: 18, fontSize: 8, fontWeight: 700, cursor: "pointer", border: "none", background: userType === p ? "linear-gradient(135deg,#EDD060,#C9A84C)" : "transparent", color: userType === p ? "#06080D" : "rgba(240,237,230,0.4)", transition: "all 0.2s", whiteSpace: "nowrap" }}>{PROFILS[p].icon}</button>
              ))}
            </div>
            <div style={s.badge}>LIVE</div>
          </div>
        </div>

        {/* ── Pages container ── */}
        <div style={s.pages}>

          {/* ═══ HOME ═══ */}
          <div style={{ ...s.page, ...(page === "home" ? s.pageActive : {}) }}>
            <div style={s.hero}>
              <div style={{ color: "rgba(240,237,230,0.5)", fontSize: 12, marginBottom: 4 }}>{PROFILS[userType]?.icon} Bonjour, {userType}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, lineHeight: 1.15, marginBottom: 5 }}>MAESTRO<span style={{ color: "#C9A84C" }}>MIND</span></div>
              <div style={{ color: "rgba(240,237,230,0.5)", fontSize: 11, marginBottom: 18 }}>32 IA spécialisées — Normes DTU — 11 divisions</div>
              <button style={s.cta} onClick={() => goPage("coach")}>
                <span>Quel est votre projet ?</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </button>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#E05252", marginBottom: 8 }}>🚨 Urgence</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
                  {[["🔴", "GAZ", "rgba(224,82,82,0.12)", "rgba(224,82,82,0.5)", "#E05252"], ["🔵", "EAU", "rgba(82,144,224,0.12)", "rgba(82,144,224,0.5)", "#5290E0"], ["⚡", "ÉLECTRICITÉ", "rgba(232,135,58,0.12)", "rgba(232,135,58,0.5)", "#E8873A"]].map(([icon, label, bg, border, color]) => (
                    <button key={label} onClick={() => startUrgence(label)} style={{ background: bg, border: "0.5px solid " + border, borderRadius: 12, padding: "10px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 18 }}>{icon}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color, letterSpacing: 1 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={s.stats3}>
              {[["32", "IA actives"], ["11", "Divisions"], ["3", "Magasins"]].map(([v, l]) => (
                <div key={l} style={s.sc}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: "#C9A84C" }}>{v}</div>
                  <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={s.secLbl}>Outils rapides</div>
            <div style={s.featGrid}>
              {[
                { label: "Vérifier un devis", sub: "Prix justes ?", color: "#E8873A", icon: "📋", action: () => { goPage("outils"); setToolTab("devis"); } },
                { label: "Calculer matériaux", sub: "Quantités exactes", color: "#52C37A", icon: "📐", action: () => { goPage("outils"); setToolTab("mat"); } },
                { label: "Aides 2025", sub: "MaPrimeRénov' CEE", color: "#52C37A", icon: "💰", action: () => { goPage("outils"); setToolTab("primes"); } },
                { label: "Vérifier artisan", sub: "RGE & légitimité", color: "#5290E0", icon: "🛡️", action: () => { goPage("outils"); setToolTab("rge"); } },
                { label: "Boutique", sub: "Matériaux partenaires", color: "#C9A84C", icon: "🛒", action: () => { goPage("shop"); } },
                { label: "Certificat DTU", sub: "Validation conformité", color: "#C9A84C", icon: "🏅", action: () => { goPage("cert"); } },
              ].map((t, i) => (
                <div key={i} className="bl-fc" style={s.fc} onClick={t.action}>
                  <div style={{ ...s.fi, background: t.color + "18", border: "0.5px solid " + t.color + "44" }}>
                    <span style={{ fontSize: 18 }}>{t.icon}</span>
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>{t.sub}</div>
                </div>
              ))}
            </div>
            <div style={s.secLbl}>Divisions IA</div>
            <div style={s.featGrid}>
              {Object.entries(DIVISIONS).map(([div, info], i) => (
                <div key={div} className="bl-fc" style={i === 0 ? s.fcHi : s.fc} onClick={() => { goPage("coach"); switchDiv(div); }}>
                  <div style={{ ...s.fi, background: info.color + "18", border: "0.5px solid " + info.color + "44" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{div}</div>
                  <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>{info.ias.length} IA</div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ COACH ═══ */}
          <div style={{ ...s.page, ...(page === "coach" ? s.pageActive : {}) }}>
            <div style={s.wrap}>
              <div style={s.aiHdr}>
                <div style={{ ...s.aiAv, background: IAS[curIA].color + "33", border: "0.5px solid " + IAS[curIA].color + "66" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IAS[curIA].color} strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700 }}>{IAS[curIA].name}</div>
                    <span style={{ ...s.rangBadge, background: rangColor(IAS[curIA].rang) + "22", color: rangColor(IAS[curIA].rang), border: "0.5px solid " + rangColor(IAS[curIA].rang) + "66" }}>{IAS[curIA].rang}</span>
                  </div>
                  <div style={{ fontSize: 10, color: IAS[curIA].color, display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: IAS[curIA].color }}></div>
                    {IAS[curIA].st}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {msgs.length > 1 && <button onClick={exportChatPDF} title="Exporter en PDF" style={{ background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.3)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                  </button>}
                  {msgs.length > 1 && <button onClick={() => { saveConv(curIA, msgs); setMsgs([{ role: "ai", text: welcomeMsg(curIA, userType) }]); setHist([]); localStorage.removeItem("mm_chat_" + curIA); }} title="Effacer la conversation" style={{ background: "rgba(224,82,82,0.06)", border: "0.5px solid rgba(224,82,82,0.25)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                  </button>}
                </div>
              </div>
              <div style={s.divSel}>
                {Object.entries(DIVISIONS).map(([div, info]) => (
                  <button key={div} style={curDiv === div ? { ...s.divPill, background: info.color + "22", color: info.color, border: "0.5px solid " + info.color + "66" } : s.divPill} onClick={() => switchDiv(div)}>{div}</button>
                ))}
              </div>
              <div style={s.iaSel}>
                {DIVISIONS[curDiv].ias.map(k => (
                  <button key={k} style={curIA === k ? s.iapOn : s.iap} onClick={() => switchIA(k)}>{IAS[k].name.replace("IA ", "")}</button>
                ))}
              </div>
              <div style={s.chips}>
                {chips.map(c => (
                  <div key={c} className="bl-chip" style={s.chip} onClick={() => setInput(c)}>{c}</div>
                ))}
              </div>
              <div style={s.msgs} ref={msgsRef}>
                {msgs.map((m, i) => (
                  <div key={i} className="bl-msg" style={{ ...m.role === "ai" ? s.msgA : s.msgU, animationDelay: i === msgs.length - 1 ? "0ms" : `${Math.min(i * 30, 120)}ms` }}>
                    <div style={s.mav}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round">
                        {m.role === "ai" ? <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> : <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>}
                      </svg>
                    </div>
                    <div style={{ maxWidth: "78%" }}>
                      <div style={m.role === "ai" ? s.bubA : s.bubU} dangerouslySetInnerHTML={{ __html: m.text === "..." ? "<span>...</span>" : m.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />
                      {m.role === "ai" && m.text !== "..." && <div style={{ display: "flex", gap: 6, marginTop: 5, paddingLeft: 2 }}>
                        <button onClick={() => rateMsg(i, 1)} style={{ background: m.rated === 1 ? "rgba(82,195,122,0.15)" : "transparent", border: "0.5px solid " + (m.rated === 1 ? "#52C37A" : "rgba(255,255,255,0.07)"), borderRadius: 20, padding: "2px 8px", fontSize: 11, color: m.rated === 1 ? "#52C37A" : "rgba(240,237,230,0.3)", cursor: "pointer" }}>👍</button>
                        <button onClick={() => rateMsg(i, -1)} style={{ background: m.rated === -1 ? "rgba(224,82,82,0.12)" : "transparent", border: "0.5px solid " + (m.rated === -1 ? "#E05252" : "rgba(255,255,255,0.07)"), borderRadius: 20, padding: "2px 8px", fontSize: 11, color: m.rated === -1 ? "#E05252" : "rgba(240,237,230,0.3)", cursor: "pointer" }}>👎</button>
                      </div>}
                    </div>
                  </div>
                ))}
              </div>
              {errMsg && <div style={s.errBox}>{errMsg}</div>}
              <div style={s.inputBar}>
                <textarea style={s.ci} value={input} onChange={e => setInput(e.target.value)} placeholder={"Demandez à " + IAS[curIA].name + "..."} rows={1} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
                <button onClick={startVoice} title="Parler à l'IA" style={{ width: 38, height: 38, borderRadius: "50%", border: "0.5px solid " + (voiceActive ? "rgba(224,82,82,0.6)" : "rgba(201,168,76,0.22)"), background: voiceActive ? "rgba(224,82,82,0.15)" : "rgba(201,168,76,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: voiceActive ? "voicePulse 0.8s ease-in-out infinite" : "none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={voiceActive ? "#E05252" : "#C9A84C"} strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                </button>
                <label style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.22)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} title="Envoyer une photo à cette IA">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => sendWithPhoto(ev.target.result); r.readAsDataURL(f); e.target.value = ""; }} />
                </label>
                <button style={s.sb} onClick={send} disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* ═══ SCANNER ═══ */}
          <div style={{ ...s.page, ...(page === "scanner" ? s.pageActive : {}) }}>
            <div style={{ display: "flex", gap: 0, borderBottom: "0.5px solid rgba(201,168,76,0.12)", flexShrink: 0 }}>
              {[["photo", "📷  Photo IA"], ["ar", "🎯  AR Live 3D"]].map(([k, l]) => (
                <button key={k} onClick={() => { setScannerTab(k); if (k === "ar" && !camActive) ouvrirCamera(); }} style={{ flex: 1, padding: "12px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", color: scannerTab === k ? "#C9A84C" : "rgba(240,237,230,0.3)", borderBottom: scannerTab === k ? "2px solid #C9A84C" : "2px solid transparent", transition: "all 0.2s", fontFamily: "'Syne',sans-serif" }}>{l}</button>
              ))}
            </div>

            {scannerTab === "photo" && <div style={{ ...s.wrap, paddingTop: 12 }}>
              <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>IA analyste</div>
              <div style={{ display: "flex", gap: 5, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 8 }}>
                {["diag", "analyse_visuelle", "urgence", "coach", "cert", "thermique", "shop"].map(k => (
                  <button key={k} onClick={() => { setScanIA(k); if (photoUrl) analyserPhoto(photoUrl, k); }} style={{ flexShrink: 0, padding: "5px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", border: "0.5px solid " + (scanIA === k ? IAS[k].color : "rgba(255,255,255,0.07)"), background: scanIA === k ? IAS[k].color + "18" : "transparent", color: scanIA === k ? IAS[k].color : "rgba(240,237,230,0.45)", transition: "all 0.2s" }}>
                    {IAS[k].name.replace("IA ", "")}
                  </button>
                ))}
              </div>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: 12, display: camActive && scannerTab === "photo" ? "block" : "none", marginBottom: 12, maxHeight: 220, objectFit: "cover" }} />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              {photoUrl && <img src={photoUrl} alt="photo" style={{ width: "100%", borderRadius: 12, marginBottom: 12, maxHeight: 220, objectFit: "cover" }} />}
              {!camActive && !photoUrl && (
                <div style={{ width: "100%", aspectRatio: "4/3", background: "#0D1018", border: "1.5px dashed rgba(201,168,76,0.18)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.4" strokeLinecap="round" style={{ opacity: 0.6, marginBottom: 10 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  <p style={{ fontSize: 12, color: "rgba(240,237,230,0.5)" }}>Caméra non activée</p>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button style={s.scanBtn} onClick={ouvrirCamera}>Activer caméra</button>
                <button style={{ ...s.scanBtnGhost, opacity: camActive ? 1 : 0.4 }} onClick={prendrePhoto}>Prendre photo</button>
              </div>
              <label style={{ display: "block", width: "100%", background: "#181D28", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px", textAlign: "center", fontSize: 12, color: "rgba(240,237,230,0.5)", cursor: "pointer", marginBottom: 12 }}>
                Importer depuis la galerie
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={importerPhoto} />
              </label>
              {scanLoading && <div style={{ background: "#181D28", borderRadius: 12, padding: 14, textAlign: "center", fontSize: 12, color: "rgba(240,237,230,0.5)", marginBottom: 12 }}>L'IA analyse votre photo...</div>}
              {scanResult && (
                <div style={{ background: "#181D28", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                    <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, flexShrink: 0, background: scanResult.urgence === "DANGER" ? "rgba(224,82,82,0.18)" : scanResult.urgence === "URGENT" ? "rgba(232,135,58,0.15)" : scanResult.urgence === "MODERE" ? "rgba(201,168,76,0.12)" : "rgba(82,195,122,0.12)", color: scanResult.urgence === "DANGER" ? "#E05252" : scanResult.urgence === "URGENT" ? "#E8873A" : scanResult.urgence === "MODERE" ? "#C9A84C" : "#52C37A", border: "0.5px solid currentColor" }}>{scanResult.urgence}</span>
                    <strong style={{ fontFamily: "'Syne',sans-serif", fontSize: 13 }}>{scanResult.titre}</strong>
                  </div>
                  {(scanResult.cout_estime || scanResult.delai || scanResult.reference_dtu) && (
                    <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
                      {scanResult.cout_estime && <div style={{ flex: 1, minWidth: 80, background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Coût estimé</div><div style={{ fontSize: 12, fontWeight: 700, color: "#C9A84C" }}>{scanResult.cout_estime}</div></div>}
                      {scanResult.delai && <div style={{ flex: 1, minWidth: 80, background: "rgba(82,144,224,0.06)", border: "0.5px solid rgba(82,144,224,0.2)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Délai</div><div style={{ fontSize: 12, fontWeight: 700, color: "#5290E0" }}>{scanResult.delai}</div></div>}
                      {scanResult.reference_dtu && <div style={{ flex: 1, minWidth: 80, background: "rgba(82,195,122,0.06)", border: "0.5px solid rgba(82,195,122,0.2)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Norme</div><div style={{ fontSize: 11, fontWeight: 700, color: "#52C37A" }}>{scanResult.reference_dtu}</div></div>}
                    </div>
                  )}
                  {scanResult.materiaux && scanResult.materiaux.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>Matériaux détectés</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {scanResult.materiaux.map((m, i) => (<span key={i} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(240,237,230,0.7)" }}>{m}</span>))}
                      </div>
                    </div>
                  )}
                  {(scanResult.urgence === "URGENT" || scanResult.urgence === "DANGER") && (
                    <div style={{ background: "rgba(224,82,82,0.08)", border: "1px solid rgba(224,82,82,0.35)", borderRadius: 10, padding: "11px 12px", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#E05252", marginBottom: 6 }}>⚠️ INTERVENTION PROFESSIONNELLE REQUISE</div>
                      <div style={{ fontSize: 10, color: "rgba(224,82,82,0.8)", lineHeight: 1.7 }}>Ne pas tenter de réparation sans évaluation experte. Risques : amiante, plomb, gaz, instabilité structurelle.</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {["Amiante → SS3/SS4", "Plomb → CREP", "Gaz → 0800 47 33 33", "Structure → Bureau de contrôle"].map(a => (<span key={a} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 20, background: "rgba(224,82,82,0.12)", border: "0.5px solid rgba(224,82,82,0.35)", color: "#E05252", fontWeight: 600 }}>{a}</span>))}
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>Plan d'action</div>
                  {scanResult.etapes.map((e, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, marginBottom: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "0.5px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#C9A84C", flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)", lineHeight: 1.5, paddingTop: 2 }}>{e}</div>
                    </div>
                  ))}
                  {scanResult.conseils_pro && (
                    <div style={{ background: "rgba(82,195,122,0.06)", border: "0.5px solid rgba(82,195,122,0.2)", borderRadius: 8, padding: "9px 11px", marginTop: 10, marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: "#52C37A", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Conseil expert</div>
                      <div style={{ fontSize: 11, color: "rgba(240,237,230,0.65)", lineHeight: 1.5 }}>💡 {scanResult.conseils_pro}</div>
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 12, marginBottom: 6 }}>Approfondir avec</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["diag", "urgence", "coach", "cert", "shop"].map(k => (
                      <button key={k} onClick={() => { goPage("coach"); switchIA(k); }} style={{ padding: "5px 11px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "0.5px solid " + IAS[k].color + "66", background: IAS[k].color + "14", color: IAS[k].color }}>{IAS[k].name.replace("IA ", "")}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>}

            {/* AR Tab */}
            {scannerTab === "ar" && <div style={{ position: "absolute", top: 44, left: 0, right: 0, bottom: 0, background: "#000", display: "flex", flexDirection: "column" }}>
              <div style={{ background: "rgba(6,8,13,0.88)", backdropFilter: "blur(12px)", flexShrink: 0, zIndex: 10 }}>
                <div style={{ display: "flex", gap: 5, padding: "7px 10px 4px", overflowX: "auto", scrollbarWidth: "none" }}>
                  {[["etagere", "🪞 Étagère"], ["cloison", "🧱 Cloison"], ["carrelage", "◼ Carrelage"], ["prise", "🔌 Prise"], ["tableau", "🖼 Tableau"], ["porte", "🚪 Porte"], ["fenetre", "🪟 Fenêtre"], ["radiateur", "🌡️ Radiateur"], ["luminaire", "💡 Luminaire"]].map(([k, l]) => (
                    <button key={k} onClick={() => { setArModeType(k); setArAnchor(null); arAnchorRef.current = null; arModeRef.current = k; }} style={{ flexShrink: 0, padding: "5px 11px", borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "none", background: arModeType === k ? "linear-gradient(135deg,#EDD060,#C9A84C)" : "rgba(255,255,255,0.08)", color: arModeType === k ? "#06080D" : "rgba(240,237,230,0.55)", whiteSpace: "nowrap" }}>{l}</button>
                  ))}
                </div>
                {arModeType === "etagere" && (
                  <div style={{ padding: "4px 10px 6px" }}>
                    <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none" }}>
                      {Object.entries(SHELF_TYPES).map(([k, v]) => (
                        <button key={k} onClick={() => { setArShelfType(k); arShelfTypeRef.current = k; }} style={{ flexShrink: 0, padding: "4px 9px", borderRadius: 16, fontSize: 9, fontWeight: 700, cursor: "pointer", border: "0.5px solid " + (arShelfType === k ? "#C9A84C" : "rgba(255,255,255,0.1)"), background: arShelfType === k ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.04)", color: arShelfType === k ? "#C9A84C" : "rgba(240,237,230,0.45)", whiteSpace: "nowrap" }}>
                          {v.emoji} {v.label}
                        </button>
                      ))}
                      <button onClick={() => setShowArAdvisor(prev => !prev)} style={{ flexShrink: 0, padding: "4px 9px", borderRadius: 16, fontSize: 9, fontWeight: 700, cursor: "pointer", border: "0.5px solid rgba(82,195,122,0.45)", background: "rgba(82,195,122,0.1)", color: "#52C37A", whiteSpace: "nowrap" }}>💡 Je ne sais pas</button>
                    </div>
                    <div style={{ fontSize: 8, color: "rgba(240,237,230,0.3)", paddingLeft: 2, marginTop: 2 }}>{SHELF_TYPES[arShelfType].desc} · {SHELF_TYPES[arShelfType].prix}</div>
                  </div>
                )}
              </div>
              {arModeType === "etagere" && showArAdvisor && (
                <div style={{ background: "rgba(6,8,13,0.97)", backdropFilter: "blur(20px)", borderBottom: "0.5px solid rgba(201,168,76,0.2)", padding: "10px 14px", flexShrink: 0, zIndex: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#52C37A" }}>💡 Conseiller IA Étagère</div>
                    <button onClick={() => setShowArAdvisor(false)} style={{ background: "none", border: "none", color: "rgba(240,237,230,0.4)", fontSize: 16, cursor: "pointer", padding: 0 }}>×</button>
                  </div>
                  <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
                    <input value={arAdvInput} onChange={e => setArAdvInput(e.target.value)} placeholder="Décrivez votre pièce / mur" style={{ flex: 1, background: "rgba(15,19,28,0.85)", border: "0.5px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "7px 10px", color: "#F0EDE6", fontSize: 11, outline: "none", fontFamily: "'DM Sans',sans-serif" }} onKeyDown={e => { if (e.key === "Enter") suggestShelf(); }} />
                    <button onClick={suggestShelf} disabled={arAdvLoading} style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#EDD060,#C9A84C)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#06080D" }}>
                      {arAdvLoading ? "…" : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>}
                    </button>
                  </div>
                  {arAdvResult && (
                    <div style={{ background: "rgba(15,19,28,0.85)", border: "0.5px solid rgba(201,168,76,0.25)", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                        <span style={{ fontSize: 16 }}>{SHELF_TYPES[arAdvResult.type]?.emoji || "▬"}</span>
                        <div>
                          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800, color: "#C9A84C" }}>{SHELF_TYPES[arAdvResult.type]?.label || arAdvResult.type} — {arAdvResult.prix}</div>
                          <div style={{ fontSize: 10, color: "rgba(240,237,230,0.55)" }}>{arAdvResult.raison}</div>
                        </div>
                      </div>
                      {arAdvResult.produit && (
                        <div style={{ background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "7px 9px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "#F0EDE6" }}>{arAdvResult.produit}</div>
                            <div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)" }}>{arAdvResult.ou} · {arAdvResult.dimensions}</div>
                          </div>
                          <button onClick={() => { const u = arAdvResult.ou?.toLowerCase().includes("ikea") ? "ikea.com/fr" : arAdvResult.ou?.toLowerCase().includes("casto") ? "castorama.fr" : "leroymerlin.fr"; window.open("https://www." + u + "/recherche/?q=" + encodeURIComponent(arAdvResult.url_keyword || arAdvResult.produit) + "&utm_source=maestromind&utm_medium=ar&utm_campaign=advisor", "_blank"); }} style={{ flexShrink: 0, padding: "5px 10px", borderRadius: 8, background: "linear-gradient(135deg,#EDD060,#C9A84C)", border: "none", fontSize: 9, fontWeight: 700, color: "#06080D", cursor: "pointer" }}>Acheter →</button>
                        </div>
                      )}
                      {arAdvResult.conseils && <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 6, lineHeight: 1.5 }}>💡 {arAdvResult.conseils}</div>}
                    </div>
                  )}
                </div>
              )}
              <div style={{ position: "relative", flex: 1, overflow: "hidden" }}
                onClick={e => { if (!camActive) { ouvrirCamera(); return; } const rect = e.currentTarget.getBoundingClientRect(); const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top }; setArAnchor(pt); arAnchorRef.current = pt; }}
                onTouchMove={e => { if (!camActive || !arAnchorRef.current) return; e.preventDefault(); const rect = e.currentTarget.getBoundingClientRect(); const t = e.touches[0]; const pt = { x: t.clientX - rect.left, y: t.clientY - rect.top }; setArAnchor(pt); arAnchorRef.current = pt; }}
                onTouchStart={e => { if (!camActive) { ouvrirCamera(); return; } const rect = e.currentTarget.getBoundingClientRect(); const t = e.touches[0]; const pt = { x: t.clientX - rect.left, y: t.clientY - rect.top }; setArAnchor(pt); arAnchorRef.current = pt; }}>
                <video ref={arVideoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <canvas ref={arCanvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none", pointerEvents: "none" }} />
                {!camActive && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(6,8,13,0.92)", zIndex: 5 }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.3" strokeLinecap="round" style={{ marginBottom: 16, opacity: 0.9 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "#C9A84C", marginBottom: 8 }}>AR Live 3D</div>
                    <div style={{ fontSize: 12, color: "rgba(240,237,230,0.5)", textAlign: "center", maxWidth: 220, lineHeight: 1.6 }}>Appuyez puis glissez pour placer</div>
                  </div>
                )}
              </div>
              <div style={{ padding: "8px 14px 14px", background: "rgba(6,8,13,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zIndex: 10 }}>
                <div style={{ fontSize: 10, color: arAnchor ? "#52C37A" : "rgba(240,237,230,0.45)", fontWeight: 600 }}>{arAnchor ? "✅ Placé — Glissez pour déplacer" : "👆 Appuyez sur le mur pour placer"}</div>
                <button onClick={() => { setArAnchor(null); arAnchorRef.current = null; }} style={{ fontSize: 9, padding: "5px 12px", borderRadius: 20, background: "rgba(224,82,82,0.12)", border: "0.5px solid rgba(224,82,82,0.35)", color: "#E05252", cursor: "pointer", fontWeight: 700 }}>Effacer</button>
              </div>
            </div>}
          </div>

          {/* ═══ SHOP ═══ */}
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

          {/* ═══ CERT ═══ */}
          <div style={{ ...s.page, ...(page === "cert" ? s.pageActive : {}) }}>
            <div style={s.wrap}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 3 }}>Certificat</div>
              <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 14 }}>Validation conformité IA — Normes DTU</div>
              <div style={s.card}>
                <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Données du projet</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Projet</div><input style={s.inp} value={certProjet} onChange={e => setCertProjet(e.target.value)} placeholder="Ex: Cloison BA13" /></div>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Surface m²</div><input style={s.inp} type="number" value={certSurface} onChange={e => setCertSurface(e.target.value)} placeholder="10" /></div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Norme DTU</div>
                  <select style={s.inp} value={certNorme} onChange={e => setCertNorme(e.target.value)}>
                    <option>DTU 25.41 — Cloisons plâtre</option><option>DTU 52.1 — Carrelage</option><option>DTU 45.1 — Isolation thermique</option><option>DTU 60.1 — Plomberie sanitaire</option><option>DTU 70.1 — Électricité NFC 15-100</option><option>DTU 31.2 — Charpente bois</option><option>DTU 40.21 — Couverture tuiles</option><option>DTU 20.1 — Maçonnerie</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Maître d'ouvrage</div><input style={s.inp} value={certProp} onChange={e => setCertProp(e.target.value)} placeholder="Nom propriétaire" /></div>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Artisan / Entreprise</div><input style={s.inp} value={certArtisan} onChange={e => setCertArtisan(e.target.value)} placeholder="Nom artisan" /></div>
                </div>
              </div>
              <div style={s.certCard}>
                <div style={s.certSeal}><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg></div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "#C9A84C", marginBottom: 3 }}>CERTIFICAT DE CONFORMITÉ</div>
                <div style={{ fontSize: 9, color: "rgba(240,237,230,0.4)", marginBottom: 14 }}>Délivré par MAESTROMIND · Plateforme IA Bâtiment</div>
                <div style={{ fontSize: 11, color: "rgba(240,237,230,0.55)", lineHeight: 2.2, borderTop: "0.5px solid rgba(201,168,76,0.15)", paddingTop: 12, textAlign: "left" }}>
                  <div>Projet : <strong style={{ color: "#F0EDE6" }}>{certProjet || "—"}</strong></div>
                  <div>Norme : <strong style={{ color: "#F0EDE6" }}>{certNorme.split("—")[0].trim()}</strong></div>
                  <div>Surface : <strong style={{ color: "#F0EDE6" }}>{certSurface || "—"} m²</strong></div>
                  {certProp && <div>Maître d'ouvrage : <strong style={{ color: "#F0EDE6" }}>{certProp}</strong></div>}
                  {certArtisan && <div>Artisan : <strong style={{ color: "#F0EDE6" }}>{certArtisan}</strong></div>}
                  <div>Date : <strong style={{ color: "#F0EDE6" }}>{new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</strong></div>
                  <div>Statut : <strong style={{ color: "#52C37A" }}>✓ CONFORME</strong></div>
                </div>
              </div>
              <button style={s.dlBtn} onClick={genererPDF}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Télécharger le certificat PDF
              </button>
            </div>
          </div>

          {/* ═══ OUTILS ═══ */}
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
                <button style={devisLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={analyserDevis} disabled={devisLoading}>{devisLoading ? "Analyse en cours..." : "🔍 Analyser le devis"}</button>
                {devisResult && <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: devisResult.verdict === "CORRECT" ? "rgba(82,195,122,0.15)" : devisResult.verdict === "ÉLEVÉ" ? "rgba(232,135,58,0.15)" : "rgba(224,82,82,0.15)", color: devisResult.verdict === "CORRECT" ? "#52C37A" : devisResult.verdict === "ÉLEVÉ" ? "#E8873A" : "#E05252", border: "0.5px solid currentColor" }}>{devisResult.verdict}</span>
                    <div style={{ fontSize: 12, color: "rgba(240,237,230,0.75)", flex: 1 }}>{devisResult.resume}</div>
                  </div>
                  {devisResult.points.map((p, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}><div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "0.5px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#C9A84C", flexShrink: 0 }}>{i + 1}</div><div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)", lineHeight: 1.5 }}>{p}</div></div>)}
                  {devisResult.conseil && <div style={{ ...s.card, marginTop: 10, borderColor: "rgba(82,195,122,0.2)", background: "rgba(82,195,122,0.05)" }}><div style={{ fontSize: 10, color: "#52C37A", fontWeight: 700, marginBottom: 4 }}>CONSEIL</div><div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)" }}>{devisResult.conseil}</div></div>}
                </div>}
                {devisResult && !counterDevis && (<button style={counterLoading ? { ...s.greenBtn, opacity: 0.5, borderColor: "rgba(232,135,58,0.4)", color: "#E8873A" } : { ...s.greenBtn, borderColor: "rgba(232,135,58,0.45)", color: "#E8873A" }} onClick={genererContreDevis} disabled={counterLoading}>{counterLoading ? "Génération en cours..." : "✍️ Négocier ce devis (contre-devis IA)"}</button>)}
                {counterDevis && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 9, color: "#E8873A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>CONTRE-DEVIS NÉGOCIÉ</div>
                    {counterDevis.lignes.map((l, i) => (<div key={i} style={{ ...s.card, marginBottom: 7, borderColor: "rgba(232,135,58,0.15)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}><div style={{ fontSize: 12, fontWeight: 600, flex: 1, marginRight: 8 }}>{l.poste}</div><div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontSize: 10, color: "rgba(240,237,230,0.35)", textDecoration: "line-through" }}>{l.prix_demande}</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: "#52C37A" }}>{l.prix_negocie}</div></div></div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", lineHeight: 1.5 }}>💬 {l.argument}</div></div>))}
                    <div style={{ ...s.card, background: "rgba(82,195,122,0.06)", borderColor: "rgba(82,195,122,0.2)", marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: 12, color: "rgba(240,237,230,0.7)" }}>Économie potentielle</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#52C37A" }}>{counterDevis.economie_totale}</div></div></div>
                    <div style={{ ...s.card, background: "rgba(82,144,224,0.05)", borderColor: "rgba(82,144,224,0.2)", marginBottom: 10 }}><div style={{ fontSize: 10, color: "#5290E0", fontWeight: 700, marginBottom: 6 }}>MESSAGE À ENVOYER À L'ARTISAN</div><div style={{ fontSize: 12, color: "rgba(240,237,230,0.7)", lineHeight: 1.7, fontStyle: "italic" }}>"{counterDevis.message_negociation}"</div></div>
                    {counterDevis.conseil && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", lineHeight: 1.6, marginBottom: 8 }}>💡 {counterDevis.conseil}</div>}
                    <button onClick={() => { setCounterDevis(null); }} style={{ ...s.greenBtn, background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(240,237,230,0.4)" }}>← Nouvelle analyse</button>
                  </div>
                )}
              </div>}

              {toolTab === "mat" && <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Type de travaux</div><select style={s.inp} value={calcType} onChange={e => setCalcType(e.target.value)}>{["Peinture", "Carrelage", "Parquet", "Placo BA13", "Enduit", "Isolation murs", "Isolation combles", "Toiture", "Béton dalle", "Ragréage"].map(t => <option key={t}>{t}</option>)}</select></div>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Surface m²</div><input style={s.inp} type="number" value={calcSurface} onChange={e => setCalcSurface(e.target.value)} /></div>
                </div>
                <button style={calcLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={calculerMateriaux} disabled={calcLoading}>{calcLoading ? "Calcul en cours..." : "📐 Calculer les matériaux"}</button>
                {calcResult && <div style={{ marginTop: 12 }}>
                  {calcResult.materiaux.map((m, i) => <div key={i} style={{ ...s.pi, marginBottom: 8 }}><div style={s.piw}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></div><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{m.nom}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)" }}>{m.quantite} · {m.conseil}</div></div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#C9A84C" }}>{m.prixEstime}</div></div>)}
                  <div style={{ ...s.card, background: "rgba(201,168,76,0.06)", borderColor: "rgba(201,168,76,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)" }}>Total estimé</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#C9A84C" }}>{calcResult.total}</div></div>
                  {calcResult.conseil && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", marginTop: 8, lineHeight: 1.6 }}>💡 {calcResult.conseil}</div>}
                </div>}
              </div>}

              {toolTab === "primes" && <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Revenus du foyer</div><select style={s.inp} value={primesRev} onChange={e => setPrimesRev(e.target.value)}>{["Très modeste", "Modeste", "Intermédiaire", "Supérieur"].map(r => <option key={r}>{r}</option>)}</select></div>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Surface m²</div><input style={s.inp} type="number" value={primesSurf} onChange={e => setPrimesSurf(e.target.value)} /></div>
                </div>
                <div style={{ marginBottom: 12 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Type de travaux</div><select style={s.inp} value={primesTrav} onChange={e => setPrimesTrav(e.target.value)}>{["Isolation combles", "Isolation murs", "Pompe à chaleur", "Chaudière gaz à condensation", "Poêle à granulés", "VMC double flux", "Fenêtres double vitrage", "Rénovation globale"].map(t => <option key={t}>{t}</option>)}</select></div>
                <button style={primesLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={calculerPrimes} disabled={primesLoading}>{primesLoading ? "Calcul en cours..." : "💰 Calculer mes aides 2025"}</button>
                {primesResult && <div style={{ marginTop: 12 }}>
                  {primesResult.aides.map((a, i) => <div key={i} style={{ ...s.card, marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: "#F0EDE6", flex: 1, marginRight: 8 }}>{a.nom}</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "#52C37A", flexShrink: 0 }}>{a.montant}</div></div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)", marginBottom: 3 }}>{a.condition}</div><div style={{ fontSize: 10, color: "rgba(82,195,122,0.7)" }}>→ {a.demarche}</div></div>)}
                  <div style={{ ...s.card, background: "rgba(82,195,122,0.06)", borderColor: "rgba(82,195,122,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={{ fontSize: 12 }}>Total aides estimées</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#52C37A" }}>{primesResult.total}</div></div>
                  {primesResult.attention && <div style={{ ...s.errBox, borderColor: "rgba(232,135,58,0.3)", background: "rgba(232,135,58,0.05)", color: "#E8873A" }}>⚠️ {primesResult.attention}</div>}
                  {primesResult.conseil && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", lineHeight: 1.6 }}>💡 {primesResult.conseil}</div>}
                </div>}
              </div>}

              {toolTab === "rge" && <div>
                <div style={{ marginBottom: 8 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Nom de l'artisan ou entreprise</div><input style={s.inp} value={artisanNom} onChange={e => setArtisanNom(e.target.value)} placeholder="Ex: Plomberie Durand, SAS Martin BTP..." /></div>
                <div style={{ marginBottom: 12 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Spécialité</div><select style={s.inp} value={artisanSpec} onChange={e => setArtisanSpec(e.target.value)}>{["Maçonnerie", "Plomberie", "Électricité", "Isolation", "Chauffage", "Charpente", "Couverture", "Carrelage", "Peinture", "Menuiserie"].map(t => <option key={t}>{t}</option>)}</select></div>
                <button style={artisanLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={verifierArtisan} disabled={artisanLoading}>{artisanLoading ? "Vérification en cours..." : "🛡️ Vérifier cet artisan"}</button>
                {artisanResult && <div style={{ marginTop: 12 }}>
                  {(() => { const score = Math.min(100, Math.round((artisanResult.checks?.length || 0) * 12.5)); const color = score >= 75 ? "#52C37A" : score >= 50 ? "#E8873A" : "#E05252"; const label = score >= 75 ? "✅ Artisan fiable" : score >= 50 ? "⚠️ Vérifications requises" : "🚫 Risque élevé"; return (<div style={{ ...s.card, textAlign: "center", marginBottom: 12 }}><div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 10px" }}><svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" /><circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="7" strokeDasharray={score * 2.136 + " " + 213.6} strokeDashoffset="53.4" strokeLinecap="round" /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color }}>{score}%</div></div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color }}>{label}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)", marginTop: 3 }}>{artisanResult.checks?.length || 0} points vérifiés</div></div>); })()}
                  {artisanResult.alertes?.length > 0 && <div style={{ marginBottom: 10 }}>{artisanResult.alertes.map((a, i) => <div key={i} style={{ ...s.errBox, marginBottom: 6 }}>⚠️ {a}</div>)}</div>}
                  {artisanResult.checks?.map((c, i) => <div key={i} style={{ ...s.card, marginBottom: 7 }}><div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(82,195,122,0.1)", border: "0.5px solid rgba(82,195,122,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#52C37A", flexShrink: 0 }}>✓</div><div><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{c.label}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)", lineHeight: 1.5 }}>{c.comment}</div>{c.url && c.url !== "" && <div style={{ fontSize: 10, color: "#5290E0", marginTop: 3 }}>→ {c.url}</div>}</div></div></div>)}
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
                  <div style={s.aides}>{[["MaPrimeRénov", dpeRes.prime], ["CEE", dpeRes.cee], ["Total aides", dpeRes.total], ["Économies/an", dpeRes.eco]].map(([l, v]) => (<div key={l} style={s.aideC}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#52C37A" }}>{v.toLocaleString("fr-FR")}€</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 2 }}>{l}</div></div>))}</div>
                </div>}
              </div>}

              {toolTab === "planning" && <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Type de projet</div><select style={s.inp} value={planningType} onChange={e => setPlanningType(e.target.value)}>{["Rénovation salle de bain", "Rénovation cuisine", "Isolation combles", "Isolation murs", "Pose carrelage", "Cloison BA13", "Peinture appartement", "Rénovation complète", "Installation électrique", "Plomberie sanitaires"].map(t => <option key={t}>{t}</option>)}</select></div>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Budget €</div><input style={s.inp} type="number" value={planningBudget} onChange={e => setPlanningBudget(e.target.value)} /></div>
                </div>
                <button style={planningLoading ? { ...s.greenBtn, opacity: 0.5 } : s.greenBtn} onClick={planifierChantier} disabled={planningLoading}>{planningLoading ? "Planification en cours..." : "📅 Générer le planning chantier"}</button>
                {planningResult && <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800 }}>{planningResult.duree_totale}</div><div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)" }}>· {planningType}</div></div>
                  {planningResult.semaines.map((sem, i) => (<div key={i} style={{ ...s.card, marginBottom: 9, borderLeft: "2.5px solid #C9A84C" }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: "linear-gradient(135deg,#EDD060,#C9A84C)", color: "#06080D", fontWeight: 800 }}>S{sem.numero}</span><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700 }}>{sem.titre}</div></div>{sem.taches.map((t, j) => <div key={j} style={{ display: "flex", gap: 7, marginBottom: 5 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(82,195,122,0.1)", border: "0.5px solid rgba(82,195,122,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#52C37A", flexShrink: 0 }}>✓</div><div style={{ fontSize: 11, color: "rgba(240,237,230,0.6)" }}>{t}</div></div>)}{sem.materiaux_a_commander?.length > 0 && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "0.5px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, marginBottom: 4 }}>🛒 À COMMANDER</div>{sem.materiaux_a_commander.map((m, j) => <div key={j} style={{ fontSize: 10, color: "rgba(240,237,230,0.45)", marginBottom: 2 }}>→ {m}</div>)}</div>}{sem.attention && <div style={{ marginTop: 8, padding: "6px 9px", borderRadius: 8, background: "rgba(232,135,58,0.08)", border: "0.5px solid rgba(232,135,58,0.25)", fontSize: 10, color: "#E8873A" }}>⚠️ {sem.attention}</div>}</div>))}
                  {planningResult.ordre_metiers?.length > 0 && <div style={{ ...s.card, marginBottom: 9 }}><div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, marginBottom: 8 }}>ORDRE DES CORPS DE MÉTIER</div>{planningResult.ordre_metiers.map((m, i) => <div key={i} style={{ fontSize: 11, color: "rgba(240,237,230,0.6)", marginBottom: 4 }}>{m}</div>)}</div>}
                  {planningResult.budget_detail && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", marginBottom: 8, lineHeight: 1.6 }}>💶 {planningResult.budget_detail}</div>}
                  {planningResult.conseils && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", lineHeight: 1.6 }}>💡 {planningResult.conseils}</div>}
                </div>}
              </div>}

              {toolTab === "devis_pro" && <div>
                <div style={{ fontSize: 9, color: "#E8873A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>GÉNÉRATEUR DEVIS ARTISAN</div>
                <div style={{ marginBottom: 8 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Décrivez les travaux</div><textarea style={{ ...s.ci, width: "100%", minHeight: 100, borderRadius: 12, padding: "10px 14px", marginBottom: 0, lineHeight: 1.6 }} value={devisProDesc} onChange={e => setDevisProDesc(e.target.value)} placeholder="Ex: Pose carrelage salle de bain 8m²..." /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Client</div><input style={s.inp} value={devisProClient} onChange={e => setDevisProClient(e.target.value)} placeholder="Nom du client" /></div>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Surface m²</div><input style={s.inp} type="number" value={devisProSurface} onChange={e => setDevisProSurface(e.target.value)} /></div>
                </div>
                <button style={devisProLoading ? { ...s.greenBtn, opacity: 0.5, borderColor: "rgba(232,135,58,0.4)", color: "#E8873A" } : { ...s.greenBtn, borderColor: "rgba(232,135,58,0.45)", color: "#E8873A" }} onClick={genererDevisPro} disabled={devisProLoading}>{devisProLoading ? "Génération en cours..." : "📄 Générer le devis professionnel"}</button>
                {devisProResult && <div style={{ marginTop: 12 }}>
                  <div style={{ ...s.card, background: "rgba(201,168,76,0.05)", borderColor: "rgba(201,168,76,0.25)", marginBottom: 10 }}>
                    {(devisProResult.lignes || []).map((l, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "7px 0", borderBottom: i < devisProResult.lignes.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}><div style={{ flex: 1, marginRight: 10 }}><div style={{ fontSize: 11, fontWeight: 500 }}>{l.description}</div>{l.dtu && <div style={{ fontSize: 9, color: "#C9A84C", marginTop: 1 }}>{l.dtu}</div>}<div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)" }}>{l.quantite} {l.unite} × {l.prix_unitaire}</div></div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#C9A84C", flexShrink: 0 }}>{l.total}</div></div>)}
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 6, borderTop: "0.5px solid rgba(201,168,76,0.2)" }}><div style={{ fontSize: 12, color: "rgba(240,237,230,0.5)" }}>Total TTC</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#C9A84C" }}>{devisProResult.total_ttc}</div></div>
                  </div>
                  <button style={s.dlBtn} onClick={genererDevisProPDF}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Télécharger le devis PDF</button>
                  <button onClick={() => { setDevisProDesc(""); }} style={{ ...s.greenBtn, marginTop: 8, background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(240,237,230,0.4)" }}>← Nouveau devis</button>
                </div>}
              </div>}

              {toolTab === "rentabilite" && <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {[["Surface chantier m²", rentaSurface, setRentaSurface], ["Taux horaire €/h", rentaTaux, setRentaTaux], ["Coût matériaux €", rentaMat, setRentaMat], ["Déplacements €", rentaDep, setRentaDep]].map(([label, val, set]) => (
                    <div key={label}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div><input style={s.inp} type="number" value={val} onChange={e => set(e.target.value)} /></div>
                  ))}
                </div>
                <button style={s.greenBtn} onClick={calculerRentabilite}>📊 Calculer ma rentabilité</button>
                {rentaResult && <div style={{ marginTop: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    {[["CA Total", rentaResult.ca_total + "€", "#C9A84C"], ["Bénéfice net", rentaResult.benef + "€", rentaResult.benef > 0 ? "#52C37A" : "#E05252"], ["Marge", rentaResult.marge + "%", rentaResult.marge > 25 ? "#52C37A" : rentaResult.marge > 10 ? "#E8873A" : "#E05252"], ["Prix/m²", rentaResult.prix_m2 + "€", "#5290E0"]].map(([l, v, c]) => (
                      <div key={l} style={{ ...s.sc, textAlign: "left", padding: "12px 14px" }}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: c }}>{v}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 3 }}>{l}</div></div>
                    ))}
                  </div>
                  <div style={s.card}>
                    <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>DÉTAIL</div>
                    {[["Main d'œuvre (" + rentaResult.heures + "h × " + rentaTaux + "€/h)", rentaResult.mo + "€", "rgba(240,237,230,0.7)"], ["Matériaux", rentaMat + "€", "rgba(240,237,230,0.5)"], ["Déplacements", rentaDep + "€", "rgba(240,237,230,0.5)"], ["Charges sociales (45%)", "-" + rentaResult.charges + "€", "#E05252"], ["Bénéfice net", "→ " + rentaResult.benef + "€", rentaResult.benef > 0 ? "#52C37A" : "#E05252"]].map(([l, v, c]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><div style={{ fontSize: 11, color: "rgba(240,237,230,0.55)" }}>{l}</div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: c }}>{v}</div></div>
                    ))}
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
                    <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}><div style={{ width: Math.max(0, Math.min(rentaResult.marge, 100)) + "%", height: "100%", borderRadius: 4, background: rentaResult.marge > 25 ? "linear-gradient(90deg,#52C37A,#C9A84C)" : rentaResult.marge > 10 ? "#E8873A" : "#E05252", transition: "width 0.6s ease" }} /></div>
                    <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", marginTop: 4 }}>Marge : {rentaResult.marge}% {rentaResult.marge < 15 ? "⚠️ Insuffisante" : rentaResult.marge > 30 ? "✅ Excellente" : ""}</div>
                  </div>
                </div>}
              </div>}

            </div>
          </div>

          {/* ═══ PROJETS ═══ */}
          <div style={{ ...s.page, ...(page === "projets" ? s.pageActive : {}) }}>
            <div style={s.wrap}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 3 }}>Mes Projets</div>
              <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 14 }}>Suivi de vos chantiers</div>
              <div style={s.card}>
                <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Nouveau projet</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Nom du projet</div><input style={s.inp} value={projetNom} onChange={e => setProjetNom(e.target.value)} placeholder="Ex: Réno salle de bain" /></div>
                  <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Type</div><select style={s.inp} value={projetType} onChange={e => setProjetType(e.target.value)}>{["Rénovation", "Construction", "Isolation", "Plomberie", "Électricité", "Peinture", "Carrelage", "Aménagement", "Autre"].map(t => <option key={t}>{t}</option>)}</select></div>
                </div>
                <div style={{ marginBottom: 10 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Notes</div><textarea style={{ ...s.inp, minHeight: 60, resize: "none" }} value={projetNotes} onChange={e => setProjetNotes(e.target.value)} placeholder="Description, adresse, budget estimé..." /></div>
                <button style={s.greenBtn} onClick={ajouterProjet}>+ Créer le projet</button>
              </div>
              {projets.length === 0 && <div style={{ textAlign: "center", padding: "32px 16px", color: "rgba(240,237,230,0.3)", fontSize: 12 }}>Aucun projet pour l'instant.<br />Créez votre premier projet ci-dessus.</div>}
              {projets.map(p => <div key={p.id} style={{ ...s.card, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{p.nom}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "0.5px solid rgba(201,168,76,0.3)", fontWeight: 600 }}>{p.type}</span>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "rgba(82,195,122,0.08)", color: "#52C37A", border: "0.5px solid rgba(82,195,122,0.25)", fontWeight: 600 }}>{p.statut}</span>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "rgba(255,255,255,0.03)", color: "rgba(240,237,230,0.38)", border: "0.5px solid rgba(255,255,255,0.07)", fontWeight: 600 }}>{p.date}</span>
                    </div>
                  </div>
                  <button onClick={() => supprimerProjet(p.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: "rgba(224,82,82,0.5)" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg></button>
                </div>
                {p.notes && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", lineHeight: 1.6, borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: 8, marginTop: 6 }}>{p.notes}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 10 }}>
                  <button onClick={() => ouvrirProjetChat(p)} style={{ background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.25)", borderRadius: 10, padding: "7px 4px", fontSize: 9, fontWeight: 700, color: "#C9A84C", cursor: "pointer" }}>🤖 IA dédiée</button>
                  <button onClick={() => { goPage("cert"); setCertProjet(p.nom); }} style={{ background: "rgba(82,195,122,0.06)", border: "0.5px solid rgba(82,195,122,0.2)", borderRadius: 10, padding: "7px 4px", fontSize: 9, fontWeight: 700, color: "#52C37A", cursor: "pointer" }}>🏅 Certificat</button>
                  <button onClick={() => genererCRChantier(p)} disabled={crLoading} style={{ background: "rgba(82,144,224,0.06)", border: "0.5px solid rgba(82,144,224,0.2)", borderRadius: 10, padding: "7px 4px", fontSize: 9, fontWeight: 700, color: "#5290E0", cursor: "pointer", opacity: crLoading ? 0.5 : 1 }}>{crLoading ? "..." : "📋 CR PDF"}</button>
                </div>
              </div>)}
            </div>
          </div>

        </div>

        {/* ── NavBar ── */}
        <div style={s.bnav}>
          <NavIcon id="home" label="Accueil"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg></NavIcon>
          <NavIcon id="coach" label="32 IA"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></NavIcon>
          <NavIcon id="scanner" label="Scanner"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg></NavIcon>
          <NavIcon id="outils" label="Outils"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg></NavIcon>
          <NavIcon id="projets" label="Projets"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg></NavIcon>
        </div>

      </div>

      {/* ── Projet Chat Overlay ── */}
      {projetChat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,13,0.98)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", flexDirection: "column", zIndex: 9994, maxWidth: 430, margin: "0 auto" }}>
          <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid rgba(201,168,76,0.15)", flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2.2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg></div>
            <div style={{ flex: 1 }}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700 }}>{projetChat.nom}</div><div style={{ fontSize: 10, color: "#C9A84C" }}>IA dédiée · {projetChat.type}</div></div>
            <button onClick={() => setProjetChat(null)} style={{ background: "none", border: "none", color: "rgba(240,237,230,0.4)", fontSize: 22, cursor: "pointer", padding: 4 }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {projetChatMsgs.map((m, i) => (
              <div key={i} style={m.role === "ai" ? s.msgA : s.msgU}>
                <div style={s.mav}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round">{m.role === "ai" ? <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> : <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>}</svg></div>
                <div style={m.role === "ai" ? s.bubA : s.bubU} dangerouslySetInnerHTML={{ __html: m.text === "..." ? "<span>...</span>" : m.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 16px 16px", borderTop: "0.5px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <div style={s.inputBar}>
              <textarea style={s.ci} value={projetChatInput} onChange={e => setProjetChatInput(e.target.value)} placeholder={"Question sur " + projetChat.nom + "..."} rows={1} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendProjetChat(); } }} />
              <button style={s.sb} onClick={sendProjetChat} disabled={projetChatLoading}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg></button>
            </div>
          </div>
        </div>
      )}

      {/* ── Paywall ── */}
      {showPaywall && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,13,0.94)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 9997, padding: "0 32px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔓</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#C9A84C", marginBottom: 8, textAlign: "center" }}>5 messages utilisés</div>
          <div style={{ fontSize: 13, color: "rgba(240,237,230,0.55)", textAlign: "center", marginBottom: 28, lineHeight: 1.7, maxWidth: 280 }}>Passez Premium pour un accès illimité aux 32 IA expertes bâtiment.</div>
          <button onClick={async () => { try { const { checkoutPremium } = await import("./utils/stripe"); await checkoutPremium(); } catch { setShowPaywall(false); } }} style={{ width: "100%", maxWidth: 320, background: "linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border: "none", borderRadius: 14, padding: "15px", fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: "#06080D", cursor: "pointer", marginBottom: 12, boxShadow: "0 4px 28px rgba(201,168,76,0.4)" }}>Premium — 4,99€/mois</button>
          <button onClick={() => setShowPaywall(false)} style={{ background: "transparent", border: "none", fontSize: 12, color: "rgba(240,237,230,0.3)", cursor: "pointer", padding: 8 }}>Continuer sans Premium</button>
        </div>
      )}

      {/* ── RGPD Banner ── */}
      {!rgpdOk && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(10,14,22,0.97)", backdropFilter: "blur(20px)", borderTop: "0.5px solid rgba(201,168,76,0.2)", padding: "14px 16px", zIndex: 9999 }}>
          <div style={{ fontSize: 11, color: "rgba(240,237,230,0.6)", marginBottom: 10, lineHeight: 1.6 }}>MAESTROMIND utilise des cookies essentiels. En continuant, vous acceptez notre <span style={{ color: "#C9A84C" }}>politique de confidentialité</span>.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { localStorage.setItem("rgpd_accepted", "1"); setRgpdOk(true); }} style={{ flex: 1, background: "linear-gradient(135deg,#EDD060,#C9A84C)", border: "none", borderRadius: 10, padding: "10px", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: "#06080D", cursor: "pointer" }}>Accepter</button>
            <button onClick={() => { localStorage.setItem("rgpd_accepted", "1"); setRgpdOk(true); }} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px", fontSize: 12, color: "rgba(240,237,230,0.5)", cursor: "pointer" }}>Essentiels</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
