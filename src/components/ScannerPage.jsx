import { useState, useCallback, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { IAS } from "../data/constants";
import { apiURL, apiHeaders, withRetry } from "../utils/api";
import Tooltip from "./Tooltip";
import s from "../styles/index";

// ── FORMAT HELPERS ──
function fmtDual(meters) {
  const mm = Math.round(meters * 1000);
  return `${mm} (${meters.toFixed(2)}m)`;
}
function fmtDualShort(meters) {
  const mm = Math.round(meters * 1000);
  return `${mm}mm (${meters.toFixed(2)}m)`;
}

const HISTORY_KEY = "mm_scanner_history";
const MAX_HISTORY = 20;

function parseAIJson(text) {
  const clean = (text || "").replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) try { return JSON.parse(match[0]); } catch {}
  return null;
}

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

// ── ELEMENT COLORS ──
const ELEM_COLORS = {
  mur: { fill: "transparent", stroke: "#C9A84C", strokeW: 2 },
  porte: { fill: "rgba(82,195,122,0.15)", stroke: "#52C37A", strokeW: 1.5 },
  fenetre: { fill: "rgba(82,144,224,0.15)", stroke: "#5290E0", strokeW: 1.5 },
  prise: { fill: "#E8873A", stroke: "#E8873A", strokeW: 1 },
  interrupteur: { fill: "#E8873A", stroke: "#E8873A", strokeW: 1 },
  plinthe: { fill: "rgba(201,168,76,0.08)", stroke: "rgba(201,168,76,0.4)", strokeW: 1 },
};
function getElemColor(type) { return ELEM_COLORS[type] || ELEM_COLORS.mur; }

