import { useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { IAS } from "../data/constants";
import { apiURL, apiHeaders, withRetry } from "../utils/api";
import s from "../styles/index";

function buildMesurePrompt(target, refType, refValue) {
  const refInfo = refType && refValue
    ? `\nCALIBRATION : ${refType === "porte" ? "porte visible = " + refValue + "m haut" : refType === "fenetre" ? "fenêtre = " + refValue + "m large" : refType === "carreau" ? "carreau = " + refValue + "cm" : refType === "hauteur" ? "hauteur plafond = " + refValue + "m" : "élément = " + refValue + "m"}. UTILISE CE REPÈRE comme référence absolue. Calcule tout par proportion.`
    : "\nAucun repère fourni. Utilise les standards visibles (porte 2.04m, prise 30cm sol, interrupteur 1.10m, plinthe 8cm, carreaux 30/45/60cm).";

  const base = `Tu es MÉTREUR EXPERT bâtiment. Mesure à partir de la photo.${refInfo}\n\nRepères standards : Porte 2.04×0.83m | Prise 30cm sol | Interrupteur 1.10m | Plinthe 8cm | Carreaux 30/45/60cm | Parpaing 20×50cm | BA13 120×250cm`;

  if (target === "mur") return base + `\n\nPHOTO MUR. JSON UNIQUEMENT :\n{"hauteur":"X.Xm","largeur":"X.Xm","surface_mur":"X.Xm²","ouvertures":[{"type":"porte/fenêtre","largeur":"X.Xm","hauteur":"X.Xm"}],"surface_nette":"X.Xm²","confiance":"haute/moyenne/basse","methode":"repère + calcul"}`;
  if (target === "plafond") return base + `\n\nPHOTO PLAFOND. JSON UNIQUEMENT :\n{"type":"plat/pente","longueur":"X.Xm","largeur":"X.Xm","surface_sol":"X.Xm²","pente":"X°","hauteur_min":"X.Xm","hauteur_max":"X.Xm","surface_rampant":"X.Xm²","confiance":"haute/moyenne/basse","methode":"repère + calcul"}`;
  return base + `\n\nPHOTO PIÈCE. JSON UNIQUEMENT :\n{"longueur":"X.Xm","largeur":"X.Xm","hauteur":"X.Xm","surface_sol":"X.Xm²","perimetre":"X.Xml","surface_murs":"X.Xm²","forme":"rectangulaire/L/sous combles","pente":"X°","hauteur_min":"X.Xm","hauteur_max":"X.Xm","ouvertures":[{"type":"porte/fenêtre","largeur":"X.Xm","hauteur":"X.Xm"}],"confiance":"haute/moyenne/basse","methode":"repère + calcul"}\nChamps pertinents uniquement.`;
}

function parseAIJson(text) {
  const clean = (text || "").replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const m = clean.match(/\{[\s\S]*\}/);
  if (m) return JSON.parse(m[0]);
  throw new Error("L'IA n'a pas pu analyser. Réessayez avec une meilleure photo.");
}

export default function ScannerPage() {
  const {
    page, goPage, switchIA, apiKey,
    photoUrl, scanLoading, scanResult, scanIA, setScanIA, scannerTab, setScannerTab,
    analyserPhoto, setCalcSurface, setCalcHauteur, setCalcPente, setCalcLongueur,
  } = useApp();

  // Mode actuel
  const [mode, setMode] = useState("diagnostic"); // diagnostic | mesure
  const [photo, setPhoto] = useState(null);

  // Mesure state
  const [mesureTarget, setMesureTarget] = useState("mur");
  const [mesureRefType, setMesureRefType] = useState("porte");
  const [mesureRefValue, setMesureRefValue] = useState("2.04");
  const [mesureLoading, setMesureLoading] = useState(false);
  const [mesureResult, setMesureResult] = useState(null);

  // Gestion photo — ouvre la caméra NATIVE du téléphone
  const handlePhoto = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPhoto(dataUrl);
      if (mode === "diagnostic") {
        analyserPhoto(dataUrl, scanIA);
      } else {
        analyserMesurePhoto(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [mode, scanIA, analyserPhoto]);

  const analyserMesurePhoto = useCallback(async (dataUrl) => {
    setMesureLoading(true);
    setMesureResult(null);
    const base64 = dataUrl.split(",")[1];
    const mediaType = dataUrl.split(";")[0].split(":")[1] || "image/jpeg";
    const targetLabels = { mur: "un mur", piece: "une pièce", plafond: "un plafond" };
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST",
        headers: apiHeaders(apiKey),
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 900,
          system: buildMesurePrompt(mesureTarget, mesureRefType, mesureRefValue),
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: "Photo : " + targetLabels[mesureTarget] + ". Repère : " + mesureRefType + " = " + mesureRefValue + (mesureRefType === "carreau" ? "cm" : "m") + ". Mesure tout par proportion." }
          ]}]
        }),
      }));
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const result = parseAIJson(data?.content?.[0]?.text);
      result._target = mesureTarget;
      setMesureResult(result);
    } catch (e) {
      setMesureResult({ erreur: e.message });
    } finally { setMesureLoading(false); }
  }, [apiKey, mesureTarget, mesureRefType, mesureRefValue]);

  const injecterMesures = useCallback(() => {
    if (!mesureResult) return;
    const r = mesureResult;
    const surface = parseFloat(r.surface_nette || r.surface_sol || r.surface_mur || r.surface_rampant || "0");
    if (surface > 0) setCalcSurface(String(surface));
    const hauteur = parseFloat(r.hauteur || r.hauteur_max || "0");
    if (hauteur > 0) setCalcHauteur(String(hauteur));
    const pente = parseFloat(r.pente || "0");
    if (pente > 0) setCalcPente(String(pente));
    const longueur = parseFloat(r.perimetre || r.largeur || "0");
    if (longueur > 0) setCalcLongueur(String(longueur));
    goPage("outils");
  }, [mesureResult, setCalcSurface, setCalcHauteur, setCalcPente, setCalcLongueur, goPage]);

  const MCard = ({ label, value, color = "#52C37A" }) => value ? (
    <div style={{ background: color + "0F", border: "0.5px solid " + color + "33", borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: 8, color: "rgba(240,237,230,0.4)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
    </div>
  ) : null;

  return (
    <div style={{ ...s.page, ...(page === "scanner" ? s.pageActive : {}) }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "0.5px solid rgba(201,168,76,0.12)", flexShrink: 0 }}>
        {[["diagnostic", "\u{1F4F7} Diagnostic IA"], ["mesure", "\u{1F4D0} Mesurer"]].map(([k, l]) => (
          <button key={k} onClick={() => { setScannerTab(k); setMode(k); setPhoto(null); setMesureResult(null); }} style={{ flex: 1, padding: "12px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", color: mode === k ? (k === "mesure" ? "#52C37A" : "#C9A84C") : "rgba(240,237,230,0.3)", borderBottom: mode === k ? ("2px solid " + (k === "mesure" ? "#52C37A" : "#C9A84C")) : "2px solid transparent", fontFamily: "'Syne',sans-serif" }}>{l}</button>
        ))}
      </div>

      <div style={s.wrap}>
        {/* === MODE DIAGNOSTIC === */}
        {mode === "diagnostic" && <>
          <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>IA analyste</div>
          <div style={{ display: "flex", gap: 5, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 8 }}>
            {["diag", "analyse_visuelle", "urgence", "coach", "cert", "thermique", "shop"].map(k => (
              <button key={k} onClick={() => { setScanIA(k); if (photo) analyserPhoto(photo, k); }} style={{ flexShrink: 0, padding: "5px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", border: "0.5px solid " + (scanIA === k ? IAS[k]?.color || "#C9A84C" : "rgba(255,255,255,0.07)"), background: scanIA === k ? (IAS[k]?.color || "#C9A84C") + "18" : "transparent", color: scanIA === k ? IAS[k]?.color || "#C9A84C" : "rgba(240,237,230,0.45)" }}>
                {IAS[k]?.name?.replace("IA ", "") || k}
              </button>
            ))}
          </div>
        </>}

        {/* === MODE MESURE === */}
        {mode === "mesure" && <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#52C37A,#3A9B5A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F0EDE6" strokeWidth="2.2" strokeLinecap="round"><path d="M2 2l5 5M2 2v4M2 2h4" /><path d="M22 22l-5-5M22 22v-4M22 22h-4" /></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: "#52C37A" }}>Métreur IA Vision</div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>Prenez une photo, l'IA mesure</div>
            </div>
          </div>

          <div style={{ fontSize: 9, color: "#52C37A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Je photographie</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[["mur", "\u{1F9F1} Un mur"], ["piece", "\u{1F3E0} Une pièce"], ["plafond", "\u2B06\uFE0F Un plafond"]].map(([k, l]) => (
              <button key={k} onClick={() => setMesureTarget(k)} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "0.5px solid " + (mesureTarget === k ? "#52C37A" : "rgba(255,255,255,0.08)"), background: mesureTarget === k ? "rgba(82,195,122,0.12)" : "rgba(15,19,28,0.6)", color: mesureTarget === k ? "#52C37A" : "rgba(240,237,230,0.5)", fontFamily: "'Syne',sans-serif" }}>{l}</button>
            ))}
          </div>

          <div style={{ background: "rgba(82,195,122,0.05)", border: "0.5px solid rgba(82,195,122,0.15)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: "#52C37A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Repère visible sur la photo</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {[["porte", "Porte"], ["fenetre", "Fenêtre"], ["carreau", "Carreau"], ["hauteur", "Hauteur"], ["custom", "Autre"]].map(([k, l]) => (
                <button key={k} onClick={() => { setMesureRefType(k); setMesureRefValue(k === "porte" ? "2.04" : k === "fenetre" ? "1.15" : k === "carreau" ? "30" : k === "hauteur" ? "2.50" : ""); }} style={{ flex: 1, padding: "5px 2px", borderRadius: 8, fontSize: 9, fontWeight: 600, cursor: "pointer", border: "0.5px solid " + (mesureRefType === k ? "#52C37A" : "rgba(255,255,255,0.08)"), background: mesureRefType === k ? "rgba(82,195,122,0.12)" : "transparent", color: mesureRefType === k ? "#52C37A" : "rgba(240,237,230,0.4)", whiteSpace: "nowrap" }}>{l}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input style={{ ...s.inp, flex: 1 }} type="number" step="0.01" value={mesureRefValue} onChange={e => setMesureRefValue(e.target.value)} />
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)" }}>{mesureRefType === "carreau" ? "cm" : "m"}</div>
            </div>
          </div>
        </>}

        {/* === PHOTO (commune aux 2 modes) === */}
        {photo && <img src={photo} alt="photo" style={{ width: "100%", borderRadius: 12, marginBottom: 12, maxHeight: 280, objectFit: "cover" }} />}

        {!photo && (
          <div style={{ width: "100%", aspectRatio: "4/3", background: "#0D1018", border: "1.5px dashed " + (mode === "mesure" ? "rgba(82,195,122,0.25)" : "rgba(201,168,76,0.18)"), borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={mode === "mesure" ? "#52C37A" : "#C9A84C"} strokeWidth="1.4" strokeLinecap="round" style={{ opacity: 0.6, marginBottom: 10 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            <p style={{ fontSize: 12, color: "rgba(240,237,230,0.5)" }}>{mode === "mesure" ? "Photographiez votre mur ou pièce" : "Photographiez le problème"}</p>
          </div>
        )}

        {/* Boutons — caméra native du téléphone */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <label style={{ flex: 1, background: mode === "mesure" ? "linear-gradient(135deg,#52C37A,#3A9B5A)" : "linear-gradient(135deg,#EDD060,#C9A84C)", border: "none", borderRadius: 12, padding: "14px", textAlign: "center", fontSize: 13, fontWeight: 800, color: mode === "mesure" ? "#F0EDE6" : "#06080D", cursor: "pointer", fontFamily: "'Syne',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            {photo ? "Reprendre" : "Prendre photo"}
            <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
          </label>
          <label style={{ flex: 1, background: "#181D28", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px", textAlign: "center", fontSize: 12, color: "rgba(240,237,230,0.5)", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
            Galerie
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
          </label>
        </div>

        {/* === RÉSULTATS DIAGNOSTIC === */}
        {mode === "diagnostic" && scanLoading && <div style={{ background: "#181D28", borderRadius: 12, padding: 14, textAlign: "center", fontSize: 12, color: "rgba(240,237,230,0.5)", marginBottom: 12 }}>L'IA analyse votre photo...</div>}
        {mode === "diagnostic" && scanResult && (
          <div style={{ background: "#181D28", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
              <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: scanResult.urgence === "DANGER" ? "rgba(224,82,82,0.18)" : scanResult.urgence === "URGENT" ? "rgba(232,135,58,0.15)" : scanResult.urgence === "MODERE" ? "rgba(201,168,76,0.12)" : "rgba(82,195,122,0.12)", color: scanResult.urgence === "DANGER" ? "#E05252" : scanResult.urgence === "URGENT" ? "#E8873A" : scanResult.urgence === "MODERE" ? "#C9A84C" : "#52C37A", border: "0.5px solid currentColor" }}>{scanResult.urgence}</span>
              <strong style={{ fontFamily: "'Syne',sans-serif", fontSize: 13 }}>{scanResult.titre}</strong>
            </div>
            {scanResult.etapes?.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 9, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "0.5px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#C9A84C", flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)", lineHeight: 1.5 }}>{e}</div>
              </div>
            ))}
            {scanResult.conseils_pro && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", lineHeight: 1.6, marginTop: 8 }}>{"\u{1F4A1}"} {scanResult.conseils_pro}</div>}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {["diag", "urgence", "coach", "cert"].map(k => (
                <button key={k} onClick={() => { goPage("coach"); switchIA(k); }} style={{ padding: "5px 11px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "0.5px solid " + (IAS[k]?.color || "#C9A84C") + "66", background: (IAS[k]?.color || "#C9A84C") + "14", color: IAS[k]?.color || "#C9A84C" }}>{IAS[k]?.name?.replace("IA ", "") || k}</button>
              ))}
            </div>
          </div>
        )}

        {/* === RÉSULTATS MESURE === */}
        {mode === "mesure" && mesureLoading && <div style={{ background: "#181D28", borderRadius: 12, padding: 14, textAlign: "center", fontSize: 12, color: "#52C37A", marginBottom: 12 }}>{"\u{1F4D0}"} Le Métreur IA analyse...</div>}
        {mode === "mesure" && mesureResult && !mesureResult.erreur && (
          <div style={{ background: "#181D28", border: "0.5px solid rgba(82,195,122,0.2)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: mesureResult.confiance === "haute" ? "rgba(82,195,122,0.15)" : mesureResult.confiance === "moyenne" ? "rgba(201,168,76,0.12)" : "rgba(232,135,58,0.12)", color: mesureResult.confiance === "haute" ? "#52C37A" : mesureResult.confiance === "moyenne" ? "#C9A84C" : "#E8873A", border: "0.5px solid currentColor" }}>Confiance {mesureResult.confiance}</span>
              <strong style={{ fontFamily: "'Syne',sans-serif", fontSize: 13 }}>{mesureResult.forme || mesureResult.type || "Analyse"}</strong>
            </div>

            {mesureResult._target === "mur" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
              <MCard label="Hauteur" value={mesureResult.hauteur} color="#5290E0" />
              <MCard label="Largeur" value={mesureResult.largeur} />
              <MCard label="Surface brute" value={mesureResult.surface_mur} color="#C9A84C" />
              <MCard label="Surface nette" value={mesureResult.surface_nette} color="#52C37A" />
            </div>}

            {mesureResult._target === "piece" && <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
                <MCard label="Longueur" value={mesureResult.longueur} />
                <MCard label="Largeur" value={mesureResult.largeur} />
                <MCard label="Hauteur" value={mesureResult.hauteur} color="#5290E0" />
                <MCard label="Surface sol" value={mesureResult.surface_sol} color="#C9A84C" />
              </div>
              {mesureResult.perimetre && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
                <MCard label="Périmètre" value={mesureResult.perimetre} color="#C9A84C" />
                <MCard label="Surface murs" value={mesureResult.surface_murs} color="#5290E0" />
              </div>}
            </>}

            {mesureResult._target === "plafond" && <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
                <MCard label="Longueur" value={mesureResult.longueur} />
                <MCard label="Largeur" value={mesureResult.largeur} />
                <MCard label="Surface sol" value={mesureResult.surface_sol} color="#C9A84C" />
                <MCard label="Type" value={mesureResult.type} color="#5290E0" />
              </div>
              {mesureResult.pente && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 10 }}>
                <MCard label="Pente" value={mesureResult.pente} color="#E8873A" />
                <MCard label="H. min" value={mesureResult.hauteur_min} color="#5290E0" />
                <MCard label="H. max" value={mesureResult.hauteur_max} color="#5290E0" />
              </div>}
              {mesureResult.surface_rampant && <MCard label="Surface rampant" value={mesureResult.surface_rampant} color="#E8873A" />}
            </>}

            {mesureResult.ouvertures?.length > 0 && <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>Ouvertures</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {mesureResult.ouvertures.map((o, i) => <span key={i} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(240,237,230,0.7)" }}>{o.type} {o.largeur}{"\u00D7"}{o.hauteur}</span>)}
              </div>
            </div>}

            {mesureResult.methode && <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", lineHeight: 1.6, marginBottom: 10, borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>{"\u{1F4A1}"} {mesureResult.methode}</div>}

            <button onClick={injecterMesures} style={{ width: "100%", background: "linear-gradient(135deg,#52C37A,#3A9B5A)", border: "none", borderRadius: 12, padding: "12px", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800, color: "#F0EDE6", cursor: "pointer" }}>{"\u{1F4D0}"} Utiliser dans Outils</button>
          </div>
        )}
        {mode === "mesure" && mesureResult?.erreur && <div style={s.errBox}>{mesureResult.erreur}</div>}
      </div>
    </div>
  );
}
