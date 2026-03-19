import { useState, useCallback, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { IAS } from "../data/constants";
import { apiURL, apiHeaders, withRetry } from "../utils/api";
import s from "../styles/index";

const HISTORY_KEY = "mm_scanner_history";
const MAX_HISTORY = 20;

function createThumbnail(dataUrl, size = 100) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.src = dataUrl;
  });
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}

function saveHistory(entries) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

export default function ScannerPage() {
  const {
    page, goPage, switchIA, apiKey,
    scanLoading, scanResult, scanIA, setScanIA, scannerTab, setScannerTab,
    analyserPhoto, setCalcSurface, setCalcHauteur, setCalcPente, setCalcLongueur,
  } = useApp();

  // Mode actuel
  const [mode, setMode] = useState("diagnostic"); // diagnostic | mesure
  const [photo, setPhoto] = useState(null);

  // Mesure state — tracé sur photo
  const [mesurePhoto, setMesurePhoto] = useState(null);
  const [lines, setLines] = useState([]); // [{ id, x1, y1, x2, y2, label }]
  const [refLine, setRefLine] = useState(null); // la ligne de référence
  const [refSize, setRefSize] = useState(""); // dimension réelle en mètres
  const [measureMode, setMeasureMode] = useState(false); // true = taps créent des points, false = zoom libre
  const [drawingLine, setDrawingLine] = useState(null); // ligne en cours de tracé {x1, y1}
  const [pixelRatio, setPixelRatio] = useState(0); // mètres par pixel

  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // History state
  const [history, setHistory] = useState(loadHistory);
  const [historyPreview, setHistoryPreview] = useState(null);

  const addToHistory = useCallback(async (photoDataUrl, resultData, histMode) => {
    const thumb = await createThumbnail(photoDataUrl);
    const entry = { id: Date.now(), date: new Date().toLocaleString("fr-FR"), mode: histMode, thumb, result: resultData };
    setHistory(prev => { const next = [entry, ...prev].slice(0, MAX_HISTORY); saveHistory(next); return next; });
  }, []);

  const clearHistory = useCallback(() => { setHistory([]); setHistoryPreview(null); localStorage.removeItem(HISTORY_KEY); }, []);

  // Save diagnostic result to history when it arrives
  useEffect(() => {
    if (scanResult && photo && mode === "diagnostic") {
      addToHistory(photo, scanResult, "diagnostic");
    }
  }, [scanResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset mesure state when switching modes
  const resetMesure = useCallback(() => {
    setMesurePhoto(null);
    setLines([]);
    setRefLine(null);
    setRefSize("");
    setDrawingLine(null);
    setPixelRatio(0);
  }, []);

  // Gestion photo — ouvre la camera NATIVE du telephone
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
        // Mode mesure : on stocke la photo pour le canvas
        setMesurePhoto(dataUrl);
        setLines([]);
        setRefLine(null);
        setRefSize("");
        setDrawingLine(null);
        setPixelRatio(0);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [mode, scanIA, analyserPhoto]);

  // === CANVAS DRAWING ===
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.clientWidth) return;

    // Set canvas internal resolution to match displayed image size
    // Use devicePixelRatio for sharp rendering on hi-DPI screens
    const dpr = window.devicePixelRatio || 1;
    const w = img.clientWidth;
    const h = img.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const allLines = [...lines];

    // Draw each line
    allLines.forEach((line, idx) => {
      const isRef = refLine && line.id === refLine.id;
      const color = isRef ? "#52C37A" : "#C9A84C";

      // Line
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Endpoints
      [{ x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 }].forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#F0EDE6";
        ctx.fill();
      });

      // Label
      const midX = (line.x1 + line.x2) / 2;
      const midY = (line.y1 + line.y2) / 2;
      let label = "";
      if (isRef && refSize) {
        label = refSize + "m";
      } else if (!isRef && pixelRatio > 0) {
        const pxLen = Math.sqrt((line.x2 - line.x1) ** 2 + (line.y2 - line.y1) ** 2);
        const realLen = (pxLen * pixelRatio).toFixed(2);
        label = realLen + "m";
      }
      if (label) {
        ctx.font = "bold 12px 'DM Sans', sans-serif";
        const textW = ctx.measureText(label).width;
        const padX = 8, padY = 4;
        ctx.fillStyle = color;
        const rx = midX - textW / 2 - padX;
        const ry = midY - 8 - padY;
        const rw = textW + padX * 2;
        const rh = 16 + padY * 2;
        const radius = 6;
        ctx.beginPath();
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + rw - radius, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
        ctx.lineTo(rx + rw, ry + rh - radius);
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
        ctx.lineTo(rx + radius, ry + rh);
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#F0EDE6";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, midX, midY);
      }
    });

    // Draw line being drawn (first point placed)
    if (drawingLine) {
      ctx.beginPath();
      ctx.arc(drawingLine.x1, drawingLine.y1, 6, 0, Math.PI * 2);
      ctx.fillStyle = (!refLine ? "#52C37A" : "#C9A84C");
      ctx.fill();
      ctx.beginPath();
      ctx.arc(drawingLine.x1, drawingLine.y1, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#F0EDE6";
      ctx.fill();
    }
  }, [lines, refLine, refSize, pixelRatio, drawingLine]);

  // Redraw canvas when state changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Redraw on image load / resize
  useEffect(() => {
    const handleResize = () => drawCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawCanvas]);

  // Touch tracking for tap detection
  const touchStartRef = useRef(null);
  const lastTouchRef = useRef(0);

  // Get coordinates from event relative to canvas (CSS pixels)
  const getCoords = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  // Core tap handler — places a point
  const processTap = useCallback((coords) => {
    if (!coords) return;
    if (!drawingLine) {
      setDrawingLine({ x1: coords.x, y1: coords.y });
    } else {
      const newLine = {
        id: Date.now(),
        x1: drawingLine.x1, y1: drawingLine.y1,
        x2: coords.x, y2: coords.y, label: "",
      };
      setLines(prev => [...prev, newLine]);
      if (!refLine) setRefLine(newLine);
      setDrawingLine(null);
    }
  }, [drawingLine, refLine]);

  // Touch start — record position + time, DON'T prevent default (allow zoom)
  const handleTouchStart = useCallback((e) => {
    // Ignore multi-touch (pinch-to-zoom)
    if (e.touches.length > 1) { touchStartRef.current = null; return; }
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    // Don't preventDefault here — allow browser zoom/scroll
  }, []);

  // Touch end — check if it was a deliberate tap (short + no movement)
  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dt = Date.now() - start.time;
    const dx = Math.abs(t.clientX - start.x);
    const dy = Math.abs(t.clientY - start.y);
    // Only count as tap if: < 300ms, < 12px movement, single finger
    if (dt < 300 && dx < 12 && dy < 12) {
      e.preventDefault(); // Prevent ghost click only on valid tap
      lastTouchRef.current = Date.now();
      processTap(getCoords(t.clientX, t.clientY));
    }
  }, [getCoords, processTap]);

  // Click handler (desktop) — ignore if recent touch
  const handleClick = useCallback((e) => {
    if (Date.now() - lastTouchRef.current < 500) return;
    e.preventDefault();
    processTap(getCoords(e.clientX, e.clientY));
  }, [getCoords, processTap]);

  // Validate reference
  const validateReference = useCallback(() => {
    if (!refLine || !refSize) return;
    const pxLen = Math.sqrt((refLine.x2 - refLine.x1) ** 2 + (refLine.y2 - refLine.y1) ** 2);
    if (pxLen === 0) return;
    const ratio = parseFloat(refSize) / pxLen;
    setPixelRatio(ratio);
  }, [refLine, refSize]);

  // Delete last line
  const deleteLastLine = useCallback(() => {
    setLines(prev => {
      if (prev.length === 0) return prev;
      const newLines = prev.slice(0, -1);
      const removed = prev[prev.length - 1];
      // If we removed the reference line, reset reference
      if (refLine && removed.id === refLine.id) {
        setRefLine(null);
        setRefSize("");
        setPixelRatio(0);
      }
      return newLines;
    });
  }, [refLine]);

  // Clear all lines
  const clearAllLines = useCallback(() => {
    setLines([]);
    setRefLine(null);
    setRefSize("");
    setDrawingLine(null);
    setPixelRatio(0);
  }, []);

  // Inject largest measure into Outils
  const injecterMesures = useCallback(() => {
    if (lines.length === 0 || pixelRatio <= 0) return;
    let maxReal = 0;
    lines.forEach(line => {
      if (refLine && line.id === refLine.id) return;
      const pxLen = Math.sqrt((line.x2 - line.x1) ** 2 + (line.y2 - line.y1) ** 2);
      const real = pxLen * pixelRatio;
      if (real > maxReal) maxReal = real;
    });
    if (maxReal > 0) {
      setCalcSurface(String(maxReal.toFixed(2)));
    }
    goPage("outils");
  }, [lines, pixelRatio, refLine, setCalcSurface, goPage]);

  // Get computed measure for a line
  const getLineMeasure = useCallback((line) => {
    if (refLine && line.id === refLine.id) {
      return refSize ? refSize + "m" : "";
    }
    if (pixelRatio <= 0) return "";
    const pxLen = Math.sqrt((line.x2 - line.x1) ** 2 + (line.y2 - line.y1) ** 2);
    return (pxLen * pixelRatio).toFixed(2) + "m";
  }, [refLine, refSize, pixelRatio]);

  // Determine current instruction step
  const getInstruction = () => {
    if (!mesurePhoto) return "Prenez une photo du mur ou de la pi\u00e8ce";
    if (!measureMode && lines.length === 0) return "Zoomez sur la zone \u00e0 mesurer, puis passez en mode Mesurer";
    if (!measureMode) return "Mode zoom actif \u2014 passez en mode Mesurer pour tracer";
    if (lines.length === 0 && !drawingLine) return "Tapez sur un bout de la porte (ou fen\u00eatre), puis l'autre bout";
    if (drawingLine) return "Tapez le 2\u00e8me point pour terminer la ligne";
    if (refLine && !pixelRatio) return "Entrez la dimension r\u00e9elle de la r\u00e9f\u00e9rence ci-dessous";
    if (pixelRatio > 0) return "Tapez 2 points pour mesurer autre chose";
    return "";
  };

  return (
    <div style={{ ...s.page, ...(page === "scanner" ? s.pageActive : {}) }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "0.5px solid rgba(201,168,76,0.12)", flexShrink: 0 }}>
        {[["diagnostic", "\u{1F4F7} Diagnostic IA"], ["mesure", "\u{1F4D0} Mesurer"]].map(([k, l]) => (
          <button key={k} onClick={() => { setScannerTab(k); setMode(k); setPhoto(null); resetMesure(); }} style={{ flex: 1, padding: "12px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", color: mode === k ? (k === "mesure" ? "#52C37A" : "#C9A84C") : "rgba(240,237,230,0.3)", borderBottom: mode === k ? ("2px solid " + (k === "mesure" ? "#52C37A" : "#C9A84C")) : "2px solid transparent", fontFamily: "'Syne',sans-serif" }}>{l}</button>
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
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: "#52C37A" }}>M\u00e9treur</div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>Tracez des lignes sur la photo pour mesurer</div>
            </div>
          </div>

          {/* Instruction */}
          <div style={{ background: "rgba(82,195,122,0.05)", border: "0.5px solid rgba(82,195,122,0.15)", borderRadius: 10, padding: "10px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(82,195,122,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#52C37A", fontWeight: 700 }}>
                {!mesurePhoto ? "1" : lines.length === 0 && !drawingLine ? "2" : refLine && !pixelRatio ? "3" : pixelRatio > 0 ? "4" : "2"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#52C37A", fontWeight: 600, lineHeight: 1.4 }}>{getInstruction()}</div>
          </div>

          {/* Toggle Mesurer / Naviguer */}
          {mesurePhoto && (
            <div style={{ display: "flex", gap: 0, marginBottom: 10, borderRadius: 10, overflow: "hidden", border: "0.5px solid rgba(82,195,122,0.3)" }}>
              <button onClick={() => setMeasureMode(false)} style={{ flex: 1, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: !measureMode ? "rgba(82,195,122,0.15)" : "transparent", color: !measureMode ? "#52C37A" : "rgba(240,237,230,0.4)", fontFamily: "'Syne',sans-serif" }}>
                {"\u{1F50D}"} Zoomer
              </button>
              <button onClick={() => setMeasureMode(true)} style={{ flex: 1, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", borderLeft: "0.5px solid rgba(82,195,122,0.3)", background: measureMode ? "rgba(82,195,122,0.15)" : "transparent", color: measureMode ? "#52C37A" : "rgba(240,237,230,0.4)", fontFamily: "'Syne',sans-serif" }}>
                {"\u{1F4D0}"} Mesurer
              </button>
            </div>
          )}

          {/* Photo + Canvas overlay */}
          {mesurePhoto && (
            <div ref={containerRef} style={{ position: "relative", width: "100%", marginBottom: 12, borderRadius: 12, overflow: "hidden" }}>
              <img
                ref={imgRef}
                src={mesurePhoto}
                alt="mesure"
                onLoad={drawCanvas}
                style={{ width: "100%", display: "block", borderRadius: 12 }}
              />
              <canvas
                ref={canvasRef}
                onClick={measureMode ? handleClick : undefined}
                onTouchStart={measureMode ? handleTouchStart : undefined}
                onTouchEnd={measureMode ? handleTouchEnd : undefined}
                style={{
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                  touchAction: measureMode ? "none" : "auto",
                  cursor: measureMode ? "crosshair" : "default",
                  pointerEvents: measureMode ? "auto" : "none",
                  borderRadius: 12,
                }}
              />
            </div>
          )}

          {/* Reference dimension input */}
          {refLine && !pixelRatio && (
            <div style={{ background: "rgba(82,195,122,0.08)", border: "0.5px solid rgba(82,195,122,0.25)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: "#52C37A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Dimension r\u00e9elle de la r\u00e9f\u00e9rence</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <input
                    style={s.inp}
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={refSize}
                    onChange={e => setRefSize(e.target.value)}
                    placeholder="Ex: 2.04"
                    autoFocus
                  />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#52C37A" }}>m</span>
                <button
                  onClick={validateReference}
                  disabled={!refSize || parseFloat(refSize) <= 0}
                  style={{
                    background: refSize && parseFloat(refSize) > 0 ? "linear-gradient(135deg,#52C37A,#3A9B5A)" : "rgba(82,195,122,0.15)",
                    border: "none", borderRadius: 10, padding: "11px 18px",
                    fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800,
                    color: refSize && parseFloat(refSize) > 0 ? "#F0EDE6" : "rgba(82,195,122,0.4)",
                    cursor: refSize && parseFloat(refSize) > 0 ? "pointer" : "not-allowed",
                  }}
                >
                  Valider
                </button>
              </div>
              <div style={{ fontSize: 9, color: "rgba(240,237,230,0.35)", marginTop: 6 }}>
                Entrez la dimension r\u00e9elle de l'\u00e9l\u00e9ment sur lequel vous avez trac\u00e9 la ligne verte (ex: porte = 2.04m)
              </div>
            </div>
          )}
        </>}

        {/* === PHOTO placeholder (commune aux 2 modes, quand pas de photo) === */}
        {mode === "diagnostic" && photo && <img src={photo} alt="photo" style={{ width: "100%", borderRadius: 12, marginBottom: 12, maxHeight: 240, objectFit: "cover" }} />}

        {!photo && (
          <div style={{ width: "100%", aspectRatio: "4/3", background: "#0D1018", border: "1.5px dashed " + (mode === "mesure" ? "rgba(82,195,122,0.25)" : "rgba(201,168,76,0.18)"), borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={mode === "mesure" ? "#52C37A" : "#C9A84C"} strokeWidth="1.4" strokeLinecap="round" style={{ opacity: 0.6, marginBottom: 10 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            <p style={{ fontSize: 12, color: "rgba(240,237,230,0.5)" }}>{mode === "mesure" ? "Prenez une photo du mur ou de la pi\u00e8ce" : "Photographiez le probl\u00e8me"}</p>
          </div>
        )}

        {/* Boutons --- camera native du telephone */}
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

        {/* === RESULTATS DIAGNOSTIC === */}
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

        {/* === RESUME MESURES === */}
        {mode === "mesure" && lines.length > 0 && (
          <div style={{ background: "#181D28", border: "0.5px solid rgba(82,195,122,0.2)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: "#52C37A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Mesures ({lines.length})</div>
            {lines.map((line, idx) => {
              const isRef = refLine && line.id === refLine.id;
              const measure = getLineMeasure(line);
              return (
                <div key={line.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: idx < lines.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: isRef ? "#52C37A" : "#C9A84C", flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 12, color: "rgba(240,237,230,0.7)", fontWeight: 600 }}>
                    Ligne {idx + 1} {isRef ? "(r\u00e9f\u00e9rence)" : ""}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isRef ? "#52C37A" : "#C9A84C", fontFamily: "'Syne',sans-serif" }}>
                    {measure || "---"}
                  </div>
                </div>
              );
            })}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {pixelRatio > 0 && lines.length > 1 && (
                <button onClick={injecterMesures} style={{ flex: 1, background: "linear-gradient(135deg,#52C37A,#3A9B5A)", border: "none", borderRadius: 10, padding: "11px", fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 800, color: "#F0EDE6", cursor: "pointer" }}>
                  Utiliser dans Outils
                </button>
              )}
              <button onClick={deleteLastLine} style={{ flex: pixelRatio > 0 && lines.length > 1 ? 0 : 1, minWidth: 44, background: "rgba(232,135,58,0.1)", border: "0.5px solid rgba(232,135,58,0.3)", borderRadius: 10, padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#E8873A", cursor: "pointer" }}>
                Supprimer derni\u00e8re
              </button>
              <button onClick={clearAllLines} style={{ flex: pixelRatio > 0 && lines.length > 1 ? 0 : 1, minWidth: 44, background: "rgba(224,82,82,0.08)", border: "0.5px solid rgba(224,82,82,0.25)", borderRadius: 10, padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#E05252", cursor: "pointer" }}>
                Effacer tout
              </button>
            </div>
          </div>
        )}

        {/* === HISTORIQUE PREVIEW === */}
        {historyPreview && (
          <div style={{ background: "#181D28", border: "0.5px solid rgba(201,168,76,0.25)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#C9A84C" }}>{historyPreview.mode === "diagnostic" ? "Diagnostic" : "Mesure"} — {historyPreview.date}</div>
              <button onClick={() => setHistoryPreview(null)} style={{ background: "transparent", border: "none", color: "rgba(240,237,230,0.4)", cursor: "pointer", fontSize: 16, padding: 0 }}>{"\u2715"}</button>
            </div>
            {historyPreview.mode === "diagnostic" && historyPreview.result && (
              <div>
                {historyPreview.result.urgence && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "0.5px solid rgba(201,168,76,0.3)" }}>{historyPreview.result.urgence}</span>}
                {historyPreview.result.titre && <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, fontFamily: "'Syne',sans-serif" }}>{historyPreview.result.titre}</div>}
                {historyPreview.result.etapes?.map((e, i) => <div key={i} style={{ fontSize: 11, color: "rgba(240,237,230,0.6)", lineHeight: 1.5, marginTop: 4 }}>{i + 1}. {e}</div>)}
              </div>
            )}
            {historyPreview.mode === "mesure" && historyPreview.result && !historyPreview.result.erreur && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {Object.entries(historyPreview.result).filter(([k]) => !k.startsWith("_") && k !== "confiance" && k !== "methode" && k !== "ouvertures" && k !== "forme" && k !== "type").map(([k, v]) => (
                  <div key={k} style={{ background: "rgba(82,195,122,0.06)", borderRadius: 6, padding: "5px 8px" }}>
                    <div style={{ fontSize: 8, color: "rgba(240,237,230,0.35)", textTransform: "uppercase" }}>{k.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#52C37A" }}>{typeof v === "string" ? v : JSON.stringify(v)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === HISTORIQUE SCANNER === */}
        {history.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Historique ({history.length})</div>
              <button onClick={clearHistory} style={{ background: "rgba(224,82,82,0.08)", border: "0.5px solid rgba(224,82,82,0.25)", borderRadius: 8, padding: "4px 10px", fontSize: 9, fontWeight: 600, color: "#E05252", cursor: "pointer" }}>Effacer</button>
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 6 }}>
              {history.map(h => (
                <div key={h.id} onClick={() => setHistoryPreview(h)} style={{ flexShrink: 0, cursor: "pointer", width: 80, textAlign: "center", opacity: historyPreview?.id === h.id ? 1 : 0.7, transition: "opacity 0.2s" }}>
                  <img src={h.thumb} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: historyPreview?.id === h.id ? "1.5px solid #C9A84C" : "1px solid rgba(255,255,255,0.08)" }} />
                  <div style={{ fontSize: 8, color: h.mode === "diagnostic" ? "#C9A84C" : "#52C37A", fontWeight: 600, marginTop: 3 }}>{h.mode === "diagnostic" ? "Diag" : "Mesure"}</div>
                  <div style={{ fontSize: 7, color: "rgba(240,237,230,0.3)" }}>{h.date.split(" ")[0]}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