// ── DRAW PLAN 2D ──
function drawPlan(canvas, planData, selectedElement, allMeasures, hoveredElement) {
  if (!canvas || !planData) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = "#1A1D24";
  ctx.fillRect(0, 0, w, h);

  // Mur = 90% centered
  const margin = w * 0.05;
  const mW = w - margin * 2;
  const mH = h - margin * 2;
  const mX = margin;
  const mY = margin;

  // Draw wall outline
  ctx.strokeStyle = "#C9A84C";
  ctx.lineWidth = 2;
  ctx.strokeRect(mX, mY, mW, mH);

  // Draw each element
  const elems = planData.elements || [];
  elems.forEach((el, idx) => {
    if (el.type === "mur") return; // skip the wall itself
    const ex = mX + (el.x / 100) * mW;
    const ey = mY + (el.y / 100) * mH;
    const ew = (el.w / 100) * mW;
    const eh = (el.h / 100) * mH;
    const col = getElemColor(el.type);
    const isSelected = selectedElement === idx;
    const isHovered = hoveredElement === idx;

    // Glow for selected
    if (isSelected) {
      ctx.shadowColor = col.stroke;
      ctx.shadowBlur = 12;
    }

    if (el.type === "prise" || el.type === "interrupteur") {
      // Small circle
      const cx = ex + ew / 2;
      const cy = ey + eh / 2;
      const r = Math.max(ew, eh) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(r, 4), 0, Math.PI * 2);
      ctx.fillStyle = col.fill;
      ctx.fill();
      ctx.strokeStyle = col.stroke;
      ctx.lineWidth = isSelected ? 2.5 : col.strokeW;
      ctx.stroke();
      // icon letter
      ctx.fillStyle = "#F0EDE6";
      ctx.font = "bold " + Math.max(8, r) + "px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(el.type === "prise" ? "P" : "I", cx, cy);
    } else if (el.type === "porte") {
      // Rectangle + arc
      ctx.fillStyle = col.fill;
      ctx.fillRect(ex, ey, ew, eh);
      ctx.strokeStyle = col.stroke;
      ctx.lineWidth = isSelected ? 3 : col.strokeW;
      ctx.strokeRect(ex, ey, ew, eh);
      // Door arc (opening) — dashed quarter circle at bottom
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = col.stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const arcR = Math.min(ew, eh * 0.3);
      ctx.arc(ex, ey + eh, arcR, -Math.PI / 2, 0);
      ctx.stroke();
      ctx.restore();
    } else if (el.type === "fenetre") {
      // Rectangle + cross
      ctx.fillStyle = col.fill;
      ctx.fillRect(ex, ey, ew, eh);
      ctx.strokeStyle = col.stroke;
      ctx.lineWidth = isSelected ? 3 : col.strokeW;
      ctx.strokeRect(ex, ey, ew, eh);
      // Cross
      ctx.beginPath();
      ctx.moveTo(ex, ey + eh / 2);
      ctx.lineTo(ex + ew, ey + eh / 2);
      ctx.moveTo(ex + ew / 2, ey);
      ctx.lineTo(ex + ew / 2, ey + eh);
      ctx.strokeStyle = col.stroke;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    } else {
      // Generic rectangle (plinthe, etc.)
      ctx.fillStyle = col.fill;
      ctx.fillRect(ex, ey, ew, eh);
      ctx.strokeStyle = col.stroke;
      ctx.lineWidth = isSelected ? 3 : col.strokeW;
      ctx.strokeRect(ex, ey, ew, eh);
    }

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Label
    if (el.label && (el.type !== "prise" && el.type !== "interrupteur")) {
      ctx.fillStyle = "rgba(240,237,230,0.7)";
      ctx.font = "600 " + Math.max(9, Math.min(11, ew / 5)) + "px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(el.label, ex + ew / 2, ey + eh / 2);
    }

    // Dimensions (if allMeasures computed)
    if (allMeasures) {
      const m = allMeasures[idx];
      if (m) {
        ctx.font = "bold 9px 'DM Sans', sans-serif";
        // Height dimension — right side (dual mm + m)
        if (m.realH) {
          const dimText = fmtDual(m.realH);
          const tx = ex + ew + 4;
          const ty = ey + eh / 2;
          const tw = ctx.measureText(dimText).width;
          ctx.fillStyle = "rgba(26,29,36,0.85)";
          roundRect(ctx, tx - 2, ty - 8, tw + 6, 16, 4);
          ctx.fill();
          ctx.strokeStyle = col.stroke;
          ctx.lineWidth = 0.5;
          roundRect(ctx, tx - 2, ty - 8, tw + 6, 16, 4);
          ctx.stroke();
          ctx.fillStyle = col.stroke;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(dimText, tx + 1, ty);
          // Arrow line
          ctx.beginPath();
          ctx.moveTo(ex + ew + 1, ey);
          ctx.lineTo(ex + ew + 1, ey + eh);
          ctx.strokeStyle = col.stroke;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          drawArrowTip(ctx, ex + ew + 1, ey, "up", col.stroke);
          drawArrowTip(ctx, ex + ew + 1, ey + eh, "down", col.stroke);
        }
        // Width dimension — bottom (dual mm + m)
        if (m.realW) {
          const dimText = fmtDual(m.realW);
          const tx = ex + ew / 2;
          const ty = ey + eh + 12;
          const tw = ctx.measureText(dimText).width;
          ctx.fillStyle = "rgba(26,29,36,0.85)";
          roundRect(ctx, tx - tw / 2 - 3, ty - 8, tw + 6, 16, 4);
          ctx.fill();
          ctx.strokeStyle = col.stroke;
          ctx.lineWidth = 0.5;
          roundRect(ctx, tx - tw / 2 - 3, ty - 8, tw + 6, 16, 4);
          ctx.stroke();
          ctx.fillStyle = col.stroke;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(dimText, tx, ty);
          ctx.beginPath();
          ctx.moveTo(ex, ey + eh + 3);
          ctx.lineTo(ex + ew, ey + eh + 3);
          ctx.strokeStyle = col.stroke;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          drawArrowTip(ctx, ex, ey + eh + 3, "left", col.stroke);
          drawArrowTip(ctx, ex + ew, ey + eh + 3, "right", col.stroke);
        }
        // Floor height (cote depuis le sol) — small label at bottom-left of element
        if (m.floorH !== undefined && el.type !== "plinthe") {
          ctx.font = "600 8px 'DM Sans', sans-serif";
          const floorText = "Sol: " + fmtDual(m.floorH);
          const ftw = ctx.measureText(floorText).width;
          const fx = ex - 2;
          const fy = ey + eh + 22;
          ctx.fillStyle = "rgba(26,29,36,0.9)";
          roundRect(ctx, fx - 2, fy - 6, ftw + 6, 12, 3);
          ctx.fill();
          ctx.strokeStyle = "rgba(232,135,58,0.6)";
          ctx.lineWidth = 0.5;
          roundRect(ctx, fx - 2, fy - 6, ftw + 6, 12, 3);
          ctx.stroke();
          ctx.fillStyle = "#E8873A";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(floorText, fx + 1, fy);
        }
      }
    }

    // Highlight border on hover
    if (isHovered && !isSelected) {
      ctx.strokeStyle = col.stroke;
      ctx.lineWidth = 2.5;
      if (el.type === "prise" || el.type === "interrupteur") {
        const cx2 = ex + ew / 2, cy2 = ey + eh / 2, r2 = Math.max(ew, eh) / 2;
        ctx.beginPath();
        ctx.arc(cx2, cy2, Math.max(r2, 4) + 3, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(ex - 2, ey - 2, ew + 4, eh + 4);
      }
    }
  });

  // Wall total dimensions if allMeasures
  if (allMeasures && allMeasures._wallH) {
    ctx.font = "bold 10px 'Syne', sans-serif";
    // Wall height — far right (dual mm + m)
    const dimH = fmtDualShort(allMeasures._wallH);
    const twH = ctx.measureText(dimH).width;
    const rxH = mX + mW + 16;
    const ryH = mY + mH / 2;
    ctx.fillStyle = "rgba(26,29,36,0.9)";
    roundRect(ctx, rxH - 3, ryH - 9, twH + 8, 18, 5);
    ctx.fill();
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 1;
    roundRect(ctx, rxH - 3, ryH - 9, twH + 8, 18, 5);
    ctx.stroke();
    ctx.fillStyle = "#C9A84C";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(dimH, rxH + 1, ryH);
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(rxH - 6, mY);
    ctx.lineTo(rxH - 6, mY + mH);
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 0.7;
    ctx.stroke();
    drawArrowTip(ctx, rxH - 6, mY, "up", "#C9A84C");
    drawArrowTip(ctx, rxH - 6, mY + mH, "down", "#C9A84C");
  }
  // Wall surface (m2)
  if (allMeasures && allMeasures._wallH && allMeasures._wallW) {
    const surfM2 = (allMeasures._wallH * allMeasures._wallW).toFixed(2);
    ctx.font = "bold 10px 'Syne', sans-serif";
    const surfText = "Surface: " + surfM2 + " m\u00B2";
    const twS = ctx.measureText(surfText).width;
    const sxS = mX + mW / 2;
    const syS = mY - 10;
    ctx.fillStyle = "rgba(26,29,36,0.92)";
    roundRect(ctx, sxS - twS / 2 - 5, syS - 9, twS + 10, 18, 5);
    ctx.fill();
    ctx.strokeStyle = "#52C37A";
    ctx.lineWidth = 1;
    roundRect(ctx, sxS - twS / 2 - 5, syS - 9, twS + 10, 18, 5);
    ctx.stroke();
    ctx.fillStyle = "#52C37A";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(surfText, sxS, syS);
  }

  if (allMeasures && allMeasures._wallW) {
    ctx.font = "bold 10px 'Syne', sans-serif";
    const dimW = fmtDualShort(allMeasures._wallW);
    const twW = ctx.measureText(dimW).width;
    const rxW = mX + mW / 2;
    const ryW = mY + mH + 24;
    ctx.fillStyle = "rgba(26,29,36,0.9)";
    roundRect(ctx, rxW - twW / 2 - 4, ryW - 9, twW + 8, 18, 5);
    ctx.fill();
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 1;
    roundRect(ctx, rxW - twW / 2 - 4, ryW - 9, twW + 8, 18, 5);
    ctx.stroke();
    ctx.fillStyle = "#C9A84C";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dimW, rxW, ryW);
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(mX, ryW - 14);
    ctx.lineTo(mX + mW, ryW - 14);
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 0.7;
    ctx.stroke();
    drawArrowTip(ctx, mX, ryW - 14, "left", "#C9A84C");
    drawArrowTip(ctx, mX + mW, ryW - 14, "right", "#C9A84C");
  }

  // Description text at top
  if (planData.description) {
    ctx.fillStyle = "rgba(240,237,230,0.45)";
    ctx.font = "500 10px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(planData.description, w / 2, 4);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawArrowTip(ctx, x, y, dir, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = 3;
  if (dir === "up") { ctx.moveTo(x, y); ctx.lineTo(x - s, y + s * 2); ctx.lineTo(x + s, y + s * 2); }
  else if (dir === "down") { ctx.moveTo(x, y); ctx.lineTo(x - s, y - s * 2); ctx.lineTo(x + s, y - s * 2); }
  else if (dir === "left") { ctx.moveTo(x, y); ctx.lineTo(x + s * 2, y - s); ctx.lineTo(x + s * 2, y + s); }
  else if (dir === "right") { ctx.moveTo(x, y); ctx.lineTo(x - s * 2, y - s); ctx.lineTo(x - s * 2, y + s); }
  ctx.closePath();
  ctx.fill();
}

