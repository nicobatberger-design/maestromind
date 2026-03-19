// PDF generation avec lazy import de jsPDF (151KB + html2canvas 200KB chargés à la demande)

async function getJsPDF() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

function footer(doc, W, color = [201, 168, 76]) {
  doc.setFillColor(10, 14, 22); doc.rect(0, 278, W, 19, "F");
  doc.setFillColor(...color); doc.rect(0, 278, 5, 19, "F"); doc.rect(0, 295.5, W, 1.5, "F");
}

export async function exportChatPDF({ msgs, curIA, IAS, profilPDFLabel }) {
  if (!msgs || msgs.length <= 1) return;
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const ia = IAS[curIA];
  doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, 297, "F");
  doc.setFillColor(201, 168, 76); doc.rect(0, 0, 5, 297, "F"); doc.rect(0, 0, W, 1.5, "F");
  doc.setFillColor(10, 14, 22); doc.rect(5, 1.5, W - 5, 42, "F");
  doc.setTextColor(240, 237, 230); doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.text("MAESTRO", 42, 18);
  const mw = doc.getTextWidth("MAESTRO"); doc.setTextColor(201, 168, 76); doc.text("MIND", 42 + mw, 18);
  doc.setTextColor(201, 168, 76); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("CONVERSATION — " + (ia?.name || curIA).toUpperCase(), 42, 27);
  doc.setTextColor(100, 96, 88); doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(profilPDFLabel + "  \u00B7  " + dateStr + "  \u00B7  " + msgs.filter(m => m.role !== "ai" || m.text !== "...").length + " messages", 42, 34);
  doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.3); doc.line(5, 44, W, 44);
  let y = 52;
  const addPage = () => { doc.addPage(); doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, 297, "F"); doc.setFillColor(201, 168, 76); doc.rect(0, 0, 5, 297, "F"); y = 20; };
  msgs.filter(m => m.text && m.text !== "...").forEach((m) => {
    const isAI = m.role === "ai";
    const label = isAI ? (ia?.name || "IA") : "Vous";
    const color = isAI ? [82, 195, 122] : [201, 168, 76];
    doc.setTextColor(...color); doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text(label, 14, y); y += 5;
    doc.setTextColor(isAI ? 160 : 240, isAI ? 155 : 237, isAI ? 148 : 230); doc.setFontSize(9); doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(m.text, W - 28);
    if (y + lines.length * 5 > 278) addPage();
    doc.text(lines, 14, y); y += lines.length * 5 + 6;
    if (y > 278) addPage();
  });
  footer(doc, W);
  doc.setTextColor(201, 168, 76); doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.text("MAESTROMIND", 13, 286);
  doc.setTextColor(80, 76, 70); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text(profilPDFLabel + " \u00B7 Export conversation", 13, 292);
  doc.text(dateStr, W - 12, 286, { align: "right" });
  doc.save("MAESTROMIND-" + curIA + "-" + new Date().getTime() + ".pdf");
}

