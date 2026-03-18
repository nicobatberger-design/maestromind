import { useState, useCallback, useRef } from "react";
import { useApp } from "../context/AppContext";
import { IAS, SHELF_TYPES } from "../data/constants";
import { apiURL, apiHeaders, withRetry } from "../utils/api";
import s from "../styles/index";

const METREUR_VISION_PROMPT = `Tu es l'IA MÉTREUR EXPERT de MAESTROMIND. Analyse cette photo d'un espace intérieur/extérieur et ESTIME les dimensions.

MÉTHODE D'ESTIMATION :
- Utilise les éléments de référence visibles (portes standard 2.04m, prises à 30cm du sol, plinthes ~8cm, interrupteurs à 1.10m, carreaux standard 30x30/45x45/60x60cm, parpaings 20x50cm)
- Si toit en pente visible, estime l'angle et les hauteurs min/max
- Détecte la forme de la pièce (rectangulaire, L, sous combles, etc.)

Réponds UNIQUEMENT en JSON valide :
{"largeur":"X.Xm","longueur":"X.Xm","hauteur":"X.Xm","hauteur_min":"X.Xm si pente","hauteur_max":"X.Xm si pente","pente":"X° si applicable","surface_sol":"X.Xm²","surface_murs":"X.Xm²","surface_rampant":"X.Xm² si pente","perimetre":"X.Xml","forme":"rectangulaire/L/sous combles/etc","ouvertures":[{"type":"porte/fenêtre","largeur":"Xm","hauteur":"Xm"}],"confiance":"haute/moyenne/basse","details":"explication des repères utilisés pour l'estimation"}

Ne mets que les champs pertinents. Sois précis dans tes estimations.`;