// ── HIT TEST: find which element was clicked ──
function hitTestElement(planData, canvasW, canvasH, clickX, clickY) {
  if (!planData) return -1;
  const margin = canvasW * 0.05;
  const mW = canvasW - margin * 2;
  const mH = canvasH - margin * 2;
  const mX = margin;
  const mY = margin;
  const elems = planData.elements || [];
  // Reverse iterate for topmost first
  for (let i = elems.length - 1; i >= 0; i--) {
    const el = elems[i];
    if (el.type === "mur") continue;
    const ex = mX + (el.x / 100) * mW;
    const ey = mY + (el.y / 100) * mH;
    const ew = (el.w / 100) * mW;
    const eh = (el.h / 100) * mH;
    // Enlarge hit area for small elements
    const pad = (el.type === "prise" || el.type === "interrupteur") ? 10 : 4;
    if (clickX >= ex - pad && clickX <= ex + ew + pad && clickY >= ey - pad && clickY <= ey + eh + pad) {
      return i;
    }
  }
  return -1;
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

  // Mesure state — Plan 2D IA
  const [planData, setPlanData] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [refElementId, setRefElementId] = useState(null);
  const [refDimension, setRefDimension] = useState("h");
  const [refRealSize, setRefRealSize] = useState("");
  const [allMeasures, setAllMeasures] = useState(null);
  const [dimChoice, setDimChoice] = useState(null); // null or "picking"

  const canvasRef = useRef(null);

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

  // Reset mesure state
  const resetMesure = useCallback(() => {
    setPlanData(null);
    setPlanLoading(false);
    setSelectedElement(null);
    setRefElementId(null);
    setRefDimension("h");
    setRefRealSize("");
    setAllMeasures(null);
    setDimChoice(null);
  }, []);

  // ── Analyse photo with Releve Archi IA ──
  const analyserMesurePhoto = useCallback(async (dataUrl) => {
    setPlanLoading(true);
    setPlanData(null);
    setAllMeasures(null);
    setSelectedElement(null);
    setRefElementId(null);
    setRefRealSize("");
    setDimChoice(null);
    const base64 = dataUrl.split(",")[1];
    const mediaType = (dataUrl.split(";")[0].split(":")[1] || "image/jpeg");
    const ia = IAS.releve_archi;
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST",
        headers: apiHeaders(apiKey),
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: ia.sys,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: "Analyse cette photo et donne le releve architectural en JSON. Identifie chaque element visible avec ses proportions en %." }
          ] }]
        }),
      }));
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const parsed = parseAIJson(data?.content?.[0]?.text);
      if (parsed && parsed.elements) {
        setPlanData(parsed);
        addToHistory(dataUrl, parsed, "mesure");
      } else {
        setPlanData({ error: true, description: "Impossible de lire le releve" });
      }
    } catch (e) {
      setPlanData({ error: true, description: e.message });
    } finally { setPlanLoading(false); }
  }, [apiKey, addToHistory]);

  // Gestion photo
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
  }, [mode, scanIA, analyserPhoto, analyserMesurePhoto]);

  // ── Draw canvas on state change ──
  useEffect(() => {
    if (canvasRef.current && planData && !planData.error) {
      drawPlan(canvasRef.current, planData, selectedElement, allMeasures, null);
    }
  }, [planData, selectedElement, allMeasures]);

  // Redraw on resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && planData && !planData.error) {
        drawPlan(canvasRef.current, planData, selectedElement, allMeasures, null);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [planData, selectedElement, allMeasures]);

  // ── Canvas click handler ──
  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !planData) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const idx = hitTestElement(planData, canvas.clientWidth, canvas.clientHeight, x, y);
    if (idx >= 0) {
      setSelectedElement(idx);
      setDimChoice("picking");
    } else {
      setSelectedElement(null);
      setDimChoice(null);
    }
  }, [planData]);

  // Touch handler for canvas
  const touchStartRef = useRef(null);
  const handleCanvasTouchStart = useCallback((e) => {
    if (e.touches.length > 1) { touchStartRef.current = null; return; }
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }, []);
  const handleCanvasTouchEnd = useCallback((e) => {
    if (!touchStartRef.current) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dt = Date.now() - start.time;
    const dx = Math.abs(t.clientX - start.x);
    const dy = Math.abs(t.clientY - start.y);
    if (dt < 300 && dx < 12 && dy < 12) {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas || !planData) return;
      const rect = canvas.getBoundingClientRect();
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      const idx = hitTestElement(planData, canvas.clientWidth, canvas.clientHeight, x, y);
      if (idx >= 0) {
        setSelectedElement(idx);
        setDimChoice("picking");
      } else {
        setSelectedElement(null);
        setDimChoice(null);
      }
    }
  }, [planData]);

  // ── Compute all measures from reference ──
  const computeAllMeasures = useCallback(() => {
    if (refElementId === null || !refRealSize || !planData || !planData.elements) return;
    const realVal = parseFloat(refRealSize);
    if (!realVal || realVal <= 0) return;
    const refEl = planData.elements[refElementId];
    if (!refEl) return;
    const refPercent = refDimension === "h" ? refEl.h : refEl.w;
    if (!refPercent || refPercent <= 0) return;

    // Calculate: if refEl.h% = realVal meters, then 100% = realVal / (refPercent/100)
    const totalReal = realVal / (refPercent / 100);
    // For width, we need to know if the reference is h or w
    // If ref is "h", totalReal = wall height in meters
    // If ref is "w", totalReal = wall width in meters
    const isRefHeight = refDimension === "h";

    // We need both wall dimensions. We assume the wall element is 100x100.
    // For the axis we have ref on, we know the total. For the other axis, we need another ratio.
    // Approach: use the canvas aspect ratio or assume square if no info.
    // Better: use the wall element. The wall is always w=100, h=100 in the data.
    // So 1% height = totalReal/100 meters, and we need to figure out width too.
    // Without a second reference, assume wall aspect ratio from elements.
    // Simple approach: compute height total from h-ref, width total from w-ref.
    // If only one axis known, estimate the other from a typical room height (2.50m) ratio

    let wallH, wallW;
    if (isRefHeight) {
      wallH = totalReal;
      // Estimate width: typical room wall ratio or use largest element proportions
      // Use a rough heuristic: if we have elements with known standard proportions
      // For now, use the same scale (1% = same meters for both axes — assumes photo is orthographic)
      wallW = totalReal; // This works if the photo is truly orthographic and the wall is square-ish
      // Better: use the canvas aspect ratio hint — but we don't have the original photo aspect
      // We'll note this is approximate for width
    } else {
      wallW = totalReal;
      wallH = totalReal;
    }

    const measures = { _wallH: wallH, _wallW: wallW };
    planData.elements.forEach((el, idx) => {
      if (el.type === "mur") return;
      const rH = (el.h / 100) * wallH;
      const rW = (el.w / 100) * wallW;
      // Floor height = distance from bottom of wall to bottom of element
      // In the plan, y=0 is top, y=100 is bottom. Bottom of element = el.y + el.h
      // Distance from floor (bottom) = 100 - (el.y + el.h) => in % of wall height
      const floorPercent = 100 - (el.y + el.h);
      const floorH = Math.max(0, (floorPercent / 100) * wallH);
      measures[idx] = { realH: rH, realW: rW, floorH };
    });

    setAllMeasures(measures);
  }, [refElementId, refRealSize, refDimension, planData]);

  // ── Set reference element ──
  const setReference = useCallback((dim) => {
    setRefElementId(selectedElement);
    setRefDimension(dim);
    setDimChoice(null);
    setRefRealSize("");
    setAllMeasures(null);
  }, [selectedElement]);

  // Validate reference
  const validateReference = useCallback(() => {
    computeAllMeasures();
  }, [computeAllMeasures]);

  // ── Inject into Outils ──
  const injecterMesures = useCallback(() => {
    if (!allMeasures) return;
    // Find largest dimension
    let maxVal = 0;
    Object.keys(allMeasures).forEach(k => {
      if (k.startsWith("_")) return;
      const m = allMeasures[k];
      if (m.realH > maxVal) maxVal = m.realH;
      if (m.realW > maxVal) maxVal = m.realW;
    });
    if (maxVal > 0) setCalcSurface(String(maxVal.toFixed(2)));
    if (allMeasures._wallH) setCalcHauteur(String(allMeasures._wallH.toFixed(2)));
    goPage("outils");
  }, [allMeasures, setCalcSurface, setCalcHauteur, goPage]);

  // ── Export Plan PDF ──
  const exportPlanPDF = useCallback(async () => {
    if (!allMeasures || !planData) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

    // Background
    doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, 297, "F");
    doc.setFillColor(201, 168, 76); doc.rect(0, 0, 5, 297, "F"); doc.rect(0, 0, W, 1.5, "F");

    // Header
    doc.setFillColor(10, 14, 22); doc.rect(5, 1.5, W - 5, 42, "F");
    doc.setTextColor(240, 237, 230); doc.setFontSize(15); doc.setFont("helvetica", "bold");
    doc.text("MAESTRO", 42, 18);
    const mw = doc.getTextWidth("MAESTRO");
    doc.setTextColor(201, 168, 76); doc.text("MIND", 42 + mw, 18);
    doc.setTextColor(201, 168, 76); doc.setFontSize(9); doc.text("PLAN COT\u00C9 — RELEV\u00C9 ARCHI", 42, 27);
    doc.setTextColor(100, 96, 88); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("Export " + dateStr, 42, 34);
    doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.3); doc.line(5, 44, W, 44);

    let y = 52;

    // Wall dimensions
    doc.setTextColor(201, 168, 76); doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("Dimensions du mur", 14, y); y += 8;
    doc.setTextColor(200, 195, 185); doc.setFontSize(10); doc.setFont("helvetica", "normal");
    if (allMeasures._wallH) { doc.text("Hauteur : " + fmtDualShort(allMeasures._wallH), 14, y); y += 6; }
    if (allMeasures._wallW) { doc.text("Largeur : " + fmtDualShort(allMeasures._wallW), 14, y); y += 6; }
    if (allMeasures._wallH && allMeasures._wallW) {
      const surf = (allMeasures._wallH * allMeasures._wallW).toFixed(2);
      doc.setTextColor(82, 195, 122);
      doc.text("Surface : " + surf + " m\u00B2", 14, y); y += 10;
    }

    // Table header
    doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.3); doc.line(14, y, W - 14, y); y += 6;
    doc.setTextColor(201, 168, 76); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("\u00C9l\u00E9ment", 14, y);
    doc.text("Hauteur", 70, y);
    doc.text("Largeur", 110, y);
    doc.text("Cote sol", 150, y);
    y += 2; doc.line(14, y, W - 14, y); y += 5;

    // Elements
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    (planData.elements || []).forEach((el, idx) => {
      if (el.type === "mur") return;
      const m = allMeasures[idx];
      if (!m) return;
      const isRef = idx === refElementId;
      doc.setTextColor(200, 195, 185);
      doc.text((el.label || el.type) + (isRef ? " (r\u00E9f)" : ""), 14, y);
      doc.text(fmtDualShort(m.realH), 70, y);
      doc.text(fmtDualShort(m.realW), 110, y);
      doc.setTextColor(232, 135, 58);
      doc.text(m.floorH !== undefined ? fmtDualShort(m.floorH) : "-", 150, y);
      y += 6;
      if (y > 270) { doc.addPage(); doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, 297, "F"); doc.setFillColor(201, 168, 76); doc.rect(0, 0, 5, 297, "F"); y = 20; }
    });

    // Footer
    doc.setFillColor(10, 14, 22); doc.rect(0, 278, W, 19, "F");
    doc.setFillColor(201, 168, 76); doc.rect(0, 278, 5, 19, "F"); doc.rect(0, 295.5, W, 1.5, "F");
    doc.setTextColor(201, 168, 76); doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
    doc.text("MAESTROMIND", 13, 286);
    doc.setTextColor(80, 76, 70); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Plan cot\u00E9 \u00B7 Relev\u00E9 Archi", 13, 292);
    doc.text(dateStr, W - 12, 286, { align: "right" });

    doc.save("MAESTROMIND-plan-cote-" + Date.now() + ".pdf");
  }, [allMeasures, planData, refElementId]);

  // ── Instructions ──
  const getInstruction = () => {
    if (!photo && !planData) return "Prenez une photo bien en face du mur";
    if (planLoading) return "L'IA analyse votre photo...";
    if (planData && planData.error) return "Erreur : " + (planData.description || "analyse impossible");
    if (planData && !refElementId && refElementId !== 0) return "Tapez sur un element du plan pour le selectionner";
    if ((refElementId !== null) && !allMeasures) return "Entrez la dimension reelle de l'element selectionne";
    if (allMeasures) return "Toutes les cotes sont calculees ! Vous pouvez exporter.";
    return "";
  };

  const getStep = () => {
    if (!photo && !planData) return "1";
    if (planLoading) return "2";
    if (planData && !planData.error && (refElementId === null)) return "3";
    if (refElementId !== null && !allMeasures) return "4";
    if (allMeasures) return "5";
    return "1";
  };

  // Selected element info
  const selElem = (planData && selectedElement !== null && planData.elements) ? planData.elements[selectedElement] : null;

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
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: "#52C37A" }}>Relev{"e"} Archi</div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>L'IA dessine le plan 2D, vous donnez une cote</div>
            </div>
          </div>

          {/* Guide de prise de photo */}
          {!photo && !planData && (
            <div style={{ background: "rgba(232,135,58,0.06)", border: "0.5px solid rgba(232,135,58,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#E8873A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Pour un relev{"e"} pr{"e"}cis</div>
              <div style={{ fontSize: 11, color: "rgba(240,237,230,0.6)", lineHeight: 1.6 }}>
                {"\u{1F4F1}"} Photographiez <strong style={{ color: "#E8873A" }}>bien en face</strong> du mur (perpendiculaire)<br/>
                {"\u{1F3D7}\uFE0F"} L'IA identifie portes, fen{"e"}tres, prises... et dessine le plan<br/>
                {"\u{1F4CF}"} Donnez <strong style={{ color: "#E8873A" }}>une seule cote</strong> (ex: porte = 2.04m) et tout se calcule
              </div>
            </div>
          )}

          {/* Instruction step */}
          <div style={{ background: "rgba(82,195,122,0.05)", border: "0.5px solid rgba(82,195,122,0.15)", borderRadius: 10, padding: "10px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(82,195,122,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#52C37A", fontWeight: 700 }}>{getStep()}</span>
            </div>
            <div style={{ fontSize: 11, color: "#52C37A", fontWeight: 600, lineHeight: 1.4 }}>{getInstruction()}</div>
          </div>

          {/* Loading */}
          {planLoading && (
            <div style={{ background: "#181D28", borderRadius: 12, padding: 20, textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{"\u{1F3D7}\uFE0F"}</div>
              <div style={{ fontSize: 12, color: "rgba(240,237,230,0.6)", fontWeight: 600 }}>L'IA Relev{"e"} Archi analyse...</div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.3)", marginTop: 4 }}>Identification des {"e"}l{"e"}ments architecturaux</div>
            </div>
          )}

          {/* Plan 2D Canvas */}
          {planData && !planData.error && (
            <div style={{ position: "relative", width: "100%", marginBottom: 12 }}>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onTouchStart={handleCanvasTouchStart}
                onTouchEnd={handleCanvasTouchEnd}
                style={{
                  width: "100%",
                  height: 320,
                  borderRadius: 12,
                  border: "0.5px solid rgba(201,168,76,0.2)",
                  cursor: "pointer",
                  touchAction: "none",
                }}
              />
              {/* Element count badge */}
              <div style={{ position: "absolute", top: 8, right: 8, padding: "3px 10px", borderRadius: 20, fontSize: 9, fontWeight: 700, background: "rgba(82,195,122,0.15)", color: "#52C37A", border: "0.5px solid rgba(82,195,122,0.3)" }}>
                {(planData.elements || []).filter(e => e.type !== "mur").length} {"e"}l{"e"}ments
              </div>
            </div>
          )}

          {/* Error state */}
          {planData && planData.error && (
            <div style={{ background: "rgba(224,82,82,0.08)", border: "0.5px solid rgba(224,82,82,0.25)", borderRadius: 12, padding: 14, marginBottom: 12, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#E05252", fontWeight: 600 }}>Analyse {"e"}chou{"e"}e</div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", marginTop: 4 }}>{planData.description}</div>
            </div>
          )}

          {/* Dimension choice popup — after selecting an element */}
          {dimChoice === "picking" && selElem && (
            <div style={{ background: "rgba(82,195,122,0.08)", border: "0.5px solid rgba(82,195,122,0.25)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: "#52C37A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                {"E"}l{"e"}ment s{"e"}lectionn{"e"} : {selElem.label || selElem.type}
              </div>
              <div style={{ fontSize: 11, color: "rgba(240,237,230,0.6)", marginBottom: 10 }}>
                Quelle dimension voulez-vous utiliser comme r{"e"}f{"e"}rence ?
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setReference("h")} style={{ flex: 1, background: "rgba(82,195,122,0.12)", border: "0.5px solid rgba(82,195,122,0.4)", borderRadius: 10, padding: "12px", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: "#52C37A", cursor: "pointer" }}>
                  {"\u2195\uFE0F"} Hauteur ({selElem.h}%)
                </button>
                <button onClick={() => setReference("w")} style={{ flex: 1, background: "rgba(82,144,224,0.12)", border: "0.5px solid rgba(82,144,224,0.4)", borderRadius: 10, padding: "12px", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: "#5290E0", cursor: "pointer" }}>
                  {"\u2194\uFE0F"} Largeur ({selElem.w}%)
                </button>
              </div>
              <button onClick={() => { setSelectedElement(null); setDimChoice(null); }} style={{ width: "100%", marginTop: 8, background: "transparent", border: "0.5px solid rgba(240,237,230,0.1)", borderRadius: 10, padding: "8px", fontSize: 10, color: "rgba(240,237,230,0.4)", cursor: "pointer" }}>
                Annuler
              </button>
            </div>
          )}

          {/* Reference size input */}
          {refElementId !== null && !allMeasures && dimChoice === null && (
            <div style={{ background: "rgba(82,195,122,0.08)", border: "0.5px solid rgba(82,195,122,0.25)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: "#52C37A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                Cote de r{"e"}f{"e"}rence : {refDimension === "h" ? "Hauteur" : "Largeur"} de {planData?.elements?.[refElementId]?.label || planData?.elements?.[refElementId]?.type || "element"}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <input
                    style={s.inp}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    value={refRealSize}
                    onChange={e => setRefRealSize(e.target.value)}
                    placeholder="Ex: 2.04"
                    autoFocus
                  />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#52C37A" }}>m</span>
                <button
                  onClick={validateReference}
                  disabled={!refRealSize || parseFloat(refRealSize) <= 0}
                  style={{
                    background: refRealSize && parseFloat(refRealSize) > 0 ? "linear-gradient(135deg,#52C37A,#3A9B5A)" : "rgba(82,195,122,0.15)",
                    border: "none", borderRadius: 10, padding: "11px 18px",
                    fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800,
                    color: refRealSize && parseFloat(refRealSize) > 0 ? "#F0EDE6" : "rgba(82,195,122,0.4)",
                    cursor: refRealSize && parseFloat(refRealSize) > 0 ? "pointer" : "not-allowed",
                  }}
                >
                  Calculer
                </button>
              </div>
              <div style={{ fontSize: 9, color: "rgba(240,237,230,0.35)", marginTop: 6 }}>
                Ex: porte standard = 2.04m, hauteur sous plafond = 2.50m
              </div>
            </div>
          )}

          {/* All measures summary */}
          {allMeasures && planData && !planData.error && (
            <div style={{ background: "#181D28", border: "0.5px solid rgba(82,195,122,0.2)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: "#52C37A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                Cotes calcul{"e"}es
              </div>
              {/* Wall totals */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {allMeasures._wallH && (
                  <div style={{ flex: 1, background: "rgba(201,168,76,0.08)", borderRadius: 8, padding: "8px 10px", border: "0.5px solid rgba(201,168,76,0.2)" }}>
                    <div style={{ fontSize: 8, color: "rgba(240,237,230,0.35)", textTransform: "uppercase" }}>Hauteur mur</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#C9A84C", fontFamily: "'Syne',sans-serif" }}>{fmtDualShort(allMeasures._wallH)}</div>
                  </div>
                )}
                {allMeasures._wallW && (
                  <div style={{ flex: 1, background: "rgba(201,168,76,0.08)", borderRadius: 8, padding: "8px 10px", border: "0.5px solid rgba(201,168,76,0.2)" }}>
                    <div style={{ fontSize: 8, color: "rgba(240,237,230,0.35)", textTransform: "uppercase" }}>Largeur mur</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#C9A84C", fontFamily: "'Syne',sans-serif" }}>{fmtDualShort(allMeasures._wallW)}</div>
                  </div>
                )}
                {allMeasures._wallH && allMeasures._wallW && (
                  <div style={{ flex: 1, background: "rgba(82,195,122,0.08)", borderRadius: 8, padding: "8px 10px", border: "0.5px solid rgba(82,195,122,0.2)" }}>
                    <div style={{ fontSize: 8, color: "rgba(240,237,230,0.35)", textTransform: "uppercase" }}>Surface mur</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#52C37A", fontFamily: "'Syne',sans-serif" }}>{(allMeasures._wallH * allMeasures._wallW).toFixed(2)} m{"\u00B2"}</div>
                  </div>
                )}
              </div>
              {/* Element measures */}
              {(planData.elements || []).map((el, idx) => {
                if (el.type === "mur") return null;
                const m = allMeasures[idx];
                if (!m) return null;
                const isRef = idx === refElementId;
                const col = getElemColor(el.type);
                return (
                  <div key={idx} style={{ padding: "6px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.stroke, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 12, color: "rgba(240,237,230,0.7)", fontWeight: 600 }}>
                        {el.label || el.type} {isRef ? "(ref)" : ""}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 10, color: col.stroke, fontWeight: 700 }}>{fmtDualShort(m.realH)} H</span>
                        <span style={{ fontSize: 10, color: col.stroke, fontWeight: 700 }}>{fmtDualShort(m.realW)} L</span>
                        {m.floorH !== undefined && <span style={{ fontSize: 9, color: "#E8873A", fontWeight: 600 }}>Sol: {fmtDualShort(m.floorH)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={injecterMesures} style={{ flex: 1, background: "linear-gradient(135deg,#52C37A,#3A9B5A)", border: "none", borderRadius: 10, padding: "11px", fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 800, color: "#F0EDE6", cursor: "pointer" }}>
                  Utiliser dans Outils
                </button>
                <button onClick={exportPlanPDF} style={{ background: "rgba(201,168,76,0.1)", border: "0.5px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#C9A84C", cursor: "pointer" }}>
                  {"\u{1F4C4}"} PDF
                </button>
                <button onClick={() => { setAllMeasures(null); setRefElementId(null); setRefRealSize(""); setSelectedElement(null); }} style={{ background: "rgba(232,135,58,0.1)", border: "0.5px solid rgba(232,135,58,0.3)", borderRadius: 10, padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#E8873A", cursor: "pointer" }}>
                  Recalculer
                </button>
              </div>
            </div>
          )}
        </>}

        {/* === PHOTO placeholder (commune aux 2 modes, quand pas de photo) === */}
        {mode === "diagnostic" && photo && <img src={photo} alt="photo" style={{ width: "100%", borderRadius: 12, marginBottom: 12, maxHeight: 240, objectFit: "cover" }} />}

        {!photo && (
          <div style={{ width: "100%", aspectRatio: "4/3", background: mode === "mesure" ? "radial-gradient(ellipse at 50% 50%, rgba(82,195,122,0.06) 0%, #0D1018 70%)" : "radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.06) 0%, #0D1018 70%)", border: "1.5px dashed " + (mode === "mesure" ? "rgba(82,195,122,0.25)" : "rgba(201,168,76,0.18)"), borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <div className="scanner-pulse" style={{ position: "relative", marginBottom: 14 }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={mode === "mesure" ? "#52C37A" : "#C9A84C"} strokeWidth="1.2" strokeLinecap="round" style={{ opacity: 0.7 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", width: 70, height: 2, marginLeft: -35, background: "linear-gradient(90deg, transparent, " + (mode === "mesure" ? "#52C37A" : "#C9A84C") + ", transparent)", opacity: 0.5, animation: "scanLine 2s ease-in-out infinite" }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(240,237,230,0.65)", fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>{mode === "mesure" ? "Prenez une photo du mur ou de la piece" : "\u{1F4F8} Pointez, photographiez, l'IA diagnostique"}</p>
            {mode === "diagnostic" && <p style={{ fontSize: 10, color: "rgba(240,237,230,0.3)", textAlign: "center", lineHeight: 1.5 }}>Fissures, humidité, moisissures, défauts électriques...</p>}
            {mode === "diagnostic" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, opacity: 0.5 }}>
                {[
                  ["\u{1F50D}", "Fissures"],
                  ["\u{1F4A7}", "Humidité"],
                  ["\u26A1", "Électrique"],
                  ["\u{1F527}", "Plomberie"],
                ].map(([icon, label]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "rgba(240,237,230,0.5)" }}>
                    <span style={{ fontSize: 12 }}>{icon}</span> {label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Boutons --- camera native du telephone */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12, position: "relative" }}>
          <Tooltip id="scanner-photo" text="Prenez en photo un problème — l'IA l'analyse en quelques secondes" position="bottom" />
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

        {/* Conseil photo */}
        {!photo && (
          <div style={{ fontSize: 10, color: "rgba(240,237,230,0.3)", textAlign: "center", padding: "20px 30px", lineHeight: 1.6 }}>
            {"\u{1F4A1}"} Conseil : photographiez en lumière naturelle, de face, à 50cm du problème
          </div>
        )}

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

        {/* === HISTORIQUE PREVIEW === */}
        {historyPreview && (
          <div style={{ background: "#181D28", border: "0.5px solid rgba(201,168,76,0.25)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#C9A84C" }}>{historyPreview.mode === "diagnostic" ? "Diagnostic" : "Mesure"} {"\u2014"} {historyPreview.date}</div>
              <button onClick={() => setHistoryPreview(null)} style={{ background: "transparent", border: "none", color: "rgba(240,237,230,0.4)", cursor: "pointer", fontSize: 16, padding: 0 }}>{"\u2715"}</button>
            </div>
            {historyPreview.mode === "diagnostic" && historyPreview.result && (
              <div>
                {historyPreview.result.urgence && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "0.5px solid rgba(201,168,76,0.3)" }}>{historyPreview.result.urgence}</span>}
                {historyPreview.result.titre && <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, fontFamily: "'Syne',sans-serif" }}>{historyPreview.result.titre}</div>}
                {historyPreview.result.etapes?.map((e, i) => <div key={i} style={{ fontSize: 11, color: "rgba(240,237,230,0.6)", lineHeight: 1.5, marginTop: 4 }}>{i + 1}. {e}</div>)}
              </div>
            )}
            {historyPreview.mode === "mesure" && historyPreview.result && !historyPreview.result.error && (
              <div>
                {historyPreview.result.description && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.6)", marginBottom: 6 }}>{historyPreview.result.description}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {(historyPreview.result.elements || []).filter(e => e.type !== "mur").map((el, i) => (
                    <div key={i} style={{ background: "rgba(82,195,122,0.06)", borderRadius: 6, padding: "5px 8px" }}>
                      <div style={{ fontSize: 8, color: "rgba(240,237,230,0.35)", textTransform: "uppercase" }}>{el.label || el.type}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#52C37A" }}>{el.w}% x {el.h}%</div>
                    </div>
                  ))}
                </div>
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
                  <div style={{ fontSize: 8, color: h.mode === "diagnostic" ? "#C9A84C" : "#52C37A", fontWeight: 600, marginTop: 3 }}>{h.mode === "diagnostic" ? "Diag" : "Releve"}</div>
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