export async function genererCertificatPDF({ certNorme, certProjet, certProp, certArtisan, certSurface }) {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const certNum = "MAESTRO-" + new Date().getFullYear() + "-" + Math.random().toString(36).substr(2, 6).toUpperCase();
  const norme = certNorme.split("\u2014")[0].trim();
  const projet = certProjet || "Non renseign\u00E9";
  const prop = certProp || "Non renseign\u00E9";
  const artisan = certArtisan || "Non renseign\u00E9";
  const surface = (certSurface || "10") + " m\u00B2";
  doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, H, "F");
  doc.setFillColor(201, 168, 76); doc.rect(0, 0, 5, H, "F"); doc.rect(0, 0, W, 1.5, "F");
  doc.setFillColor(10, 14, 22); doc.rect(5, 1.5, W - 5, 50, "F");
  doc.setFillColor(201, 168, 76); doc.roundedRect(14, 10, 24, 24, 3, 3, "F");
  doc.setTextColor(6, 8, 13); doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.text("M", 26, 27, { align: "center" });
  doc.setTextColor(240, 237, 230); doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.text("MAESTRO", 46, 22);
  const bw = doc.getTextWidth("MAESTRO"); doc.setTextColor(201, 168, 76); doc.text("MIND", 46 + bw, 22);
  doc.setTextColor(100, 96, 88); doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text("Plateforme IA Expertise B\u00E2timent  \u00B7  32 Intelligences Sp\u00E9cialis\u00E9es", 46, 30);
  doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.3); doc.line(5, 52, W, 52);
  doc.setFillColor(8, 12, 20); doc.rect(5, 52, W - 5, 38, "F");
  doc.setTextColor(201, 168, 76); doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text("DOCUMENT OFFICIEL DE CONFORMIT\u00C9", W / 2 + 2.5, 63, { align: "center" });
  doc.setTextColor(240, 237, 230); doc.setFontSize(19); doc.setFont("helvetica", "bold"); doc.text("CERTIFICAT DE CONFORMIT\u00C9 DTU", W / 2 + 2.5, 79, { align: "center" });
  doc.setFillColor(201, 168, 76); doc.rect(5, 90, W - 5, 0.5, "F");
  doc.setFillColor(12, 16, 24); doc.roundedRect(14, 98, W - 28, 78, 3, 3, "F");
  doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.4); doc.roundedRect(14, 98, W - 28, 78, 3, 3, "S");
  doc.setTextColor(201, 168, 76); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("INFORMATIONS DU PROJET", 22, 108);
  doc.setDrawColor(40, 50, 68); doc.setLineWidth(0.2); doc.line(22, 111, W - 22, 111);
  [["Projet", projet], ["Norme applicable", norme], ["Surface concern\u00E9e", surface], ["Ma\u00EEtre d'ouvrage", prop], ["Artisan / Entreprise", artisan], ["Date d'\u00E9mission", dateStr], ["N\u00B0 Certificat", certNum]].forEach(([label, value], i) => {
    const y = 121 + i * 9.5;
    doc.setTextColor(100, 96, 88); doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text(label + " :", 22, y);
    doc.setTextColor(240, 237, 230); doc.setFont("helvetica", "bold"); doc.text(value, 90, y);
  });
  const cx = W - 34, cy = 142;
  doc.setFillColor(6, 8, 13); doc.circle(cx, cy, 22, "F");
  doc.setDrawColor(82, 195, 122); doc.setLineWidth(1.8); doc.circle(cx, cy, 22, "S");
  doc.setLineWidth(0.5); doc.circle(cx, cy, 18.5, "S");
  doc.setTextColor(82, 195, 122); doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.text("CONFORME", cx, cy - 2, { align: "center" });
  doc.setFontSize(7); doc.text("DTU VALID\u00C9", cx, cy + 5, { align: "center" });
  doc.setFontSize(6); doc.setTextColor(60, 150, 90); doc.text("MAESTROMIND IA", cx, cy + 11, { align: "center" });
  doc.setFillColor(8, 10, 16); doc.roundedRect(14, 183, W - 28, 32, 3, 3, "F");
  doc.setDrawColor(35, 45, 62); doc.setLineWidth(0.3); doc.roundedRect(14, 183, W - 28, 32, 3, 3, "S");
  doc.setTextColor(201, 168, 76); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("NORMES ET R\u00C9GLEMENTATION", 22, 192);
  doc.setDrawColor(35, 45, 62); doc.line(22, 195, W - 22, 195);
  doc.setTextColor(160, 155, 148); doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(doc.splitTextToSize("La norme " + norme + " d\u00E9finit les r\u00E8gles de l'art applicables \u00E0 ce projet. Les travaux ont \u00E9t\u00E9 r\u00E9alis\u00E9s dans le strict respect des prescriptions techniques en vigueur au " + dateStr + ".", W - 50), 22, 201);
  doc.setFillColor(16, 10, 6); doc.roundedRect(14, 221, W - 28, 20, 2, 2, "F");
  doc.setDrawColor(80, 50, 18); doc.setLineWidth(0.3); doc.roundedRect(14, 221, W - 28, 20, 2, 2, "S");
  doc.setTextColor(140, 95, 40); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("AVERTISSEMENT", 22, 228);
  doc.setFont("helvetica", "normal"); doc.setTextColor(110, 75, 30);
  doc.text(doc.splitTextToSize("Ce certificat est g\u00E9n\u00E9r\u00E9 automatiquement par MAESTROMIND \u00E0 titre indicatif. Il ne se substitue pas \u00E0 un contr\u00F4le officiel par un bureau de contr\u00F4le agr\u00E9\u00E9 (Apave, Bureau Veritas, Socotec\u2026).", W - 50), 22, 234);
  doc.setDrawColor(40, 50, 68); doc.setLineWidth(0.3); doc.line(18, 262, 82, 262); doc.line(128, 262, 192, 262);
  doc.setTextColor(100, 96, 88); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
  doc.text("IA Certificat \u2014 MAESTROMIND", 50, 267, { align: "center" }); doc.text("Responsable Conformit\u00E9", 50, 272, { align: "center" });
  doc.text("IA Validation Technique", 160, 267, { align: "center" }); doc.text("Contr\u00F4le DTU", 160, 272, { align: "center" });
  footer(doc, W);
  doc.setTextColor(201, 168, 76); doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.text("MAESTROMIND", 13, 286);
  doc.setTextColor(80, 76, 70); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text("Plateforme IA Expertise B\u00E2timent", 13, 292);
  doc.text("N\u00B0 " + certNum, W - 12, 286, { align: "right" }); doc.text("\u00C9mis le " + dateStr, W - 12, 292, { align: "right" });
  doc.save("certificat-" + projet.replace(/\s+/g, "-").toLowerCase() + "-" + new Date().getFullYear() + ".pdf");
}