export default function ScannerPage() {
  const {
    page, goPage, switchIA, apiKey,
    camActive, photoUrl, scanLoading, scanResult, scanIA, setScanIA, scannerTab, setScannerTab,
    arModeType, setArModeType, arAnchor, setArAnchor, arShelfType, setArShelfType, showArAdvisor, setShowArAdvisor, arAdvInput, setArAdvInput, arAdvResult, arAdvLoading,
    videoRef, canvasRef, arVideoRef, arCanvasRef, arAnchorRef, arModeRef, arShelfTypeRef,
    ouvrirCamera, prendrePhoto, importerPhoto, analyserPhoto, suggestShelf,
    setCalcSurface, setCalcHauteur, setCalcPente, setCalcLongueur,
  } = useApp();

  const [mesureLoading, setMesureLoading] = useState(false);
  const [mesureResult, setMesureResult] = useState(null);
  const [mesurePhoto, setMesurePhoto] = useState(null);
  const mesureVideoRef = useRef(null);
  const mesureCanvasRef = useRef(null);
  const mesureStreamRef = useRef(null);
  const [mesureCam, setMesureCam] = useState(false);

  const ouvrirMesureCam = useCallback(async () => {
    try {
      if (mesureStreamRef.current) mesureStreamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      mesureStreamRef.current = stream;
      if (mesureVideoRef.current) { mesureVideoRef.current.srcObject = stream; mesureVideoRef.current.play().catch(() => {}); }
      setMesureCam(true);
      setMesurePhoto(null);
      setMesureResult(null);
    } catch { alert("Impossible d'accéder à la caméra."); }
  }, []);

  const prendreMesurePhoto = useCallback(() => {
    if (!mesureCam || !mesureVideoRef.current || !mesureCanvasRef.current) return;
    const v = mesureVideoRef.current, c = mesureCanvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg", 0.85);
    setMesurePhoto(dataUrl);
    setMesureCam(false);
    mesureStreamRef.current?.getTracks().forEach(t => t.stop());
    mesureStreamRef.current = null;
    analyserMesure(dataUrl);
  }, [mesureCam]);

  const importerMesurePhoto = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setMesurePhoto(ev.target.result); analyserMesure(ev.target.result); };
    reader.readAsDataURL(file);
  }, []);

  const analyserMesure = useCallback(async (dataUrl) => {
    setMesureLoading(true);
    setMesureResult(null);
    const base64 = dataUrl.split(",")[1];
    const mediaType = dataUrl.split(";")[0].split(":")[1] || "image/jpeg";
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST",
        headers: apiHeaders(apiKey),
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 900,
          system: METREUR_VISION_PROMPT,
          messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: "Analyse cette photo et estime les dimensions de l'espace visible." }] }]
        }),
      }));
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const txt = data.content[0].text.replace(/```json|```/g, "").trim();
      setMesureResult(JSON.parse(txt));
    } catch (e) {
      setMesureResult({ erreur: e.message });
    } finally { setMesureLoading(false); }
  }, [apiKey]);

  const injecterMesures = useCallback(() => {
    if (!mesureResult) return;
    if (mesureResult.surface_sol) setCalcSurface(parseFloat(mesureResult.surface_sol));
    if (mesureResult.hauteur) setCalcHauteur(parseFloat(mesureResult.hauteur));
    if (mesureResult.hauteur_max) setCalcHauteur(parseFloat(mesureResult.hauteur_max));
    if (mesureResult.pente) setCalcPente(parseFloat(mesureResult.pente));
    if (mesureResult.perimetre) setCalcLongueur(parseFloat(mesureResult.perimetre));
    goPage("outils");
  }, [mesureResult, setCalcSurface, setCalcHauteur, setCalcPente, setCalcLongueur, goPage]);

  return (
    <div style={{ ...s.page, ...(page === "scanner" ? s.pageActive : {}) }}>
      <div style={{ display: "flex", gap: 0, borderBottom: "0.5px solid rgba(201,168,76,0.12)", flexShrink: 0 }}>
        {[["photo", "\u{1F4F7}  Photo IA"], ["mesure", "\u{1F4D0}  Mesurer"], ["ar", "\u{1F3AF}  AR Live 3D"]].map(([k, l]) => (
          <button key={k} onClick={() => { setScannerTab(k); if (k === "ar" && !camActive) ouvrirCamera(); }} style={{ flex: 1, padding: "12px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", color: scannerTab === k ? (k === "mesure" ? "#52C37A" : "#C9A84C") : "rgba(240,237,230,0.3)", borderBottom: scannerTab === k ? ("2px solid " + (k === "mesure" ? "#52C37A" : "#C9A84C")) : "2px solid transparent", transition: "all 0.2s", fontFamily: "'Syne',sans-serif" }}>{l}</button>
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
                <div style={{ fontSize: 11, fontWeight: 700, color: "#E05252", marginBottom: 6 }}>{"\u26A0\uFE0F"} INTERVENTION PROFESSIONNELLE REQUISE</div>
                <div style={{ fontSize: 10, color: "rgba(224,82,82,0.8)", lineHeight: 1.7 }}>Ne pas tenter de réparation sans évaluation experte. Risques : amiante, plomb, gaz, instabilité structurelle.</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["Amiante \u2192 SS3/SS4", "Plomb \u2192 CREP", "Gaz \u2192 0800 47 33 33", "Structure \u2192 Bureau de contrôle"].map(a => (<span key={a} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 20, background: "rgba(224,82,82,0.12)", border: "0.5px solid rgba(224,82,82,0.35)", color: "#E05252", fontWeight: 600 }}>{a}</span>))}
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
                <div style={{ fontSize: 11, color: "rgba(240,237,230,0.65)", lineHeight: 1.5 }}>{"\u{1F4A1}"} {scanResult.conseils_pro}</div>
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

      {/* Mesure Tab */}
      {scannerTab === "mesure" && <div style={{ ...s.wrap, paddingTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#52C37A,#3A9B5A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F0EDE6" strokeWidth="2.2" strokeLinecap="round"><path d="M2 2l5 5M2 2v4M2 2h4" /><path d="M22 22l-5-5M22 22v-4M22 22h-4" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: "#52C37A" }}>Métreur IA Vision</div>
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>Prenez une photo, l'IA estime les dimensions</div>
          </div>
        </div>

        <video ref={mesureVideoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: 12, display: mesureCam ? "block" : "none", marginBottom: 12, maxHeight: 280, objectFit: "cover" }} />
        <canvas ref={mesureCanvasRef} style={{ display: "none" }} />

        {mesurePhoto && <img src={mesurePhoto} alt="mesure" style={{ width: "100%", borderRadius: 12, marginBottom: 12, maxHeight: 280, objectFit: "cover" }} />}

        {!mesureCam && !mesurePhoto && (
          <div style={{ width: "100%", aspectRatio: "4/3", background: "#0D1018", border: "1.5px dashed rgba(82,195,122,0.25)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#52C37A" strokeWidth="1.2" strokeLinecap="round" style={{ opacity: 0.5, marginBottom: 10 }}><path d="M2 2l5 5M2 2v4M2 2h4" /><path d="M22 22l-5-5M22 22v-4M22 22h-4" /><path d="M22 2l-5 5M22 2v4M22 2h-4" /><path d="M2 22l5-5M2 22v-4M2 22h4" /></svg>
            <p style={{ fontSize: 12, color: "rgba(240,237,230,0.5)" }}>Photographiez votre pièce ou mur</p>
            <p style={{ fontSize: 10, color: "rgba(240,237,230,0.3)", marginTop: 4 }}>L'IA utilise les repères visibles (portes, prises, carrelage)</p>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button style={{ ...s.scanBtn, background: "linear-gradient(135deg,#52C37A,#3A9B5A)", borderColor: "rgba(82,195,122,0.5)" }} onClick={ouvrirMesureCam}>Activer caméra</button>
          <button style={{ ...s.scanBtnGhost, borderColor: "rgba(82,195,122,0.3)", color: "#52C37A", opacity: mesureCam ? 1 : 0.4 }} onClick={prendreMesurePhoto}>Mesurer</button>
        </div>

        <label style={{ display: "block", width: "100%", background: "#181D28", border: "0.5px solid rgba(82,195,122,0.15)", borderRadius: 12, padding: "12px", textAlign: "center", fontSize: 12, color: "rgba(240,237,230,0.5)", cursor: "pointer", marginBottom: 12 }}>
          Importer une photo depuis la galerie
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={importerMesurePhoto} />
        </label>

        {mesureLoading && <div style={{ background: "#181D28", borderRadius: 12, padding: 14, textAlign: "center", fontSize: 12, color: "#52C37A", marginBottom: 12 }}>{"\u{1F4D0}"} Le Métreur IA analyse les dimensions...</div>}

        {mesureResult && !mesureResult.erreur && (
          <div style={{ background: "#181D28", border: "0.5px solid rgba(82,195,122,0.2)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: mesureResult.confiance === "haute" ? "rgba(82,195,122,0.15)" : mesureResult.confiance === "moyenne" ? "rgba(201,168,76,0.12)" : "rgba(232,135,58,0.12)", color: mesureResult.confiance === "haute" ? "#52C37A" : mesureResult.confiance === "moyenne" ? "#C9A84C" : "#E8873A", border: "0.5px solid currentColor" }}>Confiance {mesureResult.confiance}</span>
              <strong style={{ fontFamily: "'Syne',sans-serif", fontSize: 13 }}>{mesureResult.forme || "Espace analysé"}</strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
              {mesureResult.largeur && <div style={{ background: "rgba(82,195,122,0.06)", border: "0.5px solid rgba(82,195,122,0.2)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Largeur</div><div style={{ fontSize: 14, fontWeight: 700, color: "#52C37A" }}>{mesureResult.largeur}</div></div>}
              {mesureResult.longueur && <div style={{ background: "rgba(82,195,122,0.06)", border: "0.5px solid rgba(82,195,122,0.2)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Longueur</div><div style={{ fontSize: 14, fontWeight: 700, color: "#52C37A" }}>{mesureResult.longueur}</div></div>}
              {mesureResult.hauteur && <div style={{ background: "rgba(82,144,224,0.06)", border: "0.5px solid rgba(82,144,224,0.2)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Hauteur</div><div style={{ fontSize: 14, fontWeight: 700, color: "#5290E0" }}>{mesureResult.hauteur}</div></div>}
              {mesureResult.surface_sol && <div style={{ background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Surface sol</div><div style={{ fontSize: 14, fontWeight: 700, color: "#C9A84C" }}>{mesureResult.surface_sol}</div></div>}
            </div>

            {(mesureResult.pente || mesureResult.hauteur_min) && <div style={{ display: "flex", gap: 7, marginBottom: 10 }}>
              {mesureResult.pente && <div style={{ flex: 1, background: "rgba(232,135,58,0.06)", border: "0.5px solid rgba(232,135,58,0.2)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Pente</div><div style={{ fontSize: 14, fontWeight: 700, color: "#E8873A" }}>{mesureResult.pente}</div></div>}
              {mesureResult.hauteur_min && <div style={{ flex: 1, background: "rgba(82,144,224,0.06)", border: "0.5px solid rgba(82,144,224,0.2)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>H. min</div><div style={{ fontSize: 14, fontWeight: 700, color: "#5290E0" }}>{mesureResult.hauteur_min}</div></div>}
              {mesureResult.hauteur_max && <div style={{ flex: 1, background: "rgba(82,144,224,0.06)", border: "0.5px solid rgba(82,144,224,0.2)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>H. max</div><div style={{ fontSize: 14, fontWeight: 700, color: "#5290E0" }}>{mesureResult.hauteur_max}</div></div>}
              {mesureResult.surface_rampant && <div style={{ flex: 1, background: "rgba(232,135,58,0.06)", border: "0.5px solid rgba(232,135,58,0.2)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Surface rampant</div><div style={{ fontSize: 14, fontWeight: 700, color: "#E8873A" }}>{mesureResult.surface_rampant}</div></div>}
            </div>}

            {mesureResult.ouvertures?.length > 0 && <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>Ouvertures détectées</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {mesureResult.ouvertures.map((o, i) => <span key={i} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(240,237,230,0.7)" }}>{o.type} {o.largeur}{"\u00D7"}{o.hauteur}</span>)}
              </div>
            </div>}

            {mesureResult.details && <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", lineHeight: 1.6, marginBottom: 10, borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>{"\u{1F4A1}"} {mesureResult.details}</div>}

            <button onClick={injecterMesures} style={{ width: "100%", background: "linear-gradient(135deg,#52C37A,#3A9B5A)", border: "none", borderRadius: 12, padding: "12px", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800, color: "#F0EDE6", cursor: "pointer", boxShadow: "0 4px 20px rgba(82,195,122,0.3)" }}>{"\u{1F4D0}"} Utiliser ces mesures dans Outils</button>
          </div>
        )}

        {mesureResult?.erreur && <div style={{ ...s.errBox }}>{mesureResult.erreur}</div>}
      </div>}

      {/* AR Tab */}
      {scannerTab === "ar" && <div style={{ position: "absolute", top: 44, left: 0, right: 0, bottom: 0, background: "#000", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "rgba(6,8,13,0.88)", backdropFilter: "blur(12px)", flexShrink: 0, zIndex: 10 }}>
          <div style={{ display: "flex", gap: 5, padding: "7px 10px 4px", overflowX: "auto", scrollbarWidth: "none" }}>
            {[["etagere", "\u{1FA9E} Étagère"], ["cloison", "\u{1F9F1} Cloison"], ["carrelage", "\u25FC Carrelage"], ["prise", "\u{1F50C} Prise"], ["tableau", "\u{1F5BC} Tableau"], ["porte", "\u{1F6AA} Porte"], ["fenetre", "\u{1FA9F} Fenêtre"], ["radiateur", "\u{1F321}\uFE0F Radiateur"], ["luminaire", "\u{1F4A1} Luminaire"]].map(([k, l]) => (
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
                <button onClick={() => setShowArAdvisor(prev => !prev)} style={{ flexShrink: 0, padding: "4px 9px", borderRadius: 16, fontSize: 9, fontWeight: 700, cursor: "pointer", border: "0.5px solid rgba(82,195,122,0.45)", background: "rgba(82,195,122,0.1)", color: "#52C37A", whiteSpace: "nowrap" }}>{"\u{1F4A1}"} Je ne sais pas</button>
              </div>
              <div style={{ fontSize: 8, color: "rgba(240,237,230,0.3)", paddingLeft: 2, marginTop: 2 }}>{SHELF_TYPES[arShelfType].desc} · {SHELF_TYPES[arShelfType].prix}</div>
            </div>
          )}
        </div>
        {arModeType === "etagere" && showArAdvisor && (
          <div style={{ background: "rgba(6,8,13,0.97)", backdropFilter: "blur(20px)", borderBottom: "0.5px solid rgba(201,168,76,0.2)", padding: "10px 14px", flexShrink: 0, zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#52C37A" }}>{"\u{1F4A1}"} Conseiller IA Étagère</div>
              <button onClick={() => setShowArAdvisor(false)} style={{ background: "none", border: "none", color: "rgba(240,237,230,0.4)", fontSize: 16, cursor: "pointer", padding: 0 }}>{"\u00D7"}</button>
            </div>
            <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
              <input value={arAdvInput} onChange={e => setArAdvInput(e.target.value)} placeholder="Décrivez votre pièce / mur" style={{ flex: 1, background: "rgba(15,19,28,0.85)", border: "0.5px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "7px 10px", color: "#F0EDE6", fontSize: 11, outline: "none", fontFamily: "'DM Sans',sans-serif" }} onKeyDown={e => { if (e.key === "Enter") suggestShelf(); }} />
              <button onClick={suggestShelf} disabled={arAdvLoading} style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#EDD060,#C9A84C)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#06080D" }}>
                {arAdvLoading ? "\u2026" : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>}
              </button>
            </div>
            {arAdvResult && (
              <div style={{ background: "rgba(15,19,28,0.85)", border: "0.5px solid rgba(201,168,76,0.25)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{SHELF_TYPES[arAdvResult.type]?.emoji || "\u25AC"}</span>
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
                    <button onClick={() => { const u = arAdvResult.ou?.toLowerCase().includes("ikea") ? "ikea.com/fr" : arAdvResult.ou?.toLowerCase().includes("casto") ? "castorama.fr" : "leroymerlin.fr"; window.open("https://www." + u + "/recherche/?q=" + encodeURIComponent(arAdvResult.url_keyword || arAdvResult.produit) + "&utm_source=maestromind&utm_medium=ar&utm_campaign=advisor", "_blank"); }} style={{ flexShrink: 0, padding: "5px 10px", borderRadius: 8, background: "linear-gradient(135deg,#EDD060,#C9A84C)", border: "none", fontSize: 9, fontWeight: 700, color: "#06080D", cursor: "pointer" }}>Acheter {"\u2192"}</button>
                  </div>
                )}
                {arAdvResult.conseils && <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 6, lineHeight: 1.5 }}>{"\u{1F4A1}"} {arAdvResult.conseils}</div>}
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
          <div style={{ fontSize: 10, color: arAnchor ? "#52C37A" : "rgba(240,237,230,0.45)", fontWeight: 600 }}>{arAnchor ? "\u2705 Placé — Glissez pour déplacer" : "\u{1F446} Appuyez sur le mur pour placer"}</div>
          <button onClick={() => { setArAnchor(null); arAnchorRef.current = null; }} style={{ fontSize: 9, padding: "5px 12px", borderRadius: 20, background: "rgba(224,82,82,0.12)", border: "0.5px solid rgba(224,82,82,0.35)", color: "#E05252", cursor: "pointer", fontWeight: 700 }}>Effacer</button>
        </div>
      </div>}
    </div>
  );
}