export async function genererDevisProPDF({ devisProResult, devisProClient }) {
  if (!devisProResult) return;
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const num = "DEV-" + new Date().getFullYear() + "-" + Math.random().toString(36).substr(2, 6).toUpperCase();
  doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, H, "F");
  doc.setFillColor(201, 168, 76); doc.rect(0, 0, 5, H, "F"); doc.rect(0, 0, W, 1.5, "F");
  doc.setFillColor(10, 14, 22); doc.rect(5, 1.5, W - 5, 50, "F");
  doc.setFillColor(201, 168, 76); doc.roundedRect(14, 10, 22, 22, 3, 3, "F");
  doc.setTextColor(6, 8, 13); doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("M", 25, 26, { align: "center" });
  doc.setTextColor(240, 237, 230); doc.setFontSize(17); doc.setFont("helvetica", "bold"); doc.text("DEVIS PROFESSIONNEL", 42, 20);
  doc.setTextColor(201, 168, 76); doc.setFontSize(8); doc.text("N\u00B0 " + num, 42, 28);
  doc.setTextColor(100, 96, 88); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
  doc.text("\u00C9mis le " + dateStr + "  \u00B7  Validit\u00E9 : " + (devisProResult.validite || "30 jours"), 42, 35);
  if (devisProClient) doc.text("Client : " + devisProClient, 42, 42);
  doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.3); doc.line(5, 52, W, 52);
  doc.setFillColor(14, 18, 28); doc.rect(5, 53, W - 5, 10, "F");
  doc.setTextColor(201, 168, 76); doc.setFontSize(7); doc.setFont("helvetica", "bold");
  doc.text("D\u00C9SIGNATION", 14, 60); doc.text("UNIT\u00C9", 102, 60, { align: "center" }); doc.text("QT\u00C9", 122, 60, { align: "center" }); doc.text("PU HT", 147, 60, { align: "center" }); doc.text("TOTAL HT", W - 12, 60, { align: "right" });
  let y = 68;
  (devisProResult.lignes || []).forEach((l, i) => {
    const desc = l.dtu ? l.description + " (" + l.dtu + ")" : l.description;
    const lines = doc.splitTextToSize(desc, 82);
    const rowH = Math.max(10, lines.length * 5 + 4);
    if (i % 2 === 0) { doc.setFillColor(10, 13, 20); doc.rect(5, y - 2, W - 5, rowH, "F"); }
    doc.setTextColor(240, 237, 230); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(lines, 14, y + 3);
    doc.setTextColor(180, 175, 165); doc.text(l.unite || "", 102, y + 3, { align: "center" });
    doc.text(String(l.quantite || ""), 122, y + 3, { align: "center" });
    doc.text(l.prix_unitaire || "", 147, y + 3, { align: "center" });
    doc.setTextColor(201, 168, 76); doc.setFont("helvetica", "bold");
    doc.text(l.total || "", W - 12, y + 3, { align: "right" });
    y += rowH;
  });
  y = Math.min(y + 8, 225);
  doc.setDrawColor(201, 168, 76); doc.line(120, y, W - 5, y);
  doc.setTextColor(160, 155, 148); doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("Sous-total HT", 130, y + 7); doc.text(devisProResult.sous_total_ht || "", W - 12, y + 7, { align: "right" });
  doc.text("TVA " + devisProResult.tva_taux, 130, y + 14); doc.text(devisProResult.tva || "", W - 12, y + 14, { align: "right" });
  doc.setFillColor(14, 18, 28); doc.roundedRect(120, y + 17, W - 125, 12, 2, 2, "F");
  doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.5); doc.roundedRect(120, y + 17, W - 125, 12, 2, 2, "S");
  doc.setTextColor(201, 168, 76); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("TOTAL TTC", 130, y + 26); doc.text(devisProResult.total_ttc || "", W - 12, y + 26, { align: "right" });
  const yM = Math.min(y + 38, 248);
  doc.setFillColor(8, 10, 16); doc.roundedRect(14, yM, W - 28, 28, 2, 2, "F");
  doc.setDrawColor(35, 45, 62); doc.setLineWidth(0.2); doc.roundedRect(14, yM, W - 28, 28, 2, 2, "S");
  doc.setTextColor(201, 168, 76); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("GARANTIES & MENTIONS L\u00C9GALES", 22, yM + 7);
  doc.setTextColor(110, 106, 98); doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
  doc.text(doc.splitTextToSize((devisProResult.garanties || "") + " \u2014 " + (devisProResult.mentions || ""), W - 52), 22, yM + 14);
  doc.setDrawColor(40, 50, 68); doc.setLineWidth(0.3); doc.line(18, 270, 82, 270); doc.line(128, 270, 192, 270);
  doc.setTextColor(100, 96, 88); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("Signature artisan", 50, 275, { align: "center" }); doc.text("Signature client + \u00ABBon pour accord\u00BB", 160, 275, { align: "center" });
  footer(doc, W);
  doc.setTextColor(201, 168, 76); doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.text("MAESTROMIND", 13, 286);
  doc.setTextColor(80, 76, 70); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("Devis g\u00E9n\u00E9r\u00E9 par IA \u00B7 \u00C0 compl\u00E9ter avec vos coordonn\u00E9es", 13, 292);
  doc.text("N\u00B0 " + num, W - 12, 286, { align: "right" });
  doc.text("Validit\u00E9 : " + (devisProResult.validite || "30 jours"), W - 12, 292, { align: "right" });
  doc.save("devis-pro-" + num + ".pdf");
}

export async function genererOutilPDF({ titre, sousTitre, sections, accentColor }) {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const num = "OUTIL-" + new Date().getFullYear() + "-" + Math.random().toString(36).substr(2, 6).toUpperCase();
  const ac = accentColor || [201, 168, 76];
  // Background
  doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, H, "F");
  // Left bar + top bar
  doc.setFillColor(...ac); doc.rect(0, 0, 5, H, "F"); doc.rect(0, 0, W, 1.5, "F");
  // Header block
  doc.setFillColor(10, 14, 22); doc.rect(5, 1.5, W - 5, 42, "F");
  // MAESTROMIND logo
  doc.setFillColor(...ac); doc.roundedRect(14, 8, 20, 20, 3, 3, "F");
  doc.setTextColor(6, 8, 13); doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("M", 24, 22, { align: "center" });
  doc.setTextColor(240, 237, 230); doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.text("MAESTRO", 40, 17);
  const mw = doc.getTextWidth("MAESTRO"); doc.setTextColor(...ac); doc.text("MIND", 40 + mw, 17);
  // Titre
  doc.setTextColor(...ac); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text(titre, 40, 25);
  // Sous-titre + date
  doc.setTextColor(100, 96, 88); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
  doc.text((sousTitre || "Généré par MAESTROMIND") + "  \u00B7  " + dateStr, 40, 32);
  // Separator
  doc.setDrawColor(...ac); doc.setLineWidth(0.3); doc.line(5, 44, W, 44);

  let y = 52;
  const addPage = () => {
    doc.addPage();
    doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, H, "F");
    doc.setFillColor(...ac); doc.rect(0, 0, 5, H, "F");
    y = 20;
  };

  (sections || []).forEach(section => {
    // Check page overflow for section header
    if (y > 265) addPage();
    // Section label
    doc.setFillColor(10, 13, 20); doc.roundedRect(14, y, W - 28, 9, 2, 2, "F");
    doc.setTextColor(...ac); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
    doc.text(section.label.toUpperCase(), 22, y + 6);
    y += 13;

    if (section.text) {
      // Free text section
      doc.setTextColor(160, 155, 148); doc.setFontSize(9); doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(section.text, W - 40);
      if (y + lines.length * 4.5 > 275) addPage();
      doc.text(lines, 22, y);
      y += lines.length * 4.5 + 6;
    }

    if (section.items) {
      section.items.forEach(item => {
        if (y > 270) addPage();
        // Item label
        doc.setTextColor(240, 237, 230); doc.setFontSize(9); doc.setFont("helvetica", "bold");
        const labelLines = doc.splitTextToSize(item.label, 70);
        doc.text(labelLines, 22, y);
        // Item value
        const col = item.color || [240, 237, 230];
        doc.setTextColor(...col); doc.setFont("helvetica", "bold");
        const valLines = doc.splitTextToSize(String(item.value || ""), 80);
        doc.text(valLines, W - 20, y, { align: "right" });
        y += Math.max(labelLines.length, valLines.length) * 4.5 + 3;
      });
      y += 3;
    }
  });

  // Footer
  footer(doc, W, ac);
  doc.setTextColor(...ac); doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.text("MAESTROMIND", 13, 286);
  doc.setTextColor(80, 76, 70); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text("Plateforme IA Expertise B\u00E2timent", 13, 292);
  doc.text("N\u00B0 " + num, W - 12, 286, { align: "right" }); doc.text("\u00C9mis le " + dateStr, W - 12, 292, { align: "right" });
  doc.save("MAESTROMIND-" + titre.replace(/\s+/g, "-").toLowerCase() + "-" + num + ".pdf");
}

export async function genererCRPDF({ projet, cr, profilPDFLabel }) {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, H, "F");
  doc.setFillColor(82, 195, 122); doc.rect(0, 0, 5, H, "F"); doc.rect(0, 0, W, 1.5, "F");
  doc.setFillColor(10, 14, 22); doc.rect(5, 1.5, W - 5, 52, "F");
  doc.setFillColor(82, 195, 122); doc.roundedRect(14, 10, 22, 22, 3, 3, "F");
  doc.setTextColor(6, 8, 13); doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("CR", 25, 26, { align: "center" });
  doc.setTextColor(240, 237, 230); doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.text("COMPTE-RENDU DE CHANTIER", 42, 20);
  doc.setTextColor(82, 195, 122); doc.setFontSize(8); doc.text(dateStr, 42, 28);
  doc.setTextColor(100, 96, 88); doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("Projet : " + projet.nom + "  \u00B7  Type : " + projet.type, 42, 35);
  const av = parseInt(cr.avancement) || 0;
  doc.setFillColor(20, 24, 34); doc.rect(42, 40, W - 50, 7, "F");
  doc.setFillColor(82, 195, 122); doc.rect(42, 40, (W - 50) * av / 100, 7, "F");
  doc.setTextColor(240, 237, 230); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("Avancement : " + cr.avancement, (W + 42) / 2, 45.5, { align: "center" });
  doc.setDrawColor(82, 195, 122); doc.setLineWidth(0.3); doc.line(5, 54, W, 54);
  let y = 62;
  const sect = (title, items, r, g, b) => {
    if (!items || !items.length) return;
    doc.setFillColor(10, 13, 20); doc.roundedRect(14, y, W - 28, 9, 2, 2, "F");
    doc.setTextColor(r, g, b); doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text(title, 22, y + 6); y += 13;
    items.forEach(item => {
      if (!item) return;
      const lines = doc.splitTextToSize("\u2022 " + item, W - 40);
      doc.setTextColor(160, 155, 148); doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text(lines, 22, y); y += lines.length * 5 + 2;
    }); y += 3;
  };
  sect("TRAVAUX R\u00C9ALIS\u00C9S", cr.travaux_realises, 82, 195, 122);
  sect("TRAVAUX RESTANTS", cr.travaux_restants, 201, 168, 76);
  sect("OBSERVATIONS", cr.observations, 82, 144, 224);
  if (cr.reserves && cr.reserves[0]) sect("R\u00C9SERVES", cr.reserves, 224, 82, 82);
  if (cr.prochaine_intervention) {
    doc.setFillColor(8, 10, 16); doc.roundedRect(14, y, W - 28, 20, 2, 2, "F");
    doc.setDrawColor(82, 195, 122); doc.setLineWidth(0.2); doc.roundedRect(14, y, W - 28, 20, 2, 2, "S");
    doc.setTextColor(82, 195, 122); doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text("PROCHAINE INTERVENTION", 22, y + 7);
    doc.setTextColor(160, 155, 148); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(cr.prochaine_intervention, W - 48), 22, y + 13);
  }
  doc.setDrawColor(40, 50, 68); doc.setLineWidth(0.3); doc.line(18, 270, 82, 270); doc.line(128, 270, 192, 270);
  doc.setTextColor(100, 96, 88); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("Chef de chantier", 50, 275, { align: "center" }); doc.text("Ma\u00EEtre d'ouvrage", 160, 275, { align: "center" });
  footer(doc, W, [82, 195, 122]);
  doc.setTextColor(82, 195, 122); doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.text("MAESTROMIND", 13, 286);
  doc.setTextColor(80, 76, 70); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text(profilPDFLabel + " \u00B7 CR chantier", 13, 292);
  doc.text(dateStr, W - 12, 286, { align: "right" });
  doc.save("CR-" + projet.nom.replace(/\s+/g, "-") + "-" + new Date().getFullYear() + ".pdf");
}
